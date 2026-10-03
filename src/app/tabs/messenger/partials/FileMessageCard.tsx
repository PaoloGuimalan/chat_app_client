import type { CSSProperties } from "react";
import { IoDocumentOutline } from "react-icons/io5";
import { MessageAttachment, messageFile } from "./fileMessage";

/**
 * A file message: document icon and file name on `.cl-message-file-card`,
 * which holds the colours for both themes.
 *
 * One component for the message AND its quote above a reply. The quote used
 * to be its own markup, and drifted: it read the name only from the
 * `%%%` form (a bare-URL file quoted as an empty card), and filled your own
 * file with the accent, which the real file message never does - neither
 * side's file is tinted.
 *
 * Name and size come from the message's `attachment` (see fileMessage.ts).
 */
function FileMessageCard({
  message,
  title,
  quote = false,
}: {
  message: { content?: string; attachment?: MessageAttachment | null };
  title?: string;
  /** Above a reply: sits flush, without the message's lift. */
  quote?: boolean;
}) {
  const style: CSSProperties | undefined = quote
    ? { boxShadow: "none" }
    : undefined;
  const file = messageFile(message);

  return (
    <div
      onClick={() => file.available && window.open(file.url, "_blank")}
      className={`cl-message-file-card tw-w-full tw-h-[70px] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px] ${
        file.available ? "tw-cursor-pointer" : "tw-opacity-60"
      }`}
      style={style}
      title={title}
    >
      <div className="tw-w-full tw-max-w-[40px]">
        <IoDocumentOutline style={{ fontSize: "40px" }} />
      </div>
      <div className="tw-flex tw-flex-col tw-min-w-0">
        <span className="cl-text-caption tw-break-all ellipsis-3-lines tw-font-semibold">
          {file.name}
        </span>
        <span className="cl-text-micro tw-opacity-70">
          {file.available ? file.sizeLabel : "No longer available"}
        </span>
      </div>
    </div>
  );
}

export default FileMessageCard;
