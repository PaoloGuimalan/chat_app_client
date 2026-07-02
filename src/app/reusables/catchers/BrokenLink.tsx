import { FaLinkSlash } from "react-icons/fa6";

function BrokenLink({
  label,
  secondaryLabel,
}: {
  label: string;
  secondaryLabel: string;
}) {
  return (
    <div className="tw-bg-[var(--background)] tw-text-[var(--text)] tw-w-full tw-h-full tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
      <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-gap-[15px] tw-items-center tw-justify-center">
        <FaLinkSlash style={{ fontSize: "100px", color: "var(--text)" }} />
        <div className="tw-flex tw-flex-col tw-gap-[5px] tw-text-[var(--text)]">
          <span className="tw-font-semibold tw-text-[16px] tw-text-[var(--text)]">
            {label}
            {/* Link is broken. */}
          </span>
          <span className="tw-font-normal tw-text-[14px] tw-text-[var(--text-2)]">
            {secondaryLabel}
            {/* Please check and try again. */}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BrokenLink;

