/* eslint-disable @typescript-eslint/no-unused-vars */
import { Fragment, useMemo } from "react";
import { RiPagesFill } from "react-icons/ri";
import { useSelector } from "react-redux";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import MyPagesList from "./MyPagesList";
import { IoIosArrowForward } from "react-icons/io";
import { motion } from "framer-motion";
import CreatePage from "./CreatePage";

/* eslint-disable @typescript-eslint/no-explicit-any */
function MyPages() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const location = useLocation();

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
            <div
              className={`tw-w-full tw-flex tw-justify-between tw-h-[34px] ${isMobileView && "tw-items-center"}`}
            >
              <div className="tw-flex tw-flex-wrap tw-flex-1 tw-gap-[5px] tw-items-center tw-h-fit">
                <span
                  className={`${
                    isMobileView ? "tw-text-[14px]" : "tw-text-[16px]"
                  } tw-font-Inter tw-font-semibold`}
                >
                  My Pages
                </span>
                {location.pathname.includes("/create") && (
                  <Fragment>
                    <IoIosArrowForward size={20} />
                    <span
                      className={`${
                        isMobileView ? "tw-text-[14px]" : "tw-text-[16px]"
                      } tw-font-Inter tw-font-semibold`}
                    >
                      Create
                    </span>
                  </Fragment>
                )}
              </div>
              {!location.pathname.includes("/create") && (
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
              )}
              {location.pathname.includes("/create") && (
                <button
                  id="btn_cancel_create_page"
                  onClick={() => {
                    navigate("/pages/my-pages");
                  }}
                >
                  <span id="span_btn_label" className="tw-font-Inter">
                    Cancel
                  </span>
                </button>
              )}
            </div>
            <Routes>
              <Route path="/" element={<MyPagesList />} />
              <Route path="/create" element={<CreatePage />} />
            </Routes>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MyPages;
