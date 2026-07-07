/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthenticationInterface, IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { RiUserFollowLine, RiVerifiedBadgeFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import {
  FollowRealmRequest,
  UnfollowRealmRequest,
} from "@/reusables/hooks/requests";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { Avatar } from "@/reusables/design/primitives2";

function GenericRealmItem({
  mp,
  refresh,
  flexed,
}: {
  mp: IRealmProfileInfo;
  refresh: (callback: () => void) => void;
  flexed: boolean;
}) {
  const navigate = useNavigate();
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  // The acting entity (which may be a different page, or this exact one)
  // can't follow itself - only relevant once switched into acting as mp.
  const isSelf = authentication.active_entity_context.id === mp.entity;

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
    <div
      className={`cl-display-card tw-w-full tw-h-[300px] tw-min-h-[300px] ${!flexed && "tw-max-w-[300px]"} tw-flex tw-flex-col`}
    >
      <div
        className="cl-display-card__surface tw-w-full tw-h-full tw-min-h-[0px] tw-flex tw-flex-col tw-justify-start tw-items-center"
      >
        {mp.cover_photo ? (
          <img
            src={mp.cover_photo}
            className="cl-display-card__cover tw-w-full tw-flex tw-max-w-[1500px] tw-h-[120px] tw-object-cover"
          />
        ) : (
          <div className="cl-display-card__cover tw-w-full tw-flex tw-max-w-[1500px] tw-h-[120px]" />
        )}
        <div className="cl-display-card__body tw-w-[calc(100%-30px)] tw-pl-[15px] tw-pr-[15px] tw-flex tw-flex-col tw-items-start tw-gap-[8px] tw-flex-1">
          <Avatar
            name={mp.name}
            src={mp.profile && mp.profile !== "none" ? mp.profile : null}
            size={50}
            shape="rounded"
            className="cl-display-card__avatar-shell tw-cursor-pointer tw-relative tw--mt-[30px]"
          />
          <div className="tw-w-[calc(100%-10px)] tw-pr-[5px] tw-pl-[5px] tw-flex tw-flex-col tw-items-start tw-gap-[6px] tw-flex-1 tw-min-w-0">
            <span
              className="cl-display-card__title tw-min-w-0 tw-w-full tw-flex tw-items-center tw-gap-[4px] tw-overflow-hidden tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px]"
              onClick={() => {
                navigate(`/${mp.slug}`);
              }}
            >
              <div className="tw-flex tw-items-center tw-gap-[4px] tw-min-w-0 tw-flex-1 tw-overflow-hidden">
                <span className="tw-truncate">{mp.name}</span>
                {mp.is_verified && (
                  <RiVerifiedBadgeFill size={16} color="#1c7def" />
                )}
              </div>
            </span>
            <span className="cl-display-card__description tw-text-[12px] tw-font-Inter tw-text-left line_clamp_3">
              {mp.description}
            </span>
            <div className="tw-w-full tw-flex tw-flex-row tw-flex-1 tw-justify-between tw-items-end tw-gap-[10px] tw-pb-[15px]">
              {mp.type === "page" && (
                <div className="tw-flex tw-gap-[4px]">
                  {mp.type === "page" && mp.is_admin && (
                    <button
                      onClick={() => {
                        navigate(`/realms/${mp.realm_id}`);
                      }}
                      className="cl-display-card__button cl-display-card__button--primary tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-text-[12px]"
                    >
                      Manage
                    </button>
                  )}
                  {mp.type === "page" &&
                    !isSelf &&
                    (mp.is_follower ? (
                      <button
                        onClick={UnfollowRealmProcess}
                        disabled={isConnectionButtonsLoading}
                        className="cl-display-card__button cl-display-card__button--outline tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-[1px] tw-border-solid tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-text-[12px]"
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
                        className="cl-display-card__button cl-display-card__button--primary tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-text-[12px]"
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
              <span className="cl-display-card__meta tw-text-[12px] tw-mb-[5px] tw-inline-flex tw-items-center tw-gap-[4px]">
                <span>{mp.followers_count}</span>
                <RiUserFollowLine size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenericRealmItem;
