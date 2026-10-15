/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLayoutEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { ArrowLeft, Plus, Search, Undo2, Redo2 } from "lucide-react";
import ReactQuill from "react-quill";
import { useNavigate } from "react-router-dom";
import { appShortcutIcons } from "@/app/widgets/desktopwidgets/appShortcutIcons";
import type { AuthenticationInterface } from "@/reusables/vars/interfaces";

import "react-quill/dist/quill.snow.css";
import "./writing.css";

export function WritingHeader({ diary = false, query, onSearch, onNew }: { diary?: boolean; query?: string; onSearch?: (query: string) => void; onNew: () => void }) {
  const authentication: AuthenticationInterface = useSelector((state: any) => state.authentication);
  const navigate = useNavigate();
  const active = authentication.active_entity_context;
  const name = active?.is_switched ? active.name || "Your page" : [authentication.user.fullName.firstName, authentication.user.fullName.lastName].filter(Boolean).join(" ");
  const profile = active?.is_switched ? active.profile : authentication.user.profile;
  const subtitle = diary ? "Your personal diary" : active?.is_switched ? "Page notebook" : "Your personal notebook";
  return <header className="writing-head">
    <div className="writing-heading"><button className="writing-mobile-back" aria-label="Back to account" onClick={() => navigate("/user")}><ArrowLeft size={20}/></button><span className="writing-app-icon">{diary ? appShortcutIcons.diary : appShortcutIcons.notes}</span><div className="writing-heading-label"><h1>{diary ? "Diary" : "Notes"}</h1><small className="writing-desktop-subtitle">{subtitle}</small></div></div>
    <div className="writing-owner">{profile && profile !== "none" ? <img src={profile} alt=""/> : <span className="writing-owner-fallback">{name.slice(0, 1)}</span>}<span><strong>{name}</strong><small>{diary ? "Your personal diary" : active?.is_switched ? "Page notebook" : "Your personal notebook"}</small></span></div>
    {onSearch && <label className="writing-search"><Search size={16}/><input type="search" aria-label={diary ? "Search diary" : "Search notes"} placeholder={diary ? "Search entries" : "Search notes"} value={query} onChange={event => onSearch(event.target.value)}/></label>}
    <button className="writing-primary writing-new" onClick={onNew}><Plus size={17}/>{diary ? "New entry" : "New note"}</button>
  </header>;
}

export function HistoryButtons({ undo, redo, canUndo, canRedo }: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }) {
  return <div className="writing-history"><button aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!canUndo} onMouseDown={event => event.preventDefault()} onClick={undo}><Undo2 size={17}/></button><button aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onMouseDown={event => event.preventDefault()} onClick={redo}><Redo2 size={17}/></button></div>;
}

export function WritingBody({ value, onChange, disabled = false }: { value: string; onChange: (html: string) => void; disabled?: boolean }) {
  const editor = useRef<ReactQuill>(null);
  const initial = useRef(value);
  const modules = useMemo(() => ({ clipboard: { matchVisual: false }, toolbar: [[{ header: [2, 3, false] }], ["bold", "italic", "underline"], [{ list: "bullet" }, { list: "ordered" }], ["blockquote", "link"], ["clean"]] }), []);
  useLayoutEffect(() => {
    const quill = editor.current?.getEditor();
    if (!quill || value === quill.root.innerHTML) return;
    const target = quill.clipboard.convert(value);
    const last = target.ops?.at(-1)?.insert;
    if (typeof last !== "string" || !last.endsWith("\n")) target.insert("\n");
    const change = quill.getContents().diff(target);
    if (!change.ops?.length) return;
    let index = 0, formatCaret = 0, textCaret: number | null = null;
    for (const operation of change.ops) {
      if (operation.retain) { index += operation.retain; if (operation.attributes) formatCaret = index; }
      if (operation.insert !== undefined) { index += typeof operation.insert === "string" ? operation.insert.length : 1; textCaret = index; }
      if (operation.delete) textCaret = index;
    }
    // Updating only the changed Delta avoids a full HTML replacement, which
    // preserves an unrelated old caret and can introduce visual blank lines.
    quill.updateContents(change, "api");
    quill.setSelection(Math.min(textCaret ?? formatCaret, Math.max(0, quill.getLength() - 1)), 0, "silent");
  }, [value]);
  return <ReactQuill ref={editor} theme="snow" defaultValue={initial.current} onChange={(html, _delta, source) => { if (source === "user") onChange(html); }} readOnly={disabled} modules={modules} placeholder="Start writing…" className="writing-quill"/>;
}


