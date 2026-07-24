/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import "../../../styles/styles.css";
import { IoClose } from "react-icons/io5";
import { BiGroup } from "react-icons/bi";
import {
  // useDispatch,
  useSelector,
} from "react-redux";
import { motion } from "framer-motion";
import { Avatar } from "@/reusables/design/primitives2";
import {
  ContactsListReusableRequest,
  CreateServerRequest,
} from "../../../reusables/hooks/requests";
import Modal from "../../reusables/Modal";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  AuthenticationInterface,
  ContactRowData,
  IContact,
} from "@/reusables/vars/interfaces";
import { contactsToUserdetails } from "@/reusables/hooks/reusable";
// import { SET_MUTATE_ALERTS } from "@/redux/types";

function CreateServerModal({ setisCreateServerToggle }: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  //   const contactslist = useSelector((state: any) => state.contactslist)
  // const dispatch = useDispatch();

  const [contactslist, setcontactslist] = useState<IContact[]>([]);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [isSaving, setisSaving] = useState<boolean>(false);

  const [gcName, setgcName] = useState(
    `${authentication.user.fullName.firstName}'s Server`,
  );
  const [gcprivacy, setgcprivacy] = useState(true);
  const [searchFilter, setsearchFilter] = useState("");
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

  const processCreateGroupChat = () => {
    const markedMembersFinal = markedMembers.map((mrkd: any) => mrkd.id);
    // console.log(markedMembersFinal);
    setisSaving(true);
    CreateServerRequest(
      {
        groupName: gcName,
        privacy: gcprivacy,
        otherUsers: markedMembersFinal,
      },
      setisCreateServerToggle,
    );
    // setisCreateServerToggle(false);
    // dispatch({
    //   type: SET_MUTATE_ALERTS,
    //   payload: {
    //     alerts: {
    //       type: "warning",
    //       content: "Server creation is temporary disabled",
    //     },
    //   },
    // });
  };

  useEffect(() => {
    ContactsListReusableRequest(setcontactslist, setisLoading);
  }, []);

  const rows: ContactRowData[] = Array.from(
    new Map(
      contactslist
        .flatMap((cnts) => {
          if (cnts.type !== "single") return [];
          if (!cnts.involved_entity || !cnts.action_by) return [];

          // Orient on the ACTING entity id, not the account id. A contact's
          // counterpart can be a page, whose details.id is a realm pk that can
          // never equal a user id - so this resolved the wrong side and pages
          // never showed up in the picker. Same fix as tabs/feed/Contacts.tsx.
          const selfActed =
            cnts.action_by.id ===
            (authentication.active_entity_context?.id ||
              authentication.user.entity_id);
          const u = selfActed
            ? cnts.involved_entity.details
            : cnts.action_by.details;
          const details_ent = selfActed ? cnts.involved_entity : cnts.action_by;

          return [
            {
              id: u.id,
              entityID: details_ent.id,
              username: u.username,
              firstName: u.first_name,
              middleName: u.middle_name,
              lastName: u.last_name,
              profile: u.profile,
              isBadged: u.is_badged,
              connectionID: cnts.connection_id,
              selfActed,
              involvedUserdetails: contactsToUserdetails(cnts, !selfActed),
            },
          ];
        })
        .map((row) => [row.entityID, row]),
    ).values(),
  );

  return (
    <Modal
      component={
        <div id="div_modal_container" className="cl-create-modal">
          {isSaving && (
            <div
              className={`tw-z-[2] tw-absolute tw-h-[calc(98%-90px)] tw-max-h-[700px] tw-w-[calc(98%-20px)] tw-max-w-[calc(400px-20px)] tw-bg-[var(--surface)] tw-opacity-[0.88] tw-flex tw-items-center tw-justify-center`}
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
            </div>
          )}
          <div className="tw-flex tw-flex-1 tw-flex-col tw-max-h-[100%] tw-bg-transparent">
            <div id="div_modal_header">
              <div id="div_server_modal_header_label">
                <BiGroup style={{ fontSize: "20px" }} />
                <span id="span_modal_header_label">Create Server</span>
              </div>
            </div>
            <div id="div_modal_input_fields" className="scroller">
              <div id="div_modal_input_columns">
                <span id="span_input_label">Name of Server</span>
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
                    Server is {gcprivacy ? "Private" : "Public"}
                  </span>
                </div>
              </div>
              <div id="div_modal_input_columns_add_people">
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
                      <AiOutlineLoading3Quarters style={{ fontSize: "28px" }} />
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
                      {rows.map((cnts: ContactRowData, i: number) => {
                        const fullNameFilter = `${cnts.firstName}${
                          cnts.middleName == "N/A" ? "" : ` ${cnts.middleName}`
                        } ${cnts.lastName}`;
                        if (fullNameFilter.includes(searchFilter)) {
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
                                checked={valueToArrayChecker(cnts.entityID)}
                                onChange={() => {
                                  if (!valueToArrayChecker(cnts.entityID)) {
                                    setmarkedMembers([
                                      ...markedMembers,
                                      {
                                        id: cnts.entityID,
                                        userID: cnts.username,
                                        fullName: `${cnts.firstName}${
                                          cnts.middleName == "N/A"
                                            ? ""
                                            : ` ${cnts.middleName}`
                                        } ${cnts.lastName}`,
                                      },
                                    ]);
                                  } else {
                                    removeFromList(cnts.entityID);
                                  }
                                }}
                                className="checkbox_selector_people"
                              />
                              <div id="div_img_cncts_container">
                                <div id="div_img_search_profiles_container_cncts">
                                  <Avatar
                                    id={cnts.entityID}
                                    name={`${cnts.firstName} ${cnts.lastName}`}
                                    src={
                                      cnts.profile == "none"
                                        ? undefined
                                        : cnts.profile
                                    }
                                    size={40}
                                  />
                                </div>
                              </div>
                              <div className="div_contact_fullname_container">
                                <span className="span_cncts_fullname_label">
                                  {cnts.firstName}
                                  {cnts.middleName == "N/A"
                                    ? ""
                                    : ` ${cnts.middleName}`}{" "}
                                  {cnts.lastName}
                                </span>
                              </div>
                            </motion.div>
                          );
                        }
                      })}
                    </div>
                  </motion.div>
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
                      className="btns_create_server_cancel"
                      onClick={() => {
                        processCreateGroupChat();
                      }}
                    >
                      Create
                    </button>
                    <button
                      className="btns_create_server_cancel"
                      onClick={() => {
                        setisCreateServerToggle(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default CreateServerModal;
