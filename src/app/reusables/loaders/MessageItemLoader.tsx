import Skeleton from "react-loading-skeleton";

function MessageItemLoader() {
  return (
    <div className="div_messages_list_cards tw-border-[0px] tw-items-center">
      <div className="tw-relative tw-flex-none">
        <Skeleton
          circle
          height="46px"
          width="46px"
          className="img_search_profiles_ntfs"
          baseColor="var(--surface-3)"
          highlightColor="var(--surface-hover)"
        />
      </div>
      <div className="tw-flex tw-flex-1 tw-min-w-0 tw-flex-col tw-gap-[4px]">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-[10px]">
          <Skeleton
            containerClassName="tw-flex-1 tw-max-w-[180px]"
            height="12px"
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
            count={1}
          />
          <Skeleton
            containerClassName="tw-flex-none tw-w-[38px]"
            height="10px"
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
            count={1}
          />
        </div>
        <Skeleton
          containerClassName="tw-w-full tw-max-w-[240px]"
          height="10px"
          baseColor="var(--surface-3)"
          highlightColor="var(--surface-hover)"
          count={1}
        />
      </div>
      <div className="tw-flex tw-flex-none tw-flex-col tw-items-end tw-gap-[6px]">
        <Skeleton
          circle
          height="18px"
          width="18px"
          baseColor="var(--surface-3)"
          highlightColor="var(--surface-hover)"
        />
        <Skeleton
          circle
          height="14px"
          width="14px"
          baseColor="var(--surface-3)"
          highlightColor="var(--surface-hover)"
        />
      </div>
    </div>
  );
}

export default MessageItemLoader;
