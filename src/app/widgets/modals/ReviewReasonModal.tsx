import Modal from "@/app/reusables/Modal";
import { Btn } from "@/reusables/design";

export default function ReviewReasonModal({
  title,
  confirmLabel,
  reason,
  busy,
  onReasonChange,
  onConfirm,
  onClose,
}: {
  title: string;
  confirmLabel: string;
  reason: string;
  busy: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      component={
        <form
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onSubmit={(event) => {
            event.preventDefault();
            if (reason.trim() && !busy) onConfirm();
          }}
          className="cl-profile-surface tw-w-[calc(100%-24px)] tw-max-w-[460px] tw-rounded-[14px] tw-p-[20px] tw-text-left"
        >
          <h3 className="tw-mt-0">{title}</h3>
          <label className="tw-flex tw-flex-col tw-gap-[8px] tw-text-[13px]">
            Reason for the author
            <textarea
              autoFocus
              required
              maxLength={2000}
              rows={4}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              className="tw-rounded-[8px] tw-border tw-border-solid tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-p-[10px] tw-text-[var(--text)]"
            />
          </label>
          <div className="tw-flex tw-flex-wrap tw-justify-end tw-gap-[8px] tw-mt-[16px]">
            <Btn
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Btn>
            <Btn type="submit" disabled={busy || !reason.trim()}>
              {busy ? "Saving…" : confirmLabel}
            </Btn>
          </div>
        </form>
      }
    />
  );
}
