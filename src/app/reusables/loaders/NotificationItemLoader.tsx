import Skeleton from "react-loading-skeleton";

function NotificationItemLoader() {
  return (
    <div className="cl-notification-row cl-notification-row--loading">
      <div className="cl-notification-row__avatar">
        <Skeleton
          circle
          height="44px"
          width="44px"
          className="img_search_profiles_ntfs"
          baseColor="var(--surface-3)"
          highlightColor="var(--surface-hover)"
        />
      </div>
      <div className="cl-notification-row__content">
        <Skeleton
          containerClassName="tw-w-full tw-max-w-[160px]"
          height="12px"
          baseColor="var(--surface-3)"
          highlightColor="var(--surface-hover)"
          count={1}
        />
        <Skeleton
          containerClassName="tw-w-full"
          height="16px"
          baseColor="var(--surface-3)"
          highlightColor="var(--surface-hover)"
          count={2}
        />
        <div className="cl-notification-row__meta">
          <Skeleton
            containerClassName="tw-w-full tw-max-w-[80px]"
            height="14px"
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
            count={1}
          />
          <Skeleton
            containerClassName="tw-w-full tw-max-w-[80px]"
            height="14px"
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
            count={1}
          />
        </div>
      </div>
    </div>
  );
}

export default NotificationItemLoader;
