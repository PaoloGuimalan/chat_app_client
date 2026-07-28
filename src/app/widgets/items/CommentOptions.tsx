import { useEffect, useRef, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { MdDelete, MdEdit } from "react-icons/md";

interface CommentOptionsProps {
  onDelete: () => void;
  /** Disables both actions while a delete is in flight. */
  isBusy?: boolean;
}

// Kebab menu for a comment row, mirroring PostOptions on post items: same
// trigger, same click-outside dismissal, same menu/button classes.
//
// Edit is present but deliberately disabled - the backend has no comment
// update path yet, so the affordance is shown without pretending to work.
function CommentOptions({ onDelete, isBusy }: CommentOptionsProps) {
  const [isOptionsToggled, setisOptionsToggled] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setisOptionsToggled(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="tw-relative tw-flex-none">
      {isOptionsToggled && (
        <div className="cl-post-options-menu tw-z-[2] tw-flex tw-flex-col tw-gap-[2px] tw-min-w-[100px] tw-absolute tw-right-[20px] tw-top-[5px] tw-p-[10px] tw-rounded-md tw-border-solid tw-border-[1px] tw-shadow-md">
          <button
            disabled
            title="Editing comments isn't available yet"
            className="cl-post-options-button tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent"
            style={{ opacity: 0.45, cursor: "not-allowed" }}
          >
            <MdEdit
              size={15}
              style={{ marginLeft: "-1px", marginRight: "4px" }}
            />
            <span>Edit</span>
          </button>
          <button
            disabled={isBusy}
            onClick={() => {
              setisOptionsToggled(false);
              onDelete();
            }}
            className="cl-post-options-button tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent"
          >
            <MdDelete
              size={15}
              style={{ marginLeft: "-1px", marginRight: "4px" }}
            />
            <span>Delete</span>
          </button>
        </div>
      )}
      <button
        title="Comment options"
        aria-label="Comment options"
        onClick={() => {
          setisOptionsToggled(!isOptionsToggled);
        }}
        className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
      >
        <BsThreeDots style={{ fontSize: "15px", color: "var(--text-3)" }} />
      </button>
    </div>
  );
}

export default CommentOptions;
