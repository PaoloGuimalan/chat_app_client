/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "@/app/reusables/Modal";
import { Avatar, Btn, Chip, Icon, SegTabs } from "@/reusables/design";
import {
  CreateThoughtRequest,
  DeletePostRequest,
  GetOwnThoughtRequest,
  GetThoughtsRailRequest,
  MarkEphemeralSeenRequest,
  ReactionSaveRequest,
  SendEphemeralReplyRequest,
  UpdateThoughtRequest,
} from "@/reusables/hooks/requests";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import { getActiveAvatar } from "@/reusables/hooks/reusable";
import type {
  AuthenticationInterface,
  Emoji,
  EphemeralAudience,
  IThought,
  IThoughtsRail,
  ThoughtMood,
} from "@/reusables/vars/interfaces";
import {
  AUDIENCES,
  THOUGHTS_CHANGED_EVENT,
  THOUGHT_EMOJIS,
  THOUGHT_MAX_LENGTH,
  THOUGHT_MOODS,
  charCount,
  entityAvatar,
  entityFirstName,
  entityName,
  moodOf,
  timeAgoLabel,
  timeLeftLabel,
} from "./ephemeral";

const useAlert = () => {
  const dispatch = useDispatch();
  return (type: string, content: string) =>
    dispatch({ type: SET_MUTATE_ALERTS, payload: { alerts: { type, content } } });
};

/** The two trailing dots under a thought bubble, pointing at the avatar. */
export function BubbleTail({ left = 20, bg = "var(--surface)" }: { left?: number; bg?: string }) {
  const dot = (size: number, x: number, y: number): CSSProperties => ({
    position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: bg, border: "1px solid var(--border)",
  });
  return (
    <div style={{ height: 10, width: "100%", position: "relative" }}>
      <span style={dot(8, left + 4, -2)} />
      <span style={dot(4, left, 6)} />
    </div>
  );
}

/** A thought's text + mood as a bubble (rail, profile, composer preview). */
export function ThoughtBubble({
  text,
  mood,
  meta,
  size = "md",
  highlighted,
  style,
}: {
  text: string;
  mood?: ThoughtMood | null;
  meta?: string;
  size?: "sm" | "md" | "lg";
  highlighted?: boolean;
  style?: CSSProperties;
}) {
  const m = moodOf(mood);
  const font = size === "sm" ? 10.5 : size === "lg" ? "var(--fs-body)" : "var(--fs-body-sm)";
  return (
    <div
      style={{
        padding: size === "sm" ? "5px 8px" : "8px 12px",
        background: highlighted ? "var(--brand-soft)" : "var(--surface)",
        border: `1px solid ${highlighted ? "var(--brand)" : "var(--border)"}`,
        borderRadius: size === "sm" ? 14 : 16,
        boxShadow: size === "sm" ? "var(--shadow-sm)" : "var(--shadow-md)",
        display: "flex", flexDirection: "column", gap: 3,
        alignItems: size === "sm" ? "center" : "flex-start",
        ...style,
      }}
    >
      <span
        style={{
          fontSize: font, fontWeight: size === "sm" ? 500 : 600, color: "var(--text)", lineHeight: 1.3,
          textAlign: size === "sm" ? "center" : "left", wordBreak: "break-word",
          display: "-webkit-box", WebkitLineClamp: size === "sm" ? 2 : 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}
      >
        {text}
      </span>
      {(m || meta) && size !== "sm" && (
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "var(--fs-meta)", color: "var(--text-3)" }}>
          {m && <Icon n={m.icon} s={12} />}
          {[m?.label, meta].filter(Boolean).join(" · ")}
        </span>
      )}
    </div>
  );
}

/** Mood chip as the detail view shows it. */
function MoodChip({ mood }: { mood: ThoughtMood | null | undefined }) {
  const m = moodOf(mood);
  if (!m) return null;
  return (
    <span style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 4, height: 22, padding: "0 8px", borderRadius: 999, background: m.bg, color: m.fg, fontSize: "var(--fs-meta)", fontWeight: 650 }}>
      <Icon n={m.icon} s={13} />
      {m.label}
    </span>
  );
}

/**
 * Someone else's thought, opened from the rail (design 1e popover): the
 * thought, react, and reply - which goes to your chat with them.
 */
