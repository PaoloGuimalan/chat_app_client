/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowDown, ArrowLeft, Check, GripVertical, Paperclip, Save, Trash2, X } from "lucide-react";
import DOMPurify from "dompurify";
import { createPortal } from "react-dom";
import type { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { uploadFiles } from "@/reusables/hooks/mediaUpload";
import { HistoryButtons, WritingBody, WritingHeader } from "../writing/Writing";
import { useUnsavedWarning } from "../writing/writingHooks";
import { NoteSession, hasNoteValue, type Note, type NoteValue } from "./noteSession";
import { notesApi } from "./notesApi";
import { useNoteDrag } from "./useNoteDrag";
import { useNoteMasonry } from "./useNoteMasonry";
import { NoteMasonryCard } from "./NoteMasonryCard";
import UploadedAttachment from "../diary/UploadedAttachment";
import { NoteCardSkeleton } from "../writing/WritingSkeletons";

const sessions = new Map<string, NoteSession>();
const storageKey = (entity: string) => `chatterloop:note-drafts:${entity}`;
function persistEntity(entity: string) {
  try { sessionStorage.setItem(storageKey(entity), JSON.stringify([...sessions.entries()].filter(([key, session]) => key.startsWith(`${entity}:`) && session.dirty).map(([key, session]) => ({ key, note: session.note, value: session.value, conflict: session.conflict })))); } catch { /* The live session remains available when browser storage is full. */ }
}

export default function Notes() {
  const authentication: AuthenticationInterface = useSelector((state: any) => state.authentication);
  const entity = authentication.active_entity_context?.id || authentication.user.entity_id;
  const token = localStorage.getItem("authtoken") || "";
  // Remount the complete view on identity change; old async work retains its own token.
  return <NotesWorkspace key={`${entity}:${token}`} entity={entity} token={token}/>;
}

function NotesWorkspace({ entity, token }: { entity: string; token: string }) {
  const api = useMemo(() => notesApi(token), [token]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const backgroundReload = useRef(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [session, setSession] = useState<NoteSession | null>(null);
  const [revision, setRevision] = useState(0);
  const [confirm, setConfirm] = useState<"discard" | "delete" | "reload" | null>(null);
  const [reordering, setReordering] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const activeSession = useRef(session);
  activeSession.current = session;
  const restore = useRef(false);
  useEffect(() => {
    alive.current = true;
    for (const [key, cached] of sessions) if (key.startsWith(`${entity}:`)) cached.rebind(api.save);
    if (!restore.current) {
      restore.current = true;
      try {
        const drafts = JSON.parse(sessionStorage.getItem(storageKey(entity)) || "[]") as { key: string; note: Note | null; value: NoteValue; conflict?: boolean }[];
        drafts.forEach(draft => {
          if (!sessions.has(draft.key)) {
            const restored = new NoteSession(draft.note, api.save, () => persistEntity(entity));
            sessions.set(draft.key, restored);
            restored.recover(draft.value, draft.conflict);
          }
        });
      } catch { /* Ignore malformed local storage. */ }
    }
    return () => { alive.current = false; const current = activeSession.current; if (current && hasNoteValue(current.value)) void current.flush(); };
  }, [api, entity]);
  useEffect(() => { const timer = setTimeout(() => { setPage(1); setSearch(query); }, 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    let cancelled = false;
    // Returning from the editor refreshes the cards without adding skeletons.
    setLoading(true); setBackgroundLoading(backgroundReload.current); backgroundReload.current = false; setError("");
    api.list(page, search).then(data => {
      if (cancelled) return;
      setNotes(previous => page === 1 ? data.results : [...previous, ...data.results.filter(note => !previous.some(item => item.id === note.id))]);
      setCount(data.count); setNext(Boolean(data.next));
    }).catch(() => { if (!cancelled) setError("Couldn't load notes. Please retry."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api, page, search, refresh]);
  useLayoutEffect(() => {
    if (!session) return;
    return session.subscribe(() => { setRevision(value => value + 1); });
  }, [session]);
  useUnsavedWarning(Boolean(session?.dirty) || uploading);
  const recovered = [...sessions.entries()].filter(([key, value]) => key.startsWith(`${entity}:`) && value.dirty && value !== session);
  const reloadList = (background = false) => { backgroundReload.current = background; setPage(1); setRefresh(value => value + 1); };
  const create = () => {
    const key = `${entity}:draft-${crypto.randomUUID()}`;
    const draft = new NoteSession(null, api.save, () => persistEntity(entity));
    sessions.set(key, draft); setSession(draft);
  };
  const open = async (note: Note) => {
    const cached = [...sessions.entries()].find(([key, value]) => key.startsWith(`${entity}:`) && value.note?.id === note.id)?.[1];
    if (cached?.dirty) { setSession(cached); return; }
    setError("");
    try {
      const fresh = await api.get(note.id);
      if (!alive.current) return;
      const draft = new NoteSession(fresh, api.save, () => persistEntity(entity));
      sessions.set(`${entity}:${fresh.id}`, draft); setSession(draft);
    } catch { if (alive.current) setError("Couldn't open this note. Please retry."); }
  };
  const close = async () => {
    if (!session || uploading) return;
    const ok = await session.flush();
    if (!alive.current) return;
    if (!ok) { setConfirm("discard"); return; }
    setSession(null); reloadList(true);
  };
  const discard = () => {
    if (session) {
      session.stop();
      for (const [key, value] of sessions) if (value === session) sessions.delete(key);
      persistEntity(entity);
    }
    setConfirm(null); setSession(null); reloadList(true);
  };
  const reorder = useCallback(async (id: string, before: string | null) => {
    if (reordering || search || id === before) return;
    setReordering(true); setError("");
    const previous = notes;
    setNotes(current => {
      const moved = current.find(note => note.id === id);
      if (!moved) return current;
      const result = current.filter(note => note.id !== id);
      const index = before === null ? result.length : result.findIndex(note => note.id === before);
      result.splice(index < 0 ? result.length : index, 0, moved);
      return result;
    });
    try {
      const result = await api.reorder(id, before);
      if (!alive.current) return;
      const sorts = new Map(result.order.map(item => [item.id, item.sort]));
      setNotes(previous => previous.map(note => ({ ...note, sort: sorts.get(note.id) ?? note.sort })).sort((a, b) => b.sort - a.sort || b.id.localeCompare(a.id)));
      setAnnouncement(`Note moved to position ${result.order.findIndex(item => item.id === id) + 1}.`);
      // Reload the loaded prefix so crossing the page boundary cannot omit a row.
      const pages = await Promise.all(Array.from({ length: page }, (_, index) => api.list(index + 1, "")));
      if (alive.current) { setNotes(pages.flatMap(data => data.results)); setNext(Boolean(pages[pages.length - 1].next)); }
    } catch { if (alive.current) { setNotes(previous); setError("Couldn't move this note. Please retry."); } }
    finally { if (alive.current) setReordering(false); }
  }, [api, notes, page, reordering, search]);
  const keyboardMove = (id: string, key: string) => {
    const index = notes.findIndex(note => note.id === id);
    if (["ArrowUp", "ArrowLeft", "Home"].includes(key)) {
      const before = notes[key === "Home" ? 0 : index - 1];
      if (before) void reorder(id, before.id);
    } else if (["ArrowDown", "ArrowRight", "End"].includes(key)) {
      if (key === "End") void reorder(id, null);
      else if (notes[index + 2]) void reorder(id, notes[index + 2].id);
      else if (next) {
        // Resolve the anchor beyond the loaded page, rather than accidentally moving to the collection's end.
        void api.list(page + 1, "").then(data => { if (alive.current) void reorder(id, data.results[index + 2 - notes.length]?.id || null); }).catch(() => { if (alive.current) setError("Couldn't move this note. Please retry."); });
      }
      else if (index < notes.length - 1) void reorder(id, null);
    }
  };
  const upload = async (files: File[]) => {
    if (!session || !files.length) return;
    const current = session;
    setUploading(true); setError("");
    try {
      const uploaded = await uploadFiles({ purpose: "notes", files, token });
      current.change({ ...current.value, attachments: [...current.value.attachments, ...uploaded.map(file => ({ url: file.fileUrl, file_name: file.name, file_type: file.mime }))] });
    } catch (err) { if (alive.current) setError(err instanceof Error ? err.message : "Couldn't upload attachments. Please retry."); }
    finally { if (alive.current) setUploading(false); }
  };
  const remove = async () => {
    if (!session?.note) return;
    setError("");
    try { await api.remove(session.note); if (alive.current) discard(); }
    catch { if (alive.current) { setConfirm(null); setError("Couldn't delete this note. It may have changed elsewhere. Your edits are kept."); } }
  };
  const shortcuts = (event: React.KeyboardEvent) => {
    if (!session || !(event.target as HTMLElement).closest('.writing-quill') || !(event.ctrlKey || event.metaKey)) return;
    if (event.key.toLowerCase() === "z" || event.key.toLowerCase() === "y") {
      event.preventDefault(); event.stopPropagation();
      if (event.shiftKey || event.key.toLowerCase() === "y") session.redo(); else session.undo();
    }
  };
  const noteDrag = useNoteDrag(notes.map(note => note.id), !search && !reordering && !loading, (id, before) => {
    if (before === null && next) {
      // End of the loaded prefix comes before the next page, not after all notes.
      void api.list(page + 1, '').then(data => { if (alive.current) void reorder(id, data.results[0]?.id || null); })
        .catch(() => setError("Couldn't move this note. Please retry."));
    } else void reorder(id, before);
  });
  const displayedNotes = noteDrag.order ? noteDrag.order.map(id => notes.find(note => note.id === id)!).filter(Boolean) : notes;
  const showSkeletons = loading && !backgroundLoading;
  const masonry = useNoteMasonry(displayedNotes.map(note => note.id), showSkeletons);
  const draggedNote = notes.find(note => note.id === noteDrag.ghost?.id);
  return <section className="writing-page notes-page" aria-label="Notes">
    <WritingHeader query={query} onSearch={setQuery} onNew={create}/>
    {error && <div className="writing-error" role="alert">{error}<button onClick={() => reloadList()}>Retry</button></div>}
    <div className="notes-scroll">
      {recovered.map(([key, draft]) => <button className="notes-resume" key={key} onClick={() => setSession(draft)}>Resume unsaved note: {draft.value.title || "Untitled note"}</button>)}
      <div className="writing-caption"><span>{count} {count === 1 ? "note" : "notes"}</span><span>{search ? "Clear search to reorder" : "Drag a note or its handle to reorder"}</span></div>
      <div className="writing-sr" aria-live="polite">{announcement}</div>
      <div ref={masonry.ref} className="notes-grid notes-masonry" style={{ height: masonry.height }} aria-busy={loading || reordering} data-sorting={Boolean(noteDrag.ghost)} {...noteDrag.handlers}>
        {displayedNotes.map(note => <NoteMasonryCard key={note.id} id={note.id} tile={masonry.tiles.get(note.id)} dragging={noteDrag.ghost?.id === note.id}>
          <button className="note-card-open" onClick={() => void open(note)} aria-label={`Open ${note.title || "Untitled note"}`}>
            {note.title && <h2>{note.title}</h2>}
            <div className="note-card-preview" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}/>
          </button>
          {note.attachments[0] && <div className="note-file-preview">📎 {note.attachments[0].file_name || "Attachment"}</div>}
          <footer className="note-card-footer"><span>{new Date(note.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><span className="note-order-actions"><button data-note-no-drag className="note-drag note-to-end" aria-label={`Move ${note.title || "Untitled note"} to end`} title="Move to end" disabled={Boolean(search) || reordering || loading} onClick={() => void reorder(note.id, null)}><ArrowDown size={14}/></button><button data-note-handle className="note-drag" aria-label={`Move ${note.title || "Untitled note"}. Use arrow keys, Home or End.`} disabled={Boolean(search) || reordering || loading} onClick={event => event.stopPropagation()} onKeyDown={event => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); keyboardMove(note.id, event.key); } }}><GripVertical size={16}/></button></span></footer>
        </NoteMasonryCard>)}
        {showSkeletons && <span className="writing-sr" role="status" aria-label="Loading notes">Loading notes…</span>}
        {masonry.skeletons.map(skeleton => <NoteCardSkeleton key={skeleton.id} {...skeleton}/>)}
      </div>
      {!loading && !notes.length && <div className="writing-empty">{search ? "No matching notes" : "A little space for your ideas."}</div>}
      {next && <button className="writing-load-more" disabled={loading} onClick={() => setPage(value => value + 1)}>{loading ? "Loading…" : "Load more notes"}</button>}
    </div>
    {noteDrag.ghost && draggedNote && createPortal(<div className="cl-redesign note-drag-overlay" data-theme={document.documentElement.dataset.theme} style={{ position: 'fixed', left: noteDrag.ghost.x, top: noteDrag.ghost.y, width: noteDrag.ghost.width, height: noteDrag.ghost.height }}><article className="note-card"><div className="note-card-open">{draggedNote.title && <h2>{draggedNote.title}</h2>}<div className="note-card-preview" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(draggedNote.content) }}/></div><footer className="note-card-footer"><span>Moving note</span><GripVertical size={16}/></footer></article></div>, document.body)}
    {session && <div className="notes-shade"><section className="notes-editor" role="dialog" aria-modal="true" aria-label="Note editor" onKeyDownCapture={shortcuts} data-revision={revision}>
      <header className="writing-reader-head"><button aria-label="Close note" onClick={() => void close()} disabled={uploading}><ArrowLeft size={19}/><span>Notes</span></button><span className="writing-status" data-state={session.state} role="status">{session.state === "Saved" && <Check size={14}/>} {session.state}</span><div className="writing-reader-actions"><HistoryButtons undo={() => session.undo()} redo={() => session.redo()} canUndo={session.canUndo} canRedo={session.canRedo}/><button aria-label="Save" title="Save" disabled={uploading || session.conflict || !session.dirty || !hasNoteValue(session.value)} onClick={() => void session.flush(true)}><Save size={17}/></button>{session.note && <button aria-label="Delete note" onClick={() => setConfirm("delete")} disabled={session.state === "Saving…" || uploading}><Trash2 size={17}/></button>}</div></header>
      {session.error && <div className="writing-error" role="alert">{session.error}{!session.conflict && <button onClick={() => void session.flush(true)}>Retry</button>}{session.conflict && <><button onClick={() => { void navigator.clipboard?.writeText(`${session.value.title}\n\n${session.value.content}`); }}>Copy my edits</button><button onClick={() => setConfirm("reload")}>Reload latest</button></>}</div>}
      <div className="writing-document-scroll"><article className="writing-document"><input autoFocus className="writing-title" maxLength={255} aria-label="Note title" placeholder="Untitled note" value={session.value.title} onChange={event => session.change({ ...session.value, title: event.target.value })}/>
        <div className="writing-meta">{session.note ? `Updated ${new Date(session.note.updated_at).toLocaleString()}` : "New note"}</div>
        <WritingBody value={session.value.content} onChange={content => session.change({ ...session.value, content })}/>
        <section className="writing-files"><div className="writing-files-heading"><span>Attachments</span><button disabled={uploading} onClick={() => fileInput.current?.click()}><Paperclip size={15}/>{uploading ? "Uploading…" : "Attach file"}</button></div><input hidden ref={fileInput} type="file" multiple onChange={event => { void upload(Array.from(event.target.files || [])); event.target.value = ""; }}/>
          <div className="note-attachment-previews">{session.value.attachments.map((file, index) => <div className="note-attachment" key={file.id || file.url}><UploadedAttachment attachment={file}/><button className="note-attachment-remove" aria-label={`Remove ${file.file_name || "attachment"}`} onClick={() => session.change({ ...session.value, attachments: session.value.attachments.filter((_, position) => position !== index) })}><X size={15}/></button></div>)}</div>
        </section>
      </article></div><footer className="writing-footer"><span>{session.note ? "Your note" : "New note"}</span><span>Autosaves after 2 seconds</span></footer>
    </section></div>}
    {confirm && <div className="writing-confirm"><section className="writing-confirm-box" role="alertdialog" aria-modal="true" aria-label={confirm === "delete" ? "Delete note?" : confirm === "reload" ? "Reload latest note?" : "Discard unsaved changes?"}><h2>{confirm === "delete" ? "Delete this note?" : confirm === "reload" ? "Reload latest note?" : "Discard unsaved changes?"}</h2><p>{confirm === "delete" ? "This note and its attachments will be permanently deleted." : confirm === "reload" ? "This replaces your local edits with the saved version. Copy your edits first if you want to keep them." : "These changes have not been saved. Keep writing to retain your draft."}</p><div className="writing-confirm-actions"><button autoFocus onClick={() => setConfirm(null)}>Keep writing</button><button className="writing-primary" onClick={() => { if (confirm === "delete") void remove(); else if (confirm === "reload" && session?.note) { const id = session.note.id; void api.get(id).then(fresh => { if (!alive.current) return; discard(); const draft = new NoteSession(fresh, api.save, () => persistEntity(entity)); sessions.set(`${entity}:${id}`, draft); setSession(draft); }).catch(() => { setConfirm(null); setError("Couldn't reload. Your local edits are kept."); }); } else discard(); }}>{confirm === "delete" ? "Delete note" : confirm === "reload" ? "Reload latest" : "Discard"}</button></div></section></div>}
  </section>;
}


