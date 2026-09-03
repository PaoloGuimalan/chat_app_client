/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import "../../../styles/styles.css";
import { IoClose } from "react-icons/io5";
import { BiGroup } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Avatar,
  BotFlag,
  PageFlag,
} from "@/reusables/design/primitives2";
import {
  ContactsListReusableRequest,
  EntitySearchRequest,
  CreateServerRequest,
} from "../../../reusables/hooks/requests";
import Modal from "../../reusables/Modal";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  AuthenticationInterface,
  ContactRowData,
  EntitySearchResult,
  IContact,
} from "@/reusables/vars/interfaces";
import { contactsToUserdetails } from "@/reusables/hooks/reusable";
// import { SET_MUTATE_ALERTS } from "@/redux/types";

function CreateServerModal({ setisCreateServerToggle }: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();

  const [contactslist, setcontactslist] = useState<IContact[]>([]);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [isSaving, setisSaving] = useState<boolean>(false);

  const [gcName, setgcName] = useState(
    `${authentication.user.fullName.firstName}'s Server`,
  );
  const [gcprivacy, setgcprivacy] = useState(true);
  const [searchFilter, setsearchFilter] = useState("");
  const [markedMembers, setmarkedMembers] = useState<any[]>([]);

  // GLOBAL search results, kept apart from the contacts list rather than
  // merged into it: the two answer different questions ("who do I already
  // know" vs "who exists"), and a merged list cannot say which a row came
  // from, so the empty state would be wrong for both.
  const [searchResults, setsearchResults] = useState<EntitySearchResult[]>([]);
  const [isSearching, setisSearching] = useState<boolean>(false);

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

  // A TYPED QUERY SEARCHES EVERYONE, not just your contacts.
  //
  // Membership is entity-based - a page or a bot can be a member exactly as a
  // person can - so a contacts-only picker made those impossible to add at
  // creation time, and you had to create the server first and add them
  // afterwards. Debounced because it now costs a request per keystroke.
  useEffect(() => {
    const term = searchFilter.trim();
    if (term === "") {
      setsearchResults([]);
      setisSearching(false);
      return;
    }

    setisSearching(true);
    const timer = setTimeout(() => {
      EntitySearchRequest(
        { searchdata: term, types: "user,realm,bot", realmTypes: "page" },
        dispatch,
        setisSearching,
        alerts,
        setsearchResults,
      );
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilter]);

  const contactRows: ContactRowData[] = Array.from(
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

  // A search hit as a row. entityID is what the picker keys everything on -
  // selection and the payload it posts - so that is the field that has to be
  // right; `id` is the ACCOUNT id, which a realm or bot hit does not have.
  const searchRows: ContactRowData[] = searchResults
    .filter(
      (hit) =>
        hit.entity_id !==
        (authentication.active_entity_context?.id ||
          authentication.user.entity_id),
    )
    .map((hit) => {
      const [firstName, ...rest] = (hit.display_name || hit.handle || "").split(
        " ",
      );
      return {
        id: hit.id || hit.entity_id,
        entityID: hit.entity_id,
        username: hit.handle,
        firstName: firstName || hit.handle,
        middleName: "N/A",
        lastName: rest.join(" "),
        // ContactRowData.profile is a string; the search payload nulls it.
        profile: hit.profile ?? "none",
        isBadged: hit.is_verified,
        connectionID: "",
        selfActed: false,
        involvedUserdetails: null,
        entityType: hit.type,
        realmType: hit.realm_type,
      };
    });

  // One list, one source - decided by whether a query is typed, never by
  // merging the two.
  const rows: ContactRowData[] =
    searchFilter.trim() !== "" ? searchRows : contactRows;

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
                {isLoading || isSearching ? (
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
                                    kind={cnts.entityType}
                                  />
                                </div>
                              </div>
                              <div className="div_contact_fullname_container">
                                <span className="span_cncts_fullname_label tw-flex tw-items-center tw-gap-[4px]">
                                  <span className="tw-truncate">
                                    {cnts.firstName}
                                    {cnts.middleName == "N/A"
                                      ? ""
                                      : ` ${cnts.middleName}`}{" "}
                                    {cnts.lastName}
                                  </span>
                                  <PageFlag realmType={cnts.realmType} />
                                  <BotFlag type={cnts.entityType} />
                                </span>
                              </div>
                            </motion.div>
                          );
                      })}
                    </div>
                  </motion.div>
                )}
                {isSaving ? (
                  <div className="tw-flex tw-items-center tw-justify-end tw-w-full">
                    <span className="cl-text-caption">Saving...</span>
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
