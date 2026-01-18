/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { useMemo } from "react";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function EntryView() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const navigate = useNavigate();

  return (
    <div className="tw-flex tw-flex-col tw-gap-[15px] tw-h-auto tw-w-full tw-bg-white tw-rounded-[7px] tw-items-center">
      <div className="tw-w-[calc(100%-40px)] tw-flex tw-items-center tw-h-[31px] tw-gap-[2px] tw-p-[18px] tw-pb-[2px] tw-pl-[20px] tw-pr-[20px]">
        {isMobileView && (
          <button
            onClick={() => {
              navigate(`/${authentication.user.userID}/diary`);
            }}
            className="tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-h-[40px] tw-w-[40px]"
          >
            <IoArrowBack style={{ fontSize: "20px" }} />
          </button>
        )}
        <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
          Create New Entry
        </span>
      </div>
    </div>
  );
}

export default EntryView;
