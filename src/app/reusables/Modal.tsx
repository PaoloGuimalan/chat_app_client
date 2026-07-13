/* eslint-disable @typescript-eslint/no-explicit-any */
import { createPortal } from "react-dom";

// Portaled to <body> so this always sits above the message list regardless
// of any ancestor stacking context (e.g. a transformed/animated message
// bubble) that would otherwise trap a plain `position: fixed` overlay.
function Modal({ component }: any) {
  return createPortal(
    <div className="cl-modal-overlay tw-fixed tw-z-[9999] tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-top-0 tw-left-0">
      {component}
    </div>,
    document.body,
  );
}

export default Modal;

