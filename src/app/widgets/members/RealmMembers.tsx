/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Avatar } from "@/reusables/design/primitives2";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { genericpaginationstate } from "@/redux/actions/states";
import { PaginationProp } from "@/reusables/vars/props";
import {
  AuthenticationInterface,
  IRealmMember,
} from "@/reusables/vars/interfaces";
import { GetRealmMembersRequest } from "@/reusables/hooks/requests";
import { capitalizeFirstLetter } from "@/reusables/hooks/reusable";
import MembersOptions from "./MembersOptions";
import { useSelector } from "react-redux";

function RealmMembers({
  realm_id,
  hide,
  onList,
}: {
  realm_id: string;
  hide: string[];
  onList: (list: string[]) => void;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [searchFilter, setsearchFilter] = useState<string>("");
  const [members, setmembers] = useState<PaginationProp<IRealmMember>>(
    genericpaginationstate,
  );
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [page, setpage] = useState(1);
  const [range, setrange] = useState(50);

  const memberslist: IRealmMember[] = members.results;

  const GetRealmMembersProcess = (
    currentPage: number = page,
    searchProp: string = "",
    overridelist: boolean = false,
  ) => {
    GetRealmMembersRequest(
      realm_id,
      currentPage,
      range,
      searchProp.trim() === "" ? null : searchProp,
    )
      .then((response) => {
        if (overridelist) {
          setmembers(response);
        } else {
          setmembers((prev) => {
            const combinedList: IRealmMember[] = [
              ...prev.results,
              ...response.results,
            ];
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
            onList(uniqueById.map((mp) => mp.entity.id));
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
  };

  useEffect(() => {
    GetRealmMembersProcess();
  }, [page, range, realm_id]);

  useEffect(() => {
    const reloadListener = async () => {
      GetRealmMembersProcess(1, "", true);
    };

    document.addEventListener("reload-realm-members", reloadListener);

    return () => {
      document.removeEventListener("reload-realm-members", reloadListener);
    };
  }, []);

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
          GetRealmMembersProcess(currentPage, searchValue, true);
        } else {
          GetRealmMembersProcess();
        }
      }, 500);
    },
    [],
  );

  return (
    <div className="tw-w-full tw-h-full tw-flex-1 tw-bg-transparent tw-flex">
      <div className="tw-w-full tw-p-[18px] sm:tw-p-[24px] tw-flex tw-flex-col tw-items-start tw-gap-[15px] tw-bg-transparent tw-min-h-0">
        <span className="cl-text-body tw-font-semibold tw-text-[var(--text)]">
          Members
        </span>
        <div id="div_modal_input_columns_add_people" className="tw-w-full">
          <div id="div_input_filter_container">
            <span id="span_input_label">
              Remove, Promote, or Demote Members
            </span>
            <input
              id="input_searchfilter"
              value={searchFilter}
              onChange={(e) => {
                setsearchFilter(e.target.value);
                debouncedFetch(1, e.target.value);
              }}
              type="text"
              placeholder="Type a name of a user"
            />
          </div>
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
              className="scroller tw-pr-[8px]"
              ref={divcontentRef}
            >
              <div className="tw-w-full tw-flex tw-flex-col tw-max-h-[350px] tw-min-h-[350px] tw-gap-[8px]">
                {memberslist.map((cnts: IRealmMember) => {
                  return (
                    <motion.div
                      whileHover={{
                        backgroundColor: "var(--surface-hover)",
                      }}
                      key={cnts.member_id}
                      className="div_realm_members_cards_col tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-shadow-none"
                      title={`${cnts.entity.details.first_name}${
                        cnts.entity.details.middle_name == "N/A"
                          ? ""
                          : ` ${cnts.entity.details.middle_name}`
                      } ${cnts.entity.details.last_name}`}
                    >
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
                        <div className="tw-h-full tw-flex tw-flex-col tw-justify-center tw-gap-[4px] tw-flex-1">
                          {cnts.entity.type === "realm" ? (
                            <span className="span_cncts_fullname_label tw-text-left">
                              {cnts.entity.details.name}
                            </span>
                          ) : (
                            <span className="span_cncts_fullname_label tw-text-left">
                              {cnts.entity.details.first_name}
                              {cnts.entity.details.middle_name == "N/A"
                                ? ""
                                : ` ${cnts.entity.details.middle_name}`}{" "}
                              {cnts.entity.details.last_name}
                            </span>
                          )}
                          <span className="cl-text-caption tw-font-Inter tw-text-left tw-text-[var(--text-2)]">
                            {capitalizeFirstLetter(cnts.role)}
                          </span>
                        </div>
                        {authentication.user.entity_id !== cnts.entity.id && (
                          <MembersOptions member={cnts} hide={hide} />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {members.next && (
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
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RealmMembers;

