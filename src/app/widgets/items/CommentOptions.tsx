import { useEffect, useRef, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { MdDelete, MdEdit, MdReport } from "react-icons/md";

import ReportModal from "@/app/widgets/modals/ReportModal";

interface CommentOptionsProps {
  onDelete: () => void;
  /** Disables both actions while a delete is in flight. */
  isBusy?: boolean;
  /** The comment's own id - what a report is filed against. */
  commentID: string;
  /**
   * Yours. Edit/Delete are author-only; Report is everyone else's, so this
   * decides which half of the menu renders. The menu itself now shows on
   * EVERY comment, not just your own.
   */
  isOwnComment: boolean;
}

// Kebab menu for a comment row, mirroring PostOptions on post items: same
// trigger, same click-outside dismissal, same menu/button classes.
//
// Edit is present but deliberately disabled - the backend has no comment
// update path yet, so the affordance is shown without pretending to work.
function CommentOptions({
  onDelete,
  isBusy,
  commentID,
  isOwnComment,
}: CommentOptionsProps) {
  const [isOptionsToggled, setisOptionsToggled] = useState<boolean>(false);
  const [isReportOpen, setisReportOpen] = useState<boolean>(false);
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
          {isOwnComment && (
            <button
              disabled
              title="Editing comments isn't available yet"
              className="cl-post-options-button tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent"
              style={{ opacity: 0.45, cursor: "not-allowed" }}
            >
              <MdEdit
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Edit</span>
            </button>
          )}
          {isOwnComment && (
            <button
              disabled={isBusy}
              onClick={() => {
                setisOptionsToggled(false);
                onDelete();
              }}
              className="cl-post-options-button cl-post-options-button--danger tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent"
            >
              <MdDelete
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Delete</span>
            </button>
          )}
          {!isOwnComment && (
            <button
              onClick={() => {
                setisOptionsToggled(false);
                setisReportOpen(true);
              }}
              className="cl-post-options-button tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent"
            >
              <MdReport
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Report</span>
            </button>
          )}
        </div>
      )}
      {isReportOpen && (
        <ReportModal
          targetType="comment"
          targetId={commentID}
          onClose={() => setisReportOpen(false)}
        />
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
