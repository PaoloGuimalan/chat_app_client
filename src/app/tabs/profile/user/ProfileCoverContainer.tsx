/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { Fragment, useMemo, useRef, useState } from "react";
import { BiSolidImageAdd } from "react-icons/bi";
import { motion } from "framer-motion";
import { BsFilePerson } from "react-icons/bs";
import UploadProfileMedia from "@/app/widgets/modals/CreatePost/UploadProfileMedia";
import FullscreenImageViewer from "@/app/reusables/FullscreenImageViewer";
import { useSelector } from "react-redux";
import { useCloseOnOutside } from "./useCloseOnOutside";

function ProfileCoverContainer({
  userID,
  realm_id,
  realm_type,
  coverphoto,
  type,
  isAllowed,
  getpostprocess,
}: {
  userID: string;
  realm_id: string | null;
  realm_type?: string | null;
  coverphoto: string | null;
  type: string;
  isAllowed: boolean;
  getpostprocess: () => void;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [toggleSelection, settoggleSelection] = useState<boolean>(false);
  const [toggleUploadModal, settoggleUploadModal] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const cover = useRef<HTMLDivElement>(null);
  useCloseOnOutside(cover, toggleSelection, () => settoggleSelection(false));

  const isUserProfile = useMemo(() => {
    if (type === "profile") {
      return authentication.user.userID === userID;
    }

    return isAllowed;
  }, [authentication.user.userID, userID, isAllowed, type]);

  const hasPhoto = !!coverphoto && coverphoto !== "none";
  // A visitor gets the menu too, with the one thing there is to do: look.
  const hasMenu = isUserProfile || hasPhoto;

  const menu = hasMenu && (
    <motion.div
      initial={{
        height: "0px",
      }}
      animate={{
        height: toggleSelection ? "auto" : "0px",
      }}
      className="cl-profile-cover-menu tw-absolute tw-bottom-0 tw-right-0 tw-w-max tw-overflow-y-hidden"
    >
      <div className="tw-p-[10px] tw-flex tw-flex-col tw-gap-[2px] tw-items-stretch">
        {hasPhoto && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
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
            onClick={(e) => {
              e.stopPropagation();
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
  );

  return (
    <Fragment>
      <div
        ref={cover}
        onClick={() => {
          if (hasMenu) settoggleSelection(!toggleSelection);
        }}
        className={`cl-profile-cover tw-bg-[var(--surface-2)] tw-w-full tw-flex tw-flex-1 tw-max-w-[1200px] tw-rounded-b-[20px] tw-relative ${
          hasPhoto ? "tw-h-[200px]" : "tw-min-h-[200px]"
        } ${hasMenu ? "tw-cursor-pointer" : ""}`}
      >
        {hasPhoto && (
          <CachedImage
            src={coverphoto!}
            className={`cl-profile-cover tw-bg-[var(--surface-2)] tw-max-h-full tw-max-w-full tw-w-full tw-h-full tw-object-cover tw-rounded-b-[20px] ${
              hasMenu ? "tw-cursor-pointer" : ""
            }`}
          />
        )}
        {menu}
      </div>
      {viewingPhoto && hasPhoto && (
        <FullscreenImageViewer
          src={coverphoto!}
          onClose={() => setViewingPhoto(false)}
        />
      )}
      {toggleUploadModal && (
        <UploadProfileMedia
          realm_id={realm_id}
          realm_type={realm_type}
          type="cover_photo"
          onclose={settoggleUploadModal}
          getpostprocess={getpostprocess}
        />
      )}
    </Fragment>
  );
}

export default ProfileCoverContainer;
