import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Globe2, Lock } from "lucide-react";
import DOMPurify from "dompurify";
import { GetEntryRequest } from "@/reusables/hooks/requests";
import type { IEntry } from "@/reusables/vars/interfaces";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import UploadedAttachment from "./UploadedAttachment";
import { DiaryEntrySkeleton } from "../writing/WritingSkeletons";

export default function EntryView() {
  const [params] = useSearchParams();
  const id = params.get("entry_id");
  const { userID } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<IEntry | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setEntry(null); setError("");
    if (id) void GetEntryRequest(id).then(value => { if (!cancelled) setEntry(value); }).catch(() => { if (!cancelled) setError("Couldn't load this entry. Please retry."); });
    return () => { cancelled = true; };
  }, [id, retry]);
  return <><header className="writing-reader-head"><button aria-label="Back to entries" onClick={() => navigate(`/${encodeURIComponent(userID || "")}/diary`)}><ArrowLeft size={19}/><span>Your diary</span></button>{entry && <span className="writing-meta" style={{ margin: 0 }}>{entry.is_private ? <Lock size={13}/> : <Globe2 size={13}/>} {entry.is_private ? "Private" : "Public"}</span>}</header>
    {error ? <div className="writing-error" role="alert">{error}<button onClick={() => setRetry(value => value + 1)}>Retry</button></div> : !entry ? <DiaryEntrySkeleton/> : <><div className="writing-document-scroll"><article className="writing-document"><h1 className="writing-document-title">{entry.title}</h1><div className="writing-meta"><CalendarDays size={13}/>{new Date(`${entry.entry_date}T12:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</div>{entry.mood && <div className="diary-mood"><span>{entry.mood.emoji}</span>You were feeling <strong>{entry.mood.name}</strong></div>}<div className="writing-body ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.content) }}/>{entry.link_preview && <LinkPreviewCard preview={entry.link_preview} variant="display"/>}{entry.tag_objects.length > 0 && <div className="writing-tags" style={{ marginTop: 24 }}>{entry.tag_objects.map(tag => <span key={tag.id} className="writing-tag">{tag.name}</span>)}</div>}{entry.attachments.length > 0 && <section className="writing-files"><div className="writing-files-heading">Attachments</div><div className="diary-attachment-previews">{entry.attachments.map(file => <UploadedAttachment key={file.id} attachment={file}/>)}</div></section>}</article></div><footer className="writing-footer"><span>Your diary</span><span>{entry.mood?.name || ""}</span></footer></>}
  </>;
}
