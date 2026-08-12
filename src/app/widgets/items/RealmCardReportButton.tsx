/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { MdReport } from "react-icons/md";

import ReportModal from "@/app/widgets/modals/ReportModal";

interface RealmCardReportButtonProps {
  // Entity id of the realm. Falls back to the realm's own pk if that's all the
  // card has - the reports endpoint resolves a realm from either.
  targetId: string;
  // "page" / "server" / "group" / ... - only used for the sheet heading.
  realmType?: string;
  // Hidden while you ARE this realm; the server rejects self-reports anyway.
  hidden?: boolean;
}

/**
 * The report affordance pinned to a realm card's top-right corner.
 *
 * Absolutely positioned, so the host card only needs `position: relative` on
 * whichever element the corner should be measured from - normally the cover
 * strip's parent. Stops propagation on click because these cards are clickable
 * as a whole: without it, reporting a server would also navigate into it.
 */
function RealmCardReportButton({
  targetId,
  realmType,
  hidden,
}: RealmCardReportButtonProps) {
  const [isReportOpen, setisReportOpen] = useState<boolean>(false);

  if (hidden || !targetId) return null;

  const noun = !realmType || realmType === "page" ? "page" : realmType;

  return (
    <>
      {/* Neutral scrim, NOT the danger red the labelled Report entries use.
          This sits on a card's cover photo as a small icon-only affordance;
          a red dot in the corner of every realm card reads as an alert about
          the card rather than an action available on it. Red is reserved for
          the menu/modal entries that say "Report" in words. */}
      <button
        type="button"
        aria-label={`Report this ${noun}`}
        title="Report"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setisReportOpen(true);
        }}
        className="cl-display-card__report tw-absolute tw-top-[8px] tw-right-[8px] tw-z-[2] tw-w-[28px] tw-h-[28px] tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-cursor-pointer tw-bg-[rgba(0,0,0,0.45)] hover:tw-bg-[rgba(0,0,0,0.65)] tw-transition-colors"
      >
        <MdReport style={{ fontSize: "15px", color: "#ffffff" }} />
      </button>
      {isReportOpen && (
        <ReportModal
          targetType="realm"
          targetId={targetId}
          title={`Report this ${noun}`}
          onClose={() => setisReportOpen(false)}
        />
      )}
    </>
  );
}

export default RealmCardReportButton;
