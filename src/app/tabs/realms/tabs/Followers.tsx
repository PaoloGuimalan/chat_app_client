/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { useCallback, useEffect, useRef, useState } from "react";
import { PaginationProp } from "@/reusables/vars/props";
import { IRealmFollower, IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { genericpaginationstate } from "@/redux/actions/states";
import { formattedDateToWords } from "@/reusables/hooks/reusable";
import {
  GetRealmFollowersRequest,
  RemoveRealmFollowersRequest,
} from "@/reusables/hooks/requests";

function Followers({ realm }: { realm: IRealmProfileInfo }) {
  const [searchFilter, setsearchFilter] = useState<string>("");
  const [followers, setfollowers] = useState<PaginationProp<IRealmFollower>>(
    genericpaginationstate,
  );
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [isSaving, setisSaving] = useState<boolean>(false);
  const [page, setpage] = useState(1);
  const [range, setrange] = useState(20);

  const followerslist: IRealmFollower[] = followers.results;

  const [removedFollowers, setremovedFollowers] = useState<string[]>([]);

  const GetRealmFollowersProcess = (
    currentPage: number = page,
    searchProp: string = "",
    overridelist: boolean = false,
  ) => {
    GetRealmFollowersRequest(
      realm.realm_id,
      currentPage,
      range,
      searchProp.trim() === "" ? null : searchProp,
    )
      .then((response) => {
        if (overridelist) {
          setfollowers(response);
        } else {
          setfollowers((prev) => {
            const combinedList: IRealmFollower[] = [
              ...prev.results,
              ...response.results,
            ];
            const uniqueById = combinedList
              .filter(
                (obj, index, self) =>
                  index ===
                  self.findIndex((t) => t.follow_id === obj.follow_id),
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
  };

  useEffect(() => {
    GetRealmFollowersProcess();
  }, [page, range, realm]);

  useEffect(() => {
    const reloadListener = async () => {
      GetRealmFollowersProcess(1, "", true);
    };

    document.addEventListener("reload-realm-members", reloadListener);

    return () => {
      document.removeEventListener("reload-realm-members", reloadListener);
    };
  }, []);

  const RemoveRealmFollowersProcess = (follow_id: string) => {
    setisSaving(true);
    RemoveRealmFollowersRequest(realm.realm_id, follow_id)
      .then(() => {
        setisSaving(false);
        setremovedFollowers((prev) => {
          return [...prev, follow_id];
        });
      })
      .catch((err) => {
        setisSaving(false);
        console.log(err);
      });
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
          GetRealmFollowersProcess(currentPage, searchValue, true);
        } else {
          GetRealmFollowersProcess();
        }
      }, 500);
    },
    [],
  );

  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-p-[20px] tw-gap-[20px]">
      <div className="tw-flex tw-flex-col tw-items-start">
        <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
          Followers
        </span>
        <span className="tw-text-[#383838] tw-text-[14px] tw-font-Inter">
          Manage, navigate, or remove followers
        </span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-w-full tw-gap-[10px] tw-h-full">
        <div className={`tw-w-full tw-h-full tw-flex`}>
          <div className="tw-w-full tw-h-auto tw-flex-1 tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex">
            <div className="tw-w-full tw-p-[20px] tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
              <span className="tw-text-[14px] tw-font-semibold">Followers</span>
              <div
                id="div_modal_input_columns_add_people"
                className="tw-w-full"
              >
                <div id="div_input_filter_container">
                  <span id="span_input_label">Browse or Remove followers</span>
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
                    className="scroller"
                    ref={divcontentRef}
                  >
                    <div className="tw-w-full tw-flex tw-flex-col tw-max-h-[350px] tw-min-h-[350px]">
                      {followerslist.map((cnts: IRealmFollower) => {
                        return (
                          <motion.div
                            whileHover={{
                              backgroundColor: "#e6e6e6",
                            }}
                            initial={{
                              display: removedFollowers.includes(cnts.follow_id)
                                ? "none"
                                : "flex",
                            }}
                            animate={{
                              display: removedFollowers.includes(cnts.follow_id)
                                ? "none"
                                : "flex",
                            }}
                            key={cnts.follow_id}
                            className="div_realm_members_cards_col"
                            title={`${cnts.follower.first_name}${
                              cnts.follower.middle_name == "N/A"
                                ? ""
                                : ` ${cnts.follower.middle_name}`
                            } ${cnts.follower.last_name}`}
                          >
                            <div id="div_img_cncts_container">
                              <div id="div_img_search_profiles_container_cncts">
                                <CachedImage
                                  src={
                                    cnts.follower.profile == "none"
                                      ? DefaultProfile
                                      : cnts.follower.profile
                                  }
                                  className={
                                    cnts.follower.profile == "none"
                                      ? "img_search_profiles_ntfs"
                                      : ""
                                  }
                                  id={
                                    cnts.follower.profile == "none"
                                      ? ""
                                      : "img_actual_profile"
                                  }
                                />
                              </div>
                            </div>
                            <div className="div_contact_fullname_container">
                              <div className="tw-h-full tw-flex tw-flex-col tw-justify-center tw-gap-[4px] tw-flex-1">
                                <span className="span_cncts_fullname_label tw-text-left">
                                  {cnts.follower.first_name}
                                  {cnts.follower.middle_name == "N/A"
                                    ? ""
                                    : ` ${cnts.follower.middle_name}`}{" "}
                                  {cnts.follower.last_name}
                                </span>
                                <span className="tw-text-[12px] tw-font-Inter tw-text-left tw-text-[#525252]">
                                  Started following on{" "}
                                  {formattedDateToWords(
                                    cnts.created_at,
                                    "YYYY-MM-DD",
                                  )}
                                </span>
                              </div>
                              <button
                                disabled={isSaving}
                                onClick={() => {
                                  RemoveRealmFollowersProcess(cnts.follow_id);
                                }}
                                className="tw-min-w-[70px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#acacac] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
                              >
                                Remove
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                      {followers.next && (
                        <div
                          ref={divlazyloaderRef}
                          id="div_isLoading_notifications"
                        >
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
                              style={{ fontSize: "25px" }}
                            />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Followers;
