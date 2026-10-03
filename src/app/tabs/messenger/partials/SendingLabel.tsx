import { useUploadProgress } from "@/reusables/hooks/mediaUpload";

/**
 * Under a pending file message: its upload's progress while the bytes go
 * up (reusables/hooks/mediaUpload.ts, keyed by the pending id), then
 * "...Sending" while the server turns it into a message.
 */
function SendingLabel({ pendingID }: { pendingID?: string }) {
  const progress = useUploadProgress(pendingID);
  return (
    <span className="span_sending_label">
      {progress === null
        ? "...Sending"
        : `Uploading ${Math.round(progress * 100)}%`}
    </span>
  );
}

export default SendingLabel;
