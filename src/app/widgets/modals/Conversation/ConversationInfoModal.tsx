/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Modal from "@/app/reusables/Modal";
import { ConversationInfoModalProp } from "@/reusables/vars/props";
import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import DefaultProfile from "../../../../assets/imgs/default.png";
import GroupChatIcon from "../../../../assets/imgs/group-chat-icon.jpg";
import ServerIcon from "../../../../assets/imgs/servericon.png";
import { useSelector } from "react-redux";
import {
  AuthenticationInterface,
  ConversationFilesInterface,
  IContact,
  UserWithInfoConversationInterface,
  UsersInConversation,
} from "@/reusables/vars/interfaces";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IoCheckmark, IoClose, IoDocumentOutline } from "react-icons/io5";
import { MdOutlineGroupAdd } from "react-icons/md";
import {
  AddNewMemberRequest,
  ContactsListReusableRequest,
  GetMembersListInServer,
} from "@/reusables/hooks/requests";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaHashtag } from "react-icons/fa6";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { timeSince } from "@/reusables/hooks/reusable";

function ConversationInfoModal({
  conversationinfo,
  onclose,
}: ConversationInfoModalProp) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const navigate = useNavigate();

  const [toggleMemberDropper, settoggleMemberDropper] = useState<boolean>(true);
  const [toggledfiles, settoggledfiles] = useState<string>("media");

  const [contactslist, setcontactslist] = useState<any[]>([]);
  const [searchFilter, _] = useState("");
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [expandcontacts, setexpandcontacts] = useState<boolean>(false);
  const [markedMembers, setmarkedMembers] = useState<any[]>([]);

  const valueToArrayChecker = (userID: any) => {
    const userIDExistInArray = markedMembers.filter(
      (flt: any) => flt.id == userID,
    );

    return userIDExistInArray.length > 0 ? true : false;
  };

  const removeFromList = (userID: any) => {
    const userIDnotSimilar = markedMembers.filter(
      (flt: any) => flt.id != userID,
    );

    setmarkedMembers(userIDnotSimilar);
  };

  const GetContactsListProcess = (bool: boolean) => {
    setexpandcontacts(bool);
    if (bool) {
      if (conversationinfo.type === "server") {
        if (conversationinfo.conversationInfo?.serverID) {
          GetMembersListInServer(
            conversationinfo.conversationInfo.serverID,
            setcontactslist,
            setisLoading,
          );
        }
      } else {
        ContactsListReusableRequest(setcontactslist, setisLoading);
      }
    }
  };

  const AddNewMemberProcess = () => {
    const initialpayload = {
      conversationID: conversationinfo.conversationInfo?.groupID,
      memberstoadd: markedMembers,
      receivers: [...markedMembers.map((mp) => mp.id)],
    };
    AddNewMemberRequest(initialpayload)
      .then((response) => {
        if (response.data.status) {
          setmarkedMembers([]);
          setexpandcontacts(false);
          // console.log(response.data);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const userInfo = useMemo(() => {
    const info = conversationinfo.usersWithInfo.filter(
      (flt) => flt._id !== authentication.user.userID,
    );

    if (info.length > 0) {
      return info[0];
    }

    return null;
  }, [authentication.user.userID, conversationinfo.usersWithInfo]);

  return (
    <Modal
      component={
        <div className="div_modal_container tw-max-w-[800px] tw-max-h-[550px] tw-items-center">
          <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-pl-[10px] tw-pr-[10px] tw-pt-[7px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
            {conversationinfo.type == "single" ? (
              <span className="tw-text-[14px] tw-font-semibold tw-flex tw-flex-1">
                Conversation
              </span>
            ) : (
              <span className="tw-text-[14px] tw-font-semibold tw-flex tw-flex-1">
                {conversationinfo.type === "server" ? "Channel" : "Group Chat"}
              </span>
            )}
            <button
              onClick={() => {
                onclose(false);
              }}
              className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
            >
              <IoMdClose style={{ fontSize: "17px" }} />
            </button>
          </div>
          {conversationinfo.type === "single" ? (
            <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-flex tw-h-[calc(100%-70px)] tw-flex-col lg:tw-flex-row tw-flex-1 tw-pl-[10px] tw-pr-[10px] tw-overflow-y-scroll lg:tw-overflow-y-none thinscroller">
              <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-items-center tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-p-[10px] tw-flex tw-flex-col tw-items-center tw-gap-[10px]">
                  <div className="tw-w-full tw-max-w-[120px] tw-h-[120px] tw-flex tw-items-center tw-justify-center">
                    <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-rounded-[120px] div_conversationinfomodalimg">
                      <CachedImage
                        src={
                          userInfo?.profile !== "none"
                            ? userInfo?.profile
                            : DefaultProfile
                        }
                        className={
                          userInfo?.profile == "none"
                            ? "img_search_profiles_ntfs"
                            : "tw-w-full tw-h-full tw-rounded-full"
                        }
                      />
                    </div>
                  </div>
                  <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                    {
                      conversationinfo.usersWithInfo.filter(
                        (flt: any) => flt.userID !== authentication.user.userID,
                      )[0].fullname.firstName
                    }
                    {conversationinfo.usersWithInfo.filter(
                      (flt: any) => flt.userID !== authentication.user.userID,
                    )[0].fullname.middleName !== "N/A"
                      ? ` ${
                          conversationinfo.usersWithInfo.filter(
                            (flt: any) =>
                              flt.userID !== authentication.user.userID,
                          )[0].fullname.middleName
                        } `
                      : " "}
                    {
                      conversationinfo.usersWithInfo.filter(
                        (flt: any) => flt.userID !== authentication.user.userID,
                      )[0].fullname.lastName
                    }
                  </span>
                </div>
                <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-items-start">
                  <button
                    onClick={() => {
                      settoggleMemberDropper(!toggleMemberDropper);
                    }}
                    className="tw-font-Inter tw-border-[0px] tw-h-[35px] tw-text-[14px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
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
                    {conversationinfo.usersWithInfo.map(
                      (mp: UserWithInfoConversationInterface, i: number) => {
                        return (
                          <div
                            key={i}
                            onClick={() => {
                              navigate(`/${mp.userID}`);
                            }}
                            className="tw-w-[calc(100%-10px)] hover:tw-bg-[#f0f0f0] tw-rounded-[4px] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px] tw-select-none tw-cursor-pointer"
                          >
                            <div id="div_img_search_profiles_container_cncts">
                              <CachedImage
                                src={
                                  mp.profile == "none"
                                    ? DefaultProfile
                                    : mp.profile
                                }
                                className={
                                  mp.profile == "none"
                                    ? "img_search_profiles_ntfs"
                                    : ""
                                }
                                id={
                                  mp.profile == "none"
                                    ? ""
                                    : "img_actual_profile"
                                }
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
              <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-p-[10px] tw-pr-[0px] tw-pt-[0px]">
                <div className="tw-w-full tw-flex tw-items-center tw-h-[30px] tw-pb-[5px]">
                  <motion.button
                    onClick={() => {
                      settoggledfiles("media");
                    }}
                    animate={{
                      borderColor:
                        toggledfiles === "media" ? "black" : "transparent",
                    }}
                    className="tw-font-Inter tw-border-[0px] tw-border-b-[2px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
                  >
                    Media
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      settoggledfiles("audio");
                    }}
                    animate={{
                      borderColor:
                        toggledfiles === "audio" ? "black" : "transparent",
                    }}
                    className="tw-font-Inter tw-border-[0px] tw-border-b-[2px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
                  >
                    Audio
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      settoggledfiles("files");
                    }}
                    animate={{
                      borderColor:
                        toggledfiles === "files" ? "black" : "transparent",
                    }}
                    className="tw-font-Inter tw-border-[0px] tw-border-b-[2px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
                  >
                    Files
                  </motion.button>
                </div>
                {toggledfiles === "media" && (
                  <div className="tw-bg-transparent tw-flex tw-flex-wrap tw-flex-row tw-gap-[2px] tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                    {conversationinfo.conversationfiles.map(
                      (mp: ConversationFilesInterface, i: number) => {
                        if (mp.fileDetails.data) {
                          if (mp.fileType.includes("image")) {
                            return (
                              <CachedImage
                                key={i}
                                src={mp.fileDetails.data}
                                className="tw-w-full tw-flex tw-flex-1 tw-max-h-[150px] tw-object-cover tw-bg-black"
                              />
                            );
                          } else if (mp.fileType.includes("video")) {
                            // console.log(mp.fileDetails.data.split("%%")[0])
                            return (
                              <video
                                controls
                                key={i}
                                src={mp.fileDetails.data
                                  .split("%%%")[0]
                                  .replace("###", "%23%23%23")}
                                className="tw-w-full tw-flex tw-flex-1 tw-max-h-[200px] tw-object-cover tw-bg-black"
                              />
                            );
                          }
                        }
                      },
                    )}
                  </div>
                )}
                {toggledfiles === "audio" && (
                  <div className="tw-bg-transparent tw-flex tw-flex-wrap tw-flex-row tw-gap-[5px] tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                    {conversationinfo.conversationfiles.map(
                      (mp: ConversationFilesInterface, i: number) => {
                        if (mp.fileDetails.data) {
                          if (mp.fileType.includes("audio")) {
                            return (
                              <div
                                key={i}
                                className="tw-w-full"
                                title={
                                  mp.dateUploaded.time
                                    ? `${mp.dateUploaded.date} ${mp.dateUploaded.time}`
                                    : timeSince(mp.dateUploaded.date)
                                }
                              >
                                <audio
                                  src={mp.fileDetails.data
                                    .split("%%%")[0]
                                    .replace("###", "%23%23%23")}
                                  controls
                                  className="tw-w-full tw-border-[7px]"
                                />
                              </div>
                            );
                          }
                        }
                      },
                    )}
                  </div>
                )}
                {toggledfiles === "files" && (
                  <div className="tw-bg-transparent tw-flex tw-flex-wrap tw-flex-row tw-gap-[5px] tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                    {conversationinfo.conversationfiles.map(
                      (mp: ConversationFilesInterface, i: number) => {
                        if (mp.fileDetails.data) {
                          if (
                            !mp.fileType.includes("image") &&
                            !mp.fileType.includes("video") &&
                            !mp.fileType.includes("audio")
                          ) {
                            return (
                              <div
                                key={i}
                                onClick={() => {
                                  window.open(
                                    mp.fileDetails.data
                                      .split("%%%")[0]
                                      .replace("###", "%23%23%23"),
                                    "_blank",
                                  );
                                }}
                                className="tw-w-[calc(100%-20px)] tw-h-[70px] tw-bg-[#e4e4e4] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px]"
                                title={
                                  mp.dateUploaded.time
                                    ? `${mp.dateUploaded.date} ${mp.dateUploaded.time}`
                                    : timeSince(mp.dateUploaded.date)
                                }
                              >
                                <div className="tw-w-full tw-max-w-[40px]">
                                  <IoDocumentOutline
                                    style={{ fontSize: "40px" }}
                                  />
                                </div>
                                <span className="tw-text-[12px] tw-break-all ellipsis-3-lines tw-font-semibold tw-text-left">
                                  {mp.fileDetails.data.split("%%%")[1]}
                                </span>
                              </div>
                            );
                          }
                        }
                      },
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-flex tw-h-[calc(100%-70px)] tw-flex-col lg:tw-flex-row tw-flex-1 tw-pl-[10px] tw-pr-[10px] tw-overflow-y-scroll lg:tw-overflow-y-none thinscroller">
              <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-items-center tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                <div className="tw-bg-transparent tw-w-[calc(100%-20px)] tw-p-[10px] tw-flex tw-flex-col tw-items-center tw-gap-[10px]">
                  {conversationinfo.type === "server" ? (
                    <FaHashtag style={{ fontSize: "120px" }} />
                  ) : (
                    <div className="tw-w-full tw-max-w-[120px] tw-h-[120px] tw-flex tw-items-center tw-justify-center">
                      <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-rounded-[120px] div_conversationinfomodalimg">
                        <CachedImage
                          src={
                            conversationinfo.conversationInfo &&
                            conversationinfo.conversationInfo?.profile &&
                            conversationinfo.conversationInfo?.profile !== "N/A"
                              ? conversationinfo.conversationInfo?.profile
                              : conversationinfo.type === "server"
                                ? ServerIcon
                                : GroupChatIcon
                          }
                          id={
                            conversationinfo.conversationInfo &&
                            conversationinfo.conversationInfo?.profile &&
                            conversationinfo.conversationInfo?.profile !== "N/A"
                              ? "img_actual_profile_main"
                              : ""
                          }
                          className={
                            conversationinfo.conversationInfo &&
                            conversationinfo.conversationInfo?.profile &&
                            conversationinfo.conversationInfo?.profile !== "N/A"
                              ? ""
                              : "img_gc_profiles_ntfs"
                          }
                        />
                      </div>
                    </div>
                  )}
                  <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                    {conversationinfo.conversationInfo?.groupName}
                  </span>
                </div>
                <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-items-start">
                  <button
                    onClick={() => {
                      settoggleMemberDropper(!toggleMemberDropper);
                    }}
                    className="tw-font-Inter tw-border-[0px] tw-h-[35px] tw-text-[14px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
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
                    {conversationinfo.is_admin &&
                      (conversationinfo.conversationInfo?.type === "server" ? (
                        conversationinfo.conversationInfo?.privacy && (
                          <div
                            onClick={() => {
                              GetContactsListProcess(!expandcontacts);
                            }}
                            className="tw-w-[calc(100%-10px)] hover:tw-bg-[#f0f0f0] tw-rounded-[4px] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px] tw-select-none tw-cursor-pointer"
                          >
                            <div
                              id="div_img_search_profiles_container_cncts"
                              className="tw-bg-transparent tw-border-transparent"
                            >
                              {expandcontacts ? (
                                <IoClose style={{ fontSize: "20px" }} />
                              ) : (
                                <MdOutlineGroupAdd
                                  style={{ fontSize: "20px" }}
                                />
                              )}
                            </div>
                            <div className="tw-flex tw-flex-1 span_userdetails_ellipsis">
                              <span className="tw-flex tw-flex-1 tw-text-[13px]">
                                {expandcontacts ? "Close list" : "Add a user"}
                              </span>
                            </div>
                          </div>
                        )
                      ) : (
                        <div
                          onClick={() => {
                            GetContactsListProcess(!expandcontacts);
                          }}
                          className="tw-w-[calc(100%-10px)] hover:tw-bg-[#f0f0f0] tw-rounded-[4px] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px] tw-select-none tw-cursor-pointer"
                        >
                          <div
                            id="div_img_search_profiles_container_cncts"
                            className="tw-bg-transparent tw-border-transparent"
                          >
                            {expandcontacts ? (
                              <IoClose style={{ fontSize: "20px" }} />
                            ) : (
                              <MdOutlineGroupAdd style={{ fontSize: "20px" }} />
                            )}
                          </div>
                          <div className="tw-flex tw-flex-1 span_userdetails_ellipsis">
                            <span className="tw-flex tw-flex-1 tw-text-[13px]">
                              {expandcontacts ? "Close list" : "Add a user"}
                            </span>
                          </div>
                        </div>
                      ))}
                    {markedMembers.length > 0 && expandcontacts && (
                      <div
                        onClick={() => {
                          AddNewMemberProcess();
                        }}
                        className="tw-w-[calc(100%-10px)] hover:tw-text-white hover:tw-bg-[#1c7def] tw-rounded-[4px] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px] tw-select-none tw-cursor-pointer"
                      >
                        <div
                          id="div_img_search_profiles_container_cncts"
                          className="tw-bg-transparent tw-border-transparent"
                        >
                          <IoCheckmark style={{ fontSize: "20px" }} />
                        </div>
                        <div className="tw-flex tw-flex-1 span_userdetails_ellipsis">
                          <span className="tw-flex tw-flex-1 tw-text-[13px]">
                            Apply
                          </span>
                        </div>
                      </div>
                    )}
                    <motion.div
                      className="tw-w-full tw-flex tw-flex-col"
                      initial={{
                        height: "0px",
                      }}
                      animate={{
                        height: expandcontacts ? "400px" : "0px",
                      }}
                    >
                      {isLoading ? (
                        <div className="tw-w-full tw-flex tw-overflow-y-hidden tw-h-[400px] tw-items-center tw-justify-center">
                          <motion.div
                            animate={{
                              rotate: -360,
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                            }}
                            id="div_loader_request"
                          >
                            <AiOutlineLoading3Quarters
                              style={{ fontSize: "28px" }}
                            />
                          </motion.div>
                        </div>
                      ) : (
                        <motion.div
                          id="div_contacts_select_container"
                          className="scroller tw-h-[400px]"
                          // animate={{
                          //     maxHeight: markedMembers.length > 0 ? "calc(100% - 520px)" : "calc(100% - 440px)"
                          // }}
                        >
                          <div className="tw-w-full tw-flex tw-flex-col tw-h-auto">
                            {contactslist.map(
                              (cnts: IContact | any, i: number) => {
                                if (conversationinfo.type === "server") {
                                  const fullNameFilter = `${
                                    cnts.fullname.firstName
                                  }${
                                    cnts.fullname.middleName == "N/A"
                                      ? ""
                                      : ` ${cnts.fullname.middleName}`
                                  } ${cnts.fullname.lastName}`;
                                  const checkmemberslist =
                                    conversationinfo.users.map(
                                      (mp: UsersInConversation) => mp._id,
                                    );
                                  if (!checkmemberslist.includes(cnts._id)) {
                                    if (fullNameFilter.includes(searchFilter)) {
                                      return (
                                        <motion.div
                                          whileHover={{
                                            backgroundColor: "#e6e6e6",
                                          }}
                                          key={i}
                                          className="div_cncts_cards"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={valueToArrayChecker(
                                              cnts._id,
                                            )}
                                            onChange={() => {
                                              if (
                                                !valueToArrayChecker(cnts._id)
                                              ) {
                                                setmarkedMembers([
                                                  ...markedMembers,
                                                  {
                                                    id: cnts._id,
                                                    userID: cnts.userID,
                                                    fullName: `${
                                                      cnts.fullname.firstName
                                                    }${
                                                      cnts.fullname
                                                        .middleName == "N/A"
                                                        ? ""
                                                        : ` ${cnts.fullname.middleName}`
                                                    } ${
                                                      cnts.fullname.lastName
                                                    }`,
                                                  },
                                                ]);
                                              } else {
                                                removeFromList(cnts._id);
                                              }
                                            }}
                                            className="checkbox_selector_people"
                                          />
                                          <div id="div_img_cncts_container">
                                            <div id="div_img_search_profiles_container_cncts">
                                              <CachedImage
                                                src={
                                                  cnts.profile == "none"
                                                    ? DefaultProfile
                                                    : cnts.profile
                                                }
                                                className={
                                                  cnts.profile == "none"
                                                    ? "img_search_profiles_ntfs"
                                                    : ""
                                                }
                                                id={
                                                  cnts.profile == "none"
                                                    ? ""
                                                    : "img_actual_profile"
                                                }
                                              />
                                            </div>
                                          </div>
                                          <div className="div_contact_fullname_container">
                                            <span className="tw-flex tw-flex-1 tw-text-[13px]">
                                              {cnts.fullname.firstName}
                                              {cnts.fullname.middleName == "N/A"
                                                ? ""
                                                : ` ${cnts.fullname.middleName}`}{" "}
                                              {cnts.fullname.lastName}
                                            </span>
                                          </div>
                                        </motion.div>
                                      );
                                    } else {
                                      return null;
                                    }
                                  }
                                } else {
                                  if (cnts.type == "single") {
                                    if (cnts.action_by && cnts.involved_user) {
                                      if (
                                        cnts.action_by.id ===
                                          authentication.user.userID &&
                                        conversationinfo.usersWithInfo.filter(
                                          (flt: any) =>
                                            flt._id === cnts.involved_user.id,
                                        ).length === 0
                                      ) {
                                        const checkmemberslist =
                                          conversationinfo.users.map(
                                            (mp: UsersInConversation) => mp._id,
                                          );
                                        if (
                                          checkmemberslist.includes(
                                            cnts.involved_user.id,
                                          )
                                        ) {
                                          return null;
                                        }
                                        const fullNameFilter = `${
                                          cnts.involved_user.first_name
                                        }${
                                          cnts.involved_user.middle_name ==
                                          "N/A"
                                            ? ""
                                            : ` ${cnts.involved_user.middle_name}`
                                        } ${cnts.involved_user.last_name}`;
                                        if (
                                          fullNameFilter.includes(searchFilter)
                                        ) {
                                          return (
                                            <motion.div
                                              whileHover={{
                                                backgroundColor: "#e6e6e6",
                                              }}
                                              key={i}
                                              className="div_cncts_cards"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={valueToArrayChecker(
                                                  cnts.involved_user.id,
                                                )}
                                                onChange={() => {
                                                  if (
                                                    !valueToArrayChecker(
                                                      cnts.involved_user.id,
                                                    )
                                                  ) {
                                                    setmarkedMembers([
                                                      ...markedMembers,
                                                      {
                                                        id: cnts.involved_user
                                                          .id,
                                                        userID:
                                                          cnts.involved_user
                                                            .username,
                                                        fullName: `${
                                                          cnts.involved_user
                                                            .first_name
                                                        }${
                                                          cnts.involved_user
                                                            .middle_name ==
                                                          "N/A"
                                                            ? ""
                                                            : ` ${cnts.involved_user.middle_name}`
                                                        } ${
                                                          cnts.involved_user
                                                            .last_name
                                                        }`,
                                                      },
                                                    ]);
                                                  } else {
                                                    removeFromList(
                                                      cnts.involved_user.id,
                                                    );
                                                  }
                                                }}
                                                className="checkbox_selector_people"
                                              />
                                              <div id="div_img_cncts_container">
                                                <div id="div_img_search_profiles_container_cncts">
                                                  <CachedImage
                                                    src={
                                                      cnts.involved_user
                                                        .profile == "none"
                                                        ? DefaultProfile
                                                        : cnts.involved_user
                                                            .profile
                                                    }
                                                    className={
                                                      cnts.involved_user
                                                        .profile == "none"
                                                        ? "img_search_profiles_ntfs"
                                                        : ""
                                                    }
                                                    id={
                                                      cnts.involved_user
                                                        .profile == "none"
                                                        ? ""
                                                        : "img_actual_profile"
                                                    }
                                                  />
                                                </div>
                                              </div>
                                              <div className="div_contact_fullname_container">
                                                <span className="tw-flex tw-flex-1 tw-text-[13px]">
                                                  {
                                                    cnts.involved_user
                                                      .first_name
                                                  }
                                                  {cnts.involved_user
                                                    .middle_name == "N/A"
                                                    ? ""
                                                    : ` ${cnts.involved_user.middle_name}`}{" "}
                                                  {cnts.involved_user.last_name}
                                                </span>
                                              </div>
                                            </motion.div>
                                          );
                                        } else {
                                          return null;
                                        }
                                      } else {
                                        const checkmemberslist =
                                          conversationinfo.users.map(
                                            (mp: UsersInConversation) => mp._id,
                                          );
                                        if (
                                          checkmemberslist.includes(
                                            cnts.action_by.id,
                                          )
                                        ) {
                                          return null;
                                        }
                                        if (
                                          conversationinfo.usersWithInfo.filter(
                                            (flt: any) =>
                                              flt._id === cnts.action_by.id,
                                          ).length === 0
                                        ) {
                                          const fullNameFilter = `${
                                            cnts.action_by.first_name
                                          }${
                                            cnts.action_by.middle_name == "N/A"
                                              ? ""
                                              : ` ${cnts.action_by.middle_name}`
                                          } ${cnts.action_by.last_name}`;
                                          if (
                                            fullNameFilter.includes(
                                              searchFilter,
                                            )
                                          ) {
                                            return (
                                              <motion.div
                                                whileHover={{
                                                  backgroundColor: "#e6e6e6",
                                                }}
                                                key={i}
                                                className="div_cncts_cards"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={valueToArrayChecker(
                                                    cnts.action_by.id,
                                                  )}
                                                  onChange={() => {
                                                    if (
                                                      !valueToArrayChecker(
                                                        cnts.action_by.id,
                                                      )
                                                    ) {
                                                      setmarkedMembers([
                                                        ...markedMembers,
                                                        {
                                                          id: cnts.action_by.id,
                                                          userID:
                                                            cnts.action_by
                                                              .username,
                                                          fullName: `${
                                                            cnts.action_by
                                                              .first_name
                                                          }${
                                                            cnts.action_by
                                                              .middle_name ==
                                                            "N/A"
                                                              ? ""
                                                              : ` ${cnts.action_by.middle_name}`
                                                          } ${
                                                            cnts.action_by
                                                              .last_name
                                                          }`,
                                                        },
                                                      ]);
                                                    } else {
                                                      removeFromList(
                                                        cnts.action_by.id,
                                                      );
                                                    }
                                                  }}
                                                  className="checkbox_selector_people"
                                                />
                                                <div id="div_img_cncts_container">
                                                  <div id="div_img_search_profiles_container_cncts">
                                                    <CachedImage
                                                      src={
                                                        cnts.action_by
                                                          .profile == "none"
                                                          ? DefaultProfile
                                                          : cnts.action_by
                                                              .profile
                                                      }
                                                      className={
                                                        cnts.action_by
                                                          .profile == "none"
                                                          ? "img_search_profiles_ntfs"
                                                          : ""
                                                      }
                                                      id={
                                                        cnts.action_by
                                                          .profile == "none"
                                                          ? ""
                                                          : "img_actual_profile"
                                                      }
                                                    />
                                                  </div>
                                                </div>
                                                <div className="div_contact_fullname_container">
                                                  <span className="tw-flex tw-flex-1 tw-text-[13px]">
                                                    {cnts.action_by.first_name}
                                                    {cnts.action_by
                                                      .middle_name == "N/A"
                                                      ? ""
                                                      : ` ${cnts.action_by.middle_name}`}{" "}
                                                    {cnts.action_by.last_name}
                                                  </span>
                                                </div>
                                              </motion.div>
                                            );
                                          } else {
                                            return null;
                                          }
                                        }
                                      }
                                    } else {
                                      return null;
                                    }
                                  } else {
                                    return null;
                                  }
                                }
                              },
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                    {conversationinfo.usersWithInfo.map(
                      (mp: UserWithInfoConversationInterface, i: number) => {
                        return (
                          <div
                            key={i}
                            onClick={() => {
                              navigate(`/${mp.userID}`);
                            }}
                            className="tw-w-[calc(100%-10px)] hover:tw-bg-[#f0f0f0] tw-rounded-[4px] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px] tw-select-none tw-cursor-pointer"
                          >
                            <div id="div_img_search_profiles_container_cncts">
                              <CachedImage
                                src={
                                  mp.profile == "none"
                                    ? DefaultProfile
                                    : mp.profile
                                }
                                className={
                                  mp.profile == "none"
                                    ? "img_search_profiles_ntfs"
                                    : ""
                                }
                                id={
                                  mp.profile == "none"
                                    ? ""
                                    : "img_actual_profile"
                                }
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
              <div className="tw-bg-transparent tw-flex tw-flex-col tw-flex-1 tw-p-[10px] tw-pr-[0px] tw-pt-[0px]">
                <div className="tw-w-full tw-flex tw-items-center tw-h-[30px] tw-pb-[5px]">
                  <motion.button
                    onClick={() => {
                      settoggledfiles("media");
                    }}
                    animate={{
                      borderColor:
                        toggledfiles === "media" ? "black" : "transparent",
                    }}
                    className="tw-font-Inter tw-border-[0px] tw-border-b-[2px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
                  >
                    Media
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      settoggledfiles("audio");
                    }}
                    animate={{
                      borderColor:
                        toggledfiles === "audio" ? "black" : "transparent",
                    }}
                    className="tw-font-Inter tw-border-[0px] tw-border-b-[2px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
                  >
                    Audio
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      settoggledfiles("files");
                    }}
                    animate={{
                      borderColor:
                        toggledfiles === "files" ? "black" : "transparent",
                    }}
                    className="tw-font-Inter tw-border-[0px] tw-border-b-[2px] tw-p-[5px] tw-font-semibold tw-min-w-[70px] tw-bg-transparent tw-cursor-pointer"
                  >
                    Files
                  </motion.button>
                </div>
                {toggledfiles === "media" && (
                  <div className="tw-bg-transparent tw-flex tw-flex-wrap tw-flex-row tw-gap-[2px] tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                    {conversationinfo.conversationfiles.map(
                      (mp: ConversationFilesInterface, i: number) => {
                        if (mp.fileDetails.data) {
                          if (mp.fileType.includes("image")) {
                            return (
                              <CachedImage
                                key={i}
                                src={mp.fileDetails.data}
                                className="tw-w-full tw-flex tw-flex-1 tw-max-h-[150px] tw-object-cover tw-bg-black"
                              />
                            );
                          } else if (mp.fileType.includes("video")) {
                            // console.log(mp.fileDetails.data.split("%%")[0])
                            return (
                              <video
                                controls
                                key={i}
                                src={mp.fileDetails.data
                                  .split("%%%")[0]
                                  .replace("###", "%23%23%23")}
                                className="tw-w-full tw-flex tw-flex-1 tw-max-h-[200px] tw-object-cover tw-bg-black"
                              />
                            );
                          }
                        }
                      },
                    )}
                  </div>
                )}
                {toggledfiles === "audio" && (
                  <div className="tw-bg-transparent tw-flex tw-flex-wrap tw-flex-row tw-gap-[5px] tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                    {conversationinfo.conversationfiles.map(
                      (mp: ConversationFilesInterface, i: number) => {
                        if (mp.fileDetails.data) {
                          if (mp.fileType.includes("audio")) {
                            return (
                              <div
                                key={i}
                                className="tw-w-full"
                                title={
                                  mp.dateUploaded.time
                                    ? `${mp.dateUploaded.date} ${mp.dateUploaded.time}`
                                    : timeSince(mp.dateUploaded.date)
                                }
                              >
                                <audio
                                  src={mp.fileDetails.data
                                    .split("%%%")[0]
                                    .replace("###", "%23%23%23")}
                                  controls
                                  className="tw-w-full tw-border-[7px]"
                                />
                              </div>
                            );
                          }
                        }
                      },
                    )}
                  </div>
                )}
                {toggledfiles === "files" && (
                  <div className="tw-bg-transparent tw-flex tw-flex-wrap tw-flex-row tw-gap-[5px] tw-overflow-y-none lg:tw-overflow-y-auto thinscroller">
                    {conversationinfo.conversationfiles.map(
                      (mp: ConversationFilesInterface, i: number) => {
                        if (mp.fileDetails.data) {
                          if (
                            !mp.fileType.includes("image") &&
                            !mp.fileType.includes("video") &&
                            !mp.fileType.includes("audio")
                          ) {
                            return (
                              <div
                                key={i}
                                onClick={() => {
                                  window.open(
                                    mp.fileDetails.data
                                      .split("%%%")[0]
                                      .replace("###", "%23%23%23"),
                                    "_blank",
                                  );
                                }}
                                className="tw-w-[calc(100%-20px)] tw-h-[70px] tw-bg-[#e4e4e4] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px]"
                                title={
                                  mp.dateUploaded.time
                                    ? `${mp.dateUploaded.date} ${mp.dateUploaded.time}`
                                    : timeSince(mp.dateUploaded.date)
                                }
                              >
                                <div className="tw-w-full tw-max-w-[40px]">
                                  <IoDocumentOutline
                                    style={{ fontSize: "40px" }}
                                  />
                                </div>
                                <span className="tw-text-[12px] tw-break-all ellipsis-3-lines tw-font-semibold tw-text-left">
                                  {mp.fileDetails.data.split("%%%")[1]}
                                </span>
                              </div>
                            );
                          }
                        }
                      },
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

export default ConversationInfoModal;
