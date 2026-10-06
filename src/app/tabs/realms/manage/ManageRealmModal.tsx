import { ReactNode, useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Modal from "@/app/reusables/Modal";
import { Avatar, Icon, SegTabs } from "@/reusables/design";
import Details from "../tabs/Details";
import Media from "../tabs/Media";
import Members from "../tabs/Members";
import Followers from "../tabs/Followers";
import { useManagedRealm } from "./useManagedRealm";
import { hasMediaTab } from "./manageTabs";

type ManageTab = "details" | "media" | "members" | "followers";

/**
 * Manage a realm without leaving the screen: the /realms/:realm_id page's
 * tabs (Details, Media, Members, and a page's Followers) in a modal. A voice
 * channel opens it from its menu - going to the page unmounts the channel,
 * and the call with it.
 *
 * The page's Dashboard is left out; it is a placeholder. Media only shows
 * where the realm has a profile and cover photo (hasMediaTab).
 */
function ManageRealmModal({
  realmId,
  onClose,
}: {
  realmId: string;
  onClose: () => void;
}) {
  const { isloaded, isError, realmInfo } = useManagedRealm(realmId);
  const [tab, setTab] = useState<ManageTab>("details");

  // Removed from the realm while managing it: close, as ManageRealm leaves
  // the page.
  useEffect(() => {
    if (!realmInfo?.id) return;

    const eventName = realmInfo.id;
    const handler = (event: CustomEvent) => {
      if (event.detail?.event === "removed_user_notif") {
        onClose();
      }
    };

    document.addEventListener(eventName, handler as EventListener);

    return () => {
      document.removeEventListener(eventName, handler as EventListener);
    };
  }, [realmInfo?.id, onClose]);

  const tabs = [
    { key: "details", label: "Details" },
    ...(realmInfo && hasMediaTab(realmInfo)
      ? [{ key: "media", label: "Media" }]
      : []),
    { key: "members", label: "Members" },
    ...(realmInfo?.type === "page"
      ? [{ key: "followers", label: "Followers" }]
      : []),
  ];

  const notice = (text: string) => (
    <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center tw-p-[24px]">
      <span className="cl-text-body-sm tw-text-[var(--text-2)] tw-text-center">
        {text}
      </span>
    </div>
  );

  let body: ReactNode;
  if (!isloaded) {
    body = (
      <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center">
        <AiOutlineLoading3Quarters className="tw-animate-spin tw-text-[var(--brand)]" />
      </div>
    );
  } else if (isError || !realmInfo) {
    body = notice("We couldn't load these settings. Please try again.");
  } else if (!realmInfo.is_admin) {
    body = notice("Only admins can manage this.");
  } else if (tab === "details") {
    body = <Details realm={realmInfo} />;
  } else if (tab === "media" && hasMediaTab(realmInfo)) {
    body = <Media realm={realmInfo} />;
  } else if (tab === "followers" && realmInfo.type === "page") {
    body = <Followers realm={realmInfo} />;
  } else if (tab === "members") {
    body = <Members compact realm={realmInfo} />;
  } else {
    body = <Details realm={realmInfo} />;
  }

  return (
    <Modal
      component={
        <div
          role="dialog"
          aria-modal="true"
          aria-label={realmInfo ? `Manage ${realmInfo.name}` : "Manage"}
          // --bg, not the page's --background: that is an HSL triplet, not a
          // colour, so it paints nothing - and the tabs, which use it too,
          // would sit on the dark overlay.
          className="tw-w-[calc(100%-24px)] tw-max-w-[880px] tw-flex tw-flex-col tw-overflow-hidden tw-rounded-[14px] tw-border tw-border-[var(--border)] tw-bg-[var(--bg)] tw-text-[var(--text)]"
          style={{
            height: "min(680px, calc(100dvh - 40px))",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="tw-flex tw-items-center tw-gap-[10px] tw-px-[16px] tw-py-[12px] tw-bg-[var(--surface)] tw-border-b tw-border-[var(--border)] tw-flex-shrink-0">
            {realmInfo && (
              <Avatar
                id={realmInfo.slug ?? realmInfo.realm_id}
                entityId={realmInfo.entity}
                name={realmInfo.name}
                src={
                  realmInfo.profile && realmInfo.profile !== "N/A"
                    ? realmInfo.profile
                    : undefined
                }
                size={36}
              />
            )}
            <div className="tw-flex tw-flex-col tw-items-start tw-flex-1 tw-min-w-0">
              <span className="cl-text-body tw-font-semibold tw-truncate tw-max-w-full">
                {realmInfo ? `Manage ${realmInfo.name}` : "Manage"}
              </span>
              {realmInfo?.parent && (
                <span className="cl-text-meta tw-text-[var(--text-2)] tw-truncate tw-max-w-full">
                  {realmInfo.parent.name}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="tw-w-[32px] tw-h-[32px] tw-flex-shrink-0 tw-rounded-full tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-text-[var(--text-2)]"
            >
              <Icon n="close" s={18} />
            </button>
          </div>
          {realmInfo?.is_admin && (
            <div className="tw-px-[16px] tw-py-[10px] tw-bg-[var(--surface)] tw-border-b tw-border-[var(--border)] tw-flex-shrink-0">
              <SegTabs
                tabs={tabs}
                value={tab}
                onChange={(key) => setTab(key as ManageTab)}
                style={{ width: "100%", maxWidth: 420 }}
              />
            </div>
          )}
          {/* A row, like the page's content pane, so the tab fills it. */}
          <div className="tw-flex tw-flex-1 tw-min-h-0 tw-overflow-y-auto thinscroller">
            {body}
          </div>
        </div>
      }
    />
  );
}

export default ManageRealmModal;
