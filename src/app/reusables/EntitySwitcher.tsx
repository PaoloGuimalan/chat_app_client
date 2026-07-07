/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoChevronDown } from "react-icons/io5";
import Skeleton from "react-loading-skeleton";
import {
  GetMyRealmsRequest,
  SwitchEntityRequest,
  SwitchBackToSelfRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { Avatar } from "@/reusables/design";

// Facebook-Page-style account switcher: owns the rail's profile avatar
// button (so the switch caret can be precisely overlaid on its corner)
// plus the switcher popover itself. Direct page-to-page switching is
// allowed (matches the backend, which validates membership against the
// account's own entity regardless of which entity is currently active), so
// the list always shows the personal row plus every page you administer,
// with the active one highlighted - not just a "switch back" shortcut.
function EntitySwitcher({
  onProfileClick,
  profileSrc,
  profileName,
  size = 38,
}: {
  onProfileClick: () => void;
  profileSrc?: string;
  profileName?: string;
  size?: number;
}) {
  const dispatch = useDispatch();
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const alerts = useSelector((state: any) => state.alerts);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [menuPos, setMenuPos] = useState<{ left: number; bottom: number } | null>(
    null,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !(menuRef.current && menuRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // The rail this component lives in scrolls (overflowY: auto), which per the
  // CSS overflow spec also forces the horizontal axis to clip - so a plain
  // absolutely-positioned popover trying to escape to the right of the rail
  // gets trapped/clipped inside it instead. Render through a portal anchored
  // to the trigger's live viewport position so it always floats outside the
  // rail rather than overlapping it.
  const computeMenuPosition = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPos({
      left: rect.right + 8,
      bottom: window.innerHeight - rect.bottom,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    computeMenuPosition();
    window.addEventListener("resize", computeMenuPosition);
    return () => window.removeEventListener("resize", computeMenuPosition);
  }, [isOpen]);

  const toggleSwitcher = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      setIsLoadingPages(true);
      GetMyRealmsRequest(1, 20, "page")
        .then((response: any) => {
          setPages(
            (response?.results || []).filter((mp: any) => mp.is_admin),
          );
          setIsLoadingPages(false);
        })
        .catch(() => setIsLoadingPages(false));
    }
  };

  const handleSwitchToPage = (realmId: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    SwitchEntityRequest(realmId, dispatch, alerts).then(() => {
      setIsSwitching(false);
      setIsOpen(false);
    });
  };

  const handleSwitchToSelf = () => {
    if (isSwitching || !activeEntity.is_switched) return;
    setIsSwitching(true);
    SwitchBackToSelfRequest(dispatch, alerts).then(() => {
      setIsSwitching(false);
      setIsOpen(false);
    });
  };

  const activeEntity = authentication.active_entity_context;

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", marginTop: 4 }}
    >
      <button
        className="cl-main-rail__profile"
        title="Profile"
        onClick={onProfileClick}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          borderRadius: "50%",
        }}
      >
        <Avatar id={profileName} name={profileName} src={profileSrc} size={size} />
      </button>

      <button
        onClick={toggleSwitcher}
        title="Switch account"
        aria-label="Switch account"
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "2px solid var(--rail)",
          background: "var(--surface-1)",
          color: "var(--text)",
          position: "absolute",
          bottom: -2,
          right: -2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <IoChevronDown style={{ fontSize: 10 }} />
      </button>

      {isOpen &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            className="cl-post-options-menu"
            style={{
              position: "fixed",
              bottom: menuPos.bottom,
              left: menuPos.left,
              minWidth: 220,
              maxHeight: 320,
              overflowY: "auto",
              zIndex: 50,
              padding: 8,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-2)",
              padding: "4px 8px",
            }}
          >
            Switch account
          </div>

          <button
            onClick={handleSwitchToSelf}
            disabled={isSwitching || !activeEntity.is_switched}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 8,
              borderRadius: 8,
              border: "none",
              background: !activeEntity.is_switched
                ? "var(--brand-soft)"
                : "transparent",
              color: !activeEntity.is_switched ? "var(--brand)" : "var(--text)",
              cursor: isSwitching ? "default" : "pointer",
              textAlign: "left",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {authentication.user.fullName?.firstName}{" "}
            {authentication.user.fullName?.lastName}
          </button>

          {isLoadingPages ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  height={34}
                  borderRadius={8}
                  baseColor="var(--surface-3)"
                  highlightColor="var(--surface-hover)"
                />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-2)",
                padding: "4px 8px",
              }}
            >
              No pages to manage
            </div>
          ) : (
            pages.map((mp: any) => {
              const isActive =
                activeEntity.is_switched && activeEntity.realm_id === mp.id;
              return (
                <button
                  key={mp.id}
                  onClick={() => handleSwitchToPage(mp.id)}
                  disabled={isSwitching || isActive}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 8,
                    borderRadius: 8,
                    border: "none",
                    background: isActive ? "var(--brand-soft)" : "transparent",
                    color: isActive ? "var(--brand)" : "var(--text)",
                    cursor: isSwitching ? "default" : "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {mp.name}
                </button>
              );
            })
          )}
          </div>,
          document.body,
        )}

      {isSwitching &&
        createPortal(
          // A switch's real settling happens via a full page reload (see
          // SwitchEntityRequest/SwitchBackToSelfRequest), which otherwise
          // reads as a jarring freeze-then-flash with no feedback while the
          // request is in flight. This paints immediately on click and stays
          // up through the reload, so the old page's last frame doesn't just
          // hang there - the transition reads as an intentional handoff.
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(0, 0, 0, 0.35)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                background: "var(--surface)",
                borderRadius: "50%",
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              }}
            >
              <AiOutlineLoading3Quarters
                style={{ fontSize: 24, color: "var(--text)" }}
              />
            </motion.div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
            >
              Switching...
            </span>
          </motion.div>,
          document.body,
        )}
    </div>
  );
}

export default EntitySwitcher;
