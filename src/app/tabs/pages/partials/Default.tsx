/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ServerItemLoader from "@/app/reusables/loaders/ServerItemLoader";
import GenericRealmItem from "@/app/widgets/items/GenericRealmItem";
import { genericpaginationstate } from "@/redux/actions/states";
import { GetTopRealmsRequest } from "@/reusables/hooks/requests";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { PaginationProp } from "@/reusables/vars/props";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { RiPagesLine } from "react-icons/ri";
import { useSelector } from "react-redux";

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
      "page",
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

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFetch = useCallback(
    (currentPage: number, searchValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (searchValue.trim() !== "") {
          setisLoaded(false);
          GetTopRealmsRequest(currentPage, 10, "page", searchValue)
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
    <div className="tw-w-full tw-h-full tw-flex tw-justify-center tw-items-stretch">
      <div
        id="div_pages_list"
        className="tw-w-full tw-h-full tw-min-h-0 tw-flex tw-flex-col tw-overflow-hidden tw-bg-[var(--surface)]"
      >
        <div className="cl-pages-page__hero tw-w-full tw-bg-[var(--surface)] tw-px-[18px] tw-py-[18px] sm:tw-px-[28px] sm:tw-py-[26px]">
          <div className="cl-pages-page__hero-copy">
            <span className="cl-pages-page__eyebrow">Pages</span>
            <span
              className={`${
                isMobileView ? "tw-text-[20px]" : "tw-text-[28px]"
              } tw-font-Inter tw-font-semibold tw-leading-[1.05] tw-text-[var(--text)]`}
            >
              Welcome to Chatterloop Pages
            </span>
            <span
              className={`${
                isMobileView ? "tw-text-[11px]" : "tw-text-[13px]"
              } tw-font-Inter tw-text-[var(--text-2)] tw-max-w-[680px]`}
            >
              Discover, interact, and manage pages within your reach.
            </span>
          </div>
          <div className="cl-pages-page__search-shell">
            <div id="div_search_container">
              <div id="div_input_container">
                <AiOutlineSearch
                  style={{ fontSize: "20px", color: "var(--brand)" }}
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
        <div className="tw-flex-1 tw-min-h-0 tw-overflow-y-auto x-scroll tw-bg-[var(--surface-2)]">
          <div className="tw-w-full tw-flex tw-flex-col tw-gap-[18px] tw-p-[18px] sm:tw-p-[24px]">
            <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[20px]">
              <span
                className={`${
                  isMobileView ? "tw-text-[14px]" : "tw-text-[16px]"
                } tw-font-Inter tw-font-semibold tw-text-[var(--text)]`}
              >
                Pages you may know
              </span>
              <div className="tw-w-full tw-flex tw-justify-center tw-gap-[12px] tw-flex-wrap tw-pb-[20px]">
                {isLoaded ? (
                  pages.results.length === 0 ? (
                    <div className="tw-w-full tw-min-h-[320px] tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[10px] tw-py-[48px] tw-text-center">
                      <RiPagesLine
                        style={{
                          fontSize: isMobileView ? "80px" : "80px",
                          color: "var(--brand)",
                        }}
                      />
                      <div className="tw-flex tw-flex-col tw-gap-[5px] tw-max-w-[340px]">
                        <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                          No Pages yet
                        </span>
                        <span className="tw-text-[14px] tw-font-Inter tw-text-[var(--text-2)]">
                          Create your page and start building a community.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="tw-w-full tw-flex tw-flex-wrap tw-justify-center tw-gap-[12px]">
                      {pages.results.map((mp: IRealmProfileInfo) => (
                        <GenericRealmItem
                          key={mp.id}
                          mp={mp}
                          refresh={GetTopRealmsProcess}
                          flexed={false}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="tw-w-full tw-flex tw-flex-wrap tw-justify-center tw-gap-[12px]">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <ServerItemLoader key={i} flexed={false} />
                    ))}
                  </div>
                )}
                {isLoaded && isPaginating && (
                  <div className="tw-w-full tw-flex tw-flex-wrap tw-justify-center tw-gap-[12px]">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <ServerItemLoader key={i} flexed={false} />
                    ))}
                  </div>
                )}
                {pages.next && (
                  <div className="tw-w-full tw-flex tw-justify-center tw-pb-[8px]">
                <button
                  onClick={() => {
                    setcurrentPage((prev) => prev + 1);
                    setisPaginating(true);
                  }}
                  className="cl-pages-accent-button--ghost tw-min-w-[110px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-[1px] tw-border-solid tw-p-[8px] tw-pl-[14px] tw-pr-[14px] tw-text-[12px]"
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
    </div>
  );
}

export default Default;
