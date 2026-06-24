/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BsFilePerson } from "react-icons/bs";
import { BiSolidImageAdd } from "react-icons/bi";
import UploadProfileMedia from "@/app/widgets/modals/CreatePost/UploadProfileMedia";
import { useSelector } from "react-redux";

function ProfilePicContainer({
  userID,
  realm_id,
  profile,
  type,
  isAllowed,
  getpostprocess,
}: {
  userID: string;
  realm_id: string | null;
  profile: string | null;
  type: string;
  isAllowed: boolean;
  getpostprocess: () => void;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [toggleSelection, settoggleSelection] = useState<boolean>(false);
  const [toggleUploadModal, settoggleUploadModal] = useState<boolean>(false);

  const isUserProfile = useMemo(() => {
    if (type === "profile") {
      return authentication.user.userID === userID;
    }

    return isAllowed;
  }, [authentication.user.userID, userID, isAllowed, type]);

  return (
    <div className="tw-bg-transparent tw-w-full tw-max-w-[180px] tw-flex tw-justify-center tw-relative">
      {profile && profile !== "none" ? (
        <div
          onClick={() => {
            settoggleSelection(!toggleSelection);
          }}
          className="cl-profile-avatar-shell tw-cursor-pointer tw-w-full tw-max-w-[120px] tw-h-[120px] sm:tw-max-w-[160px] sm:tw-h-[160px] tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative tw--mt-[80px]"
        >
          <CachedImage src={profile} id="img_actual_profile_main" />
        </div>
      ) : (
        <div
          onClick={() => {
            settoggleSelection(!toggleSelection);
          }}
          className="cl-profile-avatar-shell tw-cursor-pointer tw-w-full tw-max-w-[120px] tw-h-[120px] sm:tw-max-w-[160px] sm:tw-h-[160px] tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative tw--mt-[80px]"
        >
          <CachedImage src={DefaultProfile} id="img_default_profile" />
        </div>
      )}
      {isUserProfile && (
        <motion.div
          initial={{
            height: "0px",
          }}
          animate={{
            height: toggleSelection ? "auto" : "0px",
          }}
          className="cl-profile-cover-menu tw-absolute tw-bottom-0 tw-overflow-y-hidden"
        >
          <div className="tw-p-[10px] tw-w-[calc(100%-0px)] tw-flex tw-flex-col tw-gap-[2px] tw-items-start">
            {profile !== "none" && (
              <motion.button className="cl-profile-cover-menu__item tw-cursor-pointer tw-p-[4px] tw-min-h-[30px] tw-w-[calc(100%-0px)] tw-text-left tw-flex tw-items-center tw-gap-[4px]">
                <BsFilePerson color="var(--text-2)" size={22} />
                <span className="tw-font-Inter tw-text-[12px] tw-text-[var(--text)]">
                  View Photo
                </span>
              </motion.button>
            )}
            <motion.button
              onClick={() => {
                settoggleUploadModal(true);
              }}
              className="cl-profile-cover-menu__item tw-cursor-pointer tw-p-[4px] tw-min-h-[30px] tw-w-[calc(100%-0px)] tw-text-left tw-flex tw-items-center tw-gap-[4px]"
            >
              <BiSolidImageAdd color="var(--text-2)" size={25} />
              <span className="tw-font-Inter tw-text-[12px] tw-text-[var(--text)]">
                Upload New Photo
              </span>
            </motion.button>
          </div>
        </motion.div>
      )}
      {toggleUploadModal && (
        <UploadProfileMedia
          realm_id={realm_id}
          type="profile"
          onclose={settoggleUploadModal}
          getpostprocess={getpostprocess}
        />
      )}
    </div>
  );
}

export default ProfilePicContainer;
