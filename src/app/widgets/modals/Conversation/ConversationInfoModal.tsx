/* eslint-disable @typescript-eslint/no-explicit-any */
import Modal from "@/app/reusables/Modal";
import { ConversationInfoModalProp } from "@/reusables/vars/props";
import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import GroupChatIcon from "../../../../assets/imgs/group-chat-icon.jpg";
import ServerIcon from "../../../../assets/imgs/servericon.png";
import { useSelector } from "react-redux";
import {
  AuthenticationInterface,
  UserWithInfoConversationInterface,
} from "@/reusables/vars/interfaces";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaHashtag } from "react-icons/fa6";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { Avatar, BotFlag, PageFlag } from "@/reusables/design";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import ConversationFilesPanel from "./ConversationFilesPanel";

/** "First Middle Last", skipping the "N/A" middle-name sentinel. */
const fullNameOf = (fullname: UserWithInfoConversationInterface["fullname"]) =>
  [
    fullname.firstName,
    fullname.middleName === "N/A" ? "" : fullname.middleName,
    fullname.lastName,
  ]
    .filter((part) => part && part.trim())
    .join(" ");

function ConversationInfoModal({
  conversationinfo,
  conversationID,
  conversationType,
  onclose,
}: ConversationInfoModalProp) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const navigate = useNavigate();

  const [toggleMemberDropper, settoggleMemberDropper] = useState<boolean>(true);

  const isSingle = conversationinfo.type === "single";

  // The OTHER party in a direct message. usersWithInfo includes you, so it is
  // matched by exclusion rather than by position.
  const userInfo = useMemo(
    () =>
      conversationinfo.usersWithInfo.find(
        (flt) => flt.entityID !== authentication.user.entity_id,
      ) || null,
    [authentication.user.entity_id, conversationinfo.usersWithInfo],
  );

  const groupProfile =
    conversationinfo.conversationInfo?.profile &&
    conversationinfo.conversationInfo.profile !== "N/A"
      ? conversationinfo.conversationInfo.profile
      : null;

  const renderUserAvatar = (
    userID: string,
    fullName: string,
    profile?: string | null,
    size = 40,
    entityType?: string | null,
    // The group-member lists pass it too. Membership alone does not put someone
    // in your presence scope - the server excludes group co-members on purpose
    // - but a co-member who is ALSO a contact or a DM counterpart is in it for
    // that reason, and those are exactly the people whose dot a reader expects
    // to see in a member list.
    entityId?: string | null,
  ) => (
    <Avatar
      id={userID}
      entityId={entityId}
      name={fullName}
      src={profile && profile !== "none" ? profile : undefined}
      size={size}
      kind={entityType}
    />
  );

  return (
    <Modal
      component={
        <div className="div_modal_container cl-conversation-info-modal tw-max-w-[800px] tw-items-center">
          <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-pl-[10px] tw-pr-[10px] tw-pt-[7px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
            <span className="cl-text-body tw-font-semibold tw-flex tw-flex-1">
              {isSingle
                ? "Conversation"
                : conversationinfo.type === "channel"
                  ? "Channel"
                  : "Group Chat"}
            </span>
            <button
              onClick={() => {
                onclose(false);
              }}
              aria-label="Close"
              className="cl-conversation-info-modal-close tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
            >
              <IoMdClose style={{ fontSize: "17px" }} />
            </button>
          </div>
          {/* Narrow: one column that scrolls as a whole (files under members).
              lg: two columns, each scrolling on its own. */}
          <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-flex tw-flex-1 tw-min-h-0 tw-flex-col lg:tw-flex-row tw-pl-[10px] tw-pr-[10px] tw-overflow-y-auto lg:tw-overflow-y-hidden thinscroller">
            <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-none lg:tw-flex-1 tw-items-center lg:tw-min-h-0 lg:tw-overflow-y-auto thinscroller">
              <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-p-[10px] tw-flex tw-flex-col tw-items-center tw-gap-[10px]">
                {isSingle ? (
                  <>
                    <div className="tw-w-full tw-max-w-[120px] tw-h-[120px] tw-flex tw-items-center tw-justify-center">
                      {renderUserAvatar(
                        userInfo?.userID || "conversation-user",
                        userInfo ? fullNameOf(userInfo.fullname) : "Conversation",
                        userInfo?.profile,
                        120,
                        userInfo?.entityType,
                        userInfo?.entityID,
                      )}
                    </div>
                    <span className="cl-text-body tw-font-Inter tw-font-semibold tw-flex tw-items-center tw-gap-[4px]">
                      {userInfo ? fullNameOf(userInfo.fullname) : "Conversation"}
                      {userInfo?.isVerified && (
                        <RiVerifiedBadgeFill
                          size={16}
                          color="var(--brand)"
                          style={{ flex: "none" }}
                        />
                      )}
                      <PageFlag realmType={userInfo?.realmType} size={14} />
                      <BotFlag type={userInfo?.entityType} size={14} />
                    </span>
                  </>
                ) : (
                  <>
                    {conversationinfo.type === "channel" ? (
                      <FaHashtag style={{ fontSize: "120px" }} />
                    ) : (
                      <div className="tw-w-full tw-max-w-[120px] tw-h-[120px] tw-flex tw-items-center tw-justify-center">
                        <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-rounded-[120px] div_conversationinfomodalimg">
                          <CachedImage
                            src={
                              groupProfile ??
                              (conversationinfo.type === "server"
                                ? ServerIcon
                                : GroupChatIcon)
                            }
                            id={groupProfile ? "img_actual_profile_main" : ""}
                            className={groupProfile ? "" : "img_gc_profiles_ntfs"}
                          />
                        </div>
                      </div>
                    )}
                    <span className="cl-text-body tw-font-Inter tw-font-semibold">
                      {conversationinfo.conversationInfo?.groupName}
                    </span>
                  </>
                )}
              </div>
              <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-items-start">
                <button
                  onClick={() => {
                    settoggleMemberDropper(!toggleMemberDropper);
                  }}
                  className="cl-conversation-info-modal-members tw-font-Inter tw-border-[0px] tw-h-[35px] cl-text-body tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
                  style={{ color: "var(--text)" }}
                >
                  <span className="cl-conversation-info-modal-members__label">
                    Members
                  </span>
                </button>
                <motion.div
                  initial={{
                    height: "0px",
                  }}
                  animate={{
                    height: toggleMemberDropper ? "auto" : "0px",
                  }}
                  className="tw-w-[calc(100%-40px)] tw-flex tw-gap-[5px] tw-flex-col tw-overflow-y-hidden tw-bg-transparent tw-items-start tw-pl-[20px] tw-pr-[20px]"
                >
                  {conversationinfo.usersWithInfo.map(
                    (mp: UserWithInfoConversationInterface, i: number) => {
                      const name = fullNameOf(mp.fullname);
                      return (
                        <div
                          key={mp.entityID || i}
                          onClick={() => {
                            navigate(`/${mp.userID}`);
                          }}
                          className="cl-conversation-info-modal-member tw-w-full tw-rounded-[6px] tw-flex tw-flex-none tw-items-center tw-gap-[10px] tw-select-none tw-cursor-pointer"
                          style={{ padding: "6px 8px", minHeight: 44 }}
                        >
                          <div
                            id="div_img_search_profiles_container_cncts"
                            className="tw-flex-none"
                          >
                            {renderUserAvatar(
                              mp.userID,
                              name,
                              mp.profile,
                              36,
                              mp.entityType,
                              mp.entityID,
                            )}
                          </div>
                          <div className="tw-flex tw-flex-1 tw-min-w-0 tw-items-center tw-gap-[4px] span_userdetails_ellipsis">
                            <span className="tw-min-w-0 tw-truncate cl-text-body-sm tw-text-left">
                              {name}
                            </span>
                            {mp.isVerified && (
                              <RiVerifiedBadgeFill
                                size={14}
                                color="var(--brand)"
                                style={{ flex: "none" }}
                              />
                            )}
                            <PageFlag realmType={mp.realmType} size={12} />
                            <BotFlag type={mp.entityType} size={12} />
                          </div>
                        </div>
                      );
                    },
                  )}
                </motion.div>
              </div>
            </div>
            <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-none lg:tw-flex-1 tw-p-[10px] tw-pr-[0px] tw-pt-[0px] lg:tw-min-h-0 lg:tw-overflow-y-auto thinscroller">
              <ConversationFilesPanel
                conversationID={conversationID}
                conversationType={conversationType}
              />
            </div>
          </div>
        </div>
      }
    />
  );
}

export default ConversationInfoModal;
