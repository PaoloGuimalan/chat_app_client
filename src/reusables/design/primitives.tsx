/* Shared primitives for the redesigned screens. Self-contained, theme-aware
 * via CSS custom properties from theme.css. Used by Login, Register,
 * Verification, and (incrementally) the rest of the app as it migrates. */
import {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";

export interface IconProps {
  n: string;
  s?: number;
  c?: string;
  style?: CSSProperties;
}

export function Icon({ n, s = 22, c, style }: IconProps) {
  return (
    <span
      className="material-icons"
      style={{ fontSize: s, color: c || "inherit", lineHeight: 1, ...style }}
    >
      {n}
    </span>
  );
}

type BtnVariant = "primary" | "soft" | "ghost" | "outline";
type BtnSize = "sm" | "md" | "lg";

const BTN_SIZES: Record<BtnSize, { h: number; px: number; fs: number }> = {
  sm: { h: 32, px: 12, fs: 13 },
  md: { h: 38, px: 16, fs: 14 },
  lg: { h: 46, px: 22, fs: 15 },
};

const BTN_VARIANTS: Record<BtnVariant, CSSProperties> = {
  primary: {
    background: "var(--brand)",
    color: "#fff",
    border: "1px solid transparent",
    boxShadow: "0 2px 8px rgba(28,125,239,0.30)",
  },
  soft: {
    background: "var(--brand-soft)",
    color: "var(--brand)",
    border: "1px solid transparent",
  },
  ghost: {
    background: "transparent",
    color: "var(--text)",
    border: "1px solid transparent",
  },
  outline: {
    background: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border-2)",
  },
};

export interface BtnProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children?: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  block?: boolean;
  iconL?: string;
  iconR?: string;
}

export function Btn({
  children,
  variant = "primary",
  size = "md",
  block,
  iconL,
  iconR,
  style,
  ...rest
}: BtnProps) {
  const sz = BTN_SIZES[size];
  return (
    <button
      {...rest}
      style={{
        display: block ? "flex" : "inline-flex",
        width: block ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        height: sz.h,
        padding: `0 ${sz.px}px`,
        fontSize: sz.fs,
        fontWeight: 650,
        borderRadius: "var(--r-sm)",
        cursor: rest.disabled ? "not-allowed" : "pointer",
        opacity: rest.disabled ? 0.55 : 1,
        transition: "filter .14s var(--ease), transform .1s var(--ease)",
        whiteSpace: "nowrap",
        ...BTN_VARIANTS[variant],
        ...style,
      }}
      onMouseDown={(e) => {
        if (!rest.disabled) e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e) => (e.currentTarget.style.transform = "none")}
      onMouseEnter={(e) => {
        if (!rest.disabled) e.currentTarget.style.filter = "brightness(0.95)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {iconL && <Icon n={iconL} s={sz.fs + 4} />}
      {children}
      {iconR && <Icon n={iconR} s={sz.fs + 4} />}
    </button>
  );
}

export interface IconBtnProps {
  n: string;
  s?: number;
  size?: number;
  title?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
}

export function IconBtn({
  n,
  s = 22,
  size = 40,
  title,
  onClick,
  style,
}: IconBtnProps) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--r-sm)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        color: "var(--text-2)",
        background: "var(--surface)",
        transition: "background .14s, color .14s",
        ...style,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--surface-hover)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
    >
      <Icon n={n} s={s} />
    </button>
  );
}

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  label?: string;
}

export function Field({ icon, label, ...rest }: FieldProps) {
  return (
    <label style={{ display: "block", width: "100%" }}>
      {label && (
        <span
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-2)",
            marginBottom: 6,
          }}
        >
          {label}
        </span>
      )}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 44,
          padding: "0 14px",
          background: "var(--input)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
          transition: "border-color .14s",
        }}
        onFocusCapture={(e) =>
          (e.currentTarget.style.borderColor = "var(--brand)")
        }
        onBlurCapture={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
      >
        {icon && <Icon n={icon} s={20} c="var(--text-3)" />}
        <input
          {...rest}
          style={{
            flex: 1,
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--text)",
            fontSize: 14,
          }}
        />
      </span>
    </label>
  );
}

export interface SelectFieldProps {
  icon?: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  style?: CSSProperties;
}

export function SelectField({
  icon,
  label,
  value,
  onChange,
  children,
  style,
}: SelectFieldProps) {
  return (
    <label style={{ display: "block", width: "100%", ...style }}>
      {label && (
        <span
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-2)",
            marginBottom: 6,
          }}
        >
          {label}
        </span>
      )}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 44,
          padding: "0 14px",
          background: "var(--input)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
        }}
      >
        {icon && <Icon n={icon} s={20} c="var(--text-3)" />}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--text)",
            fontSize: 14,
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            cursor: "pointer",
          }}
        >
          {children}
        </select>
        <Icon n="expand_more" s={18} c="var(--text-3)" />
      </span>
    </label>
  );
}
