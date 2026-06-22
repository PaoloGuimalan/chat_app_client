/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ExportAccountDataRequest,
  DeleteAccountRequest,
} from "@/reusables/hooks/requests";

function DataPrivacy() {
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();

  const [isExporting, setisExporting] = useState<boolean>(false);
  const [isDeleting, setisDeleting] = useState<boolean>(false);
  const [confirmDelete, setconfirmDelete] = useState<boolean>(false);

  const exportProcess = () => {
    setisExporting(true);
    ExportAccountDataRequest(dispatch, alerts, setisExporting);
  };

  const deleteProcess = () => {
    if (!confirmDelete) {
      setconfirmDelete(true);
      return;
    }
    setisDeleting(true);
    DeleteAccountRequest(dispatch, alerts, setisDeleting);
  };

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-gap-[10px] tw-flex-col tw-items-start tw-font-Inter">
      <div className="tw-w-full tw-flex tw-items-start">
        <span className="tw-text-[16px] tw-font-Inter tw-font-semibold">
          Data &amp; Privacy
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[30px]">
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
            <span className="tw-text-[14px] tw-font-semibold">
              Export your data
            </span>
            <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
              Download a copy of the personal data we hold about you,
              including your profile, posts, comments, diary entries, realm
              memberships, messages, and consent history.
            </span>
          </div>
          <button
            onClick={exportProcess}
            disabled={isExporting}
            className="tw-min-w-[140px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--surface-2)] tw-text-[var(--text)] tw-rounded-[var(--r-md)] tw-text-[13px] hover:tw-bg-[var(--surface-hover)] tw-transition-colors disabled:tw-opacity-[0.65]"
          >
            {isExporting ? "Preparing…" : "Download my data"}
          </button>
        </div>

        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
            <span className="tw-text-[14px] tw-font-semibold tw-text-[#d64545]">
              Delete your account
            </span>
            <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
              This permanently deactivates your account and removes your
              identifying information. Your account will become unusable and
              you'll be signed out immediately. This cannot be undone.
            </span>
          </div>
          <div className="tw-w-full tw-flex tw-flex-row tw-items-start tw-gap-[6px]">
            <button
              onClick={deleteProcess}
              disabled={isDeleting}
              className="tw-min-w-[140px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[#d64545] tw-text-white tw-rounded-[var(--r-md)] tw-text-[13px] disabled:tw-opacity-[0.65] tw-transition-colors"
            >
              {isDeleting
                ? "Deleting…"
                : confirmDelete
                  ? "Confirm permanent deletion"
                  : "Delete my account"}
            </button>
            {confirmDelete && !isDeleting && (
              <button
                onClick={() => setconfirmDelete(false)}
                className="tw-min-w-[92px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--surface-2)] tw-text-[var(--text)] tw-rounded-[var(--r-md)] tw-text-[13px] hover:tw-bg-[var(--surface-hover)] tw-transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataPrivacy;
