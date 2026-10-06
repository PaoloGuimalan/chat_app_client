import { unreadDividerLabel } from "@/reusables/hooks/unreadDivider";

/**
 * "N unread messages" - drawn right above the oldest unread message (see
 * hooks/unreadDivider). Styled by `.cl-unread-divider`: neutral grey, never
 * the accent. Rendered AFTER that message in the DOM, because the thread is
 * column-reverse.
 */
function UnreadDividerLine({ count }: { count: number }) {
  return (
    <div role="separator" className="cl-unread-divider">
      <span className="cl-unread-divider__label cl-text-meta">
        {unreadDividerLabel(count)}
      </span>
    </div>
  );
}

export default UnreadDividerLine;
