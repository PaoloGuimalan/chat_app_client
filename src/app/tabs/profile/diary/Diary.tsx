/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthenticationInterface,
  IEntry,
  IEntryTag,
} from "@/reusables/vars/interfaces";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { AiOutlineHome, AiOutlineSearch } from "react-icons/ai";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import "react-quill/dist/quill.snow.css";
import { FaPen } from "react-icons/fa6";
import { TbBookOff } from "react-icons/tb";
import NewEntry from "./NewEntry";
import { GetUserEntriesRequest } from "@/reusables/hooks/requests";
import { PaginationProp } from "@/reusables/vars/props";
import { entriesliststate } from "@/redux/actions/states";
import { formattedDateToWords } from "@/reusables/hooks/reusable";
import Skeleton from "react-loading-skeleton";
import EntryView from "./EntryView";

function Diary() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const [searchParams] = useSearchParams();
  const params = useParams();

  const entry_id = searchParams.get("entry_id");

  const navigate = useNavigate();

  const [entries, setentries] =
    useState<PaginationProp<IEntry>>(entriesliststate);
  const [isLoaded, setisLoaded] = useState<boolean>(false);
  const [page, setpage] = useState<number>(1); //setrange

  const entriesByDate = useMemo(() => {
    const sorted = [...entries.results].sort((a, b) => {
      const dateDiff = new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime();
      if (dateDiff === 0) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return dateDiff;
    });
    
    // Group by entry_date
    const grouped = sorted.reduce((acc, entry) => {
      const date = entry.entry_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {} as { [date: string]: IEntry[] });

    return Object.entries(grouped)
      .map(([date, groupEntries]) => ({
        date,
        entries: groupEntries.reverse()
      }))
      .reverse();
  }, [entries]);

  const GetUserEntriesProcess = (page: number, range: number) => {
    GetUserEntriesRequest({ page, range })
      .then((response) => {
        setpage(page);
        setisLoaded(true);
        setentries((prev: PaginationProp<IEntry>) => {
          const combinedList = [...prev.results, ...response.results];
          const uniqueById = combinedList.filter(
            (obj, index, self) =>
              index === self.findIndex((t) => t.id === obj.id),
          );

          return {
            ...response,
            results: uniqueById,
          };
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    GetUserEntriesProcess(1, 10);
  }, []);

  const divcontentRef = useRef<HTMLDivElement | null>(null);
  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);

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
                // setrange((prev) => prev + 10);
                setpage((prev) => prev + 1);
              }
            }
          }
        };
      }
    }
  }, [divcontentRef, divlazyloaderRef]);

  useEffect(() => {
    GetUserEntriesProcess(page, 10);
  }, [page]);

  return (
    <div className="tw-bg-[#d8d8da] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-hidden x-scroll">
      <div className="tw-flex tw-items-center tw-gap-[5px] tw-pt-[10px] tw-pl-[20px] tw-pr-[20px] sm:tw-left-[20px] tw-w-[calc(100%-40px)] tw-h-full tw-min-h-[50px] tw-max-h-[50px]">
        <button
          onClick={() => {
            navigate(`/${params.userID}`);
          }}
          className="tw-z-[10] tw-shadow-lg tw-bg-[#f0f2f5] tw-h-full tw-min-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
        >
          <IoArrowBack
            style={{ fontSize: "20px" }}
            className="tw-text-[#7f7f85]"
          />
        </button>
        <button
          onClick={() => {
            navigate("/");
          }}
          className="tw-z-[10] tw-shadow-lg tw-bg-[#f0f2f5] tw-h-full tw-min-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
        >
          <AiOutlineHome
            style={{ fontSize: "22px" }}
            className="tw-text-[#7f7f85]"
          />
        </button>
        <TypeAnimation
          sequence={[
            // Same substring at the start will only be typed out once, initially
            "Chatterloop Diary 🖊️",
            1000, // wait 1s before replacing "Mice" with "Hamsters"
            "Your Untold Stories 📖",
            1000,
            "Your Crazy Thoughts 🌀",
            1000,
            "Dive Into Your Fun Vault 🎉",
            1000,
            "We wont read it, We swear! 🤫",
            1000,
            "Unless you Share it 😉",
            1000,
            "Chatterloop Diary 🖊️",
            1000,
          ]}
          preRenderFirstString={false}
          wrapper="span"
          speed={80}
          style={{ fontSize: "14px", width: "fit" }}
          className="tw-whitespace-nowrap tw-font-semibold tw-font-Inter tw-pl-[5px]"
          cursor={false}
          // repeat={Infinity}
        />
        <div className="tw-flex tw-h-full tw-flex-1 tw-items-center tw-justify-end">
          {authentication.user.profile === "none" ? (
            <div
              id="img_default_profile_container"
              className="tw-shadow-lg tw-bg-[#f0f2f5] tw-w-[45px] tw-h-[45px] tw-max-w-[45px] tw-max-h-[45px]"
            >
              <CachedImage
                src={DefaultProfile}
                className="tw-w-[60%] tw-h-[60%]"
              />
            </div>
          ) : (
            <CachedImage
              src={authentication.user.profile}
              className="tw-w-[45px] tw-h-[45px] tw-rounded-full tw-shadow-lg tw-bg-[#f0f2f5]"
              id="img_actual_profile"
            />
          )}
        </div>
      </div>
      <div
        className={`tw-h-[calc(100%-90px)] tw-flex tw-items-end tw-pb-[15px] ${
          isMobileView
            ? "tw-pl-[10px] tw-pr-[10px] tw-w-[calc(100%-20px)]"
            : "tw-w-[calc(100%-40px)]"
        } tw-pt-[10px]`}
      >
        <div
          className={`tw-bg-transparent ${
            isMobileView ? "tw-gap-[0px]" : "tw-gap-[7px]"
          } tw-w-full tw-h-full tw-rounded-xl tw-flex`}
        >
          <motion.div
            initial={{
              flex: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? 0
                  : 1
                : 1,
              maxWidth: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? "0px"
                  : "100%"
                : "350px",
            }}
            animate={{
              flex: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? 0
                  : 1
                : 1,
              maxWidth: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? "0px"
                  : "100%"
                : "350px",
            }}
            className="tw-flex tw-flex-col tw-overflow-x-hidden tw-overflow-y-auto t-scroll tw-bg-white tw-rounded-[7px] tw-items-center tw-pb-[15px]"
            ref={divcontentRef}
          >
            <div className="tw-w-[calc(100%-40px)] tw-flex tw-p-[18px] tw-min-h-[30px] tw-pl-[20px] tw-pr-[20px] tw-items-center tw-justify-between">
              <span className="tw-text-[14px] tw-font-Inter tw-font-semibold tw-whitespace-nowrap">
                Your Entries
              </span>
              {(isMobileView || (entry_id !== null && entry_id !== "new")) && (
                <button
                  onClick={() => {
                    navigate(`/${params.userID}/diary?entry_id=new`);
                  }}
                  className="tw-h-[35px] tw-border-none tw-rounded-md tw-pl-[10px] tw-pr-[10px] tw-items-center tw-flex tw-gap-[6px]"
                >
                  <FaPen />
                  <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-cursor-pointer">
                    Write an Entry
                  </span>
                </button>
              )}
            </div>
            <div className="tw-w-[calc(100%-40px)] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
              <div id="div_input_container">
                <AiOutlineSearch
                  style={{ fontSize: "20px", color: "#4A4A4A" }}
                />
                <input
                  id="input_gc_name"
                  type="text"
                  placeholder="Search an entry"
                />
              </div>
            </div>
            {isLoaded ? (
              entries.count > 0 ? (
                <div className="tw-flex tw-flex-col tw-gap-[10px] tw-items-center tw-p-[0px] tw-pl-[20px] tw-pr-[20px] tw-pt-[20px] tw-w-[calc(100%-40px)]">
                  {entriesByDate.map((mp_grouped: { date: string; entries: IEntry[] }, i: number) => {
                    if(mp_grouped.entries.length === 1){
                      const mp = mp_grouped.entries[0];
                      return (
                        <motion.div
                          whileHover={{
                            boxShadow: "0px 0px 5px 0px #808080",
                          }}
                          key={mp.id}
                          onClick={() => {
                            navigate(`/${params.userID}/diary?entry_id=${mp.id}`);
                          }}
                          className="tw-bg-[#eaecef] tw-w-[calc(100%-20px)] tw-rounded-[7px] tw-p-[10px] tw-flex tw-flex-col tw-items-start tw-max-h-[185px] tw-gap-[2px] tw-select-none tw-cursor-pointer"
                        >
                          <div className="tw-w-full tw-flex tw-justify-between tw-pt-[5px] tw-items-center">
                            <span className="tw-text-[14px] tw-font-Inter tw-font-semibold tw-text-left">
                              {mp.title}
                            </span>
                            {mp.mood && (
                              <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-[#5a5a5a] tw-whitespace-nowrap">
                                {mp.mood.emoji} {mp.mood.name}
                              </span>
                            )}
                          </div>
                          {mp.tag_objects.length > 0 && (
                            <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[4px] tw-pt-[10px]">
                              {mp.tag_objects.map((mp: IEntryTag) => {
                                return (
                                  <div
                                    key={mp.id}
                                    className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                                  >
                                    <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-white">
                                      {mp.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <span
                            className="tw-text-[12px] tw-font-Inter tw-text-left tw-overflow-hidden tw-text-ellipsis"
                            dangerouslySetInnerHTML={{ __html: mp.content }}
                          ></span>
                          <div className="tw-w-full tw-flex tw-pt-[10px] tw-pb-[5px]">
                            <span className="tw-text-[11px] span_messages_list_name tw-text-[#5a5a5a]">
                              {formattedDateToWords(mp.entry_date, "YYYY-MM-DD")}
                            </span>
                          </div>
                        </motion.div>
                      );
                    } else {
                      const tag_objects = mp_grouped.entries
                      .map((entr: IEntry) => entr.tag_objects)
                      .flat()
                      .filter((tag, index, self) => 
                        index === self.findIndex(t => t.id === tag.id)
                      );
                      return(
                        <motion.div
                          key={i}
                          className="tw-bg-[#eaecef] tw-w-[calc(100%-20px)] tw-rounded-[7px] tw-p-[10px] tw-flex tw-flex-col tw-items-start tw-min-h-[185px] tw-gap-[2px] tw-select-none tw-cursor-pointer"
                        >
                          <div className="tw-w-full tw-flex tw-justify-between tw-pt-[5px] tw-items-center">
                            <span className="tw-text-[14px] tw-font-Inter tw-font-semibold tw-text-left">
                              {formattedDateToWords(mp_grouped.date, "YYYY-MM-DD")}
                            </span>
                          </div>
                          {tag_objects.length > 0 && (
                            <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[4px] tw-pt-[10px] tw-pb-[10px]">
                              {tag_objects.map((mp: IEntryTag) => {
                                return (
                                  <div
                                    key={mp.id}
                                    className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                                  >
                                    <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-white">
                                      {mp.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="tw-w-full tw-flex tw-flex-col tw-gap-[4px]">
                            {mp_grouped.entries.map((mp: IEntry) => {
                              return(
                                <motion.div
                                  whileHover={{
                                    boxShadow: "0px 0px 5px 0px #808080",
                                  }}
                                  key={mp.id}
                                  onClick={() => {
                                    navigate(`/${params.userID}/diary?entry_id=${mp.id}`);
                                  }}
                                  className="tw-min-h-[0px] tw-bg-white tw-w-[calc(100%-20px)] tw-rounded-[7px] tw-p-[10px] tw-flex tw-flex-col tw-items-start tw-max-h-[185px] tw-gap-[2px] tw-select-none tw-cursor-pointer"
                                >
                                  <div className="tw-w-full tw-flex tw-justify-between tw-pt-[0px] tw-items-center">
                                    <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-left">
                                      {mp.title}
                                    </span>
                                    {mp.mood && (
                                      <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-[#5a5a5a] tw-whitespace-nowrap">
                                        {mp.mood.emoji} {mp.mood.name}
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              )
                            })}
                          </div>
                          <div className="tw-w-full tw-flex tw-pt-[10px] tw-pb-[5px]">
                            <span className="tw-text-[11px] span_messages_list_name tw-text-[#5a5a5a]">
                              {mp_grouped.entries.length} entries
                            </span>
                          </div>
                        </motion.div>
                      )
                    }
                  })}
                </div>
              ) : (
                <div className="tw-flex tw-flex-col tw-gap-[10px] tw-items-center tw-pt-[50px]">
                  <TbBookOff size={70} color="#808080" />
                  <span className="tw-text-[12px] tw-font-Inter tw-font-normal tw-text-[#808080]">
                    No Entries Made Yet
                  </span>
                </div>
              )
            ) : (
              <div className="tw-flex tw-flex-col tw-gap-[10px] tw-items-center tw-p-[0px] tw-pl-[20px] tw-pr-[20px] tw-pt-[10px] tw-w-[calc(100%-40px)]">
                {Array.from({ length: 3 }).map((_, i: number) => {
                  return (
                    <div
                      key={i}
                      className="tw-bg-[#eaecef] tw-w-[calc(100%-20px)] tw-rounded-[7px] tw-p-[10px] tw-flex tw-flex-col tw-items-start tw-max-h-[185px] tw-gap-[2px]"
                    >
                      <div className="tw-w-full tw-flex tw-justify-between tw-pt-[5px] tw-items-center">
                        <Skeleton
                          containerClassName="tw-w-full tw-max-w-[150px]"
                          height={"22px"}
                          className="tw-text-[14px] tw-font-Inter tw-font-semibold tw-text-left tw-w-full"
                          baseColor="rgb(210, 210, 210)"
                        />
                        <Skeleton
                          width="80px"
                          height={"22px"}
                          className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-[#5a5a5a] tw-whitespace-nowrap"
                          baseColor="rgb(210, 210, 210)"
                        />
                      </div>
                      <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[4px] tw-pt-[10px]">
                        <Skeleton
                          width={"60px"}
                          className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                          baseColor="rgb(210, 210, 210)"
                        />
                        <Skeleton
                          width={"60px"}
                          className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                          baseColor="rgb(210, 210, 210)"
                        />
                        <Skeleton
                          width={"60px"}
                          className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                          baseColor="rgb(210, 210, 210)"
                        />
                      </div>
                      <div className="tw-w-[calc(100%-20px)] tw-pt-[8px]">
                        <Skeleton
                          height={"12px"}
                          className="tw-p-[4px] tw-mt-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                          baseColor="rgb(210, 210, 210)"
                          count={3}
                        />
                      </div>
                      <div className="tw-w-full tw-flex tw-pt-[10px] tw-pb-[5px]">
                        <Skeleton
                          height={"12px"}
                          width={"100px"}
                          className="tw-text-[11px] span_messages_list_name tw-text-[#5a5a5a]"
                          baseColor="rgb(210, 210, 210)"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {entries.next && (
              <div
                ref={divlazyloaderRef}
                className="tw-flex tw-flex-col tw-gap-[10px] tw-items-center tw-p-[0px] tw-pl-[20px] tw-pr-[20px] tw-pt-[10px] tw-w-[calc(100%-40px)]"
              >
                {Array.from({ length: 3 }).map((_, i: number) => {
                  return (
                    <div
                      key={i}
                      className="tw-bg-[#eaecef] tw-w-[calc(100%-20px)] tw-rounded-[7px] tw-p-[10px] tw-flex tw-flex-col tw-items-start tw-max-h-[185px] tw-gap-[2px]"
                    >
                      <div className="tw-w-full tw-flex tw-justify-between tw-pt-[5px] tw-items-center">
                        <Skeleton
                          containerClassName="tw-w-full tw-max-w-[150px]"
                          height={"22px"}
                          className="tw-text-[14px] tw-font-Inter tw-font-semibold tw-text-left tw-w-full"
                          baseColor="rgb(210, 210, 210)"
                        />
                        <Skeleton
                          width="80px"
                          height={"22px"}
                          className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-[#5a5a5a] tw-whitespace-nowrap"
                          baseColor="rgb(210, 210, 210)"
                        />
                      </div>
                      <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[4px] tw-pt-[10px]">
                        <Skeleton
                          width={"60px"}
                          className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                          baseColor="rgb(210, 210, 210)"
                        />
                        <Skeleton
                          width={"60px"}
                          className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                          baseColor="rgb(210, 210, 210)"
                        />
                        <Skeleton
                          width={"60px"}
                          className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                          baseColor="rgb(210, 210, 210)"
                        />
                      </div>
                      <div className="tw-w-[calc(100%-20px)] tw-pt-[8px]">
                        <Skeleton
                          height={"12px"}
                          className="tw-p-[4px] tw-mt-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                          baseColor="rgb(210, 210, 210)"
                          count={3}
                        />
                      </div>
                      <div className="tw-w-full tw-flex tw-pt-[10px] tw-pb-[5px]">
                        <Skeleton
                          height={"12px"}
                          width={"100px"}
                          className="tw-text-[11px] span_messages_list_name tw-text-[#5a5a5a]"
                          baseColor="rgb(210, 210, 210)"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{
              flex: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? 1
                  : 0
                : 1,
              maxWidth: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? "100%"
                  : "0px"
                : "none",
            }}
            animate={{
              flex: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? 1
                  : 0
                : 1,
              maxWidth: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? "100%"
                  : "0px"
                : "none",
            }}
            className="tw-flex tw-flex-col tw-gap-[15px] tw-overflow-x-hidden tw-overflow-y-auto t-scroll tw-bg-white tw-rounded-[7px] tw-items-center"
          >
            {entry_id === null || entry_id === "new" ? (
              <NewEntry
                reload={(new_entry: IEntry) => {
                  setentries((prev: PaginationProp<IEntry>) => {
                    const combinedList = [new_entry, ...prev.results];
                    const uniqueById = combinedList.filter(
                      (obj, index, self) =>
                        index === self.findIndex((t) => t.id === obj.id),
                    );

                    return {
                      ...prev,
                      results: uniqueById,
                    };
                  });
                }}
              />
            ) : (
              <EntryView />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Diary;
