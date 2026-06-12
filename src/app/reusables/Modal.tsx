/* eslint-disable @typescript-eslint/no-explicit-any */

function Modal({ component }: any) {
  return (
    <div className="cl-modal-overlay tw-fixed tw-z-[50] tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-top-0 tw-left-0">
      {component}
    </div>
  );
}

export default Modal;

