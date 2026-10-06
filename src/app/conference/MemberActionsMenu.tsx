import { useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsThreeDots } from "react-icons/bs";
import { FaCircleArrowDown, FaCircleArrowUp } from "react-icons/fa6";
import { IoPersonRemove } from "react-icons/io5";

/** Below this much room under the button the menu opens upwards instead. */
const MENU_ROOM = 130;

const scrollParentOf = (el: HTMLElement | null) => {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
};

/**
 * The ⋯ menu on a conference member in the People panel: promote or demote,
 * and remove. The caller decides WHETHER to show it (who may act on whom);
 * this only decides which role change to offer.
 *
 * It closes on any click outside it and on Escape. A full-screen
 * click-catcher can't do that here: the panel sits in an animated drawer, and
 * its transform pins a `position: fixed` catcher to the drawer, so clicks on
 * the call beside it never reached it. Near the bottom of the list it opens
 * upwards, so the list's scroll box doesn't cut it off.
 */
function MemberActionsMenu({
  role,
  viewerIsOwner,
  busy,
  locked,
  onPromote,
  onDemote,
  onRemove,
}: {
  /** The member's current role. */
  role: string;
  /** Only the owner may demote an admin. */
  viewerIsOwner: boolean;
  /** This member's change is in flight. */
  busy: boolean;
  /** Another member's change is in flight - one at a time. */
  locked: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [upwards, setUpwards] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open && rootRef.current) {
      const button = rootRef.current.getBoundingClientRect();
      const box = scrollParentOf(rootRef.current)?.getBoundingClientRect();
      const bottom = box ? box.bottom : window.innerHeight;
      setUpwards(bottom - button.bottom < MENU_ROOM);
    }
    setOpen((value) => !value);
  };

  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const isAdmin = role === "admin";
  const item =
    "tw-flex tw-items-center tw-gap-[6px] tw-text-[12px] tw-font-Inter tw-border-none tw-bg-transparent tw-rounded-sm tw-p-[7px] tw-cursor-pointer hover:tw-bg-[var(--surface-hover)] tw-text-left disabled:tw-opacity-[0.5] disabled:tw-cursor-not-allowed";

  return (
    <div ref={rootRef} className="tw-relative tw-flex-shrink-0">
      <button
        type="button"
        aria-label="Member options"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={toggle}
        className="tw-w-[26px] tw-h-[26px] tw-rounded-full tw-border-none tw-bg-transparent tw-text-[var(--text-2)] tw-flex tw-items-center tw-justify-center tw-cursor-pointer hover:tw-bg-[var(--surface-hover)] disabled:tw-opacity-[0.5]"
      >
        {busy ? (
          <AiOutlineLoading3Quarters className="tw-animate-spin tw-text-[13px]" />
        ) : (
          <BsThreeDots size={15} />
        )}
      </button>
      {open && (
        <div
          role="menu"
          className={`tw-absolute tw-right-0 ${
            upwards ? "tw-bottom-[30px]" : "tw-top-[30px]"
          } tw-z-[5] tw-min-w-[190px] tw-bg-[var(--surface)] tw-rounded-md tw-border tw-border-[var(--border)] tw-p-[6px] tw-flex tw-flex-col tw-gap-[2px]`}
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          {isAdmin ? (
            viewerIsOwner && (
              <button
                type="button"
                role="menuitem"
                disabled={locked}
                onClick={pick(onDemote)}
                className={`${item} tw-text-[var(--text)]`}
              >
                <FaCircleArrowDown size={14} />
                <span>Demote to Member</span>
              </button>
            )
          ) : (
            <button
              type="button"
              role="menuitem"
              disabled={locked}
              onClick={pick(onPromote)}
              className={`${item} tw-text-[var(--text)]`}
            >
              <FaCircleArrowUp size={14} />
              <span>Promote to Admin</span>
            </button>
          )}
          {/* It drops their membership, not just this call - they lose the
              conference until invited again. */}
          <button
            type="button"
            role="menuitem"
            disabled={locked}
            onClick={pick(onRemove)}
            className={`${item} tw-text-[var(--pink)]`}
          >
            <IoPersonRemove size={14} />
            <span>Remove from conference</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MemberActionsMenu;
