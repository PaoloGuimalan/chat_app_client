/* Secondary primitives used by the redesigned shell + tabs. */
import {
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  forwardRef,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { Icon } from "./primitives";
import {
  isUserOnline,
  lastSeenAt,
  minutesSinceLastSeen,
} from "../hooks/reusable";

import { AV_GRADS, avHash } from "./gradients";

// `name = ""` only defaults an UNDEFINED argument. A null one - which is what
// a server row with no name serialises to - passed straight through to
// .split() and took down every screen that rendered the avatar.
function initials(name?: string | null) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * The "this is software" marker that follows a bot's name.
 *
 * One component rather than the glyph pasted per list, because it had already
 * been written five different ways for PAGES (two icon libraries, three
 * sizes) and a bot appears in more lists than a page does - conversations,
 * members, reactions, pickers, mentions, search. The value it is deciding on
 * is the same everywhere, so the decision lives in one place.
 *
 * NEVER the verified check: that badge means a verified human or page, and
 * borrowing it would say something it does not mean.
 *
 * Pass whichever the caller has - `type` straight off a payload, or `is` when
 * the row already computed it.
 */
export function BotFlag({
  type,
  is,
  size = 13,
}: {
  type?: string | null;
  is?: boolean;
  size?: number;
}) {
  if (!(is ?? type === "bot")) return null;
  return (
    <span title="Bot" style={{ display: "inline-flex", flex: "none" }}>
      <Icon n="smart_toy" s={size} c="var(--text-3)" />
    </span>
  );
}

/**
 * The page marker, the sibling of BotFlag.
 *
 * Only a PAGE gets it. Groups, servers and channels are realms too, but the
 * surfaces that list them already say what they are (a hash, a lock, a
 * heading), so flagging those would label the obvious.
 */
export function PageFlag({
  realmType,
  is,
  size = 13,
}: {
  realmType?: string | null;
  is?: boolean;
  size?: number;
}) {
  if (!(is ?? realmType === "page")) return null;
  return (
    <span title="Page" style={{ display: "inline-flex", flex: "none" }}>
      <Icon n="flag" s={size} c="var(--text-3)" />
    </span>
  );
}

export interface AvatarProps {
  id?: string;
  name?: string;
  src?: string | null;
  size?: number;
  shape?: "circle" | "rounded";
  /**
   * The entity this avatar depicts, which is what the presence dot is resolved
   * from. An ENTITY id - not an account id, not a realm_id, not a username.
   *
   * PASS IT WHENEVER THE AVATAR IS AN ENTITY THAT CAN BE ONLINE: a user, a
   * page, a realm, a bot. Those are the only things the server reports
   * presence for.
   *
   * Leave it off for an avatar that stands for something which has no presence
   * to report - a group chat, a server, a channel - rather than passing that
   * thing's own id. Those have no entity row, so there is nothing to look up,
   * and a group deliberately shows no per-member dot at all (the conversation
   * header says "Members are Active" instead).
   *
   * Separate from `id` because `id` is the gradient-hash key and half the call
   * sites pass a username or a slug for it, which is fine for picking a colour
   * and useless for presence. Overloading `id` would have lit a dot for
   * whichever stranger's username happened to collide with an entity id, and
   * left the dot off wherever the hash key was a slug.
   */
  entityId?: string | null;
  /**
   * Forces the dot on or off, for callers that have already resolved presence
   * or know it does not apply. Leave it undefined to let `entityId` decide,
   * which is what nearly every caller should do.
   */
  online?: boolean;
  ring?: "none" | "unviewed" | "viewed";
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  /**
   * The entity's kind, when the caller knows it. Only "bot" changes anything:
   * a bot with no uploaded picture gets the bot glyph rather than initials,
   * because "CM" tells a reader nothing about who "Chatterloop Moderation" is,
   * and a notification saying their post was removed should visibly come from
   * the platform rather than from something that looks like a person.
   *
   * An uploaded `src` still wins - this is the fallback, not an override.
   */
  kind?: string | null;
}

function ringShadow(ring?: AvatarProps["ring"]) {
  if (ring === "unviewed") {
    return "0 0 0 2px var(--surface), 0 0 0 4px var(--brand)";
  }
  if (ring === "viewed") {
    return "0 0 0 2px var(--surface), 0 0 0 4px var(--text-2)";
  }
  return "none";
}

export function Avatar({
  id,
  name,
  src,
  kind,
  size = 38,
  shape = "circle",
  entityId,
  online,
  ring,
  className,
  style,
  onClick,
}: AvatarProps) {
  /*
   * Presence is resolved HERE rather than by each caller.
   *
   * It used to be the caller's job - read `activeuserslist` out of the store,
   * call `isUserOnline`, pass `online` - and four screens out of the roughly
   * thirty that render an avatar actually did it, which is why the dot showed
   * up on some avatars and not others for the same person.
   *
   * The selector returns the boolean, not the list, so react-redux compares
   * `false === false` and skips the re-render: a presence frame for one contact
   * re-renders only the avatars showing that contact, not every avatar on the
   * screen. Selectors re-run on every dispatch, so returning the array here
   * would have made any unrelated action re-render all of them.
   */
  const derivedOnline = useSelector(
    (state: {
      activeuserslist?: unknown[];
      authentication?: {
        user?: { entity_id?: string };
        active_entity_context?: { id?: string };
      };
    }) => {
      if (!entityId) return false;
      /*
       * You are online - you are the one looking at the screen - but you will
       * never be in `activeuserslist`, because the server builds that list from
       * your CONTACTS and DM counterparts and excludes you from your own scope
       * (`c.action_by_id <> c.involved_entity_id`, reusables/hooks/presence.js).
       * Left to the list alone, your own avatar is the one face on the page
       * that never lights up, which reads as a bug rather than as a rule.
       *
       * Both ids count: `user.entity_id` is you, and `active_entity_context.id`
       * is the page you are currently switched into, which is equally "you" for
       * as long as you are posting and replying as it.
       */
      const auth = state.authentication;
      if (
        entityId === auth?.user?.entity_id ||
        entityId === auth?.active_entity_context?.id
      ) {
        return true;
      }
      return isUserOnline(state.activeuserslist, entityId);
    },
  );
  const showOnline = online ?? derivedOnline;

  /*
   * RECENTLY OFFLINE: the dot gives way to how long ago they went.
   *
   * Selected as the raw stamp rather than an elapsed count - a count would be a
   * different number on every dispatch, so every avatar on the screen would
   * re-render whenever anything happened. The string only changes when that
   * entity's session actually does.
   */
  const lastSeenStamp = useSelector((state: { activeuserslist?: unknown[] }) =>
    entityId && !showOnline ? lastSeenAt(state.activeuserslist, entityId) : null,
  );
  /*
   * A pill is text, and text has a floor below which it is a smear rather than
   * a reading. Under ~32px there is no room for one, so those avatars show the
   * dot when the person is online and nothing when they are not - which is
   * what a stacked face row or a mention chip wants anyway.
   */
  const canShowLastSeen = size >= 32;
  const minutesAgo = canShowLastSeen ? minutesSinceLastSeen(lastSeenStamp) : null;
  // Under an hour only. At sixty minutes the marker goes away entirely rather
  // than rolling over to hours - past that, "when" stops being the reason you
  // were looking at the avatar.
  const showLastSeen =
    !showOnline && minutesAgo !== null && minutesAgo < 60;

  /*
   * The label counts up on its own. Presence pushes only arrive when someone
   * connects or disconnects, so without this a "3m" badge would still read 3m
   * half an hour later, and would never reach the sixty-minute cliff that is
   * supposed to retire it.
   *
   * The timer only exists while a badge is actually on screen, and the interval
   * is half a minute so the number is never more than 30s stale.
   */
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!showLastSeen) return;
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [showLastSeen]);

  const [resolvedSrc, setResolvedSrc] = useState<string | null | undefined>(
    src,
  );

  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);

  const key = id || name || "x";
  const [a, b] = AV_GRADS[avHash(key) % AV_GRADS.length];
  const shouldShowImage = !!resolvedSrc;
  const borderRadius =
    shape === "circle" ? "50%" : size >= 60 ? "22px" : "16px";

  /*
   * PRESENCE DOT GEOMETRY.
   *
   * `dotSize` is the marker's OUTER diameter, ring included, and the ring is
   * drawn inside it - note the explicit `boxSizing: "border-box"` on the span.
   * That is set here rather than inherited: Tailwind's preflight happens to
   * make everything border-box, and when this was written as a content-box
   * width plus an outside border, the border quietly ate 4px of the number
   * instead of adding to it. Every dot in the app rendered 4px smaller than the
   * code said, which is a miserable thing to debug from a screenshot.
   *
   * The size grows with the avatar, but far more slowly than the avatar does -
   * from about half the width of a 20px stacked face down to a sixth of a 160px
   * profile header. A flat percentage puts a blob on the header; a genuinely
   * fixed size is either too heavy on the 20px avatars or too faint to notice
   * on the 120px one in the conversation-info modal. The shallow slope is the
   * only thing that reads correctly at both ends of a range this wide.
   */
  const dotSize = Math.min(26, Math.max(10, 8 + size * 0.11));
  const dotRing = Math.min(3.5, Math.max(2, dotSize * 0.16));
  /*
   * Position, which DOES depend on size - a fixed dot pinned to the corner of
   * the bounding box drifts away from a large circle. For a circle, the
   * 4-o'clock rim point sits at 0.8536 x size from the left edge (r + r/sqrt2),
   * so the inset is whatever puts the dot's centre there: about zero at 40px,
   * which is why the old flat -1 looked right on rows, and ~8px at 160px, where
   * that same -1 left the dot floating clear of the circle entirely.
   *
   * Clamped so it never hangs more than 2px outside the box, which a small
   * avatar in a clipped container would otherwise lose. A rounded avatar has a
   * real corner to sit in and keeps the small overhang.
   */
  const dotInset =
    shape === "circle"
      ? Math.max(-2, Math.round((size * 0.1464 - dotSize / 2) * 10) / 10)
      : -1;
  /*
   * The last-seen pill is anchored by its RIGHT edge at the same point the dot
   * would sit, and grows leftward across the avatar. Anchoring it by the left
   * instead would push "59m" out past the avatar and into whatever sits beside
   * it, which in these rows is the person's name.
   *
   * It is taller than the dot because it has to hold a line of text: the dot's
   * diameter is chosen for a disc, and 9px type does not fit inside 12px of it
   * once the ring is taken off.
   */
  const pillHeight = Math.max(15, Math.round(dotSize) + 3);
  const pillFont = Math.max(9, Math.round(pillHeight * 0.52));
  return (
    <span
      // `cl-avatar` is a hook, not a style: it is what lets the stylesheet find
      // the legacy row wrappers that clip an avatar and stop them doing it (see
      // `.cl-avatar` in styles.css). Callers keep whatever class they passed.
      className={className ? `cl-avatar ${className}` : "cl-avatar"}
      onClick={onClick}
      style={{
        position: "relative",
        display: "inline-flex",
        flex: "none",
        width: size,
        height: size,
        // The presence dot sits ON the rim, so a couple of px of it fall
        // outside this box. Some callers pass a className whose own
        // `overflow: hidden` would eat it - `.cl-display-card__avatar-shell`
        // does - and an inline style is the one thing that beats any of them
        // without a specificity fight. The avatar's own image is rounded by
        // `borderRadius` below, so nothing here relied on the clip for shape.
        overflow: "visible",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {shouldShowImage ? (
        <img
          src={resolvedSrc || ""}
          alt={name || ""}
          style={{
            width: size,
            height: size,
            borderRadius,
            objectFit: "cover",
            boxShadow: ringShadow(ring),
          }}
          onError={() => {
            setResolvedSrc(null);
          }}
        />
      ) : (
        <span
          style={{
            width: size,
            height: size,
            borderRadius,
            background: `linear-gradient(135deg, ${a}, ${b})`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: size * 0.38,
            letterSpacing: "0.02em",
            boxShadow: ringShadow(ring),
          }}
        >
          {kind === "bot" ? (
            <span
              className="material-icons"
              style={{ fontSize: size * 0.56, lineHeight: 1 }}
            >
              smart_toy
            </span>
          ) : (
            initials(name)
          )}
        </span>
      )}
      {showLastSeen && (
        <span
          title={`Active ${minutesAgo === 0 ? "less than a minute" : `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"}`} ago`}
          style={{
            position: "absolute",
            right: dotInset,
            bottom: dotInset,
            height: pillHeight,
            display: "inline-flex",
            alignItems: "center",
            padding: `0 ${Math.round(pillFont * 0.45)}px`,
            borderRadius: 999,
            /* Pale green rather than a neutral grey: the badge is the dot's
             * other half, saying "active, just not this second", and sharing
             * its colour family says that at a glance. Fallbacks because the
             * green tokens live in theme.css's `.cl-redesign` block rather than
             * on `:root`, and an unresolved var() voids the whole declaration. */
            background: "var(--green-pale, #e2f7ee)",
            color: "var(--green-strong, #12734a)",
            fontSize: pillFont,
            lineHeight: 1,
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxSizing: "border-box",
            border: `${dotRing}px solid ${
              (style?.background as string) ||
              (style?.backgroundColor as string) ||
              "var(--surface)"
            }`,
          }}
        >
          {/*
            Floored at 1m. The honest value for someone who dropped eight
            seconds ago is "0m", which reads as a rendering fault rather than as
            a duration - and they are, in any case, about to be 1m.
          */}
          {Math.max(1, minutesAgo ?? 1)}m
        </span>
      )}
      {showOnline && (
        <span
          title="Active now"
          style={{
            position: "absolute",
            right: dotInset,
            bottom: dotInset,
            width: dotSize,
            height: dotSize,
            boxSizing: "border-box",
            borderRadius: "50%",
            background: "var(--online, #2ecc71)",
            border: `${dotRing}px solid ${
              /*
               * `--surface` is the right ring almost everywhere, because an
               * avatar almost always sits on a card or a row. `style.background`
               * is the escape hatch for the exceptions - an avatar on the rail
               * or on a tinted header - and a caller that sets one there wants
               * the ring to match it.
               */
              (style?.background as string) ||
              (style?.backgroundColor as string) ||
              "var(--surface)"
            }`,
          }}
        />
      )}
    </span>
  );
}

export interface CardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  children?: ReactNode;
  pad?: number | string;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, pad = 14, hover, style, ...rest },
  ref,
) {
  return (
    <div
      {...rest}
      ref={ref}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        boxShadow: "var(--shadow-sm)",
        padding: pad,
        transition: "box-shadow .18s var(--ease), transform .18s var(--ease)",
        ...style,
      }}
      onMouseEnter={
        hover
          ? (e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
          : undefined
      }
    >
      {children}
    </div>
  );
});

