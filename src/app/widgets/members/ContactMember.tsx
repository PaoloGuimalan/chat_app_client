/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import {
  AuthenticationInterface,
  IContact,
  IRealmMember,
} from "@/reusables/vars/interfaces";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { useSelector } from "react-redux";
import DefaultProfile from "../../../assets/imgs/default.png";
import {
  ContactsListInitRequest,
  GetRealmMembersRequest,
} from "@/reusables/hooks/requests";
import { genericpaginationstate } from "@/redux/actions/states";
import { PaginationProp } from "@/reusables/vars/props";

function ContactMember({
  parentRealmID,
  isRealm,
  type,
  label,
  excludeIDs,
  onAdd,
}: {
  parentRealmID: string | null;
  isRealm: boolean;
  type: string;
  label: string;
  excludeIDs: string[];
  onAdd: (
    markedMembers: { id: string; userID: string; fullName: string }[],
    callback: () => void,
  ) => void;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [contacts, setcontacts] = useState<PaginationProp<IContact>>(
    genericpaginationstate,
  );
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [searchFilter, setsearchFilter] = useState<string>("");
  const [isSaving, _setisSaving] = useState<boolean>(false);
  const [markedMembers, setmarkedMembers] = useState<any[]>([]);

  const contactslist: IContact[] = contacts.results;

  const [members, setmembers] = useState<PaginationProp<IRealmMember>>(
    genericpaginationstate,
  );

  const memberslist: IRealmMember[] = members.results;

  const [page, setpage] = useState(1);
  const [range, setrange] = useState(50);

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

  const GetPeopleListProcess = (
    currentPage: number = page,
    searchProp: string = "",
    overridelist: boolean = false,
  ) => {
    if (isRealm && type === "channel" && parentRealmID) {
      GetRealmMembersRequest(
        parentRealmID,
        currentPage,
        range,
        searchProp.trim() === "" ? null : searchProp,
      )
        .then((response) => {
          if (overridelist) {
            setmembers(response);
          } else {
            setmembers((prev) => {
              const combinedList = [...prev.results, ...response.results];
              const uniqueById = combinedList
                .filter(
                  (obj, index, self) =>
                    index ===
                    self.findIndex((t) => t.member_id === obj.member_id),
                )
                .sort(
                  (a: any, b: any) =>
                    new Date(b.date_joined).getTime() -
                    new Date(a.date_joined).getTime(),
                );
              return {
                ...response,
                results: uniqueById,
              };
            });
          }
          setisLoading(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      ContactsListInitRequest(
        currentPage,
        range,
        overridelist,
        setcontacts,
        setisLoading,
        true,
        searchProp.trim() === "" ? null : searchProp,
      );
    }
  };

  useEffect(() => {
    GetPeopleListProcess();
  }, [page, range]);

  const isNext = useMemo(() => {
    if (isRealm && type === "channel" && parentRealmID) {
      return members.next;
    } else {
      return contacts.next;
    }
  }, [members, contacts, parentRealmID, isRealm, type]);

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
                setrange(10);
                setpage((prev) => prev + 1);
              }
            }
          }
        };
      }
    }
  }, [divcontentRef, divlazyloaderRef, isLoading]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFetch = useCallback(
    (currentPage: number, searchValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (searchValue.trim() !== "") {
          // setisLoaded(false); // optional: show loading at start
          GetPeopleListProcess(currentPage, searchValue, true);
        } else {
          GetPeopleListProcess();
        }
      }, 500);
    },
    [],
  );

  return (
    <div className="tw-w-full tw-h-full tw-flex-1 tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex">
      <div className="tw-w-full tw-p-[20px] tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
        <span className="tw-text-[14px] tw-font-semibold">{label}</span>
        <div id="div_modal_input_columns_add_people" className="tw-w-full">
          <div id="div_input_filter_container">
            <span id="span_input_label">Add People</span>
            <input
              id="input_searchfilter"
              value={searchFilter}
              onChange={(e) => {
                setsearchFilter(e.target.value);
                debouncedFetch(1, e.target.value);
              }}
              type="text"
              placeholder="Type a name of a user"
              disabled={isSaving}
            />
          </div>
          <motion.div
            animate={{
              minHeight: markedMembers.length > 0 ? "auto" : "0px",
              height: markedMembers.length > 0 ? "auto" : "0px",
            }}
            id="div_selected_page_moderators_container"
            className="scrollervert"
          >
            {markedMembers.map((mrkm: any, i: number) => {
              return (
                <div key={i} className="div_selected_page_holder">
                  <span className="span_selected_label">{mrkm.fullName}</span>
                  <button
                    className="btn_remove_selected"
                    onClick={() => {
                      removeFromList(mrkm.id);
                    }}
                    disabled={isSaving}
                  >
                    <IoClose
                      style={{
                        fontSize: "17px",
                        color: "white",
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </motion.div>
          {isLoading ? (
            <div className="tw-w-full tw-flex tw-flex-1 tw-items-center tw-justify-center tw-max-h-[350px] tw-min-h-[350px]">
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
              ref={divcontentRef}
              className="scroller"
            >
              {isRealm && type === "channel" && parentRealmID ? (
                <div className="tw-w-full tw-flex tw-flex-row tw-flex-wrap tw-h-auto tw-max-h-[350px] tw-min-h-[350px]">
                  <div className="tw-w-full tw-flex tw-flex-row tw-flex-wrap tw-h-fit">
                    {memberslist.map((cnts: IRealmMember, i: number) => {
                      if (cnts.account.id !== authentication.user.userID) {
                        if (!excludeIDs.includes(cnts.account.id)) {
                          return (
                            <motion.div
                              whileHover={{
                                backgroundColor: "#e6e6e6",
                              }}
                              key={i}
                              className="div_realm_members_cards"
                              title={`${cnts.account.first_name}${
                                cnts.account.middle_name == "N/A"
                                  ? ""
                                  : ` ${cnts.account.middle_name}`
                              } ${cnts.account.last_name}`}
                            >
                              <input
                                type="checkbox"
                                checked={valueToArrayChecker(cnts.account.id)}
                                disabled={isSaving}
                                onChange={() => {
                                  if (!valueToArrayChecker(cnts.account.id)) {
                                    setmarkedMembers([
                                      ...markedMembers,
                                      {
                                        id: cnts.account.id,
                                        userID: cnts.account.username,
                                        fullName: `${cnts.account.first_name}${
                                          cnts.account.middle_name == "N/A"
                                            ? ""
                                            : ` ${cnts.account.middle_name}`
                                        } ${cnts.account.last_name}`,
                                      },
                                    ]);
                                  } else {
                                    removeFromList(cnts.account.id);
                                  }
                                }}
                                className="checkbox_selector_people_page"
                              />
                              <div id="div_img_cncts_container">
                                <div id="div_img_search_profiles_container_cncts">
                                  <CachedImage
                                    src={
                                      cnts.account.profile == "none"
                                        ? DefaultProfile
                                        : cnts.account.profile
                                    }
                                    className={
                                      cnts.account.profile == "none"
                                        ? "img_search_profiles_ntfs"
                                        : ""
                                    }
                                    id={
                                      cnts.account.profile == "none"
                                        ? ""
                                        : "img_actual_profile"
                                    }
                                  />
                                </div>
                              </div>
                              <div className="div_contact_fullname_container">
                                <span className="span_cncts_fullname_label">
                                  {cnts.account.first_name}
                                  {cnts.account.middle_name == "N/A"
                                    ? ""
                                    : ` ${cnts.account.middle_name}`}{" "}
                                  {cnts.account.last_name}
                                </span>
                              </div>
                            </motion.div>
                          );
                        }
                      }
                    })}
                  </div>
                </div>
              ) : (
                <div className="tw-w-full tw-flex tw-flex-row tw-flex-wrap tw-h-auto tw-max-h-[350px] tw-min-h-[350px]">
                  <div className="tw-w-full tw-flex tw-flex-row tw-flex-wrap tw-h-fit">
                    {contactslist.map((cnts: IContact, i: number) => {
                      if (cnts.type == "single") {
                        if (cnts.action_by && cnts.involved_user) {
                          if (
                            !excludeIDs.includes(cnts.action_by.id) ||
                            !excludeIDs.includes(cnts.involved_user.id)
                          ) {
                            if (
                              cnts.action_by.id == authentication.user.userID
                            ) {
                              return (
                                <motion.div
                                  whileHover={{
                                    backgroundColor: "#e6e6e6",
                                  }}
                                  key={i}
                                  className="div_realm_members_cards"
                                  title={`${cnts.involved_user.first_name}${
                                    cnts.involved_user.middle_name == "N/A"
                                      ? ""
                                      : ` ${cnts.involved_user.middle_name}`
                                  } ${cnts.involved_user.last_name}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={valueToArrayChecker(
                                      cnts.involved_user.id,
                                    )}
                                    disabled={isSaving}
                                    onChange={() => {
                                      if (
                                        !valueToArrayChecker(
                                          cnts.involved_user.id,
                                        )
                                      ) {
                                        setmarkedMembers([
                                          ...markedMembers,
                                          {
                                            id: cnts.involved_user.id,
                                            userID: cnts.involved_user.username,
                                            fullName: `${
                                              cnts.involved_user.first_name
                                            }${
                                              cnts.involved_user.middle_name ==
                                              "N/A"
                                                ? ""
                                                : ` ${cnts.involved_user.middle_name}`
                                            } ${cnts.involved_user.last_name}`,
                                          },
                                        ]);
                                      } else {
                                        removeFromList(cnts.involved_user.id);
                                      }
                                    }}
                                    className="checkbox_selector_people_page"
                                  />
                                  <div id="div_img_cncts_container">
                                    <div id="div_img_search_profiles_container_cncts">
                                      <CachedImage
                                        src={
                                          cnts.involved_user.profile == "none"
                                            ? DefaultProfile
                                            : cnts.involved_user.profile
                                        }
                                        className={
                                          cnts.involved_user.profile == "none"
                                            ? "img_search_profiles_ntfs"
                                            : ""
                                        }
                                        id={
                                          cnts.involved_user.profile == "none"
                                            ? ""
                                            : "img_actual_profile"
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="div_contact_fullname_container">
                                    <span className="span_cncts_fullname_label">
                                      {cnts.involved_user.first_name}
                                      {cnts.involved_user.middle_name == "N/A"
                                        ? ""
                                        : ` ${cnts.involved_user.middle_name}`}{" "}
                                      {cnts.involved_user.last_name}
                                    </span>
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
                                  className="div_realm_members_cards"
                                  title={`${cnts.action_by.first_name}${
                                    cnts.action_by.middle_name == "N/A"
                                      ? ""
                                      : ` ${cnts.action_by.middle_name}`
                                  } ${cnts.action_by.last_name}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={valueToArrayChecker(
                                      cnts.action_by.id,
                                    )}
                                    disabled={isSaving}
                                    onChange={() => {
                                      if (
                                        !valueToArrayChecker(cnts.action_by.id)
                                      ) {
                                        setmarkedMembers([
                                          ...markedMembers,
                                          {
                                            id: cnts.action_by.id,
                                            userID: cnts.action_by.username,
                                            fullName: `${
                                              cnts.action_by.first_name
                                            }${
                                              cnts.action_by.middle_name ==
                                              "N/A"
                                                ? ""
                                                : ` ${cnts.action_by.middle_name}`
                                            } ${cnts.action_by.last_name}`,
                                          },
                                        ]);
                                      } else {
                                        removeFromList(cnts.action_by.id);
                                      }
                                    }}
                                    className="checkbox_selector_people_page"
                                  />
                                  <div id="div_img_cncts_container">
                                    <div id="div_img_search_profiles_container_cncts">
                                      <CachedImage
                                        src={
                                          cnts.action_by.profile == "none"
                                            ? DefaultProfile
                                            : cnts.action_by.profile
                                        }
                                        className={
                                          cnts.action_by.profile == "none"
                                            ? "img_search_profiles_ntfs"
                                            : ""
                                        }
                                        id={
                                          cnts.action_by.profile == "none"
                                            ? ""
                                            : "img_actual_profile"
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="div_contact_fullname_container">
                                    <span className="span_cncts_fullname_label">
                                      {cnts.action_by.first_name}
                                      {cnts.action_by.middle_name == "N/A"
                                        ? ""
                                        : ` ${cnts.action_by.middle_name}`}{" "}
                                      {cnts.action_by.last_name}
                                    </span>
                                  </div>
                                </motion.div>
                              );
                            }
                          }
                        } else {
                          return null;
                        }
                      } else {
                        return null;
                      }
                    })}
                  </div>
                </div>
              )}
              {isNext && (
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
            </motion.div>
          )}
        </div>
        {markedMembers.length > 0 && (
          <div className="tw-w-full tw-flex tw-gap-[5px] tw-justify-end">
            <button
              className="btns_create_cancel"
              onClick={() => {
                onAdd(markedMembers, () => {
                  setmarkedMembers([]);
                });
              }}
            >
              Add
            </button>
            <button
              className="btns_create_cancel"
              onClick={() => {
                setmarkedMembers([]);
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactMember;
