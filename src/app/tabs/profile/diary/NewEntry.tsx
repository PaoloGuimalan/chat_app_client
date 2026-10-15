/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Paperclip } from "lucide-react";
import { AsyncPaginate } from "react-select-async-paginate";
import { GetTagsListRequest, firstPartyClient } from "@/reusables/hooks/requests";
import envs from "@/reusables/hooks/env_configs";
import type { IEntry, INewEntry, IPendingEntryAttachment } from "@/reusables/vars/interfaces";
import { uploadFiles, type UploadedFile } from "@/reusables/hooks/mediaUpload";
import { formatToDjangoDate, extractFirstUrlFromHtml } from "@/reusables/hooks/reusable";
import { useDragAndDrop } from "@/reusables/hooks/useDragAndDrop";
import { useLinkPreview } from "@/reusables/hooks/useLinkPreview";
import { limitFor } from "@/reusables/vars/uploads";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import { HistoryButtons, WritingBody } from "../writing/Writing";
import { useWritingHistory, useUnsavedWarning, useConfirmNavigation } from "../writing/writingHooks";
import { plainText } from "../notes/noteSession";
import PendingAttachmentItem from "./PendingAttachmentItem";
import CustomTagItem from "./CustomTagItem";
import MoodPicker from "./MoodPicker";

