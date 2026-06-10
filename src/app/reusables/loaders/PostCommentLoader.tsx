import { Fragment } from "react";
import Skeleton from "react-loading-skeleton";

function PostCommentLoader() {
  return (
    <Fragment>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="tw-flex tw-gap-[12px] tw-w-full tw-items-start"
        >
          <div id="div_img_comments_container">
            <div id="div_img_search_profiles_container_cncts">
              <Skeleton
                circle
                height="40px"
                width="40px"
                className="img_search_profiles_ntfs"
                baseColor="var(--surface-3)"
                highlightColor="var(--surface-hover)"
              />
            </div>
          </div>
          <div className="tw-flex tw-flex-col tw-items-start tw-gap-[8px] tw-text-left tw-flex-1 tw-min-w-0">
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-[120px]"
              height="14px"
              baseColor="var(--surface-3)"
              highlightColor="var(--surface-hover)"
              count={1}
            />
            <Skeleton
              className="tw-max-w-full"
              containerClassName="tw-w-full"
              height={index === 2 ? "72px" : "46px"}
              baseColor="var(--surface-3)"
              highlightColor="var(--surface-hover)"
              count={1}
            />
          </div>
        </div>
      ))}
    </Fragment>
  );
}

export default PostCommentLoader;
