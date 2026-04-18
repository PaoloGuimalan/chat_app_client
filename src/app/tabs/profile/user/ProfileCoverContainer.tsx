/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { Fragment, useMemo, useState } from "react";
import { BiSolidImageAdd } from "react-icons/bi";
import { motion } from "framer-motion";
import { BsFilePerson } from "react-icons/bs";
import UploadProfileMedia from "@/app/widgets/modals/CreatePost/UploadProfileMedia";
import { useSelector } from "react-redux";

function ProfileCoverContainer({
  userID,
  realm_id,
  coverphoto,
  type,
  isAllowed,
  getpostprocess,
}: {
  userID: string;
  realm_id: string | null;
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

  const isUserProfile = useMemo(() => {
    if (type === "profile") {
      return authentication.user.userID === userID;
    }

    return isAllowed;
  }, [authentication.user.userID, userID, isAllowed, type]);

  return (
    <Fragment>
      {coverphoto && coverphoto !== "none" ? (
        <div
          onClick={() => {
            settoggleSelection(!toggleSelection);
          }}
          className="tw-bg-black tw-w-full tw-flex tw-flex-1 tw-max-w-[1200px] tw-rounded-b-[10px] tw-h-[200px] tw-relative"
        >
          <CachedImage
            src={coverphoto}
            onClick={() => {
              settoggleSelection(!toggleSelection);
            }}
            className="tw-bg-black tw-max-h-full tw-max-w-full tw-w-full tw-h-full tw-object-cover tw-rounded-b-[10px] tw-cursor-pointer"
          />
          {isUserProfile && (
            <motion.div
              initial={{
                height: "0px",
              }}
              animate={{
                height: toggleSelection ? "auto" : "0px",
              }}
              className="tw-absolute tw-bottom-0 tw-right-0 tw-bg-white tw-overflow-y-hidden tw-rounded-[7px] tw-shadow-md"
            >
              <div className="tw-p-[10px] tw-w-[calc(100%-20px)] tw-flex tw-flex-col tw-gap-[2px] tw-items-start">
                {coverphoto !== "none" && (
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
                    <span className="tw-font-Inter tw-text-[12px]">
                      View Photo
                    </span>
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
        </div>
      ) : (
        <div
          onClick={() => {
            settoggleSelection(!toggleSelection);
          }}
          className="tw-bg-black tw-w-full tw-flex tw-flex-1 tw-max-w-[1200px] tw-rounded-b-[10px] tw-cursor-pointer tw-relative"
        >
          {isUserProfile && (
            <motion.div
              initial={{
                height: "0px",
              }}
              animate={{
                height: toggleSelection ? "auto" : "0px",
              }}
              className="tw-absolute tw-bottom-0 tw-right-0 tw-bg-white tw-overflow-y-hidden tw-rounded-[7px] tw-shadow-md"
            >
              <div className="tw-p-[10px] tw-w-[calc(100%-20px)] tw-flex tw-flex-col tw-gap-[2px] tw-items-start">
                {coverphoto !== "none" && (
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
                    <span className="tw-font-Inter tw-text-[12px]">
                      View Photo
                    </span>
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
        </div>
      )}
      {toggleUploadModal && (
        <UploadProfileMedia
          realm_id={realm_id}
          type="cover_photo"
          onclose={settoggleUploadModal}
          getpostprocess={getpostprocess}
        />
      )}
    </Fragment>
  );
}

export default ProfileCoverContainer;
