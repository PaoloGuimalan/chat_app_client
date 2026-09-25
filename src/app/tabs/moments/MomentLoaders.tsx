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

/**
 * The viewer's stage column while an author's moments load - on opening, and
 * on moving to the next person: the author row and a 9:16 stage, in the
 * column the real ones will fill (its width comes from the parent).
 */
export function MomentStageLoader() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Bone style={{ width: 48, height: 48, borderRadius: "50%", flex: "none" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <Bone style={{ width: "42%", height: 13, borderRadius: 6 }} />
          <Bone style={{ width: "68%", height: 10, borderRadius: 5 }} />
        </div>
      </div>
      <Bone style={{ width: "100%", aspectRatio: "9 / 16", borderRadius: "var(--r-lg)" }} />
    </>
  );
}

/** The viewer's side panel while it loads: a heading, tabs and a few rows. */
export function MomentPanelLoader() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflow: "hidden",
      }}
    >
      <Bone style={{ width: "38%", height: 18, borderRadius: 6 }} />
      <Bone style={{ width: "100%", height: 34, borderRadius: "var(--r-sm)" }} />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bone style={{ width: 38, height: 38, borderRadius: "50%", flex: "none" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Bone style={{ width: "55%", height: 11, borderRadius: 5 }} />
            <Bone style={{ width: "30%", height: 9, borderRadius: 5 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The playback controls while the viewer loads - the pill's own size. */
export function MomentControlsLoader() {
  return <Bone style={{ width: 226, height: 50, borderRadius: 999, alignSelf: "center", flex: "none" }} />;
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
