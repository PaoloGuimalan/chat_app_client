import Modal from "@/app/reusables/Modal";
import { ConfirmPrompt } from "./confirmPrompts";

interface ConfirmModalProps extends ConfirmPrompt {
  /**
   * Omit for an informational prompt: there is nothing to confirm, so the
   * dialog renders a single dismiss button (labelled with confirmLabel)
   * instead of a Cancel/destructive pair. Used where an action is refused
   * outright and the user just needs to be told why - offering "Cancel" next
   * to a button that does nothing would imply a choice that isn't there.
   */
  onConfirm?: () => void;
  onClose: () => void;
  // Locks both buttons while the action it guards is in flight. Optional:
  // most call sites close the prompt the moment it is confirmed and let
  // their own button render the spinner.
  isBusy?: boolean;
}

/**
 * The confirm-before-you-do-it prompt, ported from chatterloop_app's
 * AlertDialog (user_profile_view/realm_profile_view): title, one line of
 * consequence, Cancel + a destructive action.
 *
 * The app added it because unfollowing and unfriending are silent and
 * destructive - nothing tells the other side, and nothing on screen says it
 * worked - so a mis-tap costs a relationship. That is just as true with a
 * mouse, which is why the same guard now sits in front of the webapp's
 * Unfollow and Connected (remove) buttons.
 */
function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  isBusy,
}: ConfirmModalProps) {
  return (
    <Modal
      component={
        <div className="cl-profile-surface tw-w-[calc(100%-24px)] tw-max-w-[400px] tw-p-[18px] tw-flex tw-flex-col tw-gap-[8px] tw-items-start tw-rounded-[12px]">
          <span className="cl-text-body tw-font-semibold">{title}</span>
          <span className="cl-text-body-sm tw-text-[var(--text-2)]">
            {message}
          </span>
          <div className="tw-w-full tw-flex tw-gap-[6px] tw-justify-end tw-pt-[6px]">
            {onConfirm && (
              <button
                onClick={onClose}
                disabled={isBusy}
                className="cl-profile-action-button--secondary tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] cl-text-caption disabled:tw-opacity-[0.6] disabled:tw-cursor-not-allowed"
              >
                Cancel
              </button>
            )}
            <button
              onClick={onConfirm ?? onClose}
              disabled={isBusy}
              className={`${
                onConfirm
                  ? "cl-profile-action-button--danger"
                  : "cl-profile-action-button"
              } tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] cl-text-caption disabled:tw-opacity-[0.6] disabled:tw-cursor-not-allowed`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      }
    />
  );
}

export default ConfirmModal;
