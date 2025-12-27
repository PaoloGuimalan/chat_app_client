import { SET_PAGE_MODAL } from "@/redux/types";
import { useMemo } from "react";
import { BsPersonCircle } from "react-icons/bs";
import { FiMap } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { IoArrowBack } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

function Settings({ isModal }: { isModal: boolean }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const mappedSettingsList = useMemo(
    () => [
      {
        category: "Account Settings",
        description:
          "Review, Update, Validate, and Manage your informations on how you want it to appear.",
        items: [
          {
            icon: <BsPersonCircle size={45} color="#757b87" />,
            name: "Personal Information",
            description:
              "Change your name, birthdate, address, and your other public informations.",
            isDisabled: true,
            click: () => {
              //   console.log("TEST");
            },
          },
        ],
      },
      {
        category: "Location",
        description: "View and/or Modify how the app displays your location.",
        items: [
          {
            icon: <FiMap size={40} color="#757b87" />,
            name: "Map Feed Access",
            description:
              "Change how Map Feed use or display your location relative to your existing connections.",
            isDisabled: true,
            click: () => {
              //   console.log("TEST");
            },
          },
        ],
      },
    ],
    []
  );

  return (
    <div
      className={`tw-bg-[#f0f2f5] tw-w-full tw-h-full ${
        !isModal ? "tw-absolute" : "tw-rounded-sm tw-relative"
      } tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-scroll x-scroll tw-font-Inter`}
    >
      {!isModal ? (
        <button
          onClick={() => {
            navigate("/");
          }}
          className="tw-z-[10] tw-shadow-lg tw-bg-[#d2d2d2] tw-fixed tw-top-[4px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
        >
          <IoArrowBack style={{ fontSize: "20px" }} />
        </button>
      ) : (
        <button
          onClick={() => {
            dispatch({
              type: SET_PAGE_MODAL,
              payload: {
                pagemodal: null,
              },
            });
          }}
          className="tw-absolute tw-z-[10] tw-shadow-lg tw-bg-[#d2d2d2] tw-top-[4px] tw-right-[10px] sm:tw-right-[10px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
        >
          <IoMdClose style={{ fontSize: "20px" }} />
        </button>
      )}
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[4px]">
        <div
          className={`tw-w-[calc(100%-40px)] tw-flex tw-items-center ${
            isModal ? "tw-justify-start" : "tw-justify-center"
          } tw-bg-white tw-p-[20px]`}
        >
          <span className="tw-text-[14px] tw-font-semibold">Settings</span>
        </div>
        {/* Settings Categories */}
        {mappedSettingsList.map((mp, i) => {
          return (
            <div
              key={i}
              className="tw-w-[calc(100%-40px)] tw-flex tw-flex-col tw-bg-white tw-p-[20px] tw-pt-[15px] tw-gap-[15px]"
            >
              <div className="tw-flex tw-flex-col tw-items-start tw-gap-[4px]">
                <span className="tw-text-[14px] tw-font-semibold">
                  {mp.category}
                </span>
                <span className="tw-text-[12px] tw-font-normal tw-text-left tw-text-[#6b6b6d]">
                  {mp.description}
                </span>
              </div>
              {/* Settings Options */}
              <div className="tw-w-full tw-flex tw-flex-col tw-gap-[20px]">
                {mp.items.map((mip, ii) => {
                  return (
                    <button
                      key={ii}
                      disabled={mip.isDisabled}
                      onClick={mip.click}
                      style={{
                        opacity: mip.isDisabled ? 0.5 : 1,
                      }}
                      className="tw-w-full tw-flex tw-gap-[8px] tw-border-none tw-m-0 tw-p-0 tw-font-Inter tw-bg-transparent"
                    >
                      <div className="tw-w-[50px] tw-h-full tw-flex tw-items-center tw-justify-center">
                        {mip.icon}
                      </div>
                      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-gap-[4px]">
                        <span className="tw-text-[14px] tw-font-normal tw-text-black">
                          {mip.name}
                        </span>
                        <span className="tw-text-[12px] tw-font-normal tw-text-left tw-text-[#6b6b6d]">
                          {mip.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* END: Settings Options */}
            </div>
          );
        })}
        {/* END: Settings Categories */}
      </div>
    </div>
  );
}

export default Settings;
