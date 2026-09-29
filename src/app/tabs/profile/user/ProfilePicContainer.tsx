/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar } from "@/reusables/design/primitives2";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GetMomentRingsRequest,
  GetThoughtsRequest,
} from "@/reusables/hooks/requests";
import type { IMomentRing, IThought } from "@/reusables/vars/interfaces";
import {
  MOMENTS_CHANGED_EVENT,
  THOUGHTS_CHANGED_EVENT,
  timeLeftLabel,
} from "@/app/tabs/moments/ephemeral";
import {
  BubbleTail,
  ThoughtBubble,
  ThoughtComposerModal,
  ThoughtDetail,
} from "@/app/tabs/moments/Thoughts";
import { motion } from "framer-motion";
import { BsFilePerson } from "react-icons/bs";
import { BiSolidImageAdd, BiSolidMoviePlay } from "react-icons/bi";
import UploadProfileMedia from "@/app/widgets/modals/CreatePost/UploadProfileMedia";
import FullscreenImageViewer from "@/app/reusables/FullscreenImageViewer";
import { useSelector } from "react-redux";
import { useCloseOnOutside } from "./useCloseOnOutside";

function ProfilePicContainer({
  userID,
  entityId,
  realm_id,
  realm_type,
  profile,
  name,
  type,
  isAllowed,
  getpostprocess,
}: {
  /** The profile owner's ACCOUNT id - what `isUserProfile` compares. */
  userID: string;
  /** Their entity id, which is what the avatar's presence dot needs. */
  entityId?: string | null;
  realm_id: string | null;
  realm_type?: string | null;
  profile: string | null;
  name?: string;
  type: string;
  isAllowed: boolean;
  getpostprocess: () => void;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const [toggleSelection, settoggleSelection] = useState<boolean>(false);
  const [toggleUploadModal, settoggleUploadModal] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const navigate = useNavigate();
  const column = useRef<HTMLDivElement>(null);
  useCloseOnOutside(column, toggleSelection, () => settoggleSelection(false));
  const [ring, setRing] = useState<IMomentRing | null>(null);
  const [thought, setThought] = useState<IThought | null>(null);
  const [thoughtOpen, setThoughtOpen] = useState(false);

  // The entity's live Moment (ring) and Thought (bubble above the avatar).
  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;
    const load = () => {
      GetMomentRingsRequest([entityId])
        .then((r) => !cancelled && setRing(r[entityId] ?? null))
        .catch(() => {});
      GetThoughtsRequest([entityId])
        .then((t) => !cancelled && setThought(t[entityId] ?? null))
        .catch(() => {});
    };
    load();
    window.addEventListener(MOMENTS_CHANGED_EVENT, load);
    window.addEventListener(THOUGHTS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(MOMENTS_CHANGED_EVENT, load);
      window.removeEventListener(THOUGHTS_CHANGED_EVENT, load);
    };
  }, [entityId]);

  const avatarSize = useMemo(
    () => (screensizelistener.W < 650 ? 120 : 160),
    [screensizelistener],
  );

  const isUserProfile = useMemo(() => {
    if (type === "profile") {
      return authentication.user.userID === userID;
    }

    return isAllowed;
  }, [authentication.user.userID, userID, isAllowed, type]);

  const hasMoment = !!(ring?.has_moment && entityId);
  const hasPhoto = !!profile && profile !== "none";
  // Visitors get the menu too - just what there is to see.
  const hasMenu = isUserProfile || hasMoment || hasPhoto;

  const openMoment = () => {
    if (!ring || !entityId) return;
    settoggleSelection(false);
    navigate(`/moments/${entityId}?post=${ring.start_post_id}`);
  };

  return (
    <div
      ref={column}
      className="cl-profile-avatar-col tw-bg-transparent tw-w-full tw-max-w-[180px] tw-flex tw-justify-center tw-relative"
    >
      <div
        onClick={() => {
          // Everyone gets the menu - a live Moment is one of its items, so it
          // never hides the photo. The owner (or a realm's admin) can also
          // upload; a visitor can only look.
          if (hasMenu) settoggleSelection(!toggleSelection);
        }}
        className="cl-profile-avatar-shell tw-cursor-pointer tw-w-full tw-max-w-[120px] tw-h-[120px] sm:tw-max-w-[160px] sm:tw-h-[160px] tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative tw--mt-[80px]"
      >
        <Avatar
          id={userID}
          entityId={entityId}
          name={name}
          src={profile && profile !== "none" ? profile : undefined}
          size={avatarSize}
          ring={
            ring?.has_moment ? (ring.has_unseen ? "unviewed" : "viewed") : "none"
          }
        />
      </div>
      {thought && (
        <div
          onClick={() => setThoughtOpen(true)}
          // max-content: an absolutely positioned box shrinks to the space
          // left in its containing block, and this column is only ~160px, so
          // the bubble was crushed to a word per line inside the avatar. Sized
          // by its text instead, it sits over the cover, above-right of the
          // avatar (the avatar is pulled up 80px into the cover).
          style={{
            position: "absolute",
            bottom: "calc(100% + 40px)",
            left: "58%",
            zIndex: 5,
            width: "max-content",
            maxWidth: 210,
            cursor: "pointer",
          }}
        >
          <ThoughtBubble
            text={thought.content.text}
            mood={thought.content.mood}
            meta={timeLeftLabel(thought.expires_at)}
          />
          <div style={{ width: 40 }}>
            <BubbleTail left={6} />
          </div>
        </div>
      )}
      {thoughtOpen &&
        thought &&
        (entityId === authentication.user.entity_id ? (
          <ThoughtComposerModal
            existing={thought}
            onClose={() => setThoughtOpen(false)}
          />
        ) : (
          <div
            style={{ position: "absolute", top: 40, left: "62%", zIndex: 40 }}
          >
            <ThoughtDetail
              thought={thought}
              onClose={() => setThoughtOpen(false)}
            />
          </div>
        ))}
      {hasMenu && (
        <motion.div
          initial={{
            height: "0px",
          }}
          animate={{
            height: toggleSelection ? "auto" : "0px",
          }}
          // As wide as its longest label: squeezed to the avatar's column,
          // "Upload New Photo" broke onto two lines.
          className="cl-profile-cover-menu tw-absolute tw-bottom-0 tw-w-max tw-overflow-y-hidden"
        >
          <div className="tw-p-[10px] tw-flex tw-flex-col tw-gap-[2px] tw-items-stretch">
            {hasMoment && (
              <motion.button
                onClick={openMoment}
                className="cl-profile-cover-menu__item tw-cursor-pointer tw-p-[4px] tw-pr-[10px] tw-min-h-[30px] tw-text-left tw-flex tw-items-center tw-gap-[4px]"
              >
                <BiSolidMoviePlay color="var(--text-2)" size={22} />
                <span className="tw-font-Inter cl-text-caption tw-text-[var(--text)] tw-whitespace-nowrap">
                  View Moment
                </span>
              </motion.button>
            )}
            {hasPhoto && (
              <motion.button
                onClick={() => {
                  settoggleSelection(false);
                  setViewingPhoto(true);
                }}
                className="cl-profile-cover-menu__item tw-cursor-pointer tw-p-[4px] tw-pr-[10px] tw-min-h-[30px] tw-text-left tw-flex tw-items-center tw-gap-[4px]"
              >
                <BsFilePerson color="var(--text-2)" size={22} />
                <span className="tw-font-Inter cl-text-caption tw-text-[var(--text)] tw-whitespace-nowrap">
                  View Photo
                </span>
              </motion.button>
            )}
            {isUserProfile && (
              <motion.button
                onClick={() => {
                  settoggleSelection(false);
                  settoggleUploadModal(true);
                }}
                className="cl-profile-cover-menu__item tw-cursor-pointer tw-p-[4px] tw-pr-[10px] tw-min-h-[30px] tw-text-left tw-flex tw-items-center tw-gap-[4px]"
              >
                <BiSolidImageAdd color="var(--text-2)" size={25} />
                <span className="tw-font-Inter cl-text-caption tw-text-[var(--text)] tw-whitespace-nowrap">
                  Upload New Photo
                </span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
      {viewingPhoto && hasPhoto && (
        <FullscreenImageViewer
          src={profile!}
          onClose={() => setViewingPhoto(false)}
        />
      )}
      {toggleUploadModal && (
        <UploadProfileMedia
          realm_id={realm_id}
          realm_type={realm_type}
          type="profile"
          onclose={settoggleUploadModal}
          getpostprocess={getpostprocess}
        />
      )}
    </div>
  );
}

export default ProfilePicContainer;
