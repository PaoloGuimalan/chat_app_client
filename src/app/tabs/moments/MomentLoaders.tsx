import type { CSSProperties } from "react";

/** One shimmering block (styles.css .cl-moment-skeleton). */
function Bone({ style }: { style: CSSProperties }) {
  return <span className="cl-moment-skeleton" style={style} />;
}

/** The Moments board while the tray loads: tiles the size of the real ones. */
export function MomentsBoardLoader() {
  return (
    <div style={{ display: "flex", gap: 8, height: 150, overflow: "hidden" }}>
      <Bone style={{ width: 212, height: 150, borderRadius: "var(--r-md)", flex: "none" }} />
      {Array.from({ length: 4 }, (_, i) => (
        <Bone key={i} style={{ width: 100, height: 150, borderRadius: "var(--r-md)", flex: "none" }} />
      ))}
    </div>
  );
}

/** Archives > Moments while it loads: the same grid of 9:16 tiles. */
export function MomentArchiveLoader() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <Bone key={i} style={{ aspectRatio: "9 / 16", width: "100%", borderRadius: "var(--r-md)" }} />
      ))}
    </div>
  );
}

/** The Thoughts rail while it loads: bubble, avatar, name - per person. */
export function ThoughtsRailLoader() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "0 12px 12px", overflow: "hidden", marginBottom: 6 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{ width: 88, flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Bone style={{ width: 64, height: 30, borderRadius: 14 }} />
          <Bone style={{ width: 52, height: 52, borderRadius: "50%" }} />
          <Bone style={{ width: 50, height: 10, borderRadius: 5 }} />
        </div>
      ))}
    </div>
  );
}
