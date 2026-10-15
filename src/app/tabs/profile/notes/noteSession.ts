export interface NoteFile {
  id?: string;
  url: string;
  file_name: string | null;
  file_type: string;
}
export interface NoteValue { title: string; content: string; attachments: NoteFile[] }
export interface Note extends NoteValue {
  id: string; entity_id: string; version: number; sort: number;
  created_at: string; updated_at: string;
}
export const plainText = (html: string) => html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<[^>]*>/g, " ")
  .replace(/&#(x[\da-f]+|\d+);?/gi, (_, code: string) => String.fromCodePoint(Math.min(0x10ffff, code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : parseInt(code, 10))))
  .replace(/&nbsp;|&ZeroWidthSpace;/gi, " ").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[name] || "")).trim();
export const hasNoteValue = (value: NoteValue) => Boolean(value.title.replace(/[\u200B-\u200D\uFEFF]/g, "").trim() || plainText(value.content));
const valueKey = (value: NoteValue) => JSON.stringify([value.title.trim(), plainText(value.content) ? value.content : "", value.attachments]);
export type SaveState = "Draft" | "Unsaved changes" | "Saving…" | "Saved" | "Couldn't save" | "Conflict";
export type SaveNote = (value: NoteValue, previous: Note | null) => Promise<Note>;

/** One document, one write at a time. A response acknowledges only its snapshot. */
export class NoteSession {
  value: NoteValue;
  note: Note | null;
  baseline: string;
  state: SaveState;
  error = "";
  conflict = false;
  private timer?: ReturnType<typeof setTimeout>;
  private pending?: Promise<boolean>;
  private listeners = new Set<() => void>();
  private history: string[];
  private position = 0;
  private changedAt = 0;
  constructor(note: Note | null, private save: SaveNote, private persist: (session: NoteSession) => void = () => {}) {
    this.note = note;
    this.value = note ? { title: note.title, content: note.content, attachments: note.attachments } : { title: "", content: "", attachments: [] };
    this.baseline = valueKey(this.value);
    this.state = note ? "Saved" : "Draft";
    this.history = [this.value.content];
  }
  get dirty() { return valueKey(this.value) !== this.baseline; }
  get canUndo() { return this.position > 0; }
  get canRedo() { return this.position < this.history.length - 1; }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  rebind(save: SaveNote) { this.save = save; }
  recover(value: NoteValue, conflict = false) {
    this.stop(); this.value = value;
    this.history = plainText(value.content) || plainText(this.history[0]) ? [this.history[0], value.content] : [value.content];
    this.position = this.history.length - 1;
    this.conflict = conflict;
    this.error = conflict ? "This note changed elsewhere. Your edits are kept. Copy them or reload the latest version." : "Recovered unsaved changes. Review your draft and retry saving.";
    this.state = conflict ? "Conflict" : "Couldn't save";
  }
  private emit() { this.persist(this); this.listeners.forEach(listener => listener()); }
  change(value: NoteValue, record = true) {
    // Raw text must reach controlled inputs, even when only trailing whitespace
    // changed and the persisted document still compares equal to its baseline.
    if (JSON.stringify(value) === JSON.stringify(this.value)) return;
    const bodyChanged = (plainText(value.content) ? value.content : "") !== (plainText(this.value.content) ? this.value.content : "");
    this.value = value;
    if (record && bodyChanged) {
      this.history = this.history.slice(0, this.position + 1);
      this.history.push(value.content);
      this.position++;
    }
    this.changedAt = Date.now();
    this.state = this.pending ? "Saving…" : this.conflict ? "Conflict" : this.error ? "Couldn't save" : this.dirty ? "Unsaved changes" : this.note ? "Saved" : "Draft";
    clearTimeout(this.timer);
    if (!this.conflict && !this.error && this.dirty && hasNoteValue(value)) this.schedule();
    this.emit();
  }
  undo() { if (this.canUndo) this.change({ ...this.value, content: this.history[--this.position] }, false); }
  redo() { if (this.canRedo) this.change({ ...this.value, content: this.history[++this.position] }, false); }
  private schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush(false, false); }, Math.max(0, 2000 - (Date.now() - this.changedAt)));
  }
  async flush(retry = false, immediate = true): Promise<boolean> {
    clearTimeout(this.timer);
    if (this.pending) { const ok = await this.pending; if (ok && this.dirty) { if (immediate) return this.flush(); this.schedule(); } return ok; }
    if (!this.dirty) return true;
    if (this.conflict || (this.error && !retry)) return false;
    if (!hasNoteValue(this.value)) { this.error = "Add a title or some text before saving."; this.state = "Couldn't save"; this.emit(); return false; }
    this.error = "";
    const snapshot = structuredClone(this.value);
    this.state = "Saving…";
    // Defer the transport one microtask so pending is set before subscribers run.
    this.pending = Promise.resolve().then(() => this.save(snapshot, this.note)).then(note => {
      this.note = note;
      const canonicalFiles = (files: NoteFile[]) => files.map(file => note.attachments.find(saved => saved.url === file.url) || file);
      this.baseline = valueKey(snapshot);
      if (!this.dirty) {
        this.value = { title: note.title, content: note.content, attachments: note.attachments };
        this.baseline = valueKey(this.value);
      } else {
        // Give uploaded attachments their server ids without replacing newer edits.
        this.value = { ...this.value, attachments: canonicalFiles(this.value.attachments) };
        this.baseline = valueKey({ ...snapshot, attachments: canonicalFiles(snapshot.attachments) });
      }
      this.state = this.dirty ? "Unsaved changes" : "Saved";
      return true;
    }).catch((error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      this.conflict = status === 409;
      this.error = this.conflict ? "This note changed elsewhere. Your edits are kept. Copy them or reload the latest version." : "Couldn't save. Your edits are kept. Retry when you're ready.";
      this.state = this.conflict ? "Conflict" : "Couldn't save";
      return false;
    }).finally(() => { this.pending = undefined; this.emit(); });
    this.emit();
    const ok = await this.pending;
    if (ok && this.dirty) { if (immediate) return this.flush(); this.schedule(); }
    return ok;
  }
  stop() { clearTimeout(this.timer); }
}
