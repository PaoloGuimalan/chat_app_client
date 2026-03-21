/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState } from "react";
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

  const [pages, _setpages] = useState<any[]>([]);

  return (
    <div className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-center tw-pt-[15px] tw-pb-[10px] tw-pr-[7px]">
      <div className="tw-rounded-[10px] tw-shadow-lg tw-bg-white tw-flex tw-flex-col tw-items-center tw-justify-start tw-w-full tw-h-full tw-overflow-y-scroll x-scroll">
        <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center">
          <div className="tw-w-full tw-flex tw-flex-col tw-max-w-[calc(100%-80px)] tw-items-start tw-gap-[20px] tw-p-[40px] tw-pt-[35px]">
            <div className="tw-w-full tw-flex tw-justify-between tw-min-h-[34px]">
              <span
                className={`${
                  isMobileView ? "tw-text-[14px]" : "tw-text-[16px]"
                } tw-font-Inter tw-font-semibold`}
              >
                Followed Pages
              </span>
            </div>
            {pages.length === 0 && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FollowedPages;
