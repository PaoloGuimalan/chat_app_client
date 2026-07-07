/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { AddNewMemberToServer } from "@/reusables/hooks/requests";
import { useSelector } from "react-redux";
import {
  AuthenticationInterface,
  IRealmProfileInfo,
} from "@/reusables/vars/interfaces";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/reusables/design/primitives2";

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
  // The acting entity can't join itself - not reachable today (switching is
  // page-only, so a server can never be the active entity), but kept
  // consistent with GenericRealmItem/RealmProfile in case that changes.
  const isSelf = authentication.active_entity_context.id === mp.entity;

  const joinServerProcess = () => {
    setisJoining(true);
    const initialpayload = {
      serverID: mp.id,
      memberstoadd: [
        {
          userID: authentication.user.userID,
          entityID: authentication.user.entity_id,
          fullName: `${authentication.user.fullName.firstName}${
            authentication.user.fullName.middleName == "N/A"
              ? ""
              : ` ${authentication.user.fullName.middleName}`
          } ${authentication.user.fullName.lastName}`,
        },
      ],
      receivers: [authentication.user.entity_id],
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
      className={`cl-display-card tw-w-full tw-h-[300px] tw-min-h-[300px] ${!flexed && "tw-max-w-[300px]"} tw-flex tw-flex-col`}
    >
      <div className="cl-display-card__surface tw-w-full tw-h-full tw-min-h-[0px] tw-flex tw-flex-col tw-justify-start tw-items-center">
        {mp.cover_photo ? (
          <img
            src={mp.cover_photo}
            className="cl-display-card__cover tw-w-full tw-object-cover tw-flex tw-max-w-[1500px] tw-h-[120px]"
          />
        ) : (
          <div className="cl-display-card__cover tw-w-full tw-flex tw-max-w-[1500px] tw-h-[120px]" />
        )}
        <div className="cl-display-card__body tw-w-[calc(100%-30px)] tw-pl-[15px] tw-pr-[15px] tw-flex tw-flex-col tw-items-start tw-gap-[8px] tw-flex-1">
          <Avatar
            name={mp.name}
            src={mp.profile && mp.profile !== "N/A" ? mp.profile : null}
            size={50}
            shape="rounded"
            className="cl-display-card__avatar-shell tw-cursor-pointer tw-shadow-md tw-relative tw--mt-[30px]"
          />
          <div className="tw-w-[calc(100%-10px)] tw-pr-[5px] tw-pl-[5px] tw-flex tw-flex-col tw-items-start tw-gap-[6px] tw-flex-1 tw-min-w-0">
            <span
              className="cl-display-card__title tw-min-w-0 tw-w-full tw-flex tw-items-center tw-gap-[4px] tw-overflow-hidden tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px]"
              onClick={() => {
                if (isJoined) {
                  navigate(`/servers/${mp.id}`);
                }
              }}
            >
              <div className="tw-flex tw-items-center tw-gap-[4px] tw-min-w-0 tw-flex-1 tw-overflow-hidden">
                <span className="tw-truncate">{mp.name}</span>
                {mp.is_verified && (
                  <RiVerifiedBadgeFill size={16} color="#1c7def" />
                )}
              </div>
            </span>
            <span className="cl-display-card__description tw-text-[12px] tw-font-Inter tw-text-left line_clamp">
              {mp.description}
            </span>
            <div className="tw-w-full tw-flex tw-flex-row tw-flex-1 tw-justify-between tw-items-end tw-gap-[10px] tw-pb-[15px]">
              <span className="cl-display-card__meta tw-text-[12px] tw-mb-[5px]">
                {mp.members} member/s
              </span>
              {isJoined ? (
                <button
                  disabled
                  className="cl-display-card__button cl-display-card__button--muted tw-text-[12px] tw-h-[27px] tw-w-[100px] tw-border-none"
                >
                  Joined
                </button>
              ) : isJoining ? (
                <button
                  disabled
                  className="cl-display-card__button cl-display-card__button--muted tw-text-[12px] tw-h-[27px] tw-w-[100px] tw-border-none"
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
              ) : !isSelf ? (
                <button
                  onClick={joinServerProcess}
                  className="cl-display-card__button cl-display-card__button--primary tw-text-[12px] tw-h-[27px] tw-w-[100px] tw-border-none tw-cursor-pointer"
                >
                  Join
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicServerItem;

