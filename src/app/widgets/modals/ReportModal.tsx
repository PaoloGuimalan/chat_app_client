/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { MdReport } from "react-icons/md";

import Modal from "@/app/reusables/Modal";
import { SubmitReportRequest } from "@/reusables/hooks/requests";

// Mirrors Report.TARGET_TYPE_CHOICES in the user_service entity app. Anything
// not "user"/"realm" is content-level, so target_id is the artefact's id;
// entity-level types pass the *entity* id and the server nulls target_id.
export type ReportTargetType =
  | "user"
  | "realm"
  | "post"
  | "comment"
  | "message";

// Kept in sync with Report.REASON_CHOICES. Deliberately a static list rather
// than a fetch: the picker must open instantly, and the server re-validates
// every value anyway, so a stale entry here fails closed with a 400 instead of
// silently filing a report under the wrong reason.
const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "violence", label: "Violence or dangerous behavior" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "csae", label: "Child sexual abuse or exploitation" },
  { value: "impersonation", label: "Impersonation" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

const DEFAULT_TITLES: Record<ReportTargetType, string> = {
  user: "Report this account",
  realm: "Report this page",
  post: "Report this post",
  comment: "Report this comment",
  message: "Report this message",
};

interface ReportModalProps {
  targetType: ReportTargetType;
  // Entity id for user/realm; post/comment/message id otherwise.
  targetId: string;
  onClose: () => void;
  onSubmitted?: () => void;
  // Overrides the default heading - e.g. "Report this server" for a realm
  // whose type is server rather than page.
  title?: string;
}

/**
 * The single report flow for every target type.
 *
 * Extracted from Profile.tsx, which owned the only copy back when accounts
 * were the only thing you could report. Everything that differs between a
 * profile, a page and a post is a prop; the request shape is identical
 * because the server resolves the responsible entity itself.
 */
function ReportModal({
  targetType,
  targetId,
  onClose,
  onSubmitted,
  title,
}: ReportModalProps) {
  const dispatch = useDispatch();
  const alerts = useSelector((state: any) => state.alerts);

  const [reason, setReason] = useState<string>("spam");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitReport = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    SubmitReportRequest(
      {
        target_type: targetType,
        target_id: targetId,
        reason,
        description,
      },
      dispatch,
      alerts,
      setIsSubmitting,
    ).then((success) => {
      if (success) {
        onSubmitted?.();
        onClose();
      }
    });
  };

  return (
    <Modal
      component={
        <div className="cl-profile-surface tw-w-[calc(100%-24px)] tw-max-w-[460px] tw-p-[18px] tw-flex tw-flex-col tw-gap-[10px] tw-items-start tw-rounded-[12px]">
          <div className="tw-w-full tw-flex tw-items-center tw-gap-[8px]">
            <MdReport style={{ fontSize: "20px", color: "var(--text)" }} />
            <span className="tw-flex-1 cl-text-body tw-font-semibold">
              {title || DEFAULT_TITLES[targetType]}
            </span>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
              className="tw-w-[28px] tw-h-[28px] tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer disabled:tw-opacity-[0.6] disabled:tw-cursor-not-allowed"
            >
              <IoClose style={{ fontSize: "18px", color: "var(--text)" }} />
            </button>
          </div>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            // Everything locks while the request is in flight: the values have
            // already been sent, so a change now would silently disagree with
            // what gets filed.
            disabled={isSubmitting}
            aria-label="Reason"
            className="tw-w-full tw-p-[8px] tw-rounded-[8px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text)] cl-text-body-sm disabled:tw-opacity-[0.6] disabled:tw-cursor-not-allowed"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            placeholder="Additional details (optional)"
            rows={4}
            className="tw-w-full tw-p-[8px] tw-rounded-[8px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text)] cl-text-body-sm tw-resize-none disabled:tw-opacity-[0.6] disabled:tw-cursor-not-allowed"
          />
          <div className="tw-w-full tw-flex tw-gap-[6px] tw-justify-end">
            <button
              onClick={onClose}
              // Cancel too - dismissing mid-flight wouldn't abort the request,
              // it would just hide the outcome.
              disabled={isSubmitting}
              className="cl-profile-action-button--secondary tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] cl-text-caption disabled:tw-opacity-[0.6] disabled:tw-cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={submitReport}
              className="cl-profile-action-button tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] cl-text-caption disabled:tw-opacity-[0.6] disabled:tw-cursor-not-allowed"
            >
              {isSubmitting ? "Submitting…" : "Submit report"}
            </button>
          </div>
        </div>
      }
    />
  );
}

export default ReportModal;
