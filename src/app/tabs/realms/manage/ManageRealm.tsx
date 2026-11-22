import CommunityName from "@/app/reusables/CommunityName";
/* eslint-disable react-hooks/exhaustive-deps */
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
import CommunityArchive from "../tabs/CommunityArchive";
import Members from "../tabs/Members";
import Followers from "../tabs/Followers";
import Notifications from "../tabs/Notifications";
import { Avatar } from "@/reusables/design";
import { manageRealmTabs, type ManageRealmTab } from './manageTabs';
import Permissions from '../tabs/Permissions';
import Approvals from '../tabs/Approvals';
import RealmLifecycle from './section/RealmLifecycle';

function ManageRealm({ realm }: { realm: IRealmProfileInfo; }) {
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
  const tabs = manageRealmTabs(realm);
  const allowed = (key: ManageRealmTab) => tabs.some(tab => tab.key === key);
  const tabPath = (key: ManageRealmTab) => `/realms/${realm.id}/${key === 'dashboard' ? '' : key}`;
  const defaultPath = tabs[0] ? tabPath(tabs[0].key) : '/';

  const navButtonClass = (target: string) =>
    `tw-w-full tw-flex tw-items-center tw-justify-between tw-gap-[12px] tw-px-[14px] tw-py-[11px] tw-border-none tw-rounded-[var(--r-md)] tw-cursor-pointer tw-transition-colors ${activePath === target
      ? "tw-bg-[var(--brand-soft)] tw-text-[var(--brand)]"
      : "tw-bg-transparent tw-text-[var(--text)] hover:tw-bg-[var(--surface-hover)]"
    }`;

  const navigation = () => tabs.map(tab => <button key={tab.key}
    onClick={() => { navigate(tabPath(tab.key)); if (isMobileView) setisMenuToggled(false); }}
    className={navButtonClass(tabPath(tab.key))}>
    <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">{tab.label}</span>
  </button>);

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
                  aria-label="Back"
                  onClick={() => navigate(-1)}
                  className="tw-w-[42px] tw-h-[42px] tw-border-none tw-bg-[var(--surface-2)] tw-cursor-pointer hover:tw-bg-[var(--surface-hover)] tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-colors"
                >
                  <IoArrowBack style={{ fontSize: "20px", color: "var(--text)" }} />
                </button>
                <div className="tw-flex tw-flex-1 tw-items-center tw-gap-[10px] tw-min-w-0">
                  <Avatar
                    id={realm.slug ?? realm.realm_id}
                    entityId={realm.entity}
                    name={realm.name}
                    src={realm.profile && realm.profile !== "N/A" ? realm.profile : undefined}
                    size={42}
                  />
                  <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-truncate tw-min-w-0">
                    <span className="tw-truncate tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                      {realm.type === "community" ? <CommunityName community={{ name: realm.name, is_verified: realm.is_verified }} /> : realm.name}
                    </span>
                    {realm.parent && (
                      <span className="tw-truncate tw-text-[12px] tw-font-semibold tw-font-Inter tw-text-[var(--text-2)]">
                        {realm.parent.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="tw-flex tw-flex-col tw-flex-1 tw-min-h-0 tw-pt-[14px] tw-gap-[8px] tw-overflow-y-auto">{navigation()}</div>
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
                aria-label="Back"
                onClick={() => navigate(-1)}
                className="tw-w-[42px] tw-h-[42px] tw-border-none tw-bg-[var(--surface-2)] tw-cursor-pointer hover:tw-bg-[var(--surface-hover)] tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-colors"
              >
                <IoArrowBack style={{ fontSize: "20px", color: "var(--text)" }} />
              </button>
              <div className="tw-flex tw-flex-1 tw-items-center tw-gap-[10px] tw-min-w-0">
                <Avatar
                  id={realm.slug ?? realm.realm_id}
                  entityId={realm.entity}
                  name={realm.name}
                  src={realm.profile && realm.profile !== "N/A" ? realm.profile : undefined}
                  size={42}
                />
                <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-truncate tw-min-w-0">
                  <span className="tw-truncate tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                    {realm.type === "community" ? <CommunityName community={{ name: realm.name, is_verified: realm.is_verified }} /> : realm.name}
                  </span>
                  {realm.parent && (
                    <span className="tw-truncate tw-text-[12px] tw-font-semibold tw-font-Inter tw-text-[var(--text-2)]">
                      {realm.parent.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="tw-flex tw-flex-col tw-items-start tw-pt-[14px] tw-gap-[8px] tw-overflow-y-auto">{navigation()}</div>
          </div>
        )}
        <div className="tw-flex tw-flex-1 tw-overflow-y-scroll x-scroll tw-min-w-0 tw-bg-[var(--background)]">
          <Routes>
            <Route path="/lifecycle" element={allowed('lifecycle') ? <RealmLifecycle realm={realm} /> : <Navigate to={defaultPath} replace />} />
            <Route path="/" element={allowed('dashboard') ? <Dashboard /> : <Navigate to={defaultPath} replace />} />
            <Route path="/details" element={allowed('details') ? <Details realm={realm} /> : <Navigate to={defaultPath} replace />} />
            <Route path="/media" element={allowed('media') ? <Media realm={realm} /> : <Navigate to={defaultPath} replace />} />
            <Route path="/archived" element={allowed('archived') ? <CommunityArchive realm={realm} /> : <Navigate to={defaultPath} replace />} />
            <Route path="/members" element={allowed('members') ? <Members realm={realm} /> : <Navigate to={defaultPath} replace />} />
            <Route path="/notifications" element={allowed('notifications') ? <Notifications realm={realm} /> : <Navigate to={defaultPath} replace />} />
            <Route path="/approvals" element={allowed('approvals') ? <Approvals realm={realm} /> : <Navigate to={defaultPath} replace />} />
            <Route path="/permissions" element={allowed('permissions') ? <Permissions realm={realm} /> : <Navigate to={defaultPath} replace />} />
            <Route path="/followers" element={allowed('followers') ? <Followers realm={realm} /> : <Navigate to={defaultPath} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default ManageRealm;
