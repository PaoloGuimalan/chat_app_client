/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { useScopedPortalRoot } from "@/reusables/hooks/useScopedPortalRoot";

/**
 * Full-viewport image lightbox.
 *
 * This markup used to be pasted inline at each call site as a
 * `position: absolute` overlay, so it sized itself to the nearest positioned
 * ancestor - the conversation pane in the messenger, a single thumbnail tile
 * in the diary - rather than to the screen. Portaling it out of the message
 * tree and switching to `position: fixed` (see #div_fullscreen_image_preview)
 * is what makes it cover the whole viewport no matter where it was opened.
 *
 * The portal target is the page's own `.cl-redesign` / `.App` wrapper, not
 * <body>: that is the scope the font-size and scrollbar rules hang off, and
 * it still escapes any transformed ancestor further down that would otherwise
 * trap a fixed element.
 */
interface FullscreenImageViewerProps {
  /** Image to show. The viewer renders nothing when this is empty. */
  src: string;
  onClose: () => void;
  /** Matches the close-icon sizing the host screen uses elsewhere. */
  closeIconSize?: string | number;
}

function FullscreenImageViewer({
  src,
  onClose,
  closeIconSize = "17px",
}: FullscreenImageViewerProps) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const portalRoot = useScopedPortalRoot(anchorRef);

  // Held in a ref so the listener below can bind once: call sites pass an
  // inline arrow, which would otherwise re-subscribe on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKey);

    // The viewer covers the page now, so the page behind it must not scroll.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!src) return null;

  return (
    <>
      <span ref={anchorRef} style={{ display: "none" }} />
      {portalRoot &&
        createPortal(
          <div id="div_fullscreen_image_preview">
            <button
              id="btn_close_fip"
              aria-label="Close image"
              onClick={onClose}
            >
              <AiOutlineClose style={{ fontSize: closeIconSize }} />
            </button>
            <div id="div_fip_onblur" onClick={onClose} />
            <CachedImage src={src} id="img_fip" />
          </div>,
          portalRoot,
        )}
    </>
  );
}

export default FullscreenImageViewer;
