import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/reusables/design";
import type { IMomentTrayEntry } from "@/reusables/vars/interfaces";
import { entityAvatar, entityName } from "./ephemeral";

// The last 4h of a moment's life, drawn pink at the ribbon's left edge.
const EXPIRING_HOURS = 4;

/**
 * The viewer header's 24h timeline (designs 1b / 2b): every author in the
 * tray placed by the age of their newest moment - just posted on the right,
 * about to expire on the left, where the last 4h are marked pink. The author
 * playing now is larger and ringed; seen authors are faded. Tap one to jump.
 */
function MomentRibbon({
  entries,
  currentEntityId,
  onOpen,
  maxWidth = 560,
}: {
  entries: IMomentTrayEntry[];
  currentEntityId: string;
  onOpen: (entry: IMomentTrayEntry) => void;
  maxWidth?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(maxWidth);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(() =>
      setWidth(Math.min(maxWidth, host.clientWidth)),
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [maxWidth]);

  const now = Date.now();
  return (
    <div ref={hostRef} style={{ width: "100%", maxWidth, display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width, height: 36 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 1, background: "var(--border-2)" }} />
        <div style={{ position: "absolute", left: 0, width: width * (EXPIRING_HOURS / 24), top: 17, height: 3, borderRadius: 2, background: "var(--pink)" }} />
        {entries.map((entry) => {
          const current = entry.entity.id === currentEntityId;
          const size = current ? 32 : 22;
          const ageHours = Math.min(
            24,
            Math.max(0, (now - new Date(entry.latest.date_posted).getTime()) / 3600000),
          );
          const left = Math.round((width - size) * (1 - ageHours / 24));
          const expiring =
            new Date(entry.latest.expires_at).getTime() - now < EXPIRING_HOURS * 3600000;
          return (
            <button
              key={entry.entity.id}
              onClick={() => onOpen(entry)}
              title={entityName(entry.entity)}
              style={{
                position: "absolute",
                left,
                top: 18 - size / 2,
                width: size,
                height: size,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                zIndex: current ? 2 : 1,
                opacity: current ? 1 : entry.has_unseen ? 0.95 : expiring ? 0.5 : 0.6,
              }}
            >
              <Avatar
                id={entry.entity.id}
                name={entityName(entry.entity)}
                src={entityAvatar(entry.entity)}
                size={size}
                online={false}
                style={{
                  boxShadow: current
                    ? "0 0 0 2px var(--surface), 0 0 0 4px var(--brand)"
                    : "0 0 0 2px var(--surface)",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MomentRibbon;
