/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useMemo, useState } from "react";
import { RiPagesLine } from "react-icons/ri";
import { useSelector } from "react-redux";

function MyPagesList() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const [pages, _setpages] = useState<any[]>([]);

  return (
    <Fragment>
      {pages.length === 0 && (
        <div className="tw-w-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[10px] tw-pb-[20px] tw-pt-[120px]">
          <RiPagesLine
            style={{
              fontSize: isMobileView ? "80px" : "120px",
              color: "#7f7f85",
            }}
          />
          <div className="tw-flex tw-flex-col tw-gap-[5px]">
            <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[#7f7f85]">
              No Pages yet
            </span>
            <span className="tw-text-[14px] tw-font-Inter tw-text-[#7f7f85]">
              Create your page and start building a community.
            </span>
          </div>
        </div>
      )}
    </Fragment>
  );
}

export default MyPagesList;
