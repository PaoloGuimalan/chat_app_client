/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import { createPortal } from "react-dom";
import { useScopedPortalRoot } from "@/reusables/hooks/useScopedPortalRoot";

// Portaled to the current page's ".cl-redesign"/".App" wrapper (falling
// back to <body>) so this always sits above the message list regardless of
// any ancestor stacking context (e.g. a transformed/animated message
// bubble) that would otherwise trap a plain `position: fixed` overlay -
// while still inheriting that wrapper's font-size/theme/scrollbar scoping,
// which a plain document.body portal would skip entirely.
function Modal({ component }: any) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const portalRoot = useScopedPortalRoot(anchorRef);

  return (
    <>
      <span ref={anchorRef} style={{ display: "none" }} />
      {portalRoot &&
        createPortal(
          <div className="cl-modal-overlay tw-fixed tw-z-[9999] tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-top-0 tw-left-0">
            {component}
          </div>,
          portalRoot,
        )}
    </>
  );
}

export default Modal;
