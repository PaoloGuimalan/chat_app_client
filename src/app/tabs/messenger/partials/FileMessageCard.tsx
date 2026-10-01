import type { CSSProperties } from "react";
import { IoDocumentOutline } from "react-icons/io5";
import { fileMessageName, fileMessageUrl } from "./fileMessage";

/**
 * A file message: document icon and file name on `.cl-message-file-card`,
 * which holds the colours for both themes.
 *
 * One component for the message AND its quote above a reply. The quote used
 * to be its own markup, and drifted: it read the name only from the
 * `%%%` form (a bare-URL file quoted as an empty card), and filled your own
 * file with the accent, which the real file message never does - neither
 * side's file is tinted.
 */
function FileMessageCard({
  content,
  title,
  quote = false,
}: {
  content: string;
  title?: string;
  /** Above a reply: sits flush, without the message's lift. */
  quote?: boolean;
}) {
  const style: CSSProperties | undefined = quote
    ? { boxShadow: "none" }
    : undefined;

  return (
    <div
      onClick={() => window.open(fileMessageUrl(content), "_blank")}
      className="cl-message-file-card tw-cursor-pointer tw-w-full tw-h-[70px] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px]"
      style={style}
      title={title}
    >
      <div className="tw-w-full tw-max-w-[40px]">
        <IoDocumentOutline style={{ fontSize: "40px" }} />
      </div>
      <span className="cl-text-caption tw-break-all ellipsis-3-lines tw-font-semibold">
        {fileMessageName(content)}
      </span>
    </div>
  );
}

export default FileMessageCard;
