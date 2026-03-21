/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
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

  const [pages, _setpages] = useState<any[]>([]);

  return (
    <div className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-center tw-pt-[15px] tw-pb-[10px] tw-pr-[7px]">
      <div
        id="div_pages_list"
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
            Welcome to Chatterloop Pages
          </span>
          <span
            className={`${
              isMobileView
                ? "tw-text-[12px] tw-pl-[20px] tw-pr-[20px]"
                : "tw-text-[14px]"
            } tw-font-Inter`}
          >
            Discover, Interact, and Manage pages within your reach
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
                  // value={searchbox}
                  autoComplete="off"
                  onChange={() => {
                    // setsearchbox(e.target.value);
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
              Pages you may know
            </span>
            {pages.length === 0 && (
              <div className="tw-w-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[10px] tw-pb-[20px] tw-pt-[80px]">
                <RiPagesLine
                  style={{
                    fontSize: isMobileView ? "80px" : "80px",
                    color: "#7f7f85",
                  }}
                />
                <div className="tw-flex tw-flex-col tw-gap-[5px]">
                  <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[#7f7f85]">
                    No Pages yet
                  </span>
                  <span className="tw-text-[14px] tw-font-Inter tw-text-[#7f7f85]">
                    Create your page and start building a community.
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

export default Default;