export function ThoughtDetail({
  thought,
  onClose,
  style,
}: {
  thought: IThought;
  onClose: () => void;
  style?: CSSProperties;
}) {
  const alert = useAlert();
  const emojilist: Emoji[] = useSelector((state: any) => state.emojilist ?? []);
  const palette = useMemo(() => [...emojilist].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)), [emojilist]);
  const [mine, setMine] = useState<string | null>((thought as any).my_reaction ?? null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const author = thought.author;
  const first = entityFirstName(author);

  useEffect(() => {
    MarkEphemeralSeenRequest("thought", thought.post_id);
  }, [thought.post_id]);

  const react = async (emoji: Emoji) => {
    const method = !mine ? "POST" : mine === emoji.emoji_id ? "DELETE" : "PUT";
    const before = mine;
    setMine(method === "DELETE" ? null : emoji.emoji_id);
    try {
      await ReactionSaveRequest({ post_id: thought.post_id, emoji_id: emoji.emoji_id, method });
    } catch (err: any) {
      setMine(before);
      alert("warning", err?.message || "We couldn't save that reaction.");
    }
  };

  const send = async () => {
    if (!draft.trim() || busy || !author) return;
    setBusy(true);
    try {
      await SendEphemeralReplyRequest({ authorEntityId: author.id, kind: "thought", postId: thought.post_id, content: draft.trim() });
      alert("success", `Reply sent to ${first}.`);
      onClose();
    } catch (err: any) {
      alert("warning", err?.message || "We couldn't send that reply.");
      setBusy(false);
    }
  };

  return (
    <div style={{ width: 330, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)", padding: 16, display: "flex", flexDirection: "column", gap: 14, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar id={author?.id} entityId={author?.id} name={entityName(author)} src={entityAvatar(author)} size={44} style={{ boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px var(--brand)" }} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "var(--fs-body)", fontWeight: 700, color: "var(--text)" }}>{entityName(author)}</span>
          <span style={{ fontSize: "var(--fs-meta)", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
            {timeAgoLabel(thought.date_posted)} · <Icon n="timer" s={12} />{timeLeftLabel(thought.expires_at)}
          </span>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-3)" }}>
          <Icon n="close" s={20} />
        </button>
      </div>
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 18, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, color: "var(--text)", wordBreak: "break-word" }}>{thought.content.text}</span>
        <MoodChip mood={thought.content.mood} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        {palette.slice(0, 6).map((emoji) => (
          <button key={emoji.emoji_id} onClick={() => react(emoji)} title={emoji.emoji_title}
            style={{ width: 40, height: 40, borderRadius: "50%", background: mine === emoji.emoji_id ? "var(--brand-soft)" : "var(--surface-2)", border: `1px solid ${mine === emoji.emoji_id ? "var(--brand)" : "var(--border)"}`, fontSize: 19, cursor: "pointer" }}>
            {emoji.emoji_content}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`Reply to ${first}…`}
          style={{ flex: 1, minWidth: 0, height: 40, padding: "0 14px", borderRadius: 20, background: "var(--input)", border: "1px solid var(--border)", outline: "none", color: "var(--text)", fontSize: "var(--fs-body-sm)" }} />
        <button onClick={send} disabled={!draft.trim() || busy} aria-label="Send"
          style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: draft.trim() ? 1 : 0.55 }}>
          <Icon n="send" s={18} />
        </button>
      </div>
      <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5, marginTop: -6 }}>
        <Icon n="lock" s={14} />Replies go to your chat with {first}.
      </span>
    </div>
  );
}

/**
 * Share or edit your thought (designs 1f / 2g): live preview, text (60),
 * one-tap emoji, mood, audience. Editing keeps the thought's timer and views
 * and offers Delete.
 */
