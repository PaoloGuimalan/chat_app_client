/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { UpdateRealmMediaRequest } from "@/reusables/hooks/requests";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { useRef, useState } from "react";

function Media({ realm }: { realm: IRealmProfileInfo }) {
  const [selectedProfile, setselectedProfile] = useState<File | null>(null);
  const [selectedCoverPhoto, setselectedCoverPhoto] = useState<File | null>(
    null,
  );
  const [isSaving, setisSaving] = useState<boolean>(false);

  const [realmState, setrealmState] = useState<IRealmProfileInfo>(realm);

  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const handleProfileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setselectedProfile(file);
    }
  };

  const handleCoverChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setselectedCoverPhoto(file);
    }
  };

  const handleDivClick = () => {
    profileInputRef.current?.click();
  };

  const handleCoverClick = () => {
    coverPhotoInputRef.current?.click();
  };

  const UploadRealmMediaProcess = (media_type: "profile" | "cover_photo") => {
    if (media_type === "profile" && !selectedProfile) {
      return;
    }

    if (media_type === "cover_photo" && !selectedCoverPhoto) {
      return;
    }

    setisSaving(true);
    UpdateRealmMediaRequest({
      realm_id: realmState.realm_id,
      realm_type:
        realmState.type === "group" && realmState.parent
          ? "channel"
          : realmState.type,
      media_type,
      image: media_type === "profile" ? selectedProfile! : selectedCoverPhoto!,
    })
      .then((response) => {
        setisSaving(false);

        if (response.details.media_type === "profile") {
          setselectedProfile(null);
          setrealmState((prev: IRealmProfileInfo) => {
            return {
              ...prev,
              profile: response.details.url,
            };
          });
        }

        if (response.details.media_type === "cover_photo") {
          setselectedCoverPhoto(null);
          setrealmState((prev: IRealmProfileInfo) => {
            return {
              ...prev,
              cover_photo: response.details.url,
            };
          });
        }
      })
      .catch((err) => {
        setisSaving(false);
        console.log(err);
      });
  };

  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-p-[20px] tw-gap-[20px]">
      <div className="tw-flex tw-flex-col tw-items-start">
        <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
          Media
        </span>
        <span className="tw-text-[#383838] tw-text-[14px] tw-font-Inter">
          Manage your{" "}
          {realmState.type === "group" && realmState.parent
            ? "channel"
            : realmState.type}{" "}
          profile or cover photo
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[20px] tw-pb-[20px]">
        <input
          ref={profileInputRef}
          type="file"
          accept="image/*"
          onChange={handleProfileChange}
          className="hidden"
          hidden
          disabled={isSaving}
        />
        <input
          ref={coverPhotoInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
          hidden
          disabled={isSaving}
        />
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
          <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
            Profile
          </span>
          <div className="tw-flex tw-flex-col tw-gap-[20px] tw-w-[calc(100%-40px)] tw-bg-white tw-min-h-[300px] tw-items-center tw-justify-center tw-rounded-md tw-p-[20px]">
            {selectedProfile && (
              <CachedImage
                src={URL.createObjectURL(selectedProfile)}
                className="tw-w-full tw-max-w-[220px] tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md"
              />
            )}
            {!selectedProfile &&
              (realmState.profile &&
              realmState.profile !== "N/A" &&
              !selectedProfile ? (
                <CachedImage
                  src={realmState.profile}
                  className="tw-w-full tw-max-w-[220px] tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md"
                />
              ) : (
                <div className="tw-bg-[#e2e2e2] img-placeholder tw-h-full tw-max-h-[220px] tw-w-full tw-max-w-[220px] tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md" />
              ))}

            <div className="tw-flex tw-gap-[5px]">
              <button
                disabled={isSaving}
                onClick={handleDivClick}
                className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#acacac] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
              >
                Select Image
              </button>
              {selectedProfile && (
                <button
                  disabled={isSaving}
                  onClick={() => {
                    UploadRealmMediaProcess("profile");
                  }}
                  className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#1c7def] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
                >
                  Upload
                </button>
              )}
            </div>
          </div>
        </div>
        {realmState.type !== "group" && (
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
            <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
              Cover Photo
            </span>
            <div className="tw-flex tw-flex-col tw-gap-[20px] tw-w-[calc(100%-40px)] tw-bg-white tw-h-auto tw-items-center tw-justify-center tw-rounded-md tw-p-[20px]">
              {selectedCoverPhoto && (
                <CachedImage
                  src={URL.createObjectURL(selectedCoverPhoto)}
                  className="tw-w-full tw-h-[400px] tw-object-cover tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md"
                />
              )}
              {!selectedCoverPhoto &&
                (realmState.cover_photo && realmState.cover_photo !== "N/A" ? (
                  <CachedImage
                    src={realmState.cover_photo}
                    className="tw-w-full tw-h-[400px] tw-object-cover tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md"
                  />
                ) : (
                  <div className="tw-w-full tw-h-[400px] tw-bg-[#e2e2e2] img-placeholder tw-border-[1px] tw-border-solid tw-border-[#e2e2e2] tw-rounded-md" />
                ))}
              <div className="tw-flex tw-gap-[5px]">
                <button
                  disabled={isSaving}
                  onClick={handleCoverClick}
                  className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#acacac] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
                >
                  Select Image
                </button>
                {selectedCoverPhoto && (
                  <button
                    disabled={isSaving}
                    onClick={() => {
                      UploadRealmMediaProcess("cover_photo");
                    }}
                    className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#1c7def] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
                  >
                    Upload
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Media;
