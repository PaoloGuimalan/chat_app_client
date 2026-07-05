/* Secondary primitives used by the redesigned shell + tabs. */
import {
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  forwardRef,
  useEffect,
  useState,
} from "react";
import { Icon } from "./primitives";

const AV_GRADS: [string, string][] = [
  ["#1c7def", "#5aa9ff"],
  ["#20bd7c", "#5be0a8"],
  ["#e69500", "#ffc24d"],
  ["#ff5b6b", "#ff97a1"],
  ["#8b5cf6", "#b794ff"],
  ["#0ea5b7", "#4fd6e6"],
  ["#f0518c", "#ff8fbf"],
  ["#3b6fe0", "#6fa0ff"],
];

function avHash(id = "") {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export interface AvatarProps {
  id?: string;
  name?: string;
  src?: string | null;
  size?: number;
  shape?: "circle" | "rounded";
  online?: boolean;
  ring?: "none" | "unviewed" | "viewed";
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
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
  size = 38,
  shape = "circle",
  online,
  ring,
  className,
  style,
  onClick,
}: AvatarProps) {
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
  return (
    <span
      className={className}
      onClick={onClick}
      style={{
        position: "relative",
        display: "inline-flex",
        flex: "none",
        width: size,
        height: size,
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
          {initials(name)}
        </span>
      )}
      {online && (
        <span
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: Math.max(9, size * 0.28),
            height: Math.max(9, size * 0.28),
            borderRadius: "50%",
            background: "var(--online)",
            border: "2.5px solid var(--surface)",
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
        fontSize: 11.5,
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
        fontSize: 11.5,
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
              fontSize: 11.5,
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
          fontSize: 14,
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

