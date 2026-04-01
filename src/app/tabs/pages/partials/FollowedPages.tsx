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
    <div className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-center tw-pt-[15px] tw-pb-[10px] tw-pr-[7px]">
      <div className="tw-rounded-[10px] tw-shadow-lg tw-bg-white tw-flex tw-flex-col tw-items-center tw-justify-start tw-w-full tw-h-full tw-overflow-y-scroll x-scroll">
        <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center">
          <div
            className={`tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[20px] ${isMobileView ? "tw-max-w-[calc(100%-30px)] tw-p-[20px] tw-pt-[15px] tw-pr-[10px]" : "tw-max-w-[calc(100%-80px)] tw-p-[40px] tw-pt-[35px]"}`}
          >
            <div
              className={`tw-w-full tw-flex tw-justify-between tw-h-[34px] ${isMobileView && "tw-items-center"}`}
            >
              <span
                className={`${
                  isMobileView ? "tw-text-[14px]" : "tw-text-[16px]"
                } tw-font-Inter tw-font-semibold`}
              >
                Followed Pages
              </span>
            </div>
            {isLoaded ? (
              pages.results.length === 0 ? (
                <div className="tw-w-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[10px] tw-pb-[20px] tw-pt-[120px]">
                  <RiPagesLine
                    style={{
                      fontSize: isMobileView ? "80px" : "120px",
                      color: "#7f7f85",
                    }}
                  />
                  <div className="tw-flex tw-flex-col tw-gap-[5px]">
                    <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[#7f7f85]">
                      No Followed Pages yet
                    </span>
                    <span className="tw-text-[14px] tw-font-Inter tw-text-[#7f7f85]">
                      Explore contents and pages to get started.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[10px]">
                  {pages.results.map((mp: IRealmProfileInfo) => {
                    return (
                      <GenericRealmItem
                        key={mp.id}
                        mp={mp}
                        refresh={GetFollowedPagesProcess}
                      />
                    );
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
  );
}

export default FollowedPages;
