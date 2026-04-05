/* eslint-disable @typescript-eslint/no-explicit-any */
import ServerIcon from "../../../assets/imgs/servericon.png";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FollowRealmRequest,
  UnfollowRealmRequest,
} from "@/reusables/hooks/requests";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";

function GenericRealmItem({
  mp,
  refresh,
}: {
  mp: IRealmProfileInfo;
  refresh: (callback: () => void) => void;
}) {
  const navigate = useNavigate();

  const [isConnectionButtonsLoading, setisConnectionButtonsLoading] =
    useState<boolean>(false);

  const FollowRealmProcess = () => {
    setisConnectionButtonsLoading(true);
    FollowRealmRequest({ realm_id: mp.id })
      .then((response) => {
        refresh(() => {
          setisConnectionButtonsLoading(false);
        });
        console.log(response);
      })
      .catch((err) => {
        setisConnectionButtonsLoading(false);
        console.log(err);
      });
  };

  const UnfollowRealmProcess = () => {
    setisConnectionButtonsLoading(true);
    UnfollowRealmRequest({ realm_id: mp.id })
      .then((response) => {
        refresh(() => {
          setisConnectionButtonsLoading(false);
        });
        console.log(response);
      })
      .catch((err) => {
        setisConnectionButtonsLoading(false);
        console.log(err);
      });
  };

  return (
    <div className="tw-bg-[#e6e6e6] tw-w-full tw-h-[300px] tw-min-h-[300px] tw-max-w-[300px] tw-flex tw-flex-col tw-rounded-[5px]">
      <div className="tw-bg-[#e6e6e6] tw-w-full tw-h-full tw-min-h-[0px] tw-border-solid tw-border-[0px] tw-border-b-[0px] tw-border-[#d2d2d2] tw-flex tw-flex-col tw-justify-start tw-items-center  tw-rounded-[5px]">
        {mp.cover_photo ? (
          <img
            src={mp.cover_photo}
            className="tw-bg-black tw-w-full tw-flex tw-max-w-[1500px] tw-h-[120px] tw-rounded-t-[5px] tw-object-cover"
          />
        ) : (
          <div className="tw-bg-black tw-w-full tw-flex tw-max-w-[1500px] tw-rounded-b-[0px] tw-h-[120px] tw-rounded-t-[5px]" />
        )}
        <div className="tw-w-[calc(100%-30px)] tw-pl-[15px] tw-pr-[15px] tw-flex tw-flex-col tw-items-start tw-gap-[5px] tw-flex-1">
          <div className="tw-cursor-pointer tw-bg-white tw-w-[50px] tw-h-[50px] tw-border-solid tw-border-[5px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[20px] tw-relative tw--mt-[30px]">
            <CachedImage
              src={
                mp.profile && mp.profile !== "none" ? mp.profile : ServerIcon
              }
              id={
                mp.profile && mp.profile !== "none"
                  ? "img_actual_generic_realm_profile_main"
                  : "img_default_profile"
              }
            />
          </div>
          <div className="tw-w-[calc(100%-10px)] tw-pr-[5px] tw-pl-[5px] tw-flex tw-flex-col tw-items-start tw-gap-[5px] tw-flex-1">
            <span
              className="tw-break-keep tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
              onClick={() => {
                navigate(`/${mp.slug}`);
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
              {mp.type === "page" && (
                <div className="tw-flex tw-gap-[4px]">
                  {mp.type === "page" && mp.is_admin && (
                    <button
                      onClick={() => {
                        navigate(`/realms/${mp.realm_id}`);
                      }}
                      className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#1c7def] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
                    >
                      Manage
                    </button>
                  )}
                  {mp.type === "page" &&
                    (mp.is_follower ? (
                      <button
                        onClick={UnfollowRealmProcess}
                        disabled={isConnectionButtonsLoading}
                        className="tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-[#1c7def] tw-border-[1px] tw-border-solid tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-white tw-text-[#1c7def] tw-rounded-[6px] tw-text-[12px]"
                      >
                        {isConnectionButtonsLoading ? (
                          <motion.div
                            animate={{
                              rotate: -360,
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                            }}
                            id="div_loader_request_nano_light"
                          >
                            <AiOutlineLoading3Quarters
                              style={{ fontSize: "15px", color: "#1c7def" }}
                            />
                          </motion.div>
                        ) : (
                          <div className="tw-min-w-[60px]">Unfollow</div>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={FollowRealmProcess}
                        disabled={isConnectionButtonsLoading}
                        className="tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#1c7def] tw-text-white tw-rounded-[6px] tw-text-[12px]"
                      >
                        {isConnectionButtonsLoading ? (
                          <motion.div
                            animate={{
                              rotate: -360,
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                            }}
                            id="div_loader_request_nano_light"
                          >
                            <AiOutlineLoading3Quarters
                              style={{ fontSize: "15px" }}
                            />
                          </motion.div>
                        ) : (
                          <div className="tw-min-w-[60px]">Follow</div>
                        )}
                      </button>
                    ))}
                </div>
              )}
              <span className="tw-text-[12px] tw-text-[#3f3f3f] tw-mb-[5px]">
                {mp.followers_count} follower/s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenericRealmItem;
