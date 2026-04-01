/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetTopRealmsRequest } from "@/reusables/hooks/requests";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import ServerItemLoader from "@/app/reusables/loaders/ServerItemLoader";
import PublicServerItem from "@/app/widgets/items/PublicServerItem";
import { useSelector } from "react-redux";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { RiPagesLine } from "react-icons/ri";
import { PaginationProp } from "@/reusables/vars/props";
import { genericpaginationstate } from "@/redux/actions/states";

function Default() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const [pages, setpages] = useState<PaginationProp<IRealmProfileInfo>>(
    genericpaginationstate,
  );
  const [isLoaded, setisLoaded] = useState<boolean>(false);
  const [isPaginating, setisPaginating] = useState<boolean>(false);
  const [currentPage, setcurrentPage] = useState<number>(1);
  const [searchbox, setsearchbox] = useState<string>("");

  const GetTopRealmsProcess = (callback?: () => void) => {
    GetTopRealmsRequest(
      currentPage,
      10,
      "server",
      searchbox.trim() === "" ? null : searchbox,
    )
      .then((response) => {
        setpages((prev) => {
          const prevIds = new Set(prev.results.map((item) => item.id));
          const newItems = response.results.filter(
            (item: IRealmProfileInfo) => !prevIds.has(item.id),
          );

          return {
            ...response,
            results: [...prev.results, ...newItems],
          };
        });
        setisLoaded(true);
        setisPaginating(false);
        if (callback) {
          callback();
        }
      })
      .catch((err) => {
        setisLoaded(true);
        setisPaginating(false);
        console.log(err);
      });
  };

  useEffect(() => {
    GetTopRealmsProcess();
  }, [currentPage]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFetch = useCallback(
    (currentPage: number, searchValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (searchValue.trim() !== "") {
          setisLoaded(false); // optional: show loading at start
          GetTopRealmsRequest(currentPage, 10, "server", searchValue)
            .then((response) => {
              setpages(response);
              setisLoaded(true);
              setisPaginating(false);
            })
            .catch((err) => {
              setisLoaded(true);
              setisPaginating(false);
              console.log(err);
            });
        } else {
          GetTopRealmsProcess();
        }
      }, 500);
    },
    [],
  );

  return (
    <div className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-center tw-pt-[15px] tw-pb-[10px] tw-pr-[7px]">
      <div
        id="div_server_list"
        className="tw-rounded-[10px] tw-shadow-lg tw-bg-white tw-flex tw-flex-col tw-items-center tw-justify-start tw-w-full tw-h-full tw-overflow-y-scroll x-scroll"
      >
        <div className="tw-w-full tw-flex tw-flex-col tw-pt-[40px] tw-h-[40%] tw-min-h-[40%] tw-items-center tw-justify-center">
          <span
            className={`${
              isMobileView
                ? "tw-text-[16px] tw-pl-[20px] tw-pr-[20px]"
                : "tw-text-[20px]"
            } tw-font-Inter tw-font-semibold tw-text-[#333333]`}
          >
            Welcome to Chatterloop Servers
          </span>
          <span
            className={`${
              isMobileView
                ? "tw-text-[12px] tw-pl-[20px] tw-pr-[20px]"
                : "tw-text-[14px]"
            } tw-font-Inter`}
          >
            Discover something new, explore the Realms of Chatterloop.
          </span>
          <div
            className={`${
              isMobileView
                ? "tw-pl-[20px] tw-pr-[20px] tw-w-[calc(100%-40px)]"
                : "tw-w-full"
            } tw-max-w-[500px] tw-pt-[20px]`}
          >
            <div id="div_search_container">
              <div id="div_input_container">
                <AiOutlineSearch
                  style={{ fontSize: "20px", color: "#4A4A4A" }}
                />
                <input
                  value={searchbox}
                  autoComplete="off"
                  onChange={(e) => {
                    setsearchbox(e.target.value);
                    debouncedFetch(1, e.target.value);
                  }}
                  type="text"
                  placeholder="Search something..."
                  id="input_search_box"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center">
          <div className="tw-w-full tw-flex tw-flex-col tw-max-w-[90%] tw-items-start tw-gap-[20px]">
            <span
              className={`${
                isMobileView ? "tw-text-[14px]" : "tw-text-[16px]"
              } tw-font-Inter tw-font-semibold`}
            >
              Top Servers
            </span>
            <div className="tw-w-full tw-flex tw-justify-evenly tw-gap-[10px] tw-flex-wrap tw-pb-[20px]">
              {isLoaded ? (
                pages.results.length === 0 ? (
                  <div className="tw-w-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[10px] tw-pb-[20px] tw-pt-[80px]">
                    <RiPagesLine
                      style={{
                        fontSize: isMobileView ? "80px" : "80px",
                        color: "#7f7f85",
                      }}
                    />
                    <div className="tw-flex tw-flex-col tw-gap-[5px]">
                      <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[#7f7f85]">
                        No servers yet
                      </span>
                      <span className="tw-text-[14px] tw-font-Inter tw-text-[#7f7f85]">
                        Create your server and start building a community.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[10px]">
                    {pages.results.map((mp: IRealmProfileInfo) => {
                      return <PublicServerItem key={mp.id} mp={mp} />;
                    })}
                  </div>
                )
              ) : (
                <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[10px]">
                  {Array.from({ length: 20 }).map((_, i) => {
                    return <ServerItemLoader key={i} />;
                  })}
                </div>
              )}
              {isLoaded && isPaginating && (
                <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[10px]">
                  {Array.from({ length: 10 }).map((_, i) => {
                    return <ServerItemLoader key={i} />;
                  })}
                </div>
              )}
              {pages.next && (
                <div className="tw-w-full tw-flex tw-justify-center">
                  <button
                    onClick={() => {
                      setcurrentPage((prev) => prev + 1);
                      setisPaginating(true);
                    }}
                    className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-[1px] tw-border-solid tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-white tw-text-[#404040] tw-border-[#404040] tw-rounded-[6px] tw-text-[12px]"
                  >
                    Load more
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Default;