type EntryDraft = INewEntry & { files: IPendingEntryAttachment[] };
// Preserve an explicit-save draft across browser Back/Forward and shell unmounts,
// including its File objects. A full browser exit still shows beforeunload.
const diaryDrafts = new Map<string, { initial: EntryDraft; value: EntryDraft }>();
export default function NewEntry({ reload, showBack = true }: { reload: (entry: IEntry) => void; showBack?: boolean }) {
  const { userID } = useParams();
  const cached = useRef(diaryDrafts.get(userID || "")).current;
  const initial = useMemo<EntryDraft>(() => cached?.initial || ({ title: "", content: "", mood: null, tags: [], attachments: [], entry_date: formatToDjangoDate(new Date())?.slice(0, 10) || null, is_private: true, files: [] }), [cached]);
  const history = useWritingHistory(initial, cached?.value);
  const draft = history.value;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const token = useRef(localStorage.getItem("authtoken") || "").current;
  const urls = useRef(new Set<string>(cached?.value.files.map(file => file.reference) || []));
  const uploaded = useRef(new Map<number, UploadedFile>());
  const savingRef = useRef(false);
  const completed = useRef(false);
  const latest = useRef(draft);
  const latestDirty = useRef(history.dirty);
  latest.current = draft;
  latestDirty.current = history.dirty;
  useEffect(() => {
    alive.current = true;
    const currentUrls = urls.current;
    return () => {
      alive.current = false;
      if (!completed.current && latestDirty.current) diaryDrafts.set(userID || "", { initial, value: latest.current });
      else { diaryDrafts.delete(userID || ""); currentUrls.forEach(url => URL.revokeObjectURL(url)); }
    };
  }, [initial, userID]);
  const dirty = history.dirty && !saved;
  useUnsavedWarning(dirty);
  useConfirmNavigation(() => !completed.current && dirty, saving, () => { completed.current = true; diaryDrafts.delete(userID || ""); });
  const linkPreview = useLinkPreview({ text: extractFirstUrlFromHtml(draft.content) || "", enabled: !saving });
  const addFiles = (files: File[]) => {
    if (saving) return;
    const limit = limitFor("diary");
    if (files.some(file => file.size > limit.maxBytes)) setError(`Files can be at most ${limit.label}.`);
    history.change({ ...draft, files: [...draft.files, ...files.filter(file => file.size <= limit.maxBytes).map(file => {
      const reference = URL.createObjectURL(file); urls.current.add(reference);
      return { id: Date.now() + Math.random(), name: file.name, reference, caption: "", referenceMediaType: file.type.includes("image") ? "image" : file.type.includes("video") ? "video" : file.type, file };
    })] });
  };
  const { isDragging, dragHandlers } = useDragAndDrop({ onFiles: addFiles, disabled: saving });
  const save = async () => {
    if (savingRef.current || !draft.title.trim() || !plainText(draft.content)) return;
    savingRef.current = true; setSaving(true); setError("");
    const snapshot = draft;
    try {
      // Cache completed uploads so a failed entry request can be retried without reuploading.
      for (const pending of snapshot.files) {
        if (!uploaded.current.has(pending.id)) {
          const files = await uploadFiles({ purpose: "diary", files: [pending.file], token });
          uploaded.current.set(pending.id, files[0]);
        }
      }
      const payload: INewEntry = {
        title: snapshot.title, content: snapshot.content, mood: snapshot.mood, tags: snapshot.tags,
        entry_date: snapshot.entry_date || formatToDjangoDate(new Date()), is_private: snapshot.is_private,
        attachments: [...snapshot.attachments, ...snapshot.files.map(pending => { const file = uploaded.current.get(pending.id)!; return { file_id: file.uploadID, file_name: file.name, file_type: file.mime, url: file.fileUrl }; })],
      };
      const response = await firstPartyClient.post<IEntry>(`${envs.USER_SERVICE_API}/api/diary/entry/`, payload, { headers: { "x-access-token": token } });
      if (!alive.current) return;
      completed.current = true; setSaved(true); reload(response.data);
      navigate(`/${encodeURIComponent(userID || "")}/diary?entry_id=${response.data.id}`);
    } catch (err: any) { if (alive.current) setError(err?.response?.data?.detail || err?.message || "Couldn't save your entry. Your draft and attachments are kept. Please retry."); }
    finally { savingRef.current = false; if (alive.current) setSaving(false); }
  };
  const loadTags = async (search: string, _: unknown, additional?: { page: number }) => {
    const page = additional?.page || 1;
    const response = await GetTagsListRequest({ search, page, range: 10 });
    return { options: [...(page === 1 && search.trim() && response.results.is_new ? [{ id: -1, value: search, name: search, label: `Create “${search}”`, is_new: true }] : []), ...response.results.list.map((tag: any) => ({ ...tag, value: tag.id, label: tag.name, is_new: false }))], hasMore: Boolean(response.next), additional: { page: page + 1 } };
  };
  const selectStyles = {
    control: (base: any) => ({ ...base, minHeight: 39, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 9, boxShadow: "none", fontSize: 12 }),
    singleValue: (base: any) => ({ ...base, color: "var(--text)" }),
    input: (base: any) => ({ ...base, color: "var(--text)" }),
    menu: (base: any) => ({ ...base, background: "var(--surface)", border: "1px solid var(--border)", zIndex: 5 }),
    option: (base: any, state: any) => ({ ...base, color: "var(--text)", background: state.isFocused ? "var(--surface-2)" : "var(--surface)", fontSize: 12 }),
    multiValue: (base: any) => ({ ...base, background: "var(--brand-soft)", borderRadius: 5 }),
    multiValueLabel: (base: any) => ({ ...base, color: "var(--text-2)" }),
  };
  return <><header className="writing-reader-head">{showBack ? <button disabled={saving} onClick={() => navigate(`/${encodeURIComponent(userID || "")}/diary`)}><ArrowLeft size={19}/><span>New entry</span></button> : <span>New entry</span>}<div className="writing-reader-actions"><HistoryButtons undo={history.undo} redo={history.redo} canUndo={history.canUndo && !saving} canRedo={history.canRedo && !saving}/><button className="writing-primary" disabled={saving || !draft.title.trim() || !plainText(draft.content)} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</button></div></header>
    {error && <div className="writing-error" role="alert">{error}</div>}
    <div className="writing-document-scroll" onKeyDownCapture={event => {
      if (!saving && (event.target as HTMLElement).closest('.writing-quill') && (event.ctrlKey || event.metaKey) && ["z", "y"].includes(event.key.toLowerCase())) { event.preventDefault(); event.stopPropagation(); if (event.shiftKey || event.key.toLowerCase() === "y") history.redo(); else history.undo(); }
    }}><article className="writing-document"><input autoFocus disabled={saving} className="writing-title" aria-label="Entry title" placeholder="Give today a title" value={draft.title} onChange={event => history.change({ ...draft, title: event.target.value })}/>
      <div className="diary-form"><label className="diary-field"><span>Date</span><input type="date" aria-label="Entry date" disabled={saving} value={draft.entry_date || ""} onChange={event => history.change({ ...draft, entry_date: event.target.value })}/></label><label className="diary-field"><span>Privacy</span><select aria-label="Entry privacy" disabled={saving} value={draft.is_private ? "private" : "public"} onChange={event => history.change({ ...draft, is_private: event.target.value === "private" })}><option value="private">Private</option><option value="public">Public</option></select></label>
      <div className="diary-field diary-field-wide"><span>Mood</span><MoodPicker value={draft.mood} disabled={saving} onChange={mood => history.change({ ...draft, mood })}/></div>
      <div className="diary-field diary-field-wide"><span id="entry-tags-label">Tags</span><AsyncPaginate className="diary-tags-select" classNamePrefix="diary-tags" aria-labelledby="entry-tags-label" isDisabled={saving} isMulti value={draft.tags} loadOptions={loadTags} debounceTimeout={300} additional={{ page: 1 }} isClearable placeholder="Search or create a tag" styles={selectStyles} components={{ Option: CustomTagItem }} onChange={(tags: any) => history.change({ ...draft, tags })}/></div></div>
      <WritingBody value={draft.content} disabled={saving} onChange={content => history.change({ ...draft, content })}/>
      {linkPreview.status === "ok" && linkPreview.preview && <LinkPreviewCard preview={linkPreview.preview} variant="composer" onRemove={linkPreview.dismiss}/>}
      <section className="writing-files" {...dragHandlers}><div className="writing-files-heading"><span>{isDragging ? "Drop files to attach" : "Attachments"}</span><button disabled={saving} onClick={() => fileInput.current?.click()}><Paperclip size={15}/>Attach file</button></div><input hidden ref={fileInput} type="file" multiple onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ""; }}/>{draft.files.length ? <div className="diary-attachment-previews">{draft.files.map(file => <PendingAttachmentItem key={file.id} attachment={file} onRemove={id => { if (!saving) history.change({ ...draft, files: draft.files.filter(item => item.id !== id) }); }}/>)}</div> : <p style={{ fontSize: 12, color: "var(--text-2)", padding: "15px 0" }}>Drop files here or choose Attach file.</p>}</section>
    </article></div><footer className="writing-footer"><span>New diary entry</span><span>{draft.is_private ? "Private" : "Public"}</span></footer>
  </>;
}
