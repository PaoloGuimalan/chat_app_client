/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { ThreeDots } from "react-loader-spinner";
import { Avatar } from "@/reusables/design";
import { TypingEntry, typingKey, typingLabel } from "@/reusables/hooks/typing";

/**
 * Where each face of a typing cluster sits inside the avatar column, as
 * [left, top, diameter] fractions of the column's width. The cluster never
 * grows past one avatar's square - that is what keeps the typing bubble lined
 * up with every message bubble above it, however many people type. The
 * Flutter client draws the same shapes (typing_loader.dart's _clusterSlots).
 */
const CLUSTER: number[][][] = [
  [[0, 0, 1]],
  // Two: a diagonal pair, the second over the first.
  [
    [0, 0, 0.69],
    [0.31, 0.31, 0.69],
  ],
  // Three or more: a small triangle - the third slot turns into "+N" when
  // there are more people than faces.
  [
    [0, 0, 0.56],
    [0.44, 0, 0.56],
    [0.22, 0.44, 0.56],
  ],
];

/**
 * The typing bubble at the foot of a thread.
 *
 * In a group or channel it carries WHO is typing, beside the bubble where a
 * run's avatar sits: one face at the run avatar's size, or a small cluster
 * inside that same square when several people type at once. A DM keeps the
 * bare bubble, for the
 * same reason its messages carry no avatar - the header already says who.
 *
 * Each face is drawn from the typing broadcast itself (newer servers send the
 * typer's name and picture), falling back to the conversation's member list,
 * which is all an older server's account-id-only ping can be matched against.
 * No presence dot: someone typing is plainly here, and the dot's "Nm" pill
 * could otherwise claim they left minutes ago.
 */
function IsTypingLoader({
  typers = [],
  members = [],
  showAvatars = false,
  avatarSize = 32,
}: {
  typers?: TypingEntry[];
  members?: any[];
  showAvatars?: boolean;
  avatarSize?: number;
}) {
  const faces = showAvatars ? typers.map((typer) => faceOf(typer, members)) : [];
  const slots = CLUSTER[Math.min(faces.length, 3) - 1] ?? [];
  const clustered = faces.length > 1;
  // Past three, the last slot says how many more rather than show a face.
  const overflow =
    faces.length > slots.length ? faces.length - (slots.length - 1) : 0;

  return (
    <motion.div
      className="div_messages_result tw-items-center"
      aria-label={showAvatars ? typingLabel(typers, true) : "typing"}
    >
      {faces.length > 0 && (
        <motion.div
          className="cl-typing-avatars"
          style={{ width: avatarSize, height: avatarSize }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          title={typingLabel(typers, true)}
        >
          {slots.map(([left, top, diameter], i) => {
            const size = Math.round(avatarSize * diameter);
            const place = {
              left: avatarSize * left,
              top: avatarSize * top,
              width: size,
              height: size,
            };
            if (overflow > 0 && i === slots.length - 1) {
              return (
                <span
                  key="more"
                  className="cl-typing-avatars__slot cl-typing-avatars__more"
                  style={place}
                >
                  +{overflow}
                </span>
              );
            }
            const face = faces[i];
            return (
              <span
                key={face.key}
                className={`cl-typing-avatars__slot ${
                  clustered ? "cl-typing-avatars__slot--ringed" : ""
                }`}
                style={place}
              >
                <Avatar
                  id={face.colorKey}
                  name={face.name}
                  src={face.profile}
                  kind={face.kind}
                  size={size}
                />
              </span>
            );
          })}
        </motion.div>
      )}
      <motion.div
        initial={{
          marginLeft: "0px",
          alignItems: "flex-start",
          scale: 0,
        }}
        animate={{
          marginLeft: "0px",
          alignItems: "flex-start",
          scale: 1,
        }}
        transition={{
          duration: 0.2,
        }}
        className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
      >
        <motion.div
          initial={{
            backgroundColor: "var(--surface)",
            border: "solid 1px var(--surface)",
            color: "var(--text)",
          }}
          animate={{
            backgroundColor: "var(--surface)",
            border: "solid 1px var(--surface)",
            color: "var(--text)",
          }}
          className="span_messages_result c1 tw-h-[40px] tw-min-w-[70px] tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-justify-center"
        >
          <ThreeDots
            visible={true}
            height="30"
            width="30"
            color="var(--text)"
            radius="30"
            ariaLabel="three-dots-loading"
            wrapperStyle={{}}
            wrapperClass=""
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** A typer's face: the broadcast's own identity first, the member row second. */
function faceOf(typer: TypingEntry, members: any[]) {
  const member = members.find(
    (m: any) =>
      (typer.entityID && String(m.entityID) === String(typer.entityID)) ||
      (typer.userID && String(m._id) === String(typer.userID)),
  );
  const memberName = member
    ? [member.fullname?.firstName, member.fullname?.lastName]
        .filter(Boolean)
        .join(" ")
    : "";
  const profile =
    typer.profile || (member?.profile && member.profile !== "none" ? member.profile : null);
  return {
    key: typingKey(typer),
    name: typer.displayName || memberName || "Someone",
    colorKey: member?.userID || typer.entityID || typer.userID || "typing",
    profile: profile || undefined,
    kind: typer.entityType || member?.entityType || null,
  };
}

export default IsTypingLoader;
