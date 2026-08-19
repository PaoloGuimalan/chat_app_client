/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import {
  AddNewMemberToServer,
  RemoveRealmMemberRequest,
} from "@/reusables/hooks/requests";
import { useSelector } from "react-redux";
import {
  AuthenticationInterface,
  IRealmProfileInfo,
} from "@/reusables/vars/interfaces";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/reusables/design/primitives2";
import RealmCardReportButton from "@/app/widgets/items/RealmCardReportButton";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import { leaveRealmPrompt } from "@/app/widgets/modals/confirmPrompts";

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

  const [isLeaving, setisLeaving] = useState<boolean>(false);

  const joinServerProcess = () => {
    setisJoining(true);
    // Join as whichever entity is currently active - the personal account,
    // or a page it's switched into acting as. A switched page has no
    // fullName, so fall back to its display name/slug for the notification
    // text (userID/fullName here are cosmetic - only entityID is used for
    // the actual community_member row).
    const activeEntity = authentication.active_entity_context;
    const initialpayload = {
      serverID: mp.id,
      memberstoadd: [
        {
          userID:
            activeEntity.entity_type === "user"
              ? authentication.user.userID
              : (activeEntity.slug ?? activeEntity.name),
          entityID: activeEntity.id,
          fullName:
            activeEntity.entity_type === "user"
              ? `${authentication.user.fullName.firstName}${
                  authentication.user.fullName.middleName == "N/A"
                    ? ""
                    : ` ${authentication.user.fullName.middleName}`
                } ${authentication.user.fullName.lastName}`
              : activeEntity.name,
        },
      ],
      receivers: [activeEntity.id],
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

  // Named in the prompt: this card sits in a grid of servers, so "Leave
  // server?" alone would not say which one.
  const [isLeaveConfirmOpen, setisLeaveConfirmOpen] = useState<boolean>(false);

  const leaveServerProcess = () => {
    setisLeaving(true);
    RemoveRealmMemberRequest(mp.realm_id, [
      authentication.active_entity_context.id,
    ])
      .then((response) => {
        setisLeaving(false);
        if (response.status) {
          setisJoined(false);
        }
      })
      .catch((err) => {
        setisLeaving(false);
        console.log(err);
      });
  };

  return (
    <div
      className={`cl-display-card tw-w-full tw-h-[300px] tw-min-h-[300px] ${!flexed && "tw-max-w-[300px]"} tw-flex tw-flex-col`}
    >
      <div className="cl-display-card__surface tw-relative tw-w-full tw-h-full tw-min-h-[0px] tw-flex tw-flex-col tw-justify-start tw-items-center">
        <RealmCardReportButton
          targetId={mp.entity || mp.realm_id || mp.id}
          realmType="server"
          hidden={isSelf}
        />
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
              className="cl-display-card__title tw-min-w-0 tw-w-full tw-flex tw-items-center tw-gap-[4px] tw-overflow-hidden cl-text-body tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px]"
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
            <span className="cl-display-card__description cl-text-caption tw-font-Inter tw-text-left line_clamp">
              {mp.description}
            </span>
            <div className="tw-w-full tw-flex tw-flex-row tw-flex-1 tw-justify-between tw-items-end tw-gap-[10px] tw-pb-[15px]">
              <span className="cl-display-card__meta cl-text-caption tw-mb-[5px]">
                {mp.members} member/s
              </span>
              {isJoined && !isSelf ? (
                isLeaving ? (
                  <button
                    disabled
                    className="cl-display-card__button cl-display-card__button--muted cl-text-caption tw-h-[27px] tw-w-[100px] tw-border-none"
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
                        <AiOutlineLoading3Quarters
                          style={{ fontSize: "15px" }}
                        />
                      </motion.div>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setisLeaveConfirmOpen(true)}
                    className="cl-display-card__button cl-display-card__button--outline cl-text-caption tw-h-[27px] tw-w-[100px] tw-border-[1px] tw-border-solid tw-cursor-pointer"
                  >
                    Leave
                  </button>
                )
              ) : isJoined ? (
                <button
                  disabled
                  className="cl-display-card__button cl-display-card__button--muted cl-text-caption tw-h-[27px] tw-w-[100px] tw-border-none"
                >
                  Joined
                </button>
              ) : isJoining ? (
                <button
                  disabled
                  className="cl-display-card__button cl-display-card__button--muted cl-text-caption tw-h-[27px] tw-w-[100px] tw-border-none"
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
                  className="cl-display-card__button cl-display-card__button--primary cl-text-caption tw-h-[27px] tw-w-[100px] tw-border-none tw-cursor-pointer"
                >
                  Join
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {isLeaveConfirmOpen && (
        <ConfirmModal
          {...leaveRealmPrompt("server", mp.name)}
          onClose={() => setisLeaveConfirmOpen(false)}
          onConfirm={() => {
            setisLeaveConfirmOpen(false);
            leaveServerProcess();
          }}
        />
      )}
    </div>
  );
}

export default PublicServerItem;

