/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Modal from "@/app/reusables/Modal";
import { ServerInfoModalProp } from "@/reusables/vars/props";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { ServerUsersWithInfo } from "@/reusables/vars/interfaces";
import { useNavigate } from "react-router-dom";
import ServerAvatar from "@/reusables/design/ServerAvatar";
import { Avatar } from "@/reusables/design";

function ServerInfoModal({ serverdetails, onclose }: ServerInfoModalProp) {
  const navigate = useNavigate();

  const [toggleMemberDropper, settoggleMemberDropper] = useState<boolean>(true);
  const [expandcontacts, _] = useState<boolean>(false);

  const [markedMembers, setmarkedMembers] = useState<any[]>([]);

  const removeFromList = (userID: any) => {
    const userIDnotSimilar = markedMembers.filter(
      (flt: any) => flt.id != userID,
    );

    setmarkedMembers(userIDnotSimilar);
  };

  return (
    <Modal
      component={
        <div className="div_modal_container tw-max-w-[600px] tw-max-h-[550px] tw-items-center">
          <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-pl-[10px] tw-pr-[10px] tw-pt-[7px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
            <span className="tw-text-[14px] tw-font-semibold tw-flex tw-flex-1">
              Server
            </span>
            <button
              onClick={() => {
                onclose(false);
              }}
              className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer tw-text-[var(--text)]"
            >
              <IoMdClose style={{ fontSize: "17px" }} />
            </button>
          </div>
          <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-flex tw-h-[calc(100%-70px)] tw-flex-col tw-flex-1 tw-pl-[10px] tw-pr-[10px] tw-overflow-y-scroll lg:tw-overflow-y-none thinscroller">
            <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-items-center tw-overflow-y-none thinscroller">
              <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-p-[10px] tw-flex tw-flex-col tw-items-center tw-gap-[10px]">
                <div className="tw-w-full tw-max-w-[120px] tw-h-[120px] tw-flex tw-items-center tw-justify-center">
                  <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-rounded-[120px] div_conversationinfomodalimg">
                    <ServerAvatar
                      name={serverdetails.serverName}
                      src={
                        serverdetails &&
                        serverdetails.profile &&
                        serverdetails.profile !== "N/A"
                          ? serverdetails.profile
                          : null
                      }
                      size={120}
                      shape="circle"
                    />
                  </div>
                </div>
                <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                  {serverdetails.serverName}
                </span>
                {serverdetails.is_admin && (
                  <button
                    onClick={() => {
                      navigate(`/realms/${serverdetails.serverID}`);
                    }}
                    className="cl-server-accent-button tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[6px] tw-text-[12px]"
                  >
                    Manage
                  </button>
                )}
              </div>
              <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-items-start">
                <button
                  onClick={() => {
                    settoggleMemberDropper(!toggleMemberDropper);
                  }}
                  className="cl-server-info-members-label tw-font-Inter tw-border-[0px] tw-h-[35px] tw-text-[14px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
                  style={{ color: "var(--text)" }}
                >
                  Members
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
                  {expandcontacts && (
                    <motion.div
                      animate={{
                        minHeight: markedMembers.length > 0 ? "40px" : "0px",
                        height: markedMembers.length > 0 ? "40px" : "0px",
                      }}
                      id="div_selected_container"
                      className="scrollervert"
                    >
                      {markedMembers.map((mrkm: any, i: number) => {
                        return (
                          <div key={i} className="div_selected_holder">
                            <span className="span_selected_label">
                              {mrkm.fullName}
                            </span>
                            <button
                              className="btn_remove_selected"
                              onClick={() => {
                                removeFromList(mrkm.id);
                              }}
                            >
                              <IoClose
                                style={{ fontSize: "17px", color: "white" }}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                  {serverdetails.usersWithInfo.map(
                    (mp: ServerUsersWithInfo, i: number) => {
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            navigate(`/${mp.userID}`);
                          }}
                          className="tw-w-[calc(100%-10px)] hover:tw-bg-[var(--surface-hover)] tw-rounded-[8px] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px] tw-select-none tw-cursor-pointer"
                        >
                          <div id="div_img_search_profiles_container_cncts">
                            <Avatar
                              id={mp._id}
                              name={`${mp.fullname.firstName} ${mp.fullname.lastName}`}
                              src={
                                mp.profile && mp.profile !== "none"
                                  ? mp.profile
                                  : null
                              }
                              size={40}
                              style={{
                                width: 40,
                                height: 40,
                              }}
                            />
                          </div>
                          <div className="tw-flex tw-flex-1 span_userdetails_ellipsis">
                            <span className="tw-flex tw-flex-1 tw-text-[13px]">
                              {mp.fullname.firstName}
                              {mp.fullname.middleName == "N/A"
                                ? ""
                                : ` ${mp.fullname.middleName}`}{" "}
                              {mp.fullname.lastName}
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default ServerInfoModal;
