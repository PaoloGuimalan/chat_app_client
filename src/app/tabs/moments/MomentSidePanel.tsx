/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@/reusables/design";
import {
  ReactionSaveRequest,
  SendEphemeralReplyRequest,
} from "@/reusables/hooks/requests";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import type { Emoji, IPost } from "@/reusables/vars/interfaces";
import { timeAgoLabel, timeLeftLabel } from "./ephemeral";
import MomentThumb from "./MomentThumb";

/**
 * A reaction's burst, where its button was: the glyph floating up and a ring
 * spreading (styles.css, `cl-moment-react-*`). Each tap on your reaction adds
 * one - they overlap, so it can be spammed, as in the app.
 */
type Burst = { key: number; glyph: string; x: number; y: number; size: number; drift: number };


/**
 * The viewer's side panel for someone else's moment (design 1b): react, reply
 * - which goes to your chat with them, as a message carrying the moment - and
 * the rest of their moments today.
 *
 * Both react and reply are off when the author turned "Allow replies &
 * reactions" off; the server refuses them anyway, this only says so up front.
 */
function MomentSidePanel({
  moment,
  moments,
  index,
  authorFirstName,
  onJump,
  onReacted,
  onTyping,
}: {
  moment: IPost;
  moments: IPost[];
  index: number;
  authorFirstName: string;
  onJump: (index: number) => void;
  onReacted: (emojiId: string | null) => void;
  /** Pauses playback while the reply box is in use. */
  onTyping: (typing: boolean) => void;
}) {
  const dispatch = useDispatch();
  const emojilist: Emoji[] = useSelector((state: any) => state.emojilist ?? []);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  /** The last burst's key - re-keys your reaction's glyph so it pops again. */
  const [popped, setPopped] = useState(0);
  const burstCount = useRef(0);

  const allowsReplies = moment.details?.allow_replies !== false;
  const mine = moment.entity_reaction ?? null;
  const palette = useMemo(
    () => [...emojilist].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
    [emojilist],
  );

  const alert = (type: string, content: string) =>
    dispatch({ type: SET_MUTATE_ALERTS, payload: { alerts: { type, content } } });

  const burst = (emoji: Emoji, button: HTMLElement) => {
    const box = button.getBoundingClientRect();
    // Sized from the button's own glyph, like the app's.
    const size = parseFloat(getComputedStyle(button).fontSize) || 20;
    const key = ++burstCount.current;
    setPopped(key);
    setBursts((all) => [
      // A cap, however fast the taps come.
      ...all.slice(-15),
      {
        key,
        glyph: emoji.emoji_content,
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        size,
        drift: Math.round((Math.random() - 0.5) * 28),
      },
    ]);
  };

  /**
   * One reaction per moment, as in the app: the first tap sends it; tapping
   * it again only plays the burst again (as often as you like); the others
   * are locked once one is chosen - it can't be changed or taken back here.
   */
  const react = async (emoji: Emoji, button: HTMLElement) => {
    if (!allowsReplies) return;
    if (mine && mine !== emoji.emoji_id) return;
    burst(emoji, button);
    if (mine || reacting) return;
    setReacting(true);
    onReacted(emoji.emoji_id);
    try {
      await ReactionSaveRequest({ post_id: moment.post_id, emoji_id: emoji.emoji_id, method: "POST" });
    } catch (err: any) {
      onReacted(null);
      alert("warning", err?.message || "We couldn't save that reaction.");
    } finally {
      setReacting(false);
    }
  };

  const send = async () => {
    const content = draft.trim();
    if (!content || sending || !allowsReplies) return;
    setSending(true);
    try {
      await SendEphemeralReplyRequest({
        authorEntityId: moment.entity.id,
        kind: "moment",
        postId: moment.post_id,
        content,
      });
      setDraft("");
      alert("success", `Reply sent to ${authorFirstName}.`);
    } catch (err: any) {
      alert("warning", err?.message || "We couldn't send that reply.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", overflow: "hidden", flex: "none" }}>
      <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ display: "block", fontSize: "var(--fs-meta)", fontWeight: 600, color: "var(--text-2)", marginBottom: 10 }}>React</span>
        {allowsReplies ? (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(6, Math.max(1, palette.length))}, 1fr)`, gap: 6 }}>
            {palette.map((emoji) => {
              const on = mine === emoji.emoji_id;
              const locked = mine != null && !on;
              return (
                <button
                  key={emoji.emoji_id}
                  onClick={(e) => react(emoji, e.currentTarget)}
                  title={emoji.emoji_title}
                  disabled={locked}
                  style={{ height: 44, borderRadius: "var(--r-sm)", background: on ? "var(--brand-soft)" : "var(--surface-2)", border: `1px solid ${on ? "var(--brand)" : "var(--border)"}`, fontSize: 20, cursor: locked ? "default" : "pointer", opacity: locked ? 0.35 : 1, transition: "opacity .25s" }}
                >
                  {on ? (
                    <span key={popped} className={popped ? "cl-moment-react-pop" : undefined} style={{ display: "inline-block" }}>
                      {emoji.emoji_content}
                    </span>
                  ) : (
                    emoji.emoji_content
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-3)" }}>
            {authorFirstName} turned off replies and reactions for this Moment.
          </span>
        )}
      </div>

      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "var(--fs-meta)", fontWeight: 600, color: "var(--text-2)" }}>Reply</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--fs-meta)", color: "var(--text-3)" }}>
            <Icon n="forum" s={13} />
            goes to your chat with {authorFirstName}
          </span>
        </div>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ alignSelf: "flex-end", display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 6px 6px", borderRadius: 12, background: "var(--brand-soft)", maxWidth: "100%" }}>
            <MomentThumb post={moment} style={{ width: 30, height: 38, borderRadius: 6 }} iconSize={14} />
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: "var(--fs-meta)", fontWeight: 700, color: "var(--brand)" }}>Replying to {authorFirstName}'s Moment</span>
              <span style={{ fontSize: "var(--fs-meta)", color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {moment.caption || "Moment"}
              </span>
            </span>
          </div>
          {draft.trim() && (
            <div style={{ alignSelf: "flex-end", maxWidth: "80%", padding: "8px 12px", borderRadius: "14px 14px 4px 14px", background: "var(--brand)", color: "#fff", fontSize: "var(--fs-body-sm)", wordBreak: "break-word" }}>
              {draft}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={draft}
            disabled={!allowsReplies || sending}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => onTyping(true)}
            onBlur={() => onTyping(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder={allowsReplies ? `Reply to ${authorFirstName}…` : "Replies are turned off"}
            style={{ flex: 1, minWidth: 0, height: 40, padding: "0 14px", borderRadius: 20, background: "var(--input)", border: "1px solid var(--border)", outline: "none", color: "var(--text)", fontSize: "var(--fs-body-sm)" }}
          />
          <button
            onClick={send}
            disabled={!draft.trim() || !allowsReplies || sending}
            aria-label="Send reply"
            style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: !draft.trim() || !allowsReplies ? 0.55 : 1, flex: "none" }}
          >
            <Icon n="send" s={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 16px", flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: "var(--fs-meta)", fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
          More from {authorFirstName} today
        </span>
        {moments.map((item, i) => {
          const now = i === index;
          // A photo (even encoded as a video) is not shown with a play icon.
          const isVideo = item.details?.source
            ? item.details.source === "video"
            : (item.references?.[0] as any)?.reference_media_type?.startsWith("video");
          return (
            <button
              key={item.post_id}
              onClick={() => onJump(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 8px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", textAlign: "left", background: now ? "var(--brand-soft)" : "transparent" }}
            >
              <MomentThumb post={item} style={{ width: 34, height: 44, borderRadius: 7, boxSizing: "border-box", border: `2px solid ${now ? "var(--brand)" : "transparent"}` }} />
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "var(--fs-body-sm)", fontWeight: now ? 700 : 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.caption || (item.file_type === "shared_post" ? "Shared post" : "Moment")}
                </span>
                <span style={{ fontSize: "var(--fs-meta)", color: "var(--text-3)" }}>
                  {timeAgoLabel(item.date_posted)} · {timeLeftLabel(item.expires_at)}
                </span>
              </span>
              <Icon
                n={now ? "equalizer" : isVideo ? "play_arrow" : "chevron_right"}
                s={18}
                c={now ? "var(--brand)" : "var(--text-3)"}
              />
            </button>
          );
        })}
      </div>
      {bursts.length > 0 &&
        createPortal(
          // Over everything: the panel clips its edges, and the glyph floats
          // well above its button.
          bursts.map((b) => (
            <div
              key={b.key}
              aria-hidden
              className="cl-moment-react-burst"
              style={{ left: b.x, top: b.y, ["--burst-drift" as any]: `${b.drift}px` }}
            >
              <span className="cl-moment-react-ring" style={{ width: b.size * 2.2, height: b.size * 2.2 }} />
              <span
                className="cl-moment-react-float"
                style={{ fontSize: b.size * 1.6 }}
                onAnimationEnd={() => setBursts((all) => all.filter((x) => x.key !== b.key))}
              >
                {b.glyph}
              </span>
            </div>
          )),
          document.body,
        )}
    </div>
  );
}

export default MomentSidePanel;
