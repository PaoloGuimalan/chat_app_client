import Skeleton from "react-loading-skeleton";

function MessageItemLoader() {
  return (
    <div className="div_messages_list_cards tw-border-[0px]">
      <div id="div_img_cncts_container">
        <div id="div_img_search_profiles_container_cncts">
          <Skeleton
            circle
            height="42px"
            width="42px"
            className="img_search_profiles_ntfs"
            baseColor="rgb(210, 210, 210)"
          />
        </div>
      </div>
      <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-items-start">
        <Skeleton
          containerClassName="tw-w-full tw-max-w-[150px]"
          //   width="100%"
          height="10px"
          baseColor="rgb(210, 210, 210)"
          count={1}
        />
        <Skeleton
          containerClassName="tw-w-full tw-max-w-[100px] tw--mt-[7px]"
          //   width="100%"
          height="7px"
          baseColor="rgb(210, 210, 210)"
          count={1}
        />
        <Skeleton
          containerClassName="tw-w-full"
          //   width="100%"
          height="15px"
          baseColor="rgb(210, 210, 210)"
          count={1}
        />
        <div className="tw-flex tw-flex-row tw-h-[20px] tw-w-full tw-gap-[5px]">
          <Skeleton
            containerClassName="tw-w-full tw-max-w-[50px]"
            height="15px"
            baseColor="rgb(210, 210, 210)"
            count={1}
          />
          <Skeleton
            containerClassName="tw-w-full tw-max-w-[50px]"
            height="15px"
            baseColor="rgb(210, 210, 210)"
            count={1}
          />
        </div>
      </div>
    </div>
  );
}

export default MessageItemLoader;