type BadgeTone = "brand" | "green" | "gold" | "pink" | "grey";

const BADGE_TONES: Record<BadgeTone, [string, string]> = {
  brand: ["var(--brand-soft)", "var(--brand)"],
  green: ["var(--green-soft)", "var(--green)"],
  gold: ["var(--gold-soft)", "var(--gold)"],
  pink: ["var(--pink-soft)", "var(--pink)"],
  grey: ["var(--surface-3)", "var(--text-2)"],
};

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  style?: CSSProperties;
}

export function Badge({ children, tone = "brand", style }: BadgeProps) {
  const [bg, fg] = BADGE_TONES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        height: 20,
        padding: "0 8px",
        background: bg,
        color: fg,
        fontSize: "var(--fs-meta)",
        fontWeight: 650,
        borderRadius: "var(--r-pill)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export interface ChipProps {
  children: ReactNode;
  icon?: string;
  active?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
}

export function Chip({ children, icon, active, onClick, style }: ChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 30,
        padding: "0 10px",
        borderRadius: "var(--r-pill)",
        border: "1px solid " + (active ? "transparent" : "var(--border-2)"),
        background: active ? "var(--brand)" : "var(--surface)",
        color: active ? "#fff" : "var(--text-2)",
        fontSize: "var(--fs-meta)",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all .14s",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon && <Icon n={icon} s={15} />}
      {children}
    </button>
  );
}

