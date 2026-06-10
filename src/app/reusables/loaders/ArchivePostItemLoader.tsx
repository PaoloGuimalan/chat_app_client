import Skeleton from "react-loading-skeleton";

function ArchivePostItemLoader() {
  return (
    <div className=" tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-w-[calc(100%-40px)] tw-p-[20px] tw-pb-[7px] tw-flex tw-flex-col tw-gap-[10px]">
      <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px]">
        <div id="div_img_feed_post_container">
          <Skeleton
            circle
            height="40px"
            width="40px"
            style={{
              maxHeight: "40px",
              maxWidth: "40px",
              minHeight: "40px",
              minWidth: "40px",
            }}
            className="img_search_profiles_ntfs"
            baseColor="rgb(210, 210, 210)"
          />
        </div>
        <div className="tw-flex tw-flex-col tw-items-start tw-gap-[0px]">
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
            containerClassName="tw-w-[100px]"
            //   width="100%"
            height="12px"
            baseColor="rgb(210, 210, 210)"
            count={1}
          />
        </div>
      </div>
      <div
        className={`tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[10px] tw-pt-[10px] tw-min-h-[35px] tw-justify-center tw-mb-[15px]`}
      >
        <Skeleton
          className="tw-max-w-full"
          containerClassName="tw-w-full"
          //   width="100%"
          height="20px"
          baseColor="rgb(210, 210, 210)"
          count={3}
        />
      </div>
    </div>
  );
}

export default ArchivePostItemLoader;
