import Skeleton from "react-loading-skeleton";

function ServerItemLoader() {
  return (
    <div className="tw-bg-white tw-w-full tw-h-[300px] tw-min-h-[300px] tw-max-w-[300px] tw-flex tw-flex-col tw-rounded-[5px]">
      <div className="tw-bg-white tw-w-full tw-h-full tw-min-h-[0px] tw-border-solid tw-border-[0px] tw-border-b-[0px] tw-border-[#d2d2d2] tw-flex tw-flex-col tw-justify-start tw-items-center  tw-rounded-[5px]">
        <div className="tw-bg-[#D2D2D2] tw-w-full tw-flex tw-max-w-[1500px] tw-rounded-b-[0px] tw-h-[120px] tw-rounded-t-[5px]" />
        <div className="tw-w-[calc(100%-30px)] tw-pl-[15px] tw-pr-[15px] tw-flex tw-flex-col tw-items-start tw-gap-[5px]">
          <div className="tw-cursor-pointer tw-bg-[#d2d2d2] tw-w-[50px] tw-h-[50px] tw-border-solid tw-border-[5px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[20px] tw-relative tw--mt-[30px]">
            <Skeleton
              circle
              height="40px"
              width="40px"
              className="img_default_profile"
              baseColor="rgb(210, 210, 210)"
            />
          </div>
          <div className="tw-w-[calc(100%-10px)] tw-pr-[5px] tw-pl-[5px] tw-flex tw-flex-col tw-items-start tw-gap-[5px]">
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-[150px]"
              //   width="100%"
              height="15px"
              baseColor="rgb(210, 210, 210)"
              count={1}
            />
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-full"
              //   width="100%"
              height="12px"
              baseColor="rgb(210, 210, 210)"
              count={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerItemLoader;
