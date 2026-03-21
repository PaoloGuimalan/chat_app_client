/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { IoArrowBack } from "react-icons/io5";
import { RiPagesFill } from "react-icons/ri";
import { BsFileEarmarkPerson, BsPersonFillAdd } from "react-icons/bs";
import Default from "./partials/Default";
import MyPages from "./partials/MyPages";
import FollowedPages from "./partials/FollowedPages";

function Pages() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const urllocation = useLocation();
  const navigate = useNavigate();

  useEffect(() => {}, []);

  return (
    <div className="tw-w-full tw-h-full tw-bg-[#d8d8da] tw-absolute tw-z-[2] tw-flex tw-flex-row">
      <motion.div
        initial={{
          minWidth:
            screensizelistener.W <= 900
              ? urllocation.pathname.split("/").length < 4
                ? "70px"
                : "0px"
              : "70px",
          width:
            screensizelistener.W <= 900
              ? urllocation.pathname.split("/").length < 4
                ? "70px"
                : "0px"
              : "70px",
        }}
        animate={{
          minWidth:
            screensizelistener.W <= 900
              ? urllocation.pathname.split("/").length < 4
                ? "70px"
                : "0px"
              : "70px",
          width:
            screensizelistener.W <= 900
              ? urllocation.pathname.split("/").length < 4
                ? "70px"
                : "0px"
              : "70px",
        }}
        className="thinscroller tw-bg-[#d8d8da] tw-flex tw-flex-col tw-max-w-[70px] tw-items-center tw-pt-[10px] tw-pb-[10px] tw-overflow-x-hidden tw-overflow-y-auto"
      >
        <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6",
          }}
          onClick={() => {
            navigate("/");
          }}
          className="btn_server_navigations"
        >
          <IoArrowBack style={{ fontSize: "25px", color: "#4997f2" }} />
        </motion.button>
        <motion.button
          whileHover={{
            backgroundColor: "#e6e6e6",
          }}
          onClick={() => {
            navigate("/pages");
          }}
          className="btn_server_navigations"
        >
          <RiPagesFill style={{ fontSize: "25px", color: "#4997f2" }} />
        </motion.button>
        <hr className="tw-w-[65%]" />
        <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[2px]">
          <motion.button
            initial={{
              color: "#404040",
            }}
            animate={{
              backgroundColor: urllocation.pathname.includes("my-pages")
                ? "#e6e6e6"
                : "transparent",
            }}
            whileHover={{
              backgroundColor: "#4997f2",
              color: "#4997f2",
            }}
            onClick={() => {
              navigate(`/pages/my-pages`);
            }}
            title={"My Pages"}
            className="btn_server_navigations"
          >
            <div id="div_img_cncts_container">
              <div id="div_img_search_profiles_container_cncts">
                <BsFileEarmarkPerson style={{ fontSize: "25px" }} />
              </div>
            </div>
          </motion.button>
          <motion.button
            initial={{
              color: "#404040",
            }}
            animate={{
              backgroundColor: urllocation.pathname.includes("followed")
                ? "#e6e6e6"
                : "transparent",
            }}
            whileHover={{
              backgroundColor: "#4997f2",
              color: "#4997f2",
            }}
            onClick={() => {
              navigate(`/pages/followed`);
            }}
            title={"Followed Pages"}
            className="btn_server_navigations"
          >
            <div id="div_img_cncts_container">
              <div id="div_img_search_profiles_container_cncts">
                <BsPersonFillAdd style={{ fontSize: "25px" }} />
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>
      <Routes>
        <Route path="/" element={<Default />} />
        <Route path="/my-pages/*" element={<MyPages />} />
        <Route path="/followed" element={<FollowedPages />} />
      </Routes>
    </div>
  );
}

export default Pages;
