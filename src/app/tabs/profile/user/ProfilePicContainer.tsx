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
  profile,
  getpostprocess,
}: {
  userID: string;
  profile: string | null;
  getpostprocess: () => void;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [toggleSelection, settoggleSelection] = useState<boolean>(false);
  const [toggleUploadModal, settoggleUploadModal] = useState<boolean>(false);

  const isUserProfile = useMemo(
    () => authentication.user.userID === userID,
    [authentication.user.userID, userID],
  );

  return (
    <div className="tw-bg-transparent tw-w-full tw-max-w-[180px] tw-flex tw-justify-center tw-relative">
      {profile && profile !== "none" ? (
        <div
          onClick={() => {
            settoggleSelection(!toggleSelection);
          }}
          className="tw-cursor-pointer tw-bg-[#d2d2d2] tw-w-full tw-max-w-[120px] tw-h-[120px] sm:tw-max-w-[160px] sm:tw-h-[160px] tw-border-solid tw-border-[5px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative tw--mt-[80px]"
        >
          <CachedImage src={profile} id="img_actual_profile_main" />
        </div>
      ) : (
        <div
          onClick={() => {
            settoggleSelection(!toggleSelection);
          }}
          className="tw-cursor-pointer tw-bg-[#d2d2d2] tw-w-full tw-max-w-[120px] tw-h-[120px] sm:tw-max-w-[160px] sm:tw-h-[160px] tw-border-solid tw-border-[5px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative tw--mt-[80px]"
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
          className="tw-absolute tw-bottom-0 tw-bg-white tw-overflow-y-hidden tw-rounded-[7px] tw-shadow-md"
        >
          <div className="tw-p-[10px] tw-w-[calc(100%-20px)] tw-flex tw-flex-col tw-gap-[2px] tw-items-start">
            {profile !== "none" && (
              <motion.button
                initial={{
                  backgroundColor: "transparent",
                }}
                whileHover={{
                  backgroundColor: "#d2d2d2",
                  color: "white",
                }}
                className="tw-border-none tw-cursor-pointer tw-p-[4px] tw-min-h-[30px] tw-rounded-[4px] tw-w-[calc(100%-0px)] tw-text-left tw-flex tw-items-center tw-gap-[4px]"
              >
                <BsFilePerson color="#666666" size={22} />
                <span className="tw-font-Inter tw-text-[12px]">View Photo</span>
              </motion.button>
            )}
            <motion.button
              initial={{
                backgroundColor: "transparent",
              }}
              whileHover={{
                backgroundColor: "#d2d2d2",
                color: "white",
              }}
              onClick={() => {
                settoggleUploadModal(true);
              }}
              className="tw-border-none tw-cursor-pointer tw-p-[4px] tw-min-h-[30px] tw-rounded-[4px] tw-w-[calc(100%-0px)] tw-text-left tw-flex tw-items-center tw-gap-[4px]"
            >
              <BiSolidImageAdd color="#666666" size={25} />
              <span className="tw-font-Inter tw-text-[12px]">
                Upload New Photo
              </span>
            </motion.button>
          </div>
        </motion.div>
      )}
      {toggleUploadModal && (
        <UploadProfileMedia
          type="profile"
          onclose={settoggleUploadModal}
          getpostprocess={getpostprocess}
        />
      )}
    </div>
  );
}

export default ProfilePicContainer;
