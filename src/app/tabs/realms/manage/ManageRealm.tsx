/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { useMemo, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IoMdClose, IoMdMenu } from "react-icons/io";

function ManageRealm({ realm }: { realm: IRealmProfileInfo }) {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const navigate = useNavigate();

  const [realmState, _setrealmState] = useState<IRealmProfileInfo>(realm);
  const [isMenuToggled, setisMenuToggled] = useState<boolean>(true);

  return (
    <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-scroll x-scroll">
      <div className="tw-w-full tw-h-full tw-flex">
        {isMobileView && (
          <motion.div
            initial={{
              left: isMenuToggled ? "0px" : "calc(-100% + 60px)",
            }}
            animate={{
              left: isMenuToggled ? "0px" : "calc(-100% + 60px)",
            }}
            className="tw-flex tw-w-full tw-absolute tw-h-full tw-items-start"
          >
            <div className="tw-bg-white tw-flex tw-flex-col tw-flex-1 tw-max-w-[calc(100%-80px)] sm:tw-max-w-[calc(300px-20px)] tw-p-[10px] tw-h-[calc(100%-20px)]">
              <div className="tw-flex tw-items-center tw-gap-[10px]">
                <button
                  onClick={() => {
                    navigate("/");
                  }}
                  className="tw-p-[10px] tw-border-none tw-bg-transparent tw-cursor-pointer hover:tw-bg-[#d2d2d2] tw-rounded-full tw-flex tw-items-center tw-justify-center"
                >
                  <IoArrowBack style={{ fontSize: "20px", color: "#383838" }} />
                </button>
                <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-truncate">
                  <span className="tw-truncate tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[#383838]">
                    {realmState.name}
                  </span>
                  {realmState.parent && (
                    <span className="tw-truncate tw-text-[12px] tw-font-semibold tw-font-Inter tw-text-[#383838]">
                      {realmState.parent.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="tw-flex tw-flex-col tw-items-start tw-p-[10px] tw-pt-[20px] tw-gap-[2px]">
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/`);
                  }}
                  className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
                >
                  <span className="tw-text-[14px] tw-font-Inter">
                    Dashboard
                  </span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/details`);
                  }}
                  className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
                >
                  <span className="tw-text-[14px] tw-font-Inter">
                    Profile Details
                  </span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/media`);
                  }}
                  className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
                >
                  <span className="tw-text-[14px] tw-font-Inter">Media</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/members`);
                  }}
                  className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
                >
                  <span className="tw-text-[14px] tw-font-Inter">Members</span>
                </button>
                {realmState.type === "page" && (
                  <button
                    onClick={() => {
                      navigate(`/realms/${realm.id}/followers`);
                    }}
                    className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
                  >
                    <span className="tw-text-[14px] tw-font-Inter">
                      Followers
                    </span>
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setisMenuToggled(!isMenuToggled);
              }}
              className="tw-rounded-r-xl tw-p-[10px] tw-h-[60px] tw-w-[60px] tw-border-none tw-bg-white tw-cursor-pointer hover:tw-bg-[#d2d2d2] tw-flex tw-items-center tw-justify-center"
            >
              {isMenuToggled ? (
                <IoMdClose style={{ fontSize: "20px", color: "#383838" }} />
              ) : (
                <IoMdMenu style={{ fontSize: "20px", color: "#383838" }} />
              )}
            </button>
          </motion.div>
        )}
        {!isMobileView && (
          <div className="tw-bg-white tw-flex tw-flex-col tw-flex-1 sm:tw-max-w-[calc(300px-20px)] tw-p-[10px]">
            <div className="tw-flex tw-items-center tw-gap-[10px]">
              <button
                onClick={() => {
                  navigate("/");
                }}
                className="tw-p-[10px] tw-border-none tw-bg-transparent tw-cursor-pointer hover:tw-bg-[#d2d2d2] tw-rounded-full tw-flex tw-items-center tw-justify-center"
              >
                <IoArrowBack style={{ fontSize: "20px", color: "#383838" }} />
              </button>
              <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start">
                <span className="tw-truncate tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[#383838]">
                  {realmState.name}
                </span>
                {realmState.parent && (
                  <span className="tw-truncate tw-text-[12px] tw-font-semibold tw-font-Inter tw-text-[#383838]">
                    {realmState.parent.name}
                  </span>
                )}
              </div>
            </div>
            <div className="tw-flex tw-flex-col tw-items-start tw-p-[10px] tw-pt-[20px] tw-gap-[2px]">
              <button
                onClick={() => {
                  navigate(`/realms/${realm.id}/`);
                }}
                className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
              >
                <span className="tw-text-[14px] tw-font-Inter">Dashboard</span>
              </button>
              <button
                onClick={() => {
                  navigate(`/realms/${realm.id}/details`);
                }}
                className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
              >
                <span className="tw-text-[14px] tw-font-Inter">
                  Profile Details
                </span>
              </button>
              <button
                onClick={() => {
                  navigate(`/realms/${realm.id}/media`);
                }}
                className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
              >
                <span className="tw-text-[14px] tw-font-Inter">Media</span>
              </button>
              <button
                onClick={() => {
                  navigate(`/realms/${realm.id}/members`);
                }}
                className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
              >
                <span className="tw-text-[14px] tw-font-Inter">Members</span>
              </button>
              {realmState.type === "page" && (
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/followers`);
                  }}
                  className="tw-w-[calc(100%-20px)] tw-flex tw-p-[10px] tw-border-none tw-cursor-pointer tw-rounded-sm tw-bg-white hover:tw-bg-[#f0f0f0]"
                >
                  <span className="tw-text-[14px] tw-font-Inter">
                    Followers
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
        <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center">
          <span className="tw-text-[#666666] tw-text-[14px]">
            Manage {realm.type} is currently unavailable.
          </span>
        </div>
      </div>
    </div>
  );
}

export default ManageRealm;
