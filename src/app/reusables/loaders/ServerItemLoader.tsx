import Skeleton from "react-loading-skeleton";

function ServerItemLoader({ flexed }: { flexed: boolean }) {
  return (
    <div
      className={`cl-display-card cl-display-card--loader tw-w-full tw-h-[300px] tw-min-h-[300px] ${!flexed && "tw-max-w-[300px]"} tw-flex tw-flex-col`}
    >
      <div className="cl-display-card__surface tw-w-full tw-h-full tw-min-h-[0px] tw-flex tw-flex-col tw-justify-start tw-items-center">
        <div className="cl-display-card__cover tw-w-full tw-flex tw-max-w-[1500px] tw-h-[120px]" />
        <div className="cl-display-card__body tw-w-[calc(100%-30px)] tw-pl-[15px] tw-pr-[15px] tw-flex tw-flex-col tw-items-start tw-gap-[6px]">
          <div className="cl-display-card__avatar-shell tw-cursor-pointer tw-w-[50px] tw-h-[50px] tw-flex tw-items-center tw-justify-center tw-rounded-[20px] tw-relative tw--mt-[30px]">
            <Skeleton
              circle
              height="40px"
              width="40px"
              className="img_default_profile"
              baseColor="var(--surface-3)"
              highlightColor="var(--surface-hover)"
            />
          </div>
          <div className="tw-w-[calc(100%-10px)] tw-pr-[5px] tw-pl-[5px] tw-flex tw-flex-col tw-items-start tw-gap-[6px]">
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-[150px]"
              //   width="100%"
              height="15px"
              baseColor="var(--surface-3)"
              highlightColor="var(--surface-hover)"
              count={1}
            />
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-full"
              //   width="100%"
              height="12px"
              baseColor="var(--surface-3)"
              highlightColor="var(--surface-hover)"
              count={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerItemLoader;
