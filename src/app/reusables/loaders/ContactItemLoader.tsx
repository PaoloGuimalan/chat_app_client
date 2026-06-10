import Skeleton from "react-loading-skeleton";

function ContactItemLoader() {
  return (
    <div className="cl-contact-row cl-contact-row--loading">
      <div id="div_img_cncts_container">
        <div id="div_img_search_profiles_container_cncts">
          <Skeleton
            circle
            height="42px"
            width="42px"
            className="img_search_profiles_ntfs"
            baseColor="var(--surface-3)"
            highlightColor="var(--surface-hover)"
          />
        </div>
      </div>
      <div className="cl-contact-row__content cl-contact-row__content--loader">
        <Skeleton
          className="tw-max-w-full"
          containerClassName="tw-w-full"
          //   width="100%"
          height="20px"
          baseColor="var(--surface-3)"
          highlightColor="var(--surface-hover)"
          count={1}
        />
      </div>
      {/* <div className="div_cncts_navigations">
        <Skeleton
          containerClassName="btn_cncts_navigations"
          height="25px"
          width="25px"
          baseColor="rgb(210, 210, 210)"
        />
        <Skeleton
          containerClassName="btn_cncts_navigations"
          height="25px"
          width="25px"
          baseColor="rgb(210, 210, 210)"
        />
      </div> */}
    </div>
  );
}

export default ContactItemLoader;
