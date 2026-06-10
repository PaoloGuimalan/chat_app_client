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
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-p-[18px] sm:tw-p-[24px] tw-gap-[18px] tw-bg-[var(--background)] tw-min-h-0">
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-[4px]">
        <span className="tw-text-[var(--text)] tw-text-[20px] tw-font-semibold tw-font-Inter">
          Media
        </span>
        <span className="tw-text-[var(--text-2)] tw-text-[14px] tw-font-Inter tw-max-w-[760px]">
          Manage your{" "}
          {realmState.type === "group" && realmState.parent
            ? "channel"
            : realmState.type}{" "}
          profile or cover photo
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[16px] tw-pb-[20px]">
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
          <span className="tw-text-[var(--text)] tw-text-[16px] tw-font-semibold tw-font-Inter">
            Profile
          </span>
          <div className="tw-flex tw-flex-col tw-gap-[20px] tw-w-full tw-max-w-[860px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-min-h-[300px] tw-items-center tw-justify-center tw-rounded-[var(--r-md)] tw-p-[18px] sm:tw-p-[24px]">
            {selectedProfile && (
              <CachedImage
                src={URL.createObjectURL(selectedProfile)}
                className="tw-w-full tw-max-w-[220px] tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)]"
              />
            )}
            {!selectedProfile &&
              (realmState.profile &&
              realmState.profile !== "N/A" &&
              !selectedProfile ? (
                <CachedImage
                  src={realmState.profile}
                  className="tw-w-full tw-max-w-[220px] tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)]"
                />
              ) : (
                <div className="tw-bg-[var(--surface-2)] img-placeholder tw-h-full tw-max-h-[220px] tw-w-full tw-max-w-[220px] tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)]" />
              ))}

            <div className="tw-flex tw-gap-[5px]">
              <button
                disabled={isSaving}
                onClick={handleDivClick}
                className="tw-min-w-[96px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--surface-2)] tw-text-[var(--text)] tw-rounded-[var(--r-md)] tw-text-[13px] hover:tw-bg-[var(--surface-hover)] tw-transition-colors"
              >
                Select Image
              </button>
              {selectedProfile && (
                <button
                  disabled={isSaving}
                  onClick={() => {
                    UploadRealmMediaProcess("profile");
                  }}
                  className="tw-min-w-[96px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--brand)] tw-text-white tw-rounded-[var(--r-md)] tw-text-[13px]"
                >
                  Upload
                </button>
              )}
            </div>
          </div>
        </div>
        {realmState.type !== "group" && (
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
            <span className="tw-text-[var(--text)] tw-text-[16px] tw-font-semibold tw-font-Inter">
              Cover Photo
            </span>
            <div className="tw-flex tw-flex-col tw-gap-[20px] tw-w-full tw-max-w-[860px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-h-auto tw-items-center tw-justify-center tw-rounded-[var(--r-md)] tw-p-[18px] sm:tw-p-[24px]">
              {selectedCoverPhoto && (
                <CachedImage
                  src={URL.createObjectURL(selectedCoverPhoto)}
                  className="tw-w-full tw-h-[400px] tw-object-cover tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)]"
                />
              )}
              {!selectedCoverPhoto &&
                (realmState.cover_photo && realmState.cover_photo !== "N/A" ? (
                  <CachedImage
                    src={realmState.cover_photo}
                    className="tw-w-full tw-h-[400px] tw-object-cover tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)]"
                  />
                ) : (
                  <div className="tw-w-full tw-h-[400px] tw-bg-[var(--surface-2)] img-placeholder tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)]" />
                ))}
              <div className="tw-flex tw-gap-[5px]">
                <button
                  disabled={isSaving}
                  onClick={handleCoverClick}
                  className="tw-min-w-[96px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--surface-2)] tw-text-[var(--text)] tw-rounded-[var(--r-md)] tw-text-[13px] hover:tw-bg-[var(--surface-hover)] tw-transition-colors"
                >
                  Select Image
                </button>
                {selectedCoverPhoto && (
                  <button
                    disabled={isSaving}
                    onClick={() => {
                      UploadRealmMediaProcess("cover_photo");
                    }}
                    className="tw-min-w-[96px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--brand)] tw-text-white tw-rounded-[var(--r-md)] tw-text-[13px]"
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
