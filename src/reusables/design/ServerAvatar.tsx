import { CSSProperties, useEffect, useState } from "react";

const SERVER_TONES = [
  "#f2b24f",
  "#f4a942",
  "#f6b85e",
  "#eba13b",
  "#ffc15a",
];

function serverInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function serverHash(input = "") {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export interface ServerAvatarProps {
  name?: string;
  src?: string | null;
  size?: number;
  shape?: "circle" | "rounded";
  style?: CSSProperties;
  className?: string;
}

export function ServerAvatar({
  name,
  src,
  size = 44,
  shape = "rounded",
  style,
  className,
}: ServerAvatarProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null | undefined>(
    src,
  );

  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);

  const fill =
    SERVER_TONES[serverHash(name || resolvedSrc || "server") % SERVER_TONES.length];
  const borderRadius = shape === "circle" ? "50%" : size >= 60 ? "22px" : "16px";

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius,
        background: fill,
        color: "var(--on-brand)",
        fontWeight: 800,
        letterSpacing: "0.04em",
        boxShadow: "0 8px 18px rgba(244, 169, 66, 0.16)",
        ...style,
      }}
      aria-label={name || "Server avatar"}
      title={name || "Server avatar"}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={name || "Server avatar"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={() => {
            setResolvedSrc(null);
          }}
        />
      ) : (
        <span
          style={{
            fontSize: Math.max(11, size * 0.34),
            lineHeight: 1,
            textShadow: "0 1px 1px rgba(0,0,0,0.18)",
          }}
        >
          {serverInitials(name)}
        </span>
      )}
    </span>
  );
}

export default ServerAvatar;
