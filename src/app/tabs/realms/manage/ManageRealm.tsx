/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { useEffect, useMemo, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { motion } from "framer-motion";
import { IoMdClose, IoMdMenu } from "react-icons/io";
import Dashboard from "../tabs/Dashboard";
import Details from "../tabs/Details";
import Media from "../tabs/Media";
import Members from "../tabs/Members";
import Followers from "../tabs/Followers";
import { Avatar } from "@/reusables/design";

function ManageRealm({ realm }: { realm: IRealmProfileInfo }) {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuToggled, setisMenuToggled] = useState<boolean>(true);
  const activePath = location.pathname;

  const navButtonClass = (target: string) =>
    `tw-w-full tw-flex tw-items-center tw-justify-between tw-gap-[12px] tw-px-[14px] tw-py-[11px] tw-border-none tw-rounded-[var(--r-md)] tw-cursor-pointer tw-transition-colors ${
      activePath === target
        ? "tw-bg-[var(--brand-soft)] tw-text-[var(--brand)]"
        : "tw-bg-transparent tw-text-[var(--text)] hover:tw-bg-[var(--surface-hover)]"
    }`;

  useEffect(() => {
    if (!realm.id) return;

    const eventName = realm.id;
    const handler = (event: CustomEvent) => {
      // const data = event.detail.data;
      switch (event.detail.event) {
        case "removed_user_notif":
          navigate("/");
          break;
        default:
          break;
      }
    };

    document.addEventListener(eventName, handler as EventListener);

    return () => {
      document.removeEventListener(eventName, handler as EventListener);
    };
  }, [realm]);

  return (
    <div className="tw-bg-[var(--background)] tw-text-[var(--text)] tw-w-full tw-h-full tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-z-[2]">
      <div className="tw-w-full tw-h-full tw-flex tw-overflow-hidden">
        {isMobileView && (
          <motion.div
            initial={{
              left: isMenuToggled ? "0px" : "calc(-100% + 60px)",
            }}
            animate={{
              left: isMenuToggled ? "0px" : "calc(-100% + 60px)",
            }}
            className="tw-flex tw-w-full tw-absolute tw-h-full tw-items-start tw-z-[3]"
          >
            <div className="tw-bg-[var(--surface)] tw-border-r tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-flex tw-flex-col tw-flex-1 tw-max-w-[calc(100%-80px)] sm:tw-max-w-[calc(320px-20px)] tw-p-[14px] tw-h-full tw-min-h-0">
              <div className="tw-flex tw-items-center tw-gap-[10px] tw-pb-[14px] tw-border-b tw-border-[var(--border)]">
                <button
                  onClick={() => {
                    navigate("/");
                  }}
                  className="tw-w-[42px] tw-h-[42px] tw-border-none tw-bg-[var(--surface-2)] tw-cursor-pointer hover:tw-bg-[var(--surface-hover)] tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-colors"
                >
                  <IoArrowBack style={{ fontSize: "20px", color: "var(--text)" }} />
                </button>
                <div className="tw-flex tw-flex-1 tw-items-center tw-gap-[10px] tw-min-w-0">
                  <Avatar
                    id={realm.slug ?? realm.realm_id}
                    name={realm.name}
                    src={realm.profile && realm.profile !== "N/A" ? realm.profile : undefined}
                    size={42}
                  />
                  <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-truncate tw-min-w-0">
                    <span className="tw-truncate tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                      {realm.name}
                    </span>
                    {realm.parent && (
                      <span className="tw-truncate tw-text-[12px] tw-font-semibold tw-font-Inter tw-text-[var(--text-2)]">
                        {realm.parent.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="tw-flex tw-flex-col tw-flex-1 tw-min-h-0 tw-pt-[14px] tw-gap-[8px] tw-overflow-y-auto">
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/`);
                  }}
                  className={navButtonClass(`/realms/${realm.id}/`)}
                >
                  <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                    Dashboard
                  </span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/details`);
                  }}
                  className={navButtonClass(`/realms/${realm.id}/details`)}
                >
                  <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                    Profile Details
                  </span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/media`);
                  }}
                  className={navButtonClass(`/realms/${realm.id}/media`)}
                >
                  <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                    Media
                  </span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/members`);
                  }}
                  className={navButtonClass(`/realms/${realm.id}/members`)}
                >
                  <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                    Members
                  </span>
                </button>
                {realm.type === "page" && (
                  <button
                    onClick={() => {
                      navigate(`/realms/${realm.id}/followers`);
                    }}
                    className={navButtonClass(`/realms/${realm.id}/followers`)}
                  >
                    <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
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
              className="tw-rounded-r-xl tw-p-[10px] tw-h-[60px] tw-w-[60px] tw-border-none tw-bg-[var(--surface)] tw-shadow-[var(--shadow-sm)] tw-cursor-pointer hover:tw-bg-[var(--surface-hover)] tw-flex tw-items-center tw-justify-center tw-transition-colors"
            >
              {isMenuToggled ? (
                <IoMdClose style={{ fontSize: "20px", color: "var(--text)" }} />
              ) : (
                <IoMdMenu style={{ fontSize: "20px", color: "var(--text)" }} />
              )}
            </button>
          </motion.div>
        )}
        {!isMobileView && (
          <div className="tw-bg-[var(--surface)] tw-border-r tw-border-[var(--border)] tw-sticky tw-top-0 tw-flex tw-flex-col tw-flex-1 sm:tw-max-w-[320px] tw-p-[14px] tw-h-full tw-min-h-0">
            <div className="tw-flex tw-items-center tw-gap-[10px] tw-pb-[14px] tw-border-b tw-border-[var(--border)]">
              <button
                onClick={() => {
                  navigate("/");
                }}
                className="tw-w-[42px] tw-h-[42px] tw-border-none tw-bg-[var(--surface-2)] tw-cursor-pointer hover:tw-bg-[var(--surface-hover)] tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-colors"
              >
                <IoArrowBack style={{ fontSize: "20px", color: "var(--text)" }} />
              </button>
              <div className="tw-flex tw-flex-1 tw-items-center tw-gap-[10px] tw-min-w-0">
                <Avatar
                  id={realm.slug ?? realm.realm_id}
                  name={realm.name}
                  src={realm.profile && realm.profile !== "N/A" ? realm.profile : undefined}
                  size={42}
                />
                <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-truncate tw-min-w-0">
                  <span className="tw-truncate tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                    {realm.name}
                  </span>
                  {realm.parent && (
                    <span className="tw-truncate tw-text-[12px] tw-font-semibold tw-font-Inter tw-text-[var(--text-2)]">
                      {realm.parent.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="tw-flex tw-flex-col tw-items-start tw-pt-[14px] tw-gap-[8px] tw-overflow-y-auto">
              <button
                onClick={() => {
                  navigate(`/realms/${realm.id}/`);
                }}
                className={navButtonClass(`/realms/${realm.id}/`)}
              >
                <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                  Dashboard
                </span>
              </button>
              <button
                onClick={() => {
                  navigate(`/realms/${realm.id}/details`);
                }}
                className={navButtonClass(`/realms/${realm.id}/details`)}
              >
                <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                  Profile Details
                </span>
              </button>
              <button
                onClick={() => {
                  navigate(`/realms/${realm.id}/media`);
                }}
                className={navButtonClass(`/realms/${realm.id}/media`)}
              >
                <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                  Media
                </span>
              </button>
              <button
                onClick={() => {
                  navigate(`/realms/${realm.id}/members`);
                }}
                className={navButtonClass(`/realms/${realm.id}/members`)}
              >
                <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                  Members
                </span>
              </button>
              {realm.type === "page" && (
                <button
                  onClick={() => {
                    navigate(`/realms/${realm.id}/followers`);
                  }}
                  className={navButtonClass(`/realms/${realm.id}/followers`)}
                >
                  <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
                    Followers
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
        <div className="tw-flex tw-flex-1 tw-overflow-y-scroll x-scroll tw-min-w-0 tw-bg-[var(--background)]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/details" element={<Details realm={realm} />} />
            <Route path="/media" element={<Media realm={realm} />} />
            <Route path="/members" element={<Members realm={realm} />} />
            <Route
              path="/followers"
              element={
                realm.type === "page" ? (
                  <Followers realm={realm} />
                ) : (
                  <Navigate to={`/realms/${realm.id}/`} />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default ManageRealm;
