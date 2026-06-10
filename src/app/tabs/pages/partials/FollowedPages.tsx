/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import ServerItemLoader from "@/app/reusables/loaders/ServerItemLoader";
import GenericRealmItem from "@/app/widgets/items/GenericRealmItem";
import { genericpaginationstate } from "@/redux/actions/states";
import { GetFollowRealmRequest } from "@/reusables/hooks/requests";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { PaginationProp } from "@/reusables/vars/props";
import { useEffect, useMemo, useState } from "react";
import { RiPagesLine } from "react-icons/ri";
import { useSelector } from "react-redux";

/* eslint-disable @typescript-eslint/no-explicit-any */
function FollowedPages() {
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

  const GetFollowedPagesProcess = (callback?: () => void) => {
    GetFollowRealmRequest(currentPage, 10, "page")
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
    GetFollowedPagesProcess();
  }, [currentPage]);

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-justify-center tw-items-stretch">
      <div className="tw-w-full tw-h-full tw-min-h-0 tw-flex tw-flex-col tw-overflow-hidden tw-bg-[var(--surface)]">
        <div className="cl-pages-page__hero tw-w-full tw-bg-[var(--surface)] tw-px-[18px] tw-py-[18px] sm:tw-px-[28px] sm:tw-py-[26px]">
          <div className="cl-pages-page__hero-copy">
            <span className="cl-pages-page__eyebrow">Pages</span>
            <span
              className={`${
                isMobileView ? "tw-text-[20px]" : "tw-text-[28px]"
              } tw-font-Inter tw-font-semibold tw-leading-[1.05] tw-text-[var(--text)]`}
            >
              Followed Pages
            </span>
            <span
              className={`${
                isMobileView ? "tw-text-[11px]" : "tw-text-[13px]"
              } tw-font-Inter tw-text-[var(--text-2)] tw-max-w-[680px]`}
            >
              Keep up with the pages you already follow.
            </span>
          </div>
        </div>
        <div className="tw-flex-1 tw-min-h-0 tw-overflow-y-auto x-scroll tw-bg-[var(--surface-2)]">
          <div className="tw-w-full tw-flex tw-flex-col tw-gap-[18px] tw-p-[18px] sm:tw-p-[24px]">
            {isLoaded ? (
              pages.results.length === 0 ? (
                <div className="tw-w-full tw-min-h-[320px] tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[10px] tw-py-[48px] tw-text-center">
                  <RiPagesLine
                    style={{
                      fontSize: isMobileView ? "80px" : "120px",
                      color: "var(--brand)",
                    }}
                  />
                  <div className="tw-flex tw-flex-col tw-gap-[5px] tw-max-w-[340px]">
                    <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                      No Followed Pages yet
                    </span>
                    <span className="tw-text-[14px] tw-font-Inter tw-text-[var(--text-2)]">
                      Explore contents and pages to get started.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="tw-w-full tw-flex tw-flex-wrap tw-justify-center tw-gap-[12px]">
                  {pages.results.map((mp: IRealmProfileInfo) => (
                    <GenericRealmItem
                      key={mp.id}
                      mp={mp}
                      refresh={GetFollowedPagesProcess}
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
  );
}

export default FollowedPages;