export interface ToggleProps {
  on: boolean;
  onChange?: (v: boolean) => void;
}

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <span
      role="switch"
      aria-checked={on}
      onClick={() => onChange && onChange(!on)}
      style={{
        position: "relative",
        width: 40,
        height: 22,
        flex: "none",
        borderRadius: 999,
        cursor: "pointer",
        background: on ? "var(--brand)" : "var(--border-2)",
        transition: "background .2s var(--ease)",
        display: "inline-block",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.3)",
          transition: "left .2s var(--spring)",
        }}
      />
    </span>
  );
}

export interface SegTab {
  key: string;
  label: string;
  icon?: string;
}

export interface SegTabsProps {
  tabs: (SegTab | string)[];
  value: string;
  onChange: (k: string) => void;
  style?: CSSProperties;
}

function asTab(t: SegTab | string): SegTab {
  return typeof t === "string" ? { key: t, label: t } : t;
}

export function SegTabs({ tabs, value, onChange, style }: SegTabsProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 2,
        gap: 2,
        background: "var(--surface-3)",
        borderRadius: "var(--r-sm)",
        ...style,
      }}
    >
      {tabs.map((raw) => {
        const t = asTab(raw);
        const on = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              height: 28,
              padding: "0 10px",
              border: "none",
              borderRadius: "var(--r-xs)",
              cursor: "pointer",
              fontSize: "var(--fs-meta)",
              fontWeight: 650,
              background: on ? "var(--surface)" : "transparent",
              color: on ? "var(--text)" : "var(--text-2)",
              boxShadow: on ? "var(--shadow-sm)" : "none",
              transition: "all .14s",
              flex: 1,
            }}
          >
            {t.icon && <Icon n={t.icon} s={15} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export interface SectionTitleProps {
  children: ReactNode;
  action?: ReactNode;
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "var(--fs-body)",
          fontWeight: 750,
          letterSpacing: "-0.01em",
        }}
      >
        {children}
      </h3>
      {action}
    </div>
  );
}

