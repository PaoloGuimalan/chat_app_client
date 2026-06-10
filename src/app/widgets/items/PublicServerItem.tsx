/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import ServerIcon from "../../../assets/imgs/servericon.png";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { AddNewMemberToServer } from "@/reusables/hooks/requests";
import { useSelector } from "react-redux";
import {
  AuthenticationInterface,
  IRealmProfileInfo,
} from "@/reusables/vars/interfaces";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

function PublicServerItem({
  mp,
  flexed,
}: {
  mp: IRealmProfileInfo;
  flexed: boolean;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const [isJoining, setisJoining] = useState<boolean>(false);
  const [isJoined, setisJoined] = useState<boolean>(mp.is_member ?? false);

  const navigate = useNavigate();

  const joinServerProcess = () => {
    setisJoining(true);
    const initialpayload = {
      serverID: mp.id,
      memberstoadd: [
        {
          userID: authentication.user.userID,
          fullName: `${authentication.user.fullName.firstName}${
            authentication.user.fullName.middleName == "N/A"
              ? ""
              : ` ${authentication.user.fullName.middleName}`
          } ${authentication.user.fullName.lastName}`,
        },
      ],
      receivers: [authentication.user.userID],
    };
    AddNewMemberToServer(initialpayload)
      .then((response) => {
        if (response.data.status) {
          setisJoining(false);
          setisJoined(true);
        }
      })
      .catch((err) => {
        setisJoining(false);
        console.log(err);
      });
  };

  return (
    <div
      className={`tw-bg-white tw-w-full tw-h-[300px] tw-min-h-[300px] ${!flexed && "tw-max-w-[300px]"} tw-flex tw-flex-col tw-rounded-[5px]`}
    >
      <div className="tw-bg-white tw-w-full tw-h-full tw-min-h-[0px] tw-border-solid tw-border-[0px] tw-border-b-[0px] tw-border-[#d2d2d2] tw-flex tw-flex-col tw-justify-start tw-items-center  tw-rounded-[5px]">
        {mp.cover_photo ? (
          <img
            src={mp.cover_photo}
            className="tw-bg-black tw-w-full tw-object-cover tw-flex tw-max-w-[1500px] tw-h-[120px] tw-rounded-t-[5px]"
          />
        ) : (
          <div className="tw-bg-black tw-w-full tw-flex tw-max-w-[1500px] tw-rounded-b-[0px] tw-h-[120px] tw-rounded-t-[5px]" />
        )}
        <div className="tw-w-[calc(100%-30px)] tw-pl-[15px] tw-pr-[15px] tw-flex tw-flex-col tw-items-start tw-gap-[5px] tw-flex-1">
          <div className="tw-cursor-pointer tw-bg-white tw-shadow-md tw-w-[50px] tw-h-[50px] tw-border-solid tw-border-[5px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[20px] tw-relative tw--mt-[30px]">
            <CachedImage
              src={
                mp && mp.profile && mp.profile !== "N/A"
                  ? mp.profile
                  : ServerIcon
              }
              id={
                mp && mp.profile && mp.profile !== "N/A"
                  ? "img_actual_profile_main"
                  : ""
              }
              className={
                mp && mp.profile && mp.profile !== "N/A"
                  ? ""
                  : "img_gc_profiles_ntfs"
              }
            />
          </div>
          <div className="tw-w-[calc(100%-10px)] tw-pr-[5px] tw-pl-[5px] tw-flex tw-flex-col tw-items-start tw-gap-[5px] tw-flex-1">
            <span
              className="tw-break-keep tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
              onClick={() => {
                if (isJoined) {
                  navigate(`/servers/${mp.id}`);
                }
              }}
            >
              <div className="tw-flex tw-items-center tw-gap-[4px]">
                <span>{mp.name}</span>
                {mp.is_verified && (
                  <RiVerifiedBadgeFill size={16} color="#1c7def" />
                )}
              </div>
            </span>
            <span className="tw-text-[12px] tw-font-Inter tw-text-left line_clamp tw-text-[#3f3f3f]">
              {mp.description}
            </span>
            <div className="tw-w-full tw-flex tw-flex-row tw-flex-1 tw-justify-between tw-items-end tw-pb-[15px]">
              <span className="tw-text-[12px] tw-text-[#3f3f3f] tw-mb-[5px]">
                {mp.members} member/s
              </span>
              {isJoined ? (
                <button
                  disabled
                  className="tw-text-[12px] tw-h-[27px] tw-w-[100px] tw-border-none tw-bg-[#dfdfdf] tw-rounded-[4px]"
                >
                  Joined
                </button>
              ) : isJoining ? (
                <button
                  disabled
                  className="tw-text-[12px] tw-h-[27px] tw-w-[100px] tw-border-none tw-bg-[#dfdfdf] tw-rounded-[4px]"
                >
                  <div className="tw-h-full tw-w-full tw-flex tw-items-center tw-justify-center">
                    <motion.div
                      animate={{
                        rotate: -360,
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      id="div_loader_request_nano"
                    >
                      <AiOutlineLoading3Quarters style={{ fontSize: "15px" }} />
                    </motion.div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={joinServerProcess}
                  className="tw-text-[12px] tw-h-[27px] tw-w-[100px] tw-border-none tw-bg-[#e69500] tw-rounded-[4px] tw-cursor-pointer tw-text-white"
                >
                  Join
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicServerItem;
