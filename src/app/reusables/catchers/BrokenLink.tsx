import { FaLinkSlash } from "react-icons/fa6";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

function BrokenLink({
  label,
  secondaryLabel,
}: {
  label: string;
  secondaryLabel: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="tw-bg-[var(--background)] tw-text-[var(--text)] tw-w-full tw-h-full tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
      <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[100] tw-shadow-lg tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-flex tw-items-center tw-justify-center tw-text-[var(--text)] tw-cursor-pointer"
      >
        <IoArrowBack style={{ fontSize: "20px", color: "var(--text)" }} />
      </button>
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
