/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import "../../../styles/styles.css";
import { FcContacts } from "react-icons/fc";
import { AiOutlineLoading3Quarters, AiOutlineMessage } from "react-icons/ai";
import { BiUserMinus } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ContactsListInitRequest,
  DeclineContactRequest,
} from "../../../reusables/hooks/requests";
import DefaultProfile from "../../../assets/imgs/default.png";
import {
  SET_CONVERSATION_SETUP,
  SET_TOGGLE_RIGHT_WIDGET,
} from "../../../redux/types";
import { useNavigate } from "react-router-dom";
import { conversationsetupstate } from "../../../redux/actions/states";
import {
  contactsToUserdetails,
  isUserOnline,
  userSessionStatusFromContacts,
} from "../../../reusables/hooks/reusable";
import { PaginationProp } from "@/reusables/vars/props";
import { IContact } from "@/reusables/vars/interfaces";
import ContactItemLoader from "@/app/reusables/loaders/ContactItemLoader";
import CachedImage from "@/app/reusables/cachers/CachedImage";

function Contacts() {
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const authentication = useSelector((state: any) => state.authentication);
  const contacts: PaginationProp<IContact> = useSelector(
    (state: any) => state.contactslist
  );
  const contactslist: IContact[] = contacts.results;
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener
  );
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);
  const alerts = useSelector((state: any) => state.alerts);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setisLoading] = useState(true);
  const [isDisabledByRequest, setisDisabledByRequest] = useState(false);

  const [page, setpage] = useState(1);
  const [range] = useState(50);

  useEffect(() => {
    ContactsListInitRequest(page, range, false, dispatch, setisLoading);
  }, [page, range]);

  const settogglerightwidget = (toggle: any) => {
    dispatch({
      type: SET_TOGGLE_RIGHT_WIDGET,
      payload: {
        togglerightwidget: toggle,
      },
    });
  };

  const declineRequestProcess = (connection_id: any, action: string) => {
    setisDisabledByRequest(true);
    // console.log(addUserID);
    // dispatch({
    //   type: SET_MUTATE_ALERTS,
    //   payload: {
    //     alerts: {
    //       type: "warning",
    //       content: "Add Connection is temporary disabled",
    //     },
    //   },
    // });
    DeclineContactRequest(
      {
        connection_id,
        action,
      },
      dispatch,
      alerts,
      setisDisabledByRequest
    );
  };

  const navigateToConversation = (
    type: any,
    conversationID: any,
    userdetails: any
  ) => {
    if (screensizelistener.W <= 1100) {
      if (type == "single") {
        dispatch({
          type: SET_CONVERSATION_SETUP,
          payload: {
            conversationsetup: {
              conversationid: conversationID,
              userdetails: userdetails,
              groupdetails: conversationsetupstate.groupdetails,
              type: "single",
            },
          },
        });
        navigate("/messages");
      } else {
        dispatch({
          type: SET_CONVERSATION_SETUP,
          payload: {
            conversationsetup: {
              conversationid: conversationID,
              userdetails: conversationsetupstate.userdetails,
              groupdetails: userdetails,
              type: "group",
            },
          },
        });
        navigate("/messages");
      }
    } else {
      if (type == "single") {
        dispatch({
          type: SET_CONVERSATION_SETUP,
          payload: {
            conversationsetup: {
              conversationid: conversationID,
              userdetails: userdetails,
              groupdetails: conversationsetupstate.groupdetails,
              type: "single",
            },
          },
        });
        settogglerightwidget("messages");
      } else {
        dispatch({
          type: SET_CONVERSATION_SETUP,
          payload: {
            conversationsetup: {
              conversationid: conversationID,
              userdetails: conversationsetupstate.userdetails,
              groupdetails: userdetails,
              type: "group",
            },
          },
        });
        settogglerightwidget("messages");
      }
    }
  };

  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  const divcontentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let currentView = false;
    if (divcontentRef) {
      if (divcontentRef.current) {
        divcontentRef.current.onscroll = () => {
          // console.log("Hello")
          if (divlazyloaderRef && divlazyloaderRef.current) {
            const top = divlazyloaderRef.current.getBoundingClientRect().top;
            const isVisible = top + 0 >= 0 && top - 0 <= window.innerHeight;
            // const isVisible = top > 0 ? true : false;
            // console.log((top + 0) >= 0 && (top - 0) <= window.innerHeight);
            if (currentView != isVisible) {
              currentView = isVisible;
              if (currentView) {
                // setrange((prev) => prev + 20);
                setpage((prev) => prev + 1);
              }
            }
          }
        };
      }
    }
  }, [divcontentRef, divlazyloaderRef, isLoading]);

  return (
    <motion.div
      animate={{
        display: pathnamelistener.includes("contacts")
          ? "flex"
          : screensizelistener.W <= 1100
          ? "none"
          : "flex",
        maxWidth: pathnamelistener.includes("contacts")
          ? "600px"
          : screensizelistener.W <= 900
          ? "350px"
          : "350px",
      }}
      id="div_contacts"
    >
      <div id="div_contacts_label_container">
        <FcContacts style={{ fontSize: "28px" }} />
        <span className="span_contacts_label">Contacts</span>
      </div>
      {isLoading ? (
        // <div id="div_isLoading_notifications">
        //   <motion.div
        //     animate={{
        //       rotate: -360,
        //     }}
        //     transition={{
        //       duration: 1,
        //       repeat: Infinity,
        //     }}
        //     id="div_loader_request"
        //   >
        //     <AiOutlineLoading3Quarters style={{ fontSize: "25px" }} />
        //   </motion.div>
        // </div>
        <div id="div_contacts_list_container" className="scroller">
          {Array.from({ length: 20 }, (_, i: number) => {
            return <ContactItemLoader key={i} />;
          })}
        </div>
      ) : contactslist.length == 0 ? (
        <div id="div_contacts_list_empty_container">
          <span className="span_empty_list_label">No Contacts</span>
        </div>
      ) : (
        <div
          ref={divcontentRef}
          id="div_contacts_list_container"
          className="scroller"
        >
          {contactslist.map((cnts: IContact, i: number) => {
            if (cnts.type == "single") {
              if (cnts.involved_user && cnts.action_by) {
                if (cnts.action_by.username == authentication.user.userID) {
                  return (
                    <motion.div
                      whileHover={{
                        backgroundColor: "#e6e6e6",
                      }}
                      key={i}
                      className="div_cncts_cards"
                    >
                      <div id="div_img_cncts_container">
                        <div id="div_img_search_profiles_container_cncts">
                          <CachedImage
                            src={
                              cnts.involved_user.profile == "none"
                                ? DefaultProfile
                                : cnts.involved_user.profile
                            }
                            className="img_search_profiles_ntfs"
                          />
                        </div>
                        {isUserOnline(
                          activeuserslist,
                          cnts.involved_user.username
                        ) && <div className="div_online_indicator" />}
                      </div>
                      <div className="tw-flex tw-flex-1 tw-h-full tw-overflow-hidden tw-flex-col tw-justify-center">
                        <div className="div_contact_fullname_container">
                          <span
                            className="span_cncts_fullname_label tw-border-[#808080] hover:tw-border-solid tw-border-[0px] tw-border-b-[1px]"
                            onClick={() => {
                              navigate(`/${cnts.involved_user.username}`);
                            }}
                          >
                            {cnts.involved_user.first_name}
                            {cnts.involved_user.middle_name == "N/A"
                              ? ""
                              : ` ${cnts.involved_user.middle_name}`}{" "}
                            {cnts.involved_user.last_name}
                          </span>
                        </div>
                        {isUserOnline(
                          activeuserslist,
                          cnts.involved_user.username
                        ) ? (
                          <div className="tw-flex tw-flex-1 tw-pl-[10px] tw-pr-[10px]">
                            <span className="tw-text-[12px] tw-font-Inter">Active Now</span>
                          </div>
                        ) : (
                          userSessionStatusFromContacts(
                            activeuserslist,
                            cnts.involved_user.username
                          ) && (
                            <div className="tw-flex tw-flex-1 tw-pl-[10px] tw-pr-[10px]">
                              <span className="tw-text-[12px] tw-font-Inter tw-text-[#5a5a5a]">{
                                userSessionStatusFromContacts(
                                  activeuserslist,
                                  cnts.involved_user.username
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                      <div className="div_cncts_navigations">
                        <motion.button
                          initial={{
                            backgroundColor: "transparent",
                            color: "#9cc2ff",
                          }}
                          whileHover={{
                            backgroundColor: "#9cc2ff",
                            color: "white",
                          }}
                          onClick={() => {
                            navigateToConversation(
                              "single",
                              cnts.connection_id,
                              contactsToUserdetails(cnts, false)
                            );
                          }}
                          className="btn_cncts_navigations"
                        >
                          <AiOutlineMessage
                            style={{
                              fontSize: "20px",
                              borderRadius: "7px",
                              padding: "3px",
                            }}
                          />
                        </motion.button>
                        <motion.button
                          initial={{
                            backgroundColor: "transparent",
                            color: "#ff6675",
                          }}
                          whileHover={{
                            backgroundColor: "#ff6675",
                            color: "white",
                          }}
                          className="btn_cncts_navigations"
                          onClick={() => {
                            declineRequestProcess(cnts.connection_id, "remove");
                          }}
                          disabled={isDisabledByRequest}
                        >
                          <BiUserMinus
                            style={{
                              fontSize: "20px",
                              borderRadius: "7px",
                              padding: "3px",
                            }}
                          />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                } else {
                  return (
                    <motion.div
                      whileHover={{
                        backgroundColor: "#e6e6e6",
                      }}
                      key={i}
                      className="div_cncts_cards"
                    >
                      <div id="div_img_cncts_container">
                        <div id="div_img_search_profiles_container_cncts">
                          <CachedImage
                            src={
                              cnts.action_by.profile == "none"
                                ? DefaultProfile
                                : cnts.action_by.profile
                            }
                            className="img_search_profiles_ntfs"
                          />
                        </div>
                        {isUserOnline(
                          activeuserslist,
                          cnts.action_by.username
                        ) && <div className="div_online_indicator" />}
                      </div>
                      <div className="tw-flex tw-flex-1 tw-h-full tw-overflow-hidden tw-flex-col tw-justify-center">
                        <div className="div_contact_fullname_container">
                          <span
                            className="span_cncts_fullname_label tw-border-[#808080] hover:tw-border-solid tw-border-[0px] tw-border-b-[1px]"
                            onClick={() => {
                              navigate(`/${cnts.action_by.username}`);
                            }}
                          >
                            {cnts.action_by.first_name}
                            {cnts.action_by.middle_name == "N/A"
                              ? ""
                              : ` ${cnts.action_by.middle_name}`}{" "}
                            {cnts.action_by.last_name}
                          </span>
                        </div>
                        {isUserOnline(
                          activeuserslist,
                          cnts.action_by.username
                        ) ? (
                          <div className="tw-flex tw-flex-1 tw-pl-[10px] tw-pr-[10px]">
                            <span className="tw-text-[12px] tw-font-Inter">Active Now</span>
                          </div>
                        ): (
                          userSessionStatusFromContacts(
                            activeuserslist,
                            cnts.action_by.username
                          ) && (
                            <div className="tw-flex tw-flex-1 tw-pl-[10px] tw-pr-[10px]">
                              <span className="tw-text-[12px] tw-font-Inter tw-text-[#5a5a5a]">{
                                userSessionStatusFromContacts(
                                  activeuserslist,
                                  cnts.action_by.username
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                      <div className="div_cncts_navigations">
                        <motion.button
                          initial={{
                            backgroundColor: "transparent",
                            color: "#9cc2ff",
                          }}
                          whileHover={{
                            backgroundColor: "#9cc2ff",
                            color: "white",
                          }}
                          onClick={() => {
                            navigateToConversation(
                              "single",
                              cnts.connection_id,
                              contactsToUserdetails(cnts, true)
                            );
                          }}
                          className="btn_cncts_navigations"
                        >
                          <AiOutlineMessage
                            style={{
                              fontSize: "20px",
                              borderRadius: "7px",
                              padding: "3px",
                            }}
                          />
                        </motion.button>
                        <motion.button
                          initial={{
                            backgroundColor: "transparent",
                            color: "#ff6675",
                          }}
                          whileHover={{
                            backgroundColor: "#ff6675",
                            color: "white",
                          }}
                          className="btn_cncts_navigations"
                          onClick={() => {
                            declineRequestProcess(cnts.connection_id, "remove");
                          }}
                          disabled={isDisabledByRequest}
                        >
                          <BiUserMinus
                            style={{
                              fontSize: "20px",
                              borderRadius: "7px",
                              padding: "3px",
                            }}
                          />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                }
              } else {
                return null;
              }
            } else {
              return null;
            }
          })}
          {contacts.next && (
            <div ref={divlazyloaderRef} id="div_isLoading_notifications">
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
                <AiOutlineLoading3Quarters style={{ fontSize: "25px" }} />
              </motion.div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default Contacts;
