import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { Avatar } from "@/reusables/design";
import {
  GetSwitchablePagesRequest,
  SwitchablePage,
  SwitchBackToSelfRequest,
  SwitchEntityRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { personalIdentity, useConferenceIdentity } from "./identity";

type IdentityOption = {
  key: string;
  /** The page's realm id - what a switch is asked for. None for yourself. */
  realmID: string | null;
  entityID: string;
  name: string;
  detail: string;
  profile: string | undefined;
  isPage: boolean;
  isActive: boolean;
};

const pictureOf = (profile: string | null | undefined) =>
  profile && profile !== "N/A" && profile !== "none" ? profile : undefined;

/**
 * Who you are in the conference, and the choice to be someone else: yourself
 * or any page you run. A switch re-issues the token and reloads (as the
 * rail's switcher does), and the reload lands back on this same address - the
 * landing page, or the lobby with its invite.
 *
 * The choices open inline under the card rather than as a popover: the lobby
 * column scrolls, and a popover would be clipped by it.
 */
function IdentitySwitcher({
  label,
  onViewProfile,
  className = "tw-rounded-[var(--r-md)]",
}: {
  label: string;
  onViewProfile?: () => void;
  /** The card corner, to sit among the cards around it. */
  className?: string;
}) {
  const dispatch = useDispatch();
  const authentication = useSelector(
    (state: { authentication: AuthenticationInterface }) =>
      state.authentication,
  );
  const alerts = useSelector((state: { alerts: unknown[] }) => state.alerts);
  const me = useConferenceIdentity();
  const self = personalIdentity(authentication);

  const [pages, setPages] = useState<SwitchablePage[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<IdentityOption | null>(null);

  useEffect(() => {
    if (authentication.auth !== true) return;
    let cancelled = false;
    GetSwitchablePagesRequest()
      .then((result) => {
        if (!cancelled) setPages(result);
      })
      .catch(() => {
        if (!cancelled) setPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [authentication.auth]);

  const activeRealmID = authentication.active_entity_context?.realm_id;
  const options: IdentityOption[] = [
    {
      key: "self",
      realmID: null,
      entityID: self.entityID,
      name: self.name,
      detail: self.handle ? `@${self.handle}` : "Your account",
      profile: self.profile,
      isPage: false,
      isActive: !me.isPage,
    },
    ...(pages ?? []).map((page) => ({
      key: page.realm_id,
      realmID: page.realm_id,
      entityID: page.entity_id,
      name: page.name,
      detail: page.slug ? `Page · @${page.slug}` : "Page",
      profile: pictureOf(page.profile),
      isPage: true,
      isActive:
        me.isPage &&
        (page.entity_id === me.entityID || page.realm_id === activeRealmID),
    })),
  ];
  // Acting as a page, yourself is always there to go back to; as yourself,
  // only once a page of yours has turned up.
  const canSwitch = me.isPage || options.length > 1;

  const choose = async (option: IdentityOption) => {
    if (switchingTo) return;
    if (option.isActive) {
      setIsOpen(false);
      return;
    }
    setSwitchingTo(option);
    // Both reload on success, so only a failure comes back here.
    const switched = option.realmID
      ? await SwitchEntityRequest(option.realmID, dispatch, alerts)
      : await SwitchBackToSelfRequest(dispatch, alerts);
    if (!switched) setSwitchingTo(null);
  };

  return (
    <div
      className={`${className} tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-p-[14px] tw-flex tw-flex-col`}
    >
      <div className="tw-flex tw-items-center tw-gap-[12px]">
        <Avatar
          id={me.entityID || me.handle}
          name={me.name}
          src={me.profile}
          kind={me.isPage ? "realm" : undefined}
          size={40}
          online={false}
        />
        <div className="tw-flex tw-flex-col tw-items-start tw-min-w-0 tw-flex-1">
          <span className="cl-text-meta tw-text-[var(--text-3)]">{label}</span>
          <span className="cl-text-title tw-font-semibold tw-text-[var(--text)] tw-truncate tw-max-w-full">
            {me.name}
          </span>
          {/* Where the two don't fit on one line (a phone), the link takes a
              line of its own rather than squeezing the handle to nothing. */}
          <span className="cl-text-caption tw-text-[var(--text-2)] tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-[8px] tw-min-w-0 tw-max-w-full">
            <span className="tw-truncate tw-max-w-full">
              {me.isPage ? `Page · @${me.handle}` : `@${me.handle}`}
            </span>
            {onViewProfile && (
              <button
                type="button"
                onClick={onViewProfile}
                className="tw-border-none tw-bg-transparent tw-p-0 tw-cursor-pointer tw-text-[var(--brand)] tw-font-semibold tw-shrink-0"
                style={{ font: "inherit" }}
              >
                View profile
              </button>
            )}
          </span>
        </div>
        {canSwitch && (
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            className="cl-text-label tw-h-[34px] tw-px-[12px] tw-rounded-[var(--r-sm)] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text)] tw-font-semibold tw-cursor-pointer tw-flex tw-items-center tw-gap-[6px] tw-shrink-0"
          >
            Switch
            <FiChevronDown
              size={14}
              style={{
                transform: isOpen ? "rotate(180deg)" : "none",
                transition: "transform .2s var(--ease)",
              }}
            />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="identity-options"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="tw-flex tw-flex-col tw-gap-[2px] tw-pt-[12px] tw-mt-[12px] tw-border-t tw-border-[var(--border)]">
              <span className="cl-text-meta tw-text-[var(--text-3)] tw-px-[8px] tw-pb-[4px]">
                Use the conference as
              </span>
              {options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => choose(option)}
                  disabled={Boolean(switchingTo)}
                  aria-current={option.isActive || undefined}
                  className={`tw-flex tw-items-center tw-gap-[10px] tw-w-full tw-rounded-[var(--r-sm)] tw-border-none tw-px-[8px] tw-py-[7px] tw-text-left tw-cursor-pointer disabled:tw-cursor-default ${
                    option.isActive
                      ? "tw-bg-[var(--brand-soft)]"
                      : "tw-bg-transparent hover:tw-bg-[var(--surface-hover)]"
                  }`}
                >
                  <Avatar
                    id={option.entityID || option.key}
                    name={option.name}
                    src={option.profile}
                    kind={option.isPage ? "realm" : undefined}
                    size={30}
                    online={false}
                  />
                  <span className="tw-flex tw-flex-col tw-min-w-0 tw-flex-1">
                    <span
                      className={`cl-text-title tw-font-semibold tw-truncate ${
                        option.isActive
                          ? "tw-text-[var(--brand)]"
                          : "tw-text-[var(--text)]"
                      }`}
                    >
                      {option.name}
                    </span>
                    <span className="cl-text-caption tw-text-[var(--text-2)] tw-truncate">
                      {option.detail}
                    </span>
                  </span>
                  {option.isActive && (
                    <FiCheck
                      size={16}
                      className="tw-text-[var(--brand)] tw-shrink-0"
                    />
                  )}
                </button>
              ))}
              {pages === null && (
                <span className="cl-text-caption tw-text-[var(--text-3)] tw-flex tw-items-center tw-gap-[8px] tw-px-[8px] tw-py-[7px]">
                  <AiOutlineLoading3Quarters className="tw-animate-spin" />
                  Loading your pages
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {switchingTo && (
        // Up until the reload replaces the page - the request and the reload
        // take a moment, and a page that just sat there read as a dead click.
        <div
          role="status"
          className="tw-fixed tw-inset-0 tw-z-[100] tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[14px]"
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div className="tw-w-[56px] tw-h-[56px] tw-rounded-full tw-bg-[var(--surface)] tw-flex tw-items-center tw-justify-center tw-text-[var(--text)]">
            <AiOutlineLoading3Quarters
              className="tw-animate-spin"
              style={{ fontSize: 24 }}
            />
          </div>
          <span
            className="cl-text-body tw-font-semibold tw-text-white"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            Switching to {switchingTo.name}…
          </span>
        </div>
      )}
    </div>
  );
}

export default IdentitySwitcher;
