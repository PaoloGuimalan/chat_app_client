/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { Avatar } from "@/reusables/design";

/** Faces drawn before the rest collapse into "+N". */
const MAX_SEEN_FACES = 5;
const FACE_SIZE = 16;

export interface SeenFace {
  /** The member's ENTITY id - it keys the face across messages. */
  entityID: string;
  name: string;
  /** Gradient key for the initials fallback, matching the member lists. */
  colorKey: string;
  profile?: string | null;
  kind?: string | null;
}

/**
 * The "seen" faces under one message in a group or channel: everyone whose
 * newest seen message is this one (see hooks/messageRuns' seenAvatarAnchors).
 *
 * Each face carries a `layoutId` scoped to the conversation, so when a member
 * reads further the face leaves this row and turns up under the newer message
 * in the same render - and framer animates it from here to there instead of
 * it blinking out and back in. A face seen for the first time pops in.
 *
 * No presence dot: at 16px the dot would cover the face, and this is a
 * decorative stack like the Popular Topics faces, which skip it for the same
 * reason.
 */
function SeenReceipts({
  conversationID,
  faces,
  shownBefore,
}: {
  conversationID: string;
  faces: SeenFace[];
  /**
   * Entity ids that had a face anywhere in this thread on the previous
   * render. Those faces are MOVING, so they skip the pop-in: framer still
   * runs `initial` on a remounted layoutId element, and a face that starts
   * its slide at opacity 0 reads as one that vanished and reappeared.
   */
  shownBefore?: ReadonlySet<string>;
}) {
  if (faces.length === 0) return null;

  const shown = faces.slice(0, MAX_SEEN_FACES);
  const hidden = faces.length - shown.length;
  const label = `Seen by ${faces.map((face) => face.name).join(", ")}`;

  return (
    <div className="cl-seen-receipts" role="img" aria-label={label} title={label}>
      {shown.map((face) => (
        <motion.span
          key={face.entityID}
          layoutId={`seen-${conversationID}-${face.entityID}`}
          initial={
            shownBefore?.has(face.entityID) ? false : { opacity: 0, scale: 0.4 }
          }
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            layout: { type: "spring", stiffness: 380, damping: 32 },
            opacity: { duration: 0.15 },
            scale: { duration: 0.2 },
          }}
          style={{ display: "inline-flex" }}
        >
          <Avatar
            id={face.colorKey}
            name={face.name}
            src={face.profile && face.profile !== "none" ? face.profile : undefined}
            kind={face.kind}
            size={FACE_SIZE}
          />
        </motion.span>
      ))}
      {hidden > 0 && <span className="cl-seen-receipts__more">+{hidden}</span>}
    </div>
  );
}

export default SeenReceipts;
