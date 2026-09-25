import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/reusables/design";
import type { IMomentTrayEntry } from "@/reusables/vars/interfaces";
import { entityAvatar, entityName } from "./ephemeral";

// The last 4h of a moment's life, drawn pink at the ribbon's expiring end.
const EXPIRING_HOURS = 4;

/**
 * The viewer's 24h timeline (designs 1b / 2b): every author in the tray
 * placed by the age of their newest moment, with the last 4h before expiry
 * marked pink. The author playing now is larger and ringed; seen authors are
 * faded. Tap one to jump.
 *
 * Horizontal (the header, on narrow screens): just posted on the right,
 * about to expire on the left. Vertical (a rail beside the stage on wide
 * ones, so the header's height goes to the moment): just posted at the top,
 * about to expire at the bottom.
 */
function MomentRibbon({
  entries,
  currentEntityId,
  onOpen,
  maxWidth = 560,
  vertical = false,
}: {
  entries: IMomentTrayEntry[];
  currentEntityId: string;
  onOpen: (entry: IMomentTrayEntry) => void;
  maxWidth?: number;
  /** Fills its parent's height instead of spanning a width. */
  vertical?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // The ribbon's length along its axis.
  const [length, setLength] = useState(vertical ? 0 : maxWidth);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(() =>
      setLength(
        vertical ? host.clientHeight : Math.min(maxWidth, host.clientWidth),
      ),
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [maxWidth, vertical]);

  // Across the ribbon: the line sits in the middle of this thickness.
  const thickness = 36;
  const mid = thickness / 2;
  const expiring = length * (EXPIRING_HOURS / 24);

  const now = Date.now();
  return (
    <div
      ref={hostRef}
      style={
        vertical
          ? { height: "100%", width: thickness, display: "flex", justifyContent: "center" }
          : { width: "100%", maxWidth, display: "flex", justifyContent: "center" }
      }
    >
      <div
        style={{
          position: "relative",
          ...(vertical ? { width: thickness, height: length } : { width: length, height: thickness }),
        }}
      >
        <div
          style={{
            position: "absolute",
            background: "var(--border-2)",
            ...(vertical
              ? { top: 0, bottom: 0, left: mid, width: 1 }
              : { left: 0, right: 0, top: mid, height: 1 }),
          }}
        />
        <div
          style={{
            position: "absolute",
            borderRadius: 2,
            background: "var(--pink)",
            ...(vertical
              ? { bottom: 0, height: expiring, left: mid - 1, width: 3 }
              : { left: 0, width: expiring, top: mid - 1, height: 3 }),
          }}
        />
        {entries.map((entry) => {
          const current = entry.entity.id === currentEntityId;
          const size = current ? 32 : 22;
          const ageHours = Math.min(
            24,
            Math.max(0, (now - new Date(entry.latest.date_posted).getTime()) / 3600000),
          );
          // How far along the ribbon: 0 = just posted, 1 = about to expire.
          const along = Math.round((length - size) * (ageHours / 24));
          const isExpiring =
            new Date(entry.latest.expires_at).getTime() - now < EXPIRING_HOURS * 3600000;
          return (
            <button
              key={entry.entity.id}
              onClick={() => onOpen(entry)}
              title={entityName(entry.entity)}
              style={{
                position: "absolute",
                ...(vertical
                  ? { top: along, left: mid - size / 2 }
                  : { left: length - size - along, top: mid - size / 2 }),
                width: size,
                height: size,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                zIndex: current ? 2 : 1,
                opacity: current ? 1 : entry.has_unseen ? 0.95 : isExpiring ? 0.5 : 0.6,
              }}
            >
              {/* The ring on a ROUND wrapper - Avatar's own box is square
                  (it hosts the presence marker), so a shadow on it drew a
                  box around the face. */}
              <span
                style={{
                  display: "flex",
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  boxShadow: current
                    ? "0 0 0 2px var(--surface), 0 0 0 4px var(--brand)"
                    : "0 0 0 2px var(--surface)",
                }}
              >
                <Avatar
                  id={entry.entity.id}
                  name={entityName(entry.entity)}
                  src={entityAvatar(entry.entity)}
                  size={size}
                  online={false}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MomentRibbon;
