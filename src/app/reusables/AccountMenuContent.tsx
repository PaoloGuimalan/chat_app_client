/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Icon } from "@/reusables/design";
import { getActiveAvatar } from "@/reusables/hooks/reusable";
import {
  GetSwitchablePagesRequest,
  SwitchablePage,
  SwitchEntityRequest,
  SwitchBackToSelfRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import "../../styles/account-menu.css";
import OverlayScrollArea from "./OverlayScrollArea";

export default function AccountMenuContent({
  onProfileClick,
  onClose,
  onSwitchingChange,
  compact = false,
}: {
  onProfileClick: () => void;
  onClose?: () => void;
  onSwitchingChange?: (switching: boolean) => void;
  compact?: boolean;
}) {
  const dispatch = useDispatch();
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const alerts = useSelector((state: any) => state.alerts);
  const active = authentication.active_entity_context;
  const avatar = getActiveAvatar(authentication);
  const [pages, setPages] = useState<SwitchablePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [switching, setSwitching] = useState(false);
  const personalName =
    [
      authentication.user.fullName?.firstName,
      authentication.user.fullName?.middleName,
      authentication.user.fullName?.lastName,
    ]
      .filter((name) => name && name !== "N/A")
      .join(" ") || authentication.user.username;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadFailed(false);
    GetSwitchablePagesRequest()
      .then((pages) => {
        if (mounted) setPages(pages);
      })
      .catch(() => {
        if (mounted) setLoadFailed(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [retry]);

  const switchAccount = async (realmId?: string) => {
    if (switching) return;
    setSwitching(true);
    onSwitchingChange?.(true);
    let success = false;
    try {
      success = realmId
        ? await SwitchEntityRequest(realmId, dispatch, alerts)
        : await SwitchBackToSelfRequest(dispatch, alerts);
    } finally {
      setSwitching(false);
      onSwitchingChange?.(false);
    }
    if (success) onClose?.();
  };

  const displayName = active?.is_switched ? avatar.name : personalName;
  return (
    <>
      <button
        type="button"
        className="cl-account-profile"
        onClick={() => {
          onProfileClick();
          onClose?.();
        }}
      >
        <Avatar
          id={avatar.name}
          name={displayName}
          src={avatar.src}
          size={compact ? 40 : 48}
          online={false}
        />
        <span className="cl-account-identity">
          <strong>{displayName}</strong>
          <span>
            @
            {active?.is_switched
              ? active.slug || active.realm_id
              : authentication.user.username}
          </span>
          <span className="cl-account-profile-link">View profile</span>
        </span>
        <Icon n="chevron_right" s={20} c="var(--text-3)" />
      </button>
      <section className="cl-account-section" aria-label="Switch account">
        <h2 className="cl-account-section-title">Switch account</h2>
        <OverlayScrollArea maxHeight={compact ? 220 : 280}>
          <button
            type="button"
            className="cl-account-row"
            aria-current={!active?.is_switched ? "true" : undefined}
            disabled={switching || !active?.is_switched}
            onClick={() => void switchAccount()}
          >
            <Avatar
              id={authentication.user.username}
              name={personalName}
              src={
                authentication.user.profile !== "none"
                  ? authentication.user.profile
                  : undefined
              }
              size={28}
              online={false}
            />
            <span>{personalName}</span>
            {!active?.is_switched && (
              <Icon n="check_circle" s={18} c="var(--brand)" />
            )}
          </button>
          {loading ? (
            <div className="cl-account-status" role="status">
              Loading accounts…
            </div>
          ) : loadFailed ? (
            <button
              type="button"
              className="cl-account-retry"
              onClick={() => setRetry((value) => value + 1)}
            >
              Couldn't load pages. Retry
            </button>
          ) : pages.length === 0 ? (
            <p className="cl-account-status">No pages to manage</p>
          ) : (
            pages.map((page) => {
              const selected = Boolean(
                active?.is_switched && active.realm_id === page.realm_id,
              );
              return (
                <button
                  key={page.realm_id}
                  type="button"
                  className="cl-account-row"
                  aria-current={selected ? "true" : undefined}
                  disabled={switching || selected}
                  onClick={() => void switchAccount(page.realm_id)}
                >
                  <Avatar
                    id={page.entity_id || page.realm_id}
                    name={page.name}
                    src={page.profile || undefined}
                    size={28}
                    online={false}
                  />
                  <span>{page.name}</span>
                  {selected && (
                    <Icon n="check_circle" s={18} c="var(--brand)" />
                  )}
                </button>
              );
            })
          )}
        </OverlayScrollArea>
      </section>
      {switching &&
        createPortal(
          <div
            className="cl-account-switching"
            role="status"
            aria-live="polite"
          >
            <span className="cl-account-spinner" />
            <strong>Switching…</strong>
          </div>,
          document.body,
        )}
    </>
  );
}

