/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { useSelector } from "react-redux";

function SavedPostItemLoader() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  return (
    <div className=" tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-w-[calc(100%-40px)] tw-p-[20px] tw-pb-[20px] tw-flex tw-flex-col tw-gap-[10px]">
      <div
        style={{
          borderWidth: "0px",
        }}
        className=" tw-bg-white tw-border-solid tw-border-[#d2d2d2] tw-rounded-[7px] tw-w-[calc(100%-40px)] tw-p-[0px] tw-pb-[0px] tw-flex tw-flex-row tw-gap-[10px]"
      >
        {isMobileView ? (
          <Skeleton
            className="tw-max-w-full"
            containerClassName="tw-w-[85px] tw-h-[85px]"
            height="85px"
            baseColor="rgb(210, 210, 210)"
            count={1}
          />
        ) : (
          <Skeleton
            className="tw-max-w-full"
            containerClassName="tw-w-[120px] tw-h-[120px]"
            height="120px"
            baseColor="rgb(210, 210, 210)"
            count={1}
          />
        )}
        <div className="tw-flex tw-flex-col tw-flex-1 tw-items-start">
          <div className="tw-flex tw-flex-col tw-gap-[5px] tw-p-[5px] tw-items-start tw-flex-1 tw-w-full">
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-full"
              //   width="100%"
              height="17px"
              baseColor="rgb(210, 210, 210)"
              count={1}
            />
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-[150px]"
              //   width="100%"
              height="12px"
              baseColor="rgb(210, 210, 210)"
              count={1}
            />
          </div>
          <div className="tw-pl-[5px] tw-flex tw-gap-[6px]">
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-[70px]"
              //   width="100%"
              height="25px"
              baseColor="rgb(210, 210, 210)"
              count={1}
            />
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-[70px]"
              //   width="100%"
              height="25px"
              baseColor="rgb(210, 210, 210)"
              count={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SavedPostItemLoader;
