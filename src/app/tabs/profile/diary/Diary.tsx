/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Lock, Paperclip, Search } from "lucide-react";
import { GetUserEntriesRequest } from "@/reusables/hooks/requests";
import type { AuthenticationInterface, IEntry } from "@/reusables/vars/interfaces";
import BrokenLink from "@/app/reusables/catchers/BrokenLink";
import { WritingHeader } from "../writing/Writing";
import { DiaryListSkeleton } from "../writing/WritingSkeletons";
import { plainText } from "../notes/noteSession";
import NewEntry from "./NewEntry";
import EntryView from "./EntryView";
import DiaryProtection, { useDiaryProtection, type ProtectedEntry } from './DiaryProtection';

export default function Diary() {
  const authentication: AuthenticationInterface = useSelector((state: any) => state.authentication);
  const { userID } = useParams();
  if (userID !== authentication.user.username || authentication.active_entity_context?.is_switched) return <BrokenLink label="Your personal diary" secondaryLabel="Switch to your personal account to open your diary."/>;
  return <DiaryProtection key={`${authentication.user.entity_id}:${authentication.active_entity_context?.id || ''}`}><DiaryWorkspace/></DiaryProtection>;
}

function DiaryWorkspace() {
  const isMobile = useSelector((state: any) => state.screensizelistener.W < 800);
  const navigate = useNavigate();
  const { userID } = useParams();
  const [params] = useSearchParams();
  const id = params.get("entry_id");
  const protection = useDiaryProtection();
  const [entries, setEntries] = useState<ProtectedEntry[]>([]);
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    GetUserEntriesRequest({ page, range: 24 }).then(async data => {
      const decoded = await Promise.all(data.results.map((entry:IEntry)=>protection ? protection.read(entry) : Promise.resolve(entry)));
      if (cancelled) return;
      setEntries(previous => page === 1 ? decoded : [...previous, ...decoded.filter((entry: IEntry) => !previous.some(item => item.id === entry.id))]);
      setNext(Boolean(data.next));
    }).catch(() => { if (!cancelled) setError("Couldn't load entries. Please retry."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, retry, protection?.revision]);
  useEffect(()=>{if(protection?.revision){setEntries([]);setPage(1);setRetry(v=>v+1);}},[protection?.revision]);
  const visible = useMemo(() => entries.filter(entry => !query.trim() || (!entry._locked && `${entry.title} ${plainText(entry.content)} ${entry.tag_objects.map(tag => tag.name).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()))).sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at)), [entries, query]);
  const open = (entry: string) => navigate(`/${encodeURIComponent(userID || "")}/diary?entry_id=${entry}`);
  let lastDate = "";
  return <section className="writing-page diary-page" data-open={id !== null} aria-label="Diary">
    <WritingHeader diary onNew={() => open("new")}/>
    <div className="diary-columns"><aside className="diary-sidebar" aria-label="Diary entries">
      <label className="writing-search"><Search size={16}/><input type="search" placeholder="Search entries" aria-label="Search diary entries" value={query} onChange={event => setQuery(event.target.value)}/></label>
      <p className="diary-protection-note">Search covers loaded, unlocked entries. Load more to search earlier dates.</p>
      <div className="diary-list" aria-busy={loading}>
        {error && <div className="writing-error" role="alert">{error}<button onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
        {visible.map(entry => {
          const showDate = lastDate !== entry.entry_date; lastDate = entry.entry_date;
          return <Fragment key={entry.id}>{showDate && <div className="diary-date-group">{new Date(`${entry.entry_date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}</div>}<button className="diary-row" aria-current={entry.id === id} onClick={() => open(entry.id)}>{entry._locked ? <><span className="diary-row-title"><Lock size={13}/>Locked entry</span><span className="diary-locked-bars" aria-hidden="true"><i/><i/></span><span className="diary-row-preview">{entry._lockError || 'Entry needs a different or older key to unlock'}</span></> : <><span className="diary-row-title"><span className="diary-row-name">{entry.title || "Untitled"}</span>{entry.mood && <span className="diary-row-mood"><span aria-hidden="true">{entry.mood.emoji}</span><span className="diary-mood-name">{entry.mood.name}</span></span>}</span>{entry.tag_objects.length > 0 && <span className="writing-tags">{entry.tag_objects.slice(0, 3).map(tag => <span className="writing-tag" key={tag.id}>{tag.name}</span>)}</span>}<span className="diary-row-preview">{plainText(entry.content)}</span></>}<span className="diary-row-meta">{entry.is_private && <Lock size={11}/>}<span>{entry.is_encrypted ? 'Encrypted' : entry.is_private ? "Private" : "Public"}</span>{entry.attachments.length > 0 && <><Paperclip size={11}/><span>{entry.attachments.length}</span></>}<time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time></span></button></Fragment>;
        })}
        {loading && <DiaryListSkeleton/>}
        {!loading && !visible.length && <div className="writing-empty">{query ? "No matching entries" : "Your days, in your own words."}</div>}
        {next && <button className="writing-load-more" disabled={loading} onClick={() => setPage(value => value + 1)}>Load more entries</button>}
      </div>
    </aside><div className="diary-reader">{id === "new" || (!id && !isMobile) ? <NewEntry key={id || 'default-new'} showBack={isMobile} reload={entry => { setEntries(previous => [entry, ...previous.filter(item => item.id !== entry.id)]); }}/>: id ? <EntryView key={id}/> : null}</div></div>
  </section>;
}
