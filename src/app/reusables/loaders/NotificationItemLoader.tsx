import Skeleton from "react-loading-skeleton";

function NotificationItemLoader() {
  return (
    <div className="div_ntfs_cards">
      <div id="div_img_ntfs_container">
        <div id="div_img_search_profiles_container_ntfs">
          <Skeleton
            circle
            height="45px"
            width="45px"
            className="img_search_profiles_ntfs"
            baseColor="rgb(210, 210, 210)"
          />
        </div>
      </div>
      <div id="div_ntfs_content">
        <Skeleton
          containerClassName="tw-w-full tw-max-w-[150px]"
          //   width="100%"
          height="10px"
          baseColor="rgb(210, 210, 210)"
          count={1}
        />
        <Skeleton
          containerClassName="tw-w-full"
          //   width="100%"
          height="15px"
          baseColor="rgb(210, 210, 210)"
          count={2}
        />
        <div className="tw-flex tw-flex-row tw-h-[20px] tw-w-full tw-gap-[5px]">
          <Skeleton
            containerClassName="tw-w-full tw-max-w-[80px]"
            height="15px"
            baseColor="rgb(210, 210, 210)"
            count={1}
          />
          <Skeleton
            containerClassName="tw-w-full tw-max-w-[80px]"
            height="15px"
            baseColor="rgb(210, 210, 210)"
            count={1}
          />
        </div>
      </div>
    </div>
  );
}

export default NotificationItemLoader;
