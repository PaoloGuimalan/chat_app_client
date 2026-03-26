/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { RiPagesFill, RiPagesLine } from "react-icons/ri";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function MyPagesList() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const [pages, _setpages] = useState<any[]>([]);

  const navigate = useNavigate();

  return (
    <motion.div
      initial={{
        paddingLeft:
          screensizelistener.W <= 900
            ? location.pathname.split("/").length < 4
              ? "0px"
              : "7px"
            : "0px",
      }}
      animate={{
        paddingLeft:
          screensizelistener.W <= 900
            ? location.pathname.split("/").length < 4
              ? "0px"
              : "7px"
            : "0px",
      }}
      className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-center tw-pt-[15px] tw-pb-[10px] tw-pr-[7px]"
    >
      <div className="tw-rounded-[10px] tw-shadow-lg tw-bg-white tw-flex tw-flex-col tw-items-center tw-justify-start tw-w-full tw-h-full tw-overflow-y-scroll x-scroll">
        <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center">
          <div
            className={`tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[20px] ${isMobileView ? "tw-max-w-[calc(100%-30px)] tw-p-[20px] tw-pt-[15px] tw-pr-[10px]" : "tw-max-w-[calc(100%-80px)] tw-p-[40px] tw-pt-[35px]"}`}
          >
            <div className={`tw-w-full tw-flex tw-justify-between tw-h-[34px]`}>
              <div
                className={`tw-flex tw-flex-wrap tw-flex-1 tw-gap-[5px] tw-justify-between tw-h-fit ${isMobileView && "tw-items-center"}`}
              >
                <span
                  className={`${
                    isMobileView ? "tw-text-[14px]" : "tw-text-[16px]"
                  } tw-font-Inter tw-font-semibold`}
                >
                  My Pages
                </span>
                <button
                  id="btn_create_page"
                  onClick={() => {
                    navigate("/pages/my-pages/create");
                  }}
                >
                  <RiPagesFill style={{ fontSize: "20px" }} />
                  <span id="span_btn_label" className="tw-font-Inter">
                    Create Page
                  </span>
                </button>
              </div>
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
    </motion.div>
  );
}

export default MyPagesList;
