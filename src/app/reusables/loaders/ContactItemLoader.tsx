import Skeleton from "react-loading-skeleton";

function ContactItemLoader() {
  return (
    <div className="div_cncts_cards">
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
      <div className="div_contact_fullname_loader">
        <Skeleton
          className="tw-max-w-full"
          containerClassName="tw-w-full"
          //   width="100%"
          height="20px"
          baseColor="rgb(210, 210, 210)"
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
