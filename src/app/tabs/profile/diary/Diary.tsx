/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { AiOutlineHome, AiOutlineSearch } from "react-icons/ai";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { useMemo } from "react";
import { motion } from "framer-motion";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FaPen } from "react-icons/fa6";
import { FaSave } from "react-icons/fa";
import { BiSolidImageAdd } from "react-icons/bi";
import { MdImageNotSupported } from "react-icons/md";
import { TbBookOff } from "react-icons/tb";

function Diary() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener]
  );

  const [searchParams] = useSearchParams();

  const entry_id = searchParams.get("entry_id");

  const navigate = useNavigate();

  const toolbarOptions = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ direction: "rtl" }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["clean"],
    [
      "link",
      // 'image',
      // 'video'
    ],
  ];

  const modules = {
    toolbar: toolbarOptions,
  };

  return (
    <div className="tw-bg-[#d8d8da] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-hidden x-scroll">
      <div className="tw-flex tw-items-center tw-gap-[5px] tw-pt-[10px] tw-pl-[20px] tw-pr-[20px] sm:tw-left-[20px] tw-w-[calc(100%-40px)] tw-h-full tw-max-h-[50px]">
        <button
          onClick={() => {
            navigate(`/${authentication.user.userID}`);
          }}
          className="tw-z-[10] tw-shadow-lg tw-bg-[#f0f2f5] tw-h-full tw-min-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
        >
          <IoArrowBack
            style={{ fontSize: "20px" }}
            className="tw-text-[#7f7f85]"
          />
        </button>
        <button
          onClick={() => {
            navigate("/");
          }}
          className="tw-z-[10] tw-shadow-lg tw-bg-[#f0f2f5] tw-h-full tw-min-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
        >
          <AiOutlineHome
            style={{ fontSize: "22px" }}
            className="tw-text-[#7f7f85]"
          />
        </button>
        <TypeAnimation
          sequence={[
            // Same substring at the start will only be typed out once, initially
            "Chatterloop Diary 🖊️",
            1000, // wait 1s before replacing "Mice" with "Hamsters"
            "Your Untold Stories 📖",
            1000,
            "Your Crazy Thoughts 🌀",
            1000,
            "Dive Into Your Fun Vault 🎉",
            1000,
            "We wont read it, We swear! 🤫",
            1000,
            "Unless you Share it 😉",
            1000,
            "Chatterloop Diary 🖊️",
            1000,
          ]}
          preRenderFirstString={false}
          wrapper="span"
          speed={80}
          style={{ fontSize: "14px", width: "fit" }}
          className="tw-whitespace-nowrap tw-font-semibold tw-font-Inter tw-pl-[5px]"
          cursor={false}
          // repeat={Infinity}
        />
        <div className="tw-flex tw-h-full tw-flex-1 tw-items-center tw-justify-end">
          {authentication.user.profile === "none" ? (
            <div
              id="img_default_profile_container"
              className="tw-shadow-lg tw-bg-[#f0f2f5] tw-w-[45px] tw-h-[45px] tw-max-w-[45px] tw-max-h-[45px]"
            >
              <CachedImage
                src={DefaultProfile}
                className="tw-w-[60%] tw-h-[60%]"
              />
            </div>
          ) : (
            <CachedImage
              src={authentication.user.profile}
              className="tw-w-[45px] tw-h-[45px] tw-rounded-full tw-shadow-lg tw-bg-[#f0f2f5]"
            />
          )}
        </div>
      </div>
      <div
        className={`tw-h-[calc(100%-90px)] tw-flex tw-items-end tw-pb-[15px] ${
          isMobileView
            ? "tw-pl-[10px] tw-pr-[10px] tw-w-[calc(100%-20px)]"
            : "tw-w-[calc(100%-40px)]"
        } tw-pt-[10px]`}
      >
        <div
          className={`tw-bg-transparent ${
            isMobileView ? "tw-gap-[0px]" : "tw-gap-[7px]"
          } tw-w-full tw-h-full tw-rounded-xl tw-flex`}
        >
          <motion.div
            initial={{
              flex: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? 0
                  : 1
                : 1,
              maxWidth: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? "0px"
                  : "100%"
                : "350px",
            }}
            animate={{
              flex: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? 0
                  : 1
                : 1,
              maxWidth: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? "0px"
                  : "100%"
                : "350px",
            }}
            className="tw-flex tw-flex-col tw-overflow-x-hidden tw-overflow-y-auto t-scroll tw-bg-white tw-rounded-[7px] tw-items-center"
          >
            <div className="tw-w-[calc(100%-40px)] tw-flex tw-p-[18px] tw-h-[30px] tw-pl-[20px] tw-pr-[20px] tw-items-center tw-justify-between">
              <span className="tw-text-[14px] tw-font-Inter tw-font-semibold tw-whitespace-nowrap">
                Your Entries
              </span>
              {(isMobileView || (entry_id !== null && entry_id !== "new")) && (
                <button
                  onClick={() => {
                    navigate(
                      `/${authentication.user.userID}/diary?entry_id=new`
                    );
                  }}
                  className="tw-h-[35px] tw-border-none tw-rounded-md tw-pl-[10px] tw-pr-[10px] tw-items-center tw-flex tw-gap-[6px]"
                >
                  <FaPen />
                  <span className="tw-text-[12px] tw-font-Inter tw-font-semibold">
                    Write an Entry
                  </span>
                </button>
              )}
            </div>
            <div className="tw-w-[calc(100%-40px)] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
              <div id="div_input_container">
                <AiOutlineSearch
                  style={{ fontSize: "20px", color: "#4A4A4A" }}
                />
                <input
                  id="input_gc_name"
                  type="text"
                  placeholder="Search an entry"
                />
              </div>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-[10px] tw-items-center tw-pt-[50px]">
              <TbBookOff size={70} color="#808080" />
              <span className="tw-text-[12px] tw-font-Inter tw-font-normal tw-text-[#808080]">
                No Entries Made Yet
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={{
              flex: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? 1
                  : 0
                : 1,
              maxWidth: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? "100%"
                  : "0px"
                : "none",
            }}
            animate={{
              flex: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? 1
                  : 0
                : 1,
              maxWidth: isMobileView
                ? entry_id !== null || entry_id === "new"
                  ? "100%"
                  : "0px"
                : "none",
            }}
            className="tw-flex tw-flex-col tw-gap-[15px] tw-overflow-x-hidden tw-overflow-y-auto t-scroll tw-bg-white tw-rounded-[7px] tw-items-center"
          >
            <div className="tw-w-[calc(100%-40px)] tw-flex tw-items-center tw-h-[31px] tw-gap-[2px] tw-p-[18px] tw-pb-[2px] tw-pl-[20px] tw-pr-[20px]">
              {isMobileView && (
                <button
                  onClick={() => {
                    navigate(`/${authentication.user.userID}/diary`);
                  }}
                  className="tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-h-[40px] tw-w-[40px]"
                >
                  <IoArrowBack style={{ fontSize: "20px" }} />
                </button>
              )}
              <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                Create New Entry
              </span>
              <div className="tw-flex tw-flex-1 tw-justify-end">
                <button className="tw-cursor-pointer tw-h-[35px] tw-border-none tw-rounded-md tw-pl-[10px] tw-pr-[10px] tw-items-center tw-flex tw-gap-[6px]">
                  <FaSave size={18} />
                  <span className="tw-text-[12px] tw-font-Inter tw-font-semibold">
                    Save
                  </span>
                </button>
              </div>
            </div>
            <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
              <input id="input_gc_name" type="text" placeholder="Title" />
            </div>
            <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
              <div className="tw-w-full tw-min-h-[300px] tw-bg-[#eaecef] tw-rounded-[7px] my-editor-wrapper">
                <ReactQuill
                  modules={modules}
                  onChange={() => {}}
                  className="tw-w-full tw-rounded-[7px] tw-h-[calc(100%-42px)]"
                />
              </div>
            </div>
            <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-flex-col tw-p-[10px] tw-pl-[20px] tw-pr-[20px] tw-gap-[10px]">
              <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
                <span className="tw-text-[14px] tw-font-semibold tw-font-Inter">
                  Attachments
                </span>
                <button className="tw-cursor-pointer tw-h-[35px] tw-border-none tw-rounded-md tw-pl-[10px] tw-pr-[10px] tw-items-center tw-flex tw-gap-[6px]">
                  <BiSolidImageAdd size={18} />
                  <span className="tw-text-[12px] tw-font-Inter tw-font-semibold">
                    Add Attachments
                  </span>
                </button>
              </div>
              <div className="tw-bg-[#f7f7f9] tw-w-full tw-flex tw-min-h-[300px] tw-rounded-[7px] tw-items-center tw-justify-center">
                <div className="tw-flex tw-gap-[10px] tw-flex-col tw-items-center">
                  <MdImageNotSupported size={70} color="#808080" />
                  <span className="tw-text-[12px] tw-font-Inter tw-font-normal tw-text-[#808080]">
                    No Attachments Yet
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Diary;
