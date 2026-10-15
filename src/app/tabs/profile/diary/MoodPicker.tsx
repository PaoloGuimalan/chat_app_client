import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { GetMoodListRequest } from "@/reusables/hooks/requests";
import type { INewEntry } from "@/reusables/vars/interfaces";
type Mood = NonNullable<INewEntry["mood"]>;

export default function MoodPicker({ value, onChange, disabled }: { value: Mood | null; onChange: (mood: Mood | null) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const load = async () => {
    if (pending.current || !more) return;
    pending.current = true; setLoading(true); setError("");
    try {
      const result = await GetMoodListRequest({ page: page + 1, range: 10 });
      if (!alive.current) return;
      setMoods(previous => [...previous, ...result.results.filter((mood: Mood) => !previous.some(item => item.id === mood.id)).map((mood: Mood) => ({ ...mood, value: mood.id, label: `${mood.emoji} ${mood.name}` }))]);
      setPage(page + 1); setMore(Boolean(result.next));
    } catch { if (alive.current) setError("Couldn't load moods. Please retry."); }
    finally { pending.current = false; if (alive.current) setLoading(false); }
  };
  return <><button className="diary-mood-button" type="button" aria-haspopup="dialog" aria-expanded={open} disabled={disabled} onClick={() => { setOpen(true); if (!moods.length) void load(); }}>{value ? `${value.emoji} ${value.name}` : "How are you feeling?"}<ChevronDown size={15}/></button>{open && <div className="writing-confirm"><section className="writing-confirm-box diary-mood-picker" role="dialog" aria-modal="true" aria-label="How are you feeling?" onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); } }}><header><h2>How are you feeling?</h2><button autoFocus aria-label="Close mood picker" onClick={() => setOpen(false)}><X size={18}/></button></header><div className="diary-mood-scroll" onScroll={event => { const list = event.currentTarget; if (list.scrollHeight - list.scrollTop - list.clientHeight < 45 && !error) void load(); }}><div className="diary-mood-grid">{moods.map(mood => <button key={mood.id} aria-pressed={value?.id === mood.id} onClick={() => { onChange(mood); setOpen(false); }}><span>{mood.emoji}</span>{mood.name}</button>)}</div>{error && <p role="alert">{error}</p>}{more && <button className="writing-load-more" disabled={loading} onClick={() => void load()}>{loading ? "Loading…" : error ? "Retry" : "Load more moods"}</button>}</div><button onClick={() => { onChange(null); setOpen(false); }}>Clear mood</button></section></div>}</>;
}
