/* eslint-disable @typescript-eslint/no-explicit-any */
import Modal from "@/app/reusables/Modal";
import React, { useEffect, useState } from "react";
import { BiGroup } from "react-icons/bi";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { CreateChannelRequest } from "@/reusables/hooks/requests";
import { Avatar } from "@/reusables/design";

function CreateChannelModal({
  serverID,
  setisCreateChannelToggle,
  servermemberslist,
  refreshChannelsList,
}: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  //   const contactslist = useSelector((state: any) => state.contactslist)

  const [contactslist, setcontactslist] = useState<any[]>([]); //setcontactslist
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [isSaving, setisSaving] = useState<boolean>(false);

  const [gcName, setgcName] = useState(
    `${authentication.user.fullName.firstName}'s Channel`,
  );
  const [gcprivacy, setgcprivacy] = useState(true);
  const [searchFilter, setsearchFilter] = useState("");
  const [markedMembers, setmarkedMembers] = useState<any[]>([]);
  const [channelType, setchannelType] = useState<string>("group");

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

  const processCreateGroupChat = () => {
    const markedMembersFinal = markedMembers.map((mrkd: any) => mrkd.id);
    setisSaving(true);
    CreateChannelRequest(
      {
        serverID: serverID,
        groupName: gcName,
        privacy: gcprivacy,
        otherUsers: markedMembersFinal,
        type: channelType,
      },
      setisCreateChannelToggle,
    ).then(() => {
      if (channelType === "voice") {
        setTimeout(() => {
          refreshChannelsList();
        }, 2000);
      }
    });
  };

  useEffect(() => {
    // ContactsListReusableRequest(setcontactslist, setisLoading);
    setcontactslist(servermemberslist);
    // console.log(servermemberslist);
    setisLoading(false);
  }, [servermemberslist]);

  return (
    <Modal
      component={
        <motion.div
          animate={{
            maxHeight: gcprivacy ? "700px" : "325px",
          }}
          id="div_modal_container"
        >
          {isSaving && (
            <motion.div
              style={{
                maxHeight: gcprivacy ? "700px" : "325px",
              }}
              className={`tw-z-[2] tw-absolute tw-h-[calc(98%-90px)] tw-w-[calc(98%-20px)] tw-max-w-[calc(400px-20px)] tw-bg-[var(--surface)] tw-opacity-[0.9] tw-flex tw-items-center tw-justify-center`}
            >
              <div id="div_conversation_content_loader">
                <motion.div
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                  id="div_loader_request_conv"
                >
                  <AiOutlineLoading3Quarters style={{ fontSize: "28px" }} />
                </motion.div>
              </div>
            </motion.div>
          )}
          <div className="tw-flex tw-flex-1 tw-flex-col tw-max-h-[100%] tw-bg-transparent">
            <div id="div_modal_header">
              <div id="div_server_modal_header_label">
                <BiGroup style={{ fontSize: "20px" }} />
                <span id="span_modal_header_label">Create Channel</span>
              </div>
            </div>
            <div id="div_modal_input_fields" className="scroller">
              <div id="div_modal_input_columns">
                <span id="span_input_label">Name of Channel</span>
                <input
                  id="input_gc_name"
                  value={gcName}
                  onChange={(e) => {
                    setgcName(e.target.value);
                  }}
                  type="text"
                  placeholder="Type the group chat's name"
                />
              </div>
              <div id="div_modal_input_columns">
                <span id="span_input_label">Privacy</span>
                <div id="div_toggle_switch_container">
                  <label className="switch">
                    <input
                      type="checkbox"
                      id="input_switch_server_create"
                      checked={gcprivacy}
                      onChange={(e) => {
                        setgcprivacy(e.target.checked);
                      }}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span id="span_toggle_switch_label">
                    Channel is {gcprivacy ? "Private" : "Public"}
                  </span>
                </div>
              </div>
              <div id="div_modal_input_columns">
                <span id="span_input_label">Type</span>
                <div id="div_toggle_switch_container">
                  <select
                    id="input_searchfilter"
                    className="input_dates tw-w-full tw-font-Inter"
                    value={channelType}
                    onChange={(e) => {
                      setchannelType(e.target.value);
                    }}
                  >
                    <option value="group" defaultValue={"group"}>
                      Text Channel
                    </option>
                    <option value="voice">Voice Channel</option>
                  </select>
                  {/* <span id="span_toggle_switch_label">
                    Channel is {channelType}
                  </span> */}
                </div>
              </div>
              <div id="div_modal_input_columns_add_people">
                {gcprivacy && (
                  <React.Fragment>
                    <div id="div_input_filter_container">
                      <span id="span_input_label">Add People</span>
                      <input
                        id="input_searchfilter"
                        value={searchFilter}
                        onChange={(e) => {
                          setsearchFilter(e.target.value);
                        }}
                        type="text"
                        placeholder="Type a name of a user"
                      />
                    </div>
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
                          <div key={i} className="div_selected_server_holder">
                            <span className="span_selected_label">
                              {mrkm.fullName}
                            </span>
                            <button
                              className="btn_remove_selected"
                              onClick={() => {
                                removeFromList(mrkm.userID);
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
                    {isLoading ? (
                      <div className="tw-w-full tw-flex tw-flex-1 tw-items-center tw-justify-center">
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
                        className="scroller"
                        // animate={{
                        //     maxHeight: markedMembers.length > 0 ? "calc(100% - 520px)" : "calc(100% - 440px)"
                        // }}
                      >
                        <div className="tw-w-full tw-flex tw-flex-col tw-h-auto">
                          {contactslist.map((cnts: any, i: number) => {
                            if (cnts._id !== authentication.user.userID) {
                              return (
                                <motion.div
                                whileHover={{
                                  backgroundColor: "var(--surface-hover)",
                                }}
                                key={i}
                                className="div_cncts_cards"
                              >
                                  <input
                                    type="checkbox"
                                    checked={valueToArrayChecker(cnts._id)}
                                    onChange={() => {
                                      if (!valueToArrayChecker(cnts._id)) {
                                        setmarkedMembers([
                                          ...markedMembers,
                                          {
                                            id: cnts._id,
                                            userID: cnts.userID,
                                            fullName: `${
                                              cnts.fullname.firstName
                                            }${
                                              cnts.fullname.middleName == "N/A"
                                                ? ""
                                                : ` ${cnts.fullname.middleName}`
                                            } ${cnts.fullname.lastName}`,
                                          },
                                        ]);
                                      } else {
                                        removeFromList(cnts._id);
                                      }
                                    }}
                                    className="checkbox_selector_people_server"
                                  />
                                  <div id="div_img_cncts_container">
                                    <div id="div_img_search_profiles_container_cncts">
                                      <Avatar
                                        id={cnts._id}
                                        name={`${cnts.fullname.firstName} ${cnts.fullname.lastName}`}
                                        src={
                                          cnts.profile && cnts.profile !== "none"
                                            ? cnts.profile
                                            : null
                                        }
                                        size={40}
                                        style={{
                                          width: 40,
                                          height: 40,
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="div_contact_fullname_container">
                                    <span className="span_cncts_fullname_label">
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
                          })}
                        </div>
                      </motion.div>
                    )}
                  </React.Fragment>
                )}
                {isSaving ? (
                  <div className="tw-flex tw-items-center tw-justify-end tw-w-full">
                    <span className="tw-text-[12px]">Saving...</span>
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
                      <AiOutlineLoading3Quarters style={{ fontSize: "20px" }} />
                    </motion.div>
                  </div>
                ) : (
                  <div id="div_create_cancel_btns">
                    <button
                      disabled={false}
                      className="btns_create_server_cancel cl-server-accent-button"
                      onClick={() => {
                        processCreateGroupChat();
                      }}
                    >
                      Create
                    </button>
                    <button
                      className="btns_create_server_cancel"
                      onClick={() => {
                        setisCreateChannelToggle(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      }
    />
  );
}

export default CreateChannelModal;