export function ThoughtComposerModal({ existing, onClose }: { existing: IThought | null; onClose: () => void }) {
  const alert = useAlert();
  const authentication: AuthenticationInterface = useSelector((state: any) => state.authentication);
  const avatar = getActiveAvatar(authentication);
  const [text, setText] = useState(existing?.content.text ?? "");
  const [mood, setMood] = useState<ThoughtMood | null>(existing?.content.mood ?? null);
  const [audience, setAudience] = useState<EphemeralAudience>(
    (existing?.privacy_status as EphemeralAudience) ?? (authentication.user.isPrivate ? "connections" : "public"),
  );
  const [views, setViews] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const length = charCount(text.trim());

  useEffect(() => {
    if (existing) GetOwnThoughtRequest(existing.post_id).then((t) => setViews(t.views ?? 0)).catch(() => {});
  }, [existing?.post_id]);

  const done = (message: string) => {
    window.dispatchEvent(new CustomEvent(THOUGHTS_CHANGED_EVENT));
    alert("success", message);
    onClose();
  };

  const save = async () => {
    if (busy || length === 0 || length > THOUGHT_MAX_LENGTH) return;
    setBusy(true);
    try {
      if (existing) {
        await UpdateThoughtRequest(existing.post_id, { text: text.trim(), mood, privacy_status: audience });
        done("Thought updated.");
      } else {
        await CreateThoughtRequest({ text: text.trim(), mood, privacy: audience });
        done("Your thought is up for 24 hours.");
      }
    } catch (err: any) {
      alert("warning", err?.message || "We couldn't save your thought.");
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!existing || busy || !window.confirm("Delete your thought?")) return;
    setBusy(true);
    try {
      await DeletePostRequest([existing.post_id]);
      done("Thought deleted.");
    } catch {
      alert("warning", "We couldn't delete your thought.");
      setBusy(false);
    }
  };

  const label: CSSProperties = { fontSize: "var(--fs-meta)", fontWeight: 600, color: "var(--text-2)", marginBottom: 8 };

  return (
    <Modal
      component={
        <div style={{ width: "min(460px, calc(100vw - 24px))", maxHeight: "calc(100vh - 24px)", overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)", padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon n="bubble_chart" s={18} c="var(--brand)" />
              </span>
              <span style={{ fontSize: "var(--fs-heading)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
                {existing ? "Your thought" : "Share a thought"}
              </span>
            </div>
            <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon n="close" s={18} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0 18px", background: "var(--surface-2)", borderRadius: "var(--r-md)", marginBottom: 16 }}>
            <ThoughtBubble text={text.trim() || "What's on your mind?"} mood={mood} style={{ maxWidth: 240, alignItems: "center" }} />
            <div style={{ width: 100 }}><BubbleTail left={30} /></div>
            <Avatar id={authentication.user.userID} name={avatar.name} src={avatar.src} size={72} online={false} />
            {existing && (
              <span style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 4, height: 24, padding: "0 10px", borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand)", fontSize: "var(--fs-meta)", fontWeight: 650 }}>
                <Icon n="timer" s={14} />
                {timeLeftLabel(existing.expires_at)}{views !== null ? ` · seen by ${views}` : ""}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7, height: 44, padding: "0 12px", background: "var(--input)", border: `1px solid ${length > THOUGHT_MAX_LENGTH ? "var(--pink)" : "var(--border)"}`, borderRadius: "var(--r-sm)", marginBottom: 6 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Share a thought…" autoFocus
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "var(--text)", fontSize: "var(--fs-body)" }} />
            <span style={{ fontSize: "var(--fs-meta)", color: length > THOUGHT_MAX_LENGTH ? "var(--pink)" : "var(--text-3)" }}>{length}/{THOUGHT_MAX_LENGTH}</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {THOUGHT_EMOJIS.map((emoji) => (
              <button key={emoji} onClick={() => setText((t) => (charCount(t) < THOUGHT_MAX_LENGTH ? `${t}${emoji}` : t))}
                style={{ flex: 1, height: 34, borderRadius: "var(--r-sm)", border: "none", background: "var(--surface-2)", fontSize: 18, cursor: "pointer" }}>
                {emoji}
              </button>
            ))}
          </div>

          <span style={label}>Mood</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {THOUGHT_MOODS.map((m) => (
              <Chip key={m.key} icon={m.icon} active={mood === m.key} onClick={() => setMood(mood === m.key ? null : m.key)}>{m.label}</Chip>
            ))}
          </div>

          <span style={label}>Who can see this</span>
          <SegTabs tabs={AUDIENCES.map((a) => ({ key: a.key, label: a.label, icon: a.icon }))} value={audience}
            onChange={(k) => setAudience(k as EphemeralAudience)} style={{ display: "flex", marginBottom: 18 }} />

          {existing && (
            <button onClick={remove} disabled={busy}
              style={{ height: 40, marginBottom: 14, borderRadius: "var(--r-sm)", border: "none", background: "var(--pink-soft)", color: "var(--pink)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "var(--fs-label)", fontWeight: 650, cursor: "pointer" }}>
              <Icon n="delete_outline" s={18} />Delete thought
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <Icon n="timer" s={18} c="var(--text-3)" />
            <span style={{ flex: 1, fontSize: "var(--fs-caption)", color: "var(--text-2)" }}>Disappears after 24 hours. Not shown in the feed.</span>
            <Btn onClick={save} disabled={busy || length === 0 || length > THOUGHT_MAX_LENGTH}>{existing ? "Update" : "Share"}</Btn>
          </div>
        </div>
      }
    />
  );
}

/**
 * The Thoughts rail at the top of Messages (design 1e): your thought first
 * (edit badge, or "add" when you have none), then your circle's thoughts
 * newest first. Tap someone's to react or reply; tap yours to edit it.
 */
export function ThoughtsRail() {
  const authentication: AuthenticationInterface = useSelector((state: any) => state.authentication);
  const self = getActiveAvatar(authentication);
  const [rail, setRail] = useState<IThoughtsRail | null>(null);
  const [open, setOpen] = useState<{ thought: IThought; left: number } | null>(null);
  const [composing, setComposing] = useState(false);

  const load = () => GetThoughtsRailRequest().then(setRail).catch(() => setRail({ mine: null, results: [] }));
  useEffect(() => {
    load();
    window.addEventListener(THOUGHTS_CHANGED_EVENT, load);
    return () => window.removeEventListener(THOUGHTS_CHANGED_EVENT, load);
  }, []);

  if (!rail) return null;
  const item = (key: string, bubble: React.ReactNode, avatarNode: React.ReactNode, label: string, onClick: (e: React.MouseEvent) => void, bold?: boolean) => (
    <button key={key} onClick={onClick} style={{ width: 70, flex: "none", display: "flex", flexDirection: "column", alignItems: "center", border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
      <div style={{ minHeight: 34, display: "flex", alignItems: "flex-end", width: "100%", justifyContent: "center" }}>{bubble}</div>
      <BubbleTail />
      {avatarNode}
      <span style={{ marginTop: 5, maxWidth: 70, fontSize: "var(--fs-meta)", color: "var(--text-2)", fontWeight: bold ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </button>
  );

  return (
    <div style={{ position: "relative", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
      {composing && <ThoughtComposerModal existing={rail.mine} onClose={() => setComposing(false)} />}
      <div className="cl-rail-track" style={{ display: "flex", gap: 4, padding: "0 12px 12px", alignItems: "flex-end", overflowX: "auto" }}>
        {item(
          "mine",
          <ThoughtBubble size="sm" text={rail.mine?.content.text ?? "Share a thought"} style={{ maxWidth: 70, minWidth: 44, color: rail.mine ? undefined : "var(--text-3)" }} />,
          <span style={{ position: "relative" }}>
            <Avatar id={authentication.user.userID} name={self.name} src={self.src} size={52} online={false} />
            <span style={{ position: "absolute", right: -2, bottom: -2, width: 20, height: 20, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon n={rail.mine ? "edit" : "add"} s={12} />
            </span>
          </span>,
          "Your thought",
          () => setComposing(true),
          true,
        )}
        {rail.results.map((thought) =>
          item(
            thought.post_id,
            <ThoughtBubble size="sm" text={thought.content.text} highlighted={open?.thought.post_id === thought.post_id} style={{ maxWidth: 70, minWidth: 44 }} />,
            <Avatar id={thought.author?.id} entityId={thought.author?.id} name={entityName(thought.author)} src={entityAvatar(thought.author)} size={52} />,
            entityFirstName(thought.author),
            (e) => {
              const host = (e.currentTarget.parentElement?.parentElement as HTMLElement).getBoundingClientRect();
              const at = e.currentTarget.getBoundingClientRect();
              setOpen(open?.thought.post_id === thought.post_id ? null : { thought, left: Math.max(0, at.left - host.left - 10) });
            },
          ),
        )}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: Math.min(open.left, 40), zIndex: 30, marginTop: 6 }}>
          <ThoughtDetail thought={open.thought} onClose={() => setOpen(null)} />
        </div>
      )}
    </div>
  );
}
