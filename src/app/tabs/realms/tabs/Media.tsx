import CachedImage from "@/app/reusables/cachers/CachedImage";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";

function Media({ realm }: { realm: IRealmProfileInfo }) {
  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-p-[20px] tw-gap-[20px]">
      <div className="tw-flex tw-flex-col tw-items-start">
        <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
          Media
        </span>
        <span className="tw-text-[#383838] tw-text-[14px] tw-font-Inter">
          Manage your{" "}
          {realm.type === "group" && realm.parent ? "channel" : realm.type}{" "}
          profile or cover photo
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[20px]">
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
          <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
            Profile
          </span>
          <div className="tw-flex tw-flex-col tw-gap-[20px] tw-w-full tw-bg-white tw-min-h-[300px] tw-items-center tw-justify-center tw-rounded-md">
            {realm.profile && realm.profile !== "N/A" ? (
              <CachedImage
                src={realm.profile}
                className="tw-w-full tw-max-w-[220px] tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md"
              />
            ) : (
              <div className="tw-bg-[#e2e2e2] img-placeholder tw-h-full tw-max-h-[220px] tw-w-full tw-max-w-[220px] tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md" />
            )}
            <button
              disabled
              className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#1c7def] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
            >
              Upload
            </button>
          </div>
        </div>
        {realm.type !== "group" && (
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
            <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
              Cover Photo
            </span>
            <div className="tw-flex tw-flex-col tw-gap-[20px] tw-w-[calc(100%-40px)] tw-bg-white tw-h-auto tw-items-center tw-justify-center tw-rounded-md tw-p-[20px]">
              {realm.cover_photo && realm.cover_photo !== "N/A" ? (
                <CachedImage
                  src={realm.cover_photo}
                  className="tw-w-full tw-h-[400px] tw-object-cover tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md"
                />
              ) : (
                <div className="tw-w-full tw-h-[400px] tw-bg-[#e2e2e2] img-placeholder tw-max-h-[220px] tw-max-w-[220px] tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md" />
              )}
              <button
                disabled
                className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#1c7def] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
              >
                Upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Media;
