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
    <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
      <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[100] tw-shadow-lg tw-bg-[#d2d2d2] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
      >
        <IoArrowBack style={{ fontSize: "20px" }} />
      </button>
      <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-gap-[15px] tw-items-center tw-justify-center">
        <FaLinkSlash style={{ fontSize: "100px", color: "#333333" }} />
        <div className="tw-flex tw-flex-col tw-gap-[5px] tw-text-[#333333]">
          <span className="tw-font-semibold tw-text-[16px]">
            {label}
            {/* Link is broken. */}
          </span>
          <span className="tw-font-normal tw-text-[14px]">
            {secondaryLabel}
            {/* Please check and try again. */}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BrokenLink;
