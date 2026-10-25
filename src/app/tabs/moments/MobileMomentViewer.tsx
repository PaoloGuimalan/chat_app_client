import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Icon } from "@/reusables/design";
import { GetEphemeralViewersRequest, ReactionSaveRequest, SendEphemeralReplyRequest } from "@/reusables/hooks/requests";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import type { Emoji, IEphemeralViewers, IPost } from "@/reusables/vars/interfaces";
import { audienceOf, entityAvatar, entityFirstName, entityName, timeAgoLabel, timeLeftLabel } from "./ephemeral";
import MomentViewersPanel from "./MomentViewersPanel";
import "./mobile-moments.css";

interface Props {
  moment?: IPost;
  moments: IPost[] | null;
  index: number;
  progress: number;
  own: boolean;
  archived: boolean;
  video: boolean;
  paused: boolean;
  muted: boolean;
  children: ReactNode;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onAuthor: (offset: number) => void;
  onPause: () => void;
  onMute: () => void;
  onHold: (holding: boolean) => void;
  onReacted: (id: string | null) => void;
  onReport: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onChanged: (patch: Partial<IPost>) => void;
}

/** Native-style phone presentation; playback and navigation stay in MomentViewer. */
export default function MobileMomentViewer(props: Props) {
  const { moment, moments, index, progress, own, archived, video, paused, muted, children,
    onClose, onNext, onPrevious, onAuthor, onPause, onMute, onHold } = props;
  const dispatch = useDispatch();
  const palette = useSelector((state: { emojilist?: Emoji[] }) => state.emojilist ?? []);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [tray, setTray] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [focused, setFocused] = useState(false);
  const [held, setHeld] = useState(false);
  const [burst, setBurst] = useState(0);
  const [viewers, setViewers] = useState<IEphemeralViewers | null>(null);
  const [viewersFailed, setViewersFailed] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const gesture = useRef<{ x: number; y: number; held: boolean; timer: ReturnType<typeof setTimeout> } | null>(null);
  const linger = useRef<ReturnType<typeof setTimeout>>();
  const input = useRef<HTMLInputElement>(null);
  const viewersButton = useRef<HTMLButtonElement>(null);
  const momentId = moment?.post_id;
  const first = moment ? entityFirstName(moment.entity) : "";
  const allowsReplies = moment?.details?.allow_replies !== false;
  const mine = moment?.entity_reaction;
  const mineGlyph = palette.find(emoji => emoji.emoji_id === mine)?.emoji_content;

  useEffect(() => { onHold(held || focused || tray || sheet); }, [held, focused, tray, sheet, onHold]);
  useEffect(() => () => { clearTimeout(gesture.current?.timer); clearTimeout(linger.current); onHold(false); }, [onHold]);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const measure = () => setKeyboardInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    measure(); viewport.addEventListener("resize", measure); viewport.addEventListener("scroll", measure);
    return () => { viewport.removeEventListener("resize", measure); viewport.removeEventListener("scroll", measure); };
  }, []);
  useEffect(() => {
    if (!sheet && !tray && !focused) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (sheet) setSheet(false);
      else if (tray) { clearTimeout(linger.current); setTray(false); }
      else input.current?.blur();
    };
    window.addEventListener("keydown", escape);
    const trigger = sheet ? viewersButton.current : null;
    return () => { window.removeEventListener("keydown", escape); trigger?.focus(); };
  }, [sheet, tray, focused]);
  useEffect(() => {
    let cancelled = false;
    setViewers(null);
    setViewersFailed(false);
    if (own && momentId) {
      GetEphemeralViewersRequest("moment", momentId, "all")
        .then(data => { if (!cancelled) setViewers(data); })
        .catch(() => { if (!cancelled) setViewersFailed(true); });
    }
    return () => { cancelled = true; };
  }, [own, momentId]);

  const alert = (type: string, content: string) => dispatch({ type: SET_MUTATE_ALERTS, payload: { alerts: { type, content } } });
  const react = async (emoji: Emoji) => {
    if (!moment || !allowsReplies || (mine && mine !== emoji.emoji_id)) return;
    setBurst(value => value + 1);
    clearTimeout(linger.current);
    linger.current = setTimeout(() => setTray(false), 1400);
    if (mine || reacting) return;
    setReacting(true);
    props.onReacted(emoji.emoji_id);
    try {
      await ReactionSaveRequest({ post_id: moment.post_id, emoji_id: emoji.emoji_id, method: "POST" });
    } catch {
      props.onReacted(null);
      alert("warning", "We couldn't save that reaction.");
    } finally { setReacting(false); }
  };
  const send = async () => {
    if (!moment?.entity || !draft.trim() || sending || !allowsReplies) return;
    setSending(true);
    try {
      await SendEphemeralReplyRequest({ authorEntityId: moment.entity.id, kind: "moment", postId: moment.post_id, content: draft.trim() });
      setDraft(""); input.current?.blur();
      alert("success", `Reply sent to ${first}.`);
    } catch { alert("warning", "We couldn't send that reply."); }
    finally { setSending(false); }
  };
  const startGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button,a,input")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY, held: false, timer: setTimeout(() => {
      start.held = true; setHeld(true);
    }, 180) };
    gesture.current = start;
  };
  const finishGesture = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start) return;
    clearTimeout(start.timer); gesture.current = null; setHeld(false);
    if (focused) { input.current?.blur(); return; }
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { onAuthor(dx < 0 ? 1 : -1); return; }
    if (dy > 80) { onClose(); return; }
    if (dy < -60 && own) { setSheet(true); return; }
    if (start.held || Math.abs(dx) > 12 || Math.abs(dy) > 12) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX - box.left < box.width / 3) onPrevious(); else onNext();
  };
  const cancelGesture = () => { clearTimeout(gesture.current?.timer); gesture.current = null; setHeld(false); };

  return <section className="cl-mobile-moment" aria-label="Moments viewer">
    <div className="cl-mobile-moment__media" onPointerDown={startGesture} onPointerUp={finishGesture} onPointerCancel={cancelGesture}>
      {children}
    </div>
    <div className="cl-mobile-moment__shade" aria-hidden />
    <header className="cl-mobile-moment__header">
      <div className="cl-mobile-moment__progress" aria-label={moment ? `Moment ${index + 1} of ${moments?.length}` : "Loading Moments"}>
        {moments?.map((item, at) => <span key={item.post_id}><i style={{ width: `${at < index ? 100 : at === index ? progress * 100 : 0}%` }}/></span>)}
      </div>
      <div className="cl-mobile-moment__author">
        {moment && <>
          <span className="cl-mobile-moment__avatar"><Avatar id={moment.entity?.id} name={entityName(moment.entity)} src={entityAvatar(moment.entity)} size={30} online={false}/></span>
          <div className="cl-mobile-moment__identity">
            <div><strong>{own ? "Your moment" : entityName(moment.entity)}</strong><small>{timeAgoLabel(moment.date_posted)}</small></div>
            <small>{own && <><Icon n={audienceOf(moment.privacy_status).icon} s={12}/> {audienceOf(moment.privacy_status).label} · </>}{archived ? "Archived" : timeLeftLabel(moment.expires_at)}</small>
          </div>
          {video && <button className="cl-mobile-moment__circle" title={muted ? "Unmute" : "Mute"} aria-label={muted ? "Unmute" : "Mute"} onClick={onMute}><Icon n={muted ? "volume_off" : "volume_up"}/></button>}
          <button className="cl-mobile-moment__circle" title={paused ? "Play" : "Pause"} aria-label={paused ? "Play" : "Pause"} onClick={onPause}><Icon n={paused ? "play_arrow" : "pause"}/></button>
        </>}
        <button className="cl-mobile-moment__circle" title="Close" aria-label="Close Moments" onClick={onClose}><Icon n="close"/></button>
      </div>
    </header>
    {!moment && <div className="cl-mobile-moment__empty" role="status">{moments === null ? "Loading Moments…" : "This moment is no longer available"}</div>}
    {moment && <footer className="cl-mobile-moment__footer" style={{ bottom: focused ? keyboardInset : 0 }}>
      {moment.caption && <p className="cl-mobile-moment__caption">{moment.caption}</p>}
      {own ? <>
        <button className="cl-mobile-moment__up" aria-label="Open viewers" onClick={() => setSheet(true)}><Icon n="keyboard_arrow_up"/></button>
        <div className="cl-mobile-moment__actions">
          <button ref={viewersButton} className="cl-mobile-moment__viewers" aria-label="Viewers" onClick={() => setSheet(true)}>
            <Icon n="visibility" s={26}/><span><strong>{viewers ? viewers.totals.views ? `${viewers.totals.views} ${viewers.totals.views === 1 ? "viewer" : "viewers"}` : "No viewers yet" : viewersFailed ? "Viewers" : "Loading viewers…"}</strong><small><Icon n="favorite_border" s={13}/> {viewers?.totals.reactions ?? "–"} <Icon n="chat_bubble_outline" s={13}/> {viewers?.totals.replies ?? "–"}</small></span>
          </button>
          <button className="cl-mobile-moment__circle" aria-label="Moment settings" onClick={() => setSheet(true)}><Icon n="more_horiz"/></button>
        </div>
      </> : allowsReplies ? <>
        {tray && <div className="cl-mobile-moment__reactions" aria-label="Reactions">
          {[...palette].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).slice(0, 6).map(emoji => <button key={emoji.emoji_id} aria-label={`React ${emoji.emoji_title}`} disabled={Boolean(mine && mine !== emoji.emoji_id)} onClick={() => void react(emoji)} className={mine === emoji.emoji_id ? "is-selected" : undefined}><span key={mine === emoji.emoji_id ? burst : 0} className={mine === emoji.emoji_id && burst ? "cl-moment-react-pop" : undefined}>{emoji.emoji_content}</span></button>)}
        </div>}
        <div className="cl-mobile-moment__actions">
          <button className="cl-mobile-moment__circle" aria-label="Reactions" aria-expanded={tray} disabled={!palette.length} onClick={() => { clearTimeout(linger.current); setTray(value => !value); }}><span key={burst} className={burst ? "cl-moment-react-pop" : undefined}>{mineGlyph || <Icon n="add_reaction" s={22}/>}</span></button>
          <form className="cl-mobile-moment__reply" onSubmit={event => { event.preventDefault(); void send(); }}>
            <input ref={input} aria-label={`Reply to ${first}`} placeholder={`Reply to ${first}…`} value={draft} onChange={event => setDraft(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} disabled={sending}/>
            <button aria-label="Send reply" disabled={!draft.trim() || sending}><Icon n="send" s={19}/></button>
          </form>
        </div>
        <small className="cl-mobile-moment__status"><Icon n={mineGlyph ? "check_circle" : "lock_outline"} s={12}/>{mineGlyph ? `You reacted ${mineGlyph} · ${first} will see it` : `Replies go to your chat with ${first}.`}</small>
      </> : <small className="cl-mobile-moment__status"><Icon n="lock_outline" s={13}/>Replies are off for this moment</small>}
      {!own && <button className="cl-mobile-moment__report" onClick={props.onReport}>Report Moment</button>}
    </footer>}
    {sheet && moment && <div className="cl-mobile-moment__sheet-shade" onClick={() => setSheet(false)}>
      <section className="cl-mobile-moment__sheet" role="dialog" aria-modal="true" aria-label="Moment viewers and settings" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]');
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
        <button className="cl-mobile-moment__sheet-close" autoFocus aria-label="Close viewers" onClick={() => setSheet(false)}><Icon n="close"/></button>
        <MomentViewersPanel moment={moment} onDelete={props.onDelete} onArchive={props.onArchive} onUnarchive={props.onUnarchive} onChanged={props.onChanged} archived={archived}/>
      </section>
    </div>}
  </section>;
}
