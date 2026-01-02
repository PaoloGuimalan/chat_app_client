import { Popup } from "@vis.gl/react-maplibre";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { ProfilePopupProp } from "@/reusables/vars/props";
import CachedImage from "@/app/reusables/cachers/CachedImage";

function ProfilePopup({ coordinates, user }: ProfilePopupProp) {
  return (
    <Popup
      longitude={coordinates.longitude}
      latitude={coordinates.latitude}
      anchor="top-left"
      style={{
        width: "auto",
        minWidth: "250px",
        height: "auto",
        paddingTop: "10px",
        paddingLeft: "0px",
        // paddingBottom: "10px",
        // paddingLeft: "10px",
        // backgroundColor: "transparent",
      }}
      closeOnClick={false}
      closeButton={false}
    >
      <div className="tw-w-[calc(100%+20px)] tw--ml-[10px] tw--mt-[8px] tw-h-[100px] tw-pb-[10px]">
        {user.coverphoto !== "none" ? (
          <CachedImage
            src={user.coverphoto}
            className="tw-bg-black tw-max-h-full tw-max-w-full tw-w-full tw-h-full tw-object-cover"
          />
        ) : (
          <div className="tw-bg-black tw-w-full tw-flex tw-flex-1 tw-h-full tw-rounded-t-[0px]" />
        )}
      </div>
      <div className="tw-p-[2px] tw-flex tw-w-full tw-gap-[10px]">
        <div className="tw-bg-transparent tw-w-full tw-max-w-[50px] tw-flex tw-justify-center">
          <div className="tw--mt-[25px] tw-cursor-pointer tw-bg-[#d2d2d2] tw-min-w-[50px] tw-max-w-[50px] tw-h-[50px] sm:tw-max-w-[50px] sm:tw-h-[50px] tw-border-solid tw-border-[3px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative">
            <CachedImage src={DefaultProfile} id="img_default_profile" />
          </div>
        </div>
        <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-font-Inter tw--mt-[7px]">
          <span className="tw-text-[14px] tw-font-semibold tw-text-left">
            {user.fullName.firstName}
            {user.fullName.middleName == "N/A"
              ? ""
              : ` ${user.fullName.middleName}`}{" "}
            {user.fullName.lastName}
          </span>
          <span className="tw-text-[10px] tw--mt-[5px]">
            @{user.userID} (you)
          </span>
        </div>
      </div>
    </Popup>
  );
}

export default ProfilePopup;
