/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar } from "@/reusables/design/primitives2";
import {
  AuthenticationInterface,
  ContactRowData,
  IContact,
  IRealmMember,
} from "@/reusables/vars/interfaces";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { useSelector } from "react-redux";
import {
  ContactsListInitRequest,
  GetRealmMembersRequest,
} from "@/reusables/hooks/requests";
import { genericpaginationstate } from "@/redux/actions/states";
import { PaginationProp } from "@/reusables/vars/props";
import { contactsToUserdetails } from "@/reusables/hooks/reusable";

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

  const valueToArrayChecker = (entityID: any) => {
    const entityIDExistInArray = markedMembers.filter(
      (flt: any) => flt.entityID == entityID,
    );

    return entityIDExistInArray.length > 0 ? true : false;
  };

  const removeFromList = (entityID: any) => {
    const entityIDnotSimilar = markedMembers.filter(
      (flt: any) => flt.entityID != entityID,
    );

    setmarkedMembers(entityIDnotSimilar);
  };

  const GetPeopleListProcess = (
    currentPage: number = page,
    searchProp: string = "",
    overridelist: boolean = false,
  ) => {
    if (isRealm && (type === "channel" || type === "voice") && parentRealmID) {
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
    if (isRealm && (type === "channel" || type === "voice") && parentRealmID) {
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

  // Whoever is currently ACTING - the personal entity normally, or a page
  // while switched. Matches what /contacts filters on server-side
  // (request.entity), so it is the only correct thing to orient a row
  // against. See the same helper in tabs/feed/Contacts.tsx.
  const actingEntityID =
    authentication.active_entity_context?.id || authentication.user.entity_id;

  const rows: ContactRowData[] = Array.from(
    new Map(
      contactslist
        .flatMap((cnts) => {
          if (cnts.type !== "single") return [];
          if (!cnts.involved_entity || !cnts.action_by) return [];

          // Orient on the ENTITY id, not the account id - a counterpart can
          // now be a page, whose details.id is a realm pk that would never
          // match a user id. See the same fix in tabs/feed/Contacts.tsx.
          const selfActed = cnts.action_by.id === actingEntityID;
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
              entityType: details_ent.type as "user" | "realm",
            },
          ];
        })
        .map((row) => [row.entityID, row]),
    ).values(),
  );

  return (
    <div className="tw-w-full tw-h-full tw-flex-1 tw-bg-transparent tw-flex">
      <div className="tw-w-full tw-p-[18px] sm:tw-p-[24px] tw-flex tw-flex-col tw-items-start tw-gap-[15px] tw-bg-transparent tw-min-h-0">
        <span className="tw-text-[14px] tw-font-semibold tw-text-[var(--text)]">
          {label}
        </span>
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
              className="scroller tw-pr-[8px]"
            >
              {isRealm &&
              (type === "channel" || type === "voice") &&
              parentRealmID ? (
                <div className="tw-w-full tw-flex tw-flex-row tw-flex-wrap tw-h-auto tw-max-h-[350px] tw-min-h-[350px] tw-gap-[8px]">
                  <div className="tw-w-full tw-flex tw-flex-row tw-flex-wrap tw-h-fit tw-gap-[8px]">
                    {memberslist.map((cnts: IRealmMember, i: number) => {
                      if (
                        cnts.entity.details.id !== authentication.user.entity_id
                      ) {
                        if (!excludeIDs.includes(cnts.entity.id)) {
                          return (
                            <motion.div
                              whileHover={{
                                backgroundColor: "var(--surface-hover)",
                              }}
                              key={i}
                              className="div_realm_members_cards tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-shadow-none"
                              title={`${cnts.entity.details.first_name}${
                                cnts.entity.details.middle_name == "N/A"
                                  ? ""
                                  : ` ${cnts.entity.details.middle_name}`
                              } ${cnts.entity.details.last_name}`}
                            >
                              <input
                                type="checkbox"
                                checked={valueToArrayChecker(cnts.entity.id)}
                                disabled={isSaving}
                                onChange={() => {
                                  if (!valueToArrayChecker(cnts.entity.id)) {
                                    setmarkedMembers([
                                      ...markedMembers,
                                      {
                                        id: cnts.entity.details.id,
                                        entityID: cnts.entity.id,
                                        userID: cnts.entity.details.username,
                                        fullName: `${cnts.entity.details.first_name}${
                                          cnts.entity.details.middle_name ==
                                          "N/A"
                                            ? ""
                                            : ` ${cnts.entity.details.middle_name}`
                                        } ${cnts.entity.details.last_name}`,
                                      },
                                    ]);
                                  } else {
                                    removeFromList(cnts.entity.id);
                                  }
                                }}
                                className="checkbox_selector_people_page"
                              />
                              <div id="div_img_cncts_container">
                                <div id="div_img_search_profiles_container_cncts">
                                  <Avatar
                                    id={cnts.entity.details.id}
                                    name={`${cnts.entity.details.first_name} ${cnts.entity.details.last_name}`}
                                    src={
                                      cnts.entity.details.profile == "none"
                                        ? undefined
                                        : cnts.entity.details.profile
                                    }
                                    size={40}
                                  />
                                </div>
                              </div>
                              <div className="div_contact_fullname_container">
                                <span className="span_cncts_fullname_label">
                                  {cnts.entity.details.first_name}
                                  {cnts.entity.details.middle_name == "N/A"
                                    ? ""
                                    : ` ${cnts.entity.details.middle_name}`}{" "}
                                  {cnts.entity.details.last_name}
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
                <div className="tw-w-full tw-flex tw-flex-row tw-flex-wrap tw-h-auto tw-max-h-[350px] tw-min-h-[350px] tw-gap-[8px]">
                  <div className="tw-w-full tw-flex tw-flex-col sm:tw-flex-row tw-flex-wrap tw-h-fit tw-gap-[8px]">
                    {rows.map((cnts: ContactRowData, i: number) => {
                      if (
                        !excludeIDs.includes(cnts.entityID) ||
                        !excludeIDs.includes(cnts.entityID)
                      ) {
                        return (
                          <motion.div
                            whileHover={{
                              backgroundColor: "var(--surface-hover)",
                            }}
                            key={i}
                            className="div_realm_members_cards tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-shadow-none"
                            title={`${cnts.firstName}${
                              cnts.middleName == "N/A"
                                ? ""
                                : ` ${cnts.middleName}`
                            } ${cnts.lastName}`}
                          >
                            <input
                              type="checkbox"
                              checked={valueToArrayChecker(cnts.entityID)}
                              disabled={isSaving}
                              onChange={() => {
                                if (!valueToArrayChecker(cnts.entityID)) {
                                  setmarkedMembers([
                                    ...markedMembers,
                                    {
                                      id: cnts.id,
                                      entityID: cnts.entityID,
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
                              className="checkbox_selector_people_page"
                            />
                            <div id="div_img_cncts_container">
                              <div id="div_img_search_profiles_container_cncts">
                                <Avatar
                                  id={cnts.id}
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
