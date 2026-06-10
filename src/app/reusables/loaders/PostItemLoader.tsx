import Skeleton from "react-loading-skeleton";

function PostItemLoader() {
  return (
    <div className="tw-w-full tw-p-[20px] tw-pb-[7px] tw-flex tw-flex-col tw-gap-[10px]">
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
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
          />
        </div>
        <div className="tw-flex tw-flex-col tw-items-start tw-gap-[0px]">
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
            containerClassName="tw-w-[100px]"
            //   width="100%"
            height="12px"
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
            count={1}
          />
        </div>
      </div>
      <div
        className={`tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[10px] tw-pt-[10px] tw-min-h-[35px] tw-justify-center`}
      >
        <Skeleton
          className="tw-max-w-full"
          containerClassName="tw-w-full"
          //   width="100%"
          height="20px"
          baseColor="var(--surface-3)"
          highlightColor="var(--surface-hover)"
          count={3}
        />
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[0px] tw-justify-center">
        <hr className="tw-w-full tw-border-t tw-border-[var(--border)] tw-opacity-[0.8] tw-mb-[5px] tw-z-[0]" />
        <div className="tw-flex tw-flex-row tw-flex-wrap tw-w-full tw-justify-evenly tw-items-center tw-mb-[5px]">
          <Skeleton
            circle
            height="32px"
            width="32px"
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
          />
          <Skeleton
            circle
            height="32px"
            width="32px"
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
          />
          <Skeleton
            circle
            height="32px"
            width="32px"
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
          />
        </div>
      </div>
    </div>
  );
}

export default PostItemLoader;
