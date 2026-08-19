/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Modal from "@/app/reusables/Modal";
import { ServerInfoModalProp } from "@/reusables/vars/props";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { Fragment, useState } from "react";
import { IoClose } from "react-icons/io5";
import { BiLogOut } from "react-icons/bi";
import {
  AuthenticationInterface,
  ServerUsersWithInfo,
} from "@/reusables/vars/interfaces";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Avatar } from "@/reusables/design";
import { RemoveRealmMemberRequest } from "@/reusables/hooks/requests";
import { MdReport } from "react-icons/md";
import ReportModal from "@/app/widgets/modals/ReportModal";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import { leaveRealmPrompt } from "@/app/widgets/modals/confirmPrompts";

function ServerInfoModal({ serverdetails, onclose }: ServerInfoModalProp) {
  const navigate = useNavigate();
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [isLeaving, setisLeaving] = useState<boolean>(false);
  const [isReportOpen, setisReportOpen] = useState<boolean>(false);
  const [isLeaveConfirmOpen, setisLeaveConfirmOpen] =
    useState<boolean>(false);

  const LeaveServerProcess = () => {
    setisLeaving(true);
    RemoveRealmMemberRequest(serverdetails.serverID, [
      authentication.active_entity_context.id,
    ])
      .then((response) => {
        setisLeaving(false);
        if (response.status) {
          onclose(false);
          navigate("/servers");
        }
      })
      .catch((err) => {
        setisLeaving(false);
        console.log(err);
      });
  };

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
    <Fragment>
      {isLeaveConfirmOpen && (
        <ConfirmModal
          {...leaveRealmPrompt("server")}
          onClose={() => setisLeaveConfirmOpen(false)}
          onConfirm={() => {
            setisLeaveConfirmOpen(false);
            LeaveServerProcess();
          }}
        />
      )}
      {isReportOpen && (
        <ReportModal
          targetType="realm"
          // The server's realm id - the reports endpoint resolves a realm from
          // either its entity id or its own pk, and this screen only ever
          // holds the latter.
          targetId={serverdetails.serverID}
          title="Report this server"
          onClose={() => setisReportOpen(false)}
        />
      )}
      <Modal
        component={
        <div className="div_modal_container tw-max-w-[600px] tw-max-h-[550px] tw-items-center">
          <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-pl-[10px] tw-pr-[10px] tw-pt-[7px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
            <span className="cl-text-body tw-font-semibold tw-flex tw-flex-1">
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
                    <Avatar
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
                <span className="cl-text-body tw-font-Inter tw-font-semibold">
                  {serverdetails.serverName}
                </span>
                <div className="tw-flex tw-gap-[6px]">
                  {serverdetails.is_admin && (
                    <button
                      onClick={() => {
                        navigate(`/realms/${serverdetails.serverID}`);
                      }}
                      className="cl-server-accent-button tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[6px] cl-text-caption"
                    >
                      Manage
                    </button>
                  )}
                  {/* Between Manage and Leave: Leave is the destructive one
                      and stays last, so Report never sits where a mis-tap
                      costs you your membership. */}
                  <button
                    onClick={() => {
                      setisReportOpen(true);
                    }}
                    className="cl-server-accent-button--danger tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[6px] cl-text-caption tw-flex tw-items-center tw-justify-center tw-gap-[5px]"
                  >
                    <MdReport style={{ fontSize: "14px" }} />
                    Report
                  </button>
                  <button
                    onClick={() => setisLeaveConfirmOpen(true)}
                    disabled={isLeaving}
                    className="cl-server-accent-button--danger tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[6px] cl-text-caption tw-flex tw-items-center tw-justify-center tw-gap-[5px]"
                  >
                    <BiLogOut style={{ fontSize: "14px" }} />
                    {isLeaving ? "Leaving..." : "Leave Server"}
                  </button>
                </div>
              </div>
              <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-items-start">
                <button
                  onClick={() => {
                    settoggleMemberDropper(!toggleMemberDropper);
                  }}
                  className="cl-server-info-members-label tw-font-Inter tw-border-[0px] tw-h-[35px] cl-text-body tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
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
                  className="tw-w-[calc(100%-40px)] tw-flex tw-gap-[0px] tw-flex-col tw-overflow-y-hidden tw-bg-transparent tw-items-start tw-pl-[20px] tw-pr-[20px]"
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
                          className="tw-w-full hover:tw-bg-[var(--surface-hover)] tw-rounded-[8px] tw-flex tw-flex-none tw-items-center tw-gap-[10px] tw-select-none tw-cursor-pointer"
                          style={{ padding: "4px 10px", minHeight: 52 }}
                        >
                          <div
                            id="div_img_search_profiles_container_cncts"
                            className="tw-flex-none"
                          >
                            <Avatar
                              id={mp._id}
                              name={`${mp.fullname.firstName} ${mp.fullname.lastName}`}
                              src={
                                mp.profile && mp.profile !== "none"
                                  ? mp.profile
                                  : null
                              }
                              size={36}
                            />
                          </div>
                          <div className="tw-flex tw-flex-1 tw-min-w-0 span_userdetails_ellipsis">
                            <span className="tw-flex tw-flex-1 tw-min-w-0 tw-truncate cl-text-body-sm tw-text-left">
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
    </Fragment>
  );
}

export default ServerInfoModal;

