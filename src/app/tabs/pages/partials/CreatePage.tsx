/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import OverlayLoader from "@/app/reusables/loaders/OverlayLoader";
import {
  ContactsListReusableRequest,
  CreatePageRequest,
} from "@/reusables/hooks/requests";
import {
  contactsToUserdetails,
  hasNullValues,
} from "@/reusables/hooks/reusable";
import {
  AuthenticationInterface,
  ContactRowData,
  IContact,
} from "@/reusables/vars/interfaces";
import { Avatar, Card } from "@/reusables/design/primitives2";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AiOutlineCheck,
  AiOutlineLoading3Quarters,
  AiOutlinePicture,
} from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { IoIosArrowForward } from "react-icons/io";

type PageModeratorCandidate = {
  id: string;
  entityID: string;
  userID: string;
  fullName: string;
  profile: string | null | undefined;
};

function CreatePage() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const [selectedProfile, setselectedProfile] = useState<File | null>(null);
  const [selectedCover, setselectedCover] = useState<File | null>(null);
  const [pageName, setpageName] = useState<string>("");
  const [pageDescription, setpageDescription] = useState<string>("");
  const [email, setemail] = useState<string>("");
  const [slug, setslug] = useState<string>("");
  const [markedMembers, setmarkedMembers] = useState<any[]>([]);
  const [contactslist, setcontactslist] = useState<IContact[]>([]);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [searchFilter, setsearchFilter] = useState<string>("");
  const [isSaving, setisSaving] = useState<boolean>(false);

  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setselectedProfile(file);
    }
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setselectedCover(file);
    }
  };

  const selectedProfilePreview = useMemo(
    () => (selectedProfile ? URL.createObjectURL(selectedProfile) : null),
    [selectedProfile],
  );

  const selectedCoverPreview = useMemo(
    () => (selectedCover ? URL.createObjectURL(selectedCover) : null),
    [selectedCover],
  );

  useEffect(() => {
    return () => {
      if (selectedProfilePreview) {
        URL.revokeObjectURL(selectedProfilePreview);
      }
    };
  }, [selectedProfilePreview]);

  useEffect(() => {
    return () => {
      if (selectedCoverPreview) {
        URL.revokeObjectURL(selectedCoverPreview);
      }
    };
  }, [selectedCoverPreview]);

  const finalData = useMemo(
    () => ({
      pageName,
      pageDescription,
      email,
      slug,
      otherUsers: markedMembers.map((member) => member.entityID),
      profile: selectedProfile,
      cover_photo: selectedCover,
    }),
    [
      email,
      markedMembers,
      pageDescription,
      pageName,
      selectedCover,
      selectedProfile,
      slug,
    ],
  );

  const payloadValid = useMemo(() => !hasNullValues(finalData), [finalData]);

  const rows: ContactRowData[] = Array.from(
    contactslist
      .flatMap((cnts) => {
        if (cnts.type !== "single") return [];
        if (!cnts.involved_entity || !cnts.action_by) return [];
        const selfActed =
          cnts.action_by.details.id === authentication.user.userID;
        const u = selfActed
          ? cnts.involved_entity.details
          : cnts.action_by.details;
        const details_ent = selfActed ? cnts.involved_entity : cnts.action_by;
        return [
          {
            id: u.id,
            entityID: details_ent.id,
            username: u.username,
            firstName: u.first_name,
            middleName: u.middle_name,
            lastName: u.last_name,
            profile: u.profile,
            isBadged: u.is_badged,
            connectionID: cnts.connection_id,
            selfActed,
            involvedUserdetails: contactsToUserdetails(cnts, !selfActed),
          },
        ];
      })
      .reduce(
        (map, item) => map.set(item.id, item),
        new Map<string, ContactRowData>(),
      )
      .values(),
  );

  const selectedMemberExists = (entityID: any) =>
    markedMembers.some((member) => member.entityID == entityID);

  const toggleMember = (candidate: PageModeratorCandidate) => {
    setmarkedMembers((prev) => {
      const currentMember = prev.some(
        (member) => member.entityID == candidate.entityID,
      );
      if (currentMember) {
        return prev.filter((member) => member.entityID != candidate.entityID);
      }

      return [
        ...prev,
        {
          id: candidate.id,
          entityID: candidate.entityID,
          userID: candidate.userID,
          fullName: candidate.fullName,
        },
      ];
    });
  };

  const removeFromList = (userID: any) => {
    setmarkedMembers((prev) => prev.filter((member) => member.id != userID));
  };

  useEffect(() => {
    ContactsListReusableRequest(setcontactslist, setisLoading);
  }, []);

  const SavePageProcess = () => {
    setisSaving(true);

    if (!payloadValid) {
      setisSaving(false);
      return;
    }

    CreatePageRequest(
      finalData as {
        pageName: string;
        pageDescription: string;
        email: string;
        slug: string;
        otherUsers: any[];
        profile: File;
        cover_photo: File;
      },
    )
      .then((response) => {
        navigate("/pages/my-pages");
        setisSaving(false);
        console.log(response);
      })
      .catch((err) => {
        setisSaving(false);
        console.log(err);
      });
  };

  const inputThemeClass =
    "tw-w-full tw-rounded-[14px] tw-bg-transparent tw-text-[var(--text)] tw-outline-none placeholder:tw-text-[var(--text-2)]";

  return (
    <div className="tw-w-full tw-h-full tw-min-h-0 tw-flex tw-justify-center tw-items-stretch">
      <div className="tw-relative tw-w-full tw-h-full tw-min-h-0 tw-flex tw-flex-col tw-overflow-hidden tw-bg-[var(--surface)]">
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
        <div className="tw-flex tw-flex-col tw-gap-[14px] tw-items-start tw-border-b tw-border-[var(--border)] tw-bg-[var(--surface)] tw-px-[18px] tw-py-[18px] sm:tw-px-[28px] sm:tw-py-[24px]">
          <div className="tw-flex tw-flex-col tw-gap-[6px] tw-max-w-[760px]">
            <span className="tw-font-Inter tw-font-semibold tw-text-[22px] tw-text-left sm:tw-text-[28px] tw-leading-[1.05] tw-text-[var(--text)]">
              Create page
            </span>
            <span className="tw-font-Inter tw-text-[12px] sm:tw-text-[13px] tw-text-[var(--text-2)]">
              Build a page identity with a cover, profile, description, and
              moderators.
            </span>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-[8px] tw-w-full sm:tw-w-auto">
            <div className="tw-flex tw-items-center tw-gap-[6px] tw-text-[12px] tw-font-Inter tw-text-[var(--text-2)]">
              <span>My Pages</span>
              <IoIosArrowForward size={16} />
              <span className="tw-font-semibold tw-text-[var(--text)]">
                Create
              </span>
            </div>
            <div className="tw-flex tw-flex-wrap tw-gap-[8px] tw-ml-auto">
              <button
                disabled={isSaving}
                onClick={() => {
                  navigate("/pages/my-pages");
                }}
                className="cl-pages-accent-button--ghost tw-border-none tw-px-[14px] tw-py-[8px] tw-min-w-[90px] disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
              >
                <span className="tw-font-Inter">Cancel</span>
              </button>
              <button
                disabled={isSaving || !payloadValid}
                onClick={() => {
                  SavePageProcess();
                }}
                className="cl-pages-accent-button tw-border-none tw-px-[14px] tw-py-[8px] tw-min-w-[90px] disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
              >
                <span className="tw-font-Inter">Save</span>
              </button>
            </div>
          </div>
        </div>

        <div className="tw-flex-1 tw-min-h-0 tw-overflow-y-auto x-scroll tw-bg-[var(--surface-2)]">
          <div className="tw-w-full tw-max-w-[1200px] tw-mx-auto tw-p-[16px] sm:tw-p-[24px] tw-flex tw-flex-col tw-gap-[18px]">
            <Card pad={0} style={{ overflow: "hidden", borderRadius: "20px" }}>
              <div className="tw-relative tw-w-full tw-min-h-[230px] sm:tw-min-h-[300px] tw-bg-[var(--surface-2)] tw-border-b tw-border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    coverPhotoInputRef.current?.click();
                  }}
                  className="tw-absolute tw-inset-0 tw-z-[2] tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-cursor-pointer tw-p-[18px] tw-text-left"
                  disabled={isSaving}
                >
                  {!selectedCoverPreview && (
                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-[8px] tw-text-center">
                      <AiOutlinePicture
                        style={{ fontSize: "44px", color: "var(--text-2)" }}
                      />
                      <span className="tw-font-Inter tw-text-[13px] tw-font-semibold tw-text-[var(--text)]">
                        Click to upload cover photo
                      </span>
                      <span className="tw-font-Inter tw-text-[12px] tw-text-[var(--text-2)]">
                        Use a wide image for the best result.
                      </span>
                    </div>
                  )}
                </button>
                {selectedCoverPreview && (
                  <CachedImage
                    src={selectedCoverPreview}
                    className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-cover"
                  />
                )}
              </div>

              <div className="tw-p-[16px] sm:tw-p-[24px] tw-pt-[18px]">
                <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-[18px] tw-items-start">
                  <button
                    type="button"
                    onClick={() => {
                      profileInputRef.current?.click();
                    }}
                    disabled={isSaving}
                    className="cl-pages-create-profile-shell tw-shrink-0 tw-mt-[-72px] sm:tw-mt-[-84px] tw-cursor-pointer tw-border-[5px] tw-border-[var(--surface)] tw-bg-[var(--surface-2)] tw-overflow-hidden"
                  >
                    <Avatar
                      id={pageName || "page"}
                      name={pageName || "Page"}
                      src={selectedProfilePreview}
                      size={isMobileView ? 112 : 144}
                      ring
                    />
                  </button>

                  <div className="tw-flex-1 tw-min-w-0 tw-flex tw-flex-col tw-gap-[14px] tw-pt-[8px] lg:tw-pt-[18px]">
                    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-[12px]">
                      <input
                        type="text"
                        placeholder="Your Page Name"
                        value={pageName}
                        className={`${inputThemeClass} cl-pages-create-control sm:tw-col-span-2 tw-text-[18px] sm:tw-text-[22px] tw-font-Inter tw-font-semibold tw-px-[14px] tw-py-[14px]`}
                        onChange={(e) => {
                          setpageName(e.target.value);
                        }}
                        disabled={isSaving}
                      />
                      <input
                        type="text"
                        placeholder="Your page email"
                        value={email}
                        className={`${inputThemeClass} cl-pages-create-control tw-font-Inter tw-text-[14px] tw-px-[14px] tw-py-[12px]`}
                        onChange={(e) => {
                          setemail(e.target.value);
                        }}
                        disabled={isSaving}
                      />
                      <div className="cl-pages-create-control cl-pages-create-control--tight tw-flex tw-items-center tw-gap-[8px] tw-px-[14px] tw-py-[12px]">
                        <span className="tw-text-[14px] tw-font-semibold tw-text-[var(--text-2)]">
                          @
                        </span>
                        <input
                          type="text"
                          placeholder="page_username"
                          value={slug}
                          className="tw-w-full tw-bg-transparent tw-text-[14px] tw-font-Inter tw-text-[var(--text)] tw-outline-none placeholder:tw-text-[var(--text-2)]"
                          onChange={(e) => {
                            setslug(e.target.value);
                          }}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] tw-gap-[18px] tw-items-start">
              <Card pad={20}>
                <div className="tw-flex tw-flex-col tw-gap-[14px]">
                  <div className="tw-flex tw-flex-col tw-gap-[4px]">
                    <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                      Description
                    </span>
                    <span className="tw-text-[12px] tw-font-Inter tw-text-[var(--text-2)]">
                      Describe what people should expect from this page.
                    </span>
                  </div>
                  <textarea
                    autoComplete="off"
                    value={pageDescription}
                    placeholder="Write description here..."
                    className="cl-pages-create-control tw-w-full tw-min-h-[220px] tw-resize-none tw-p-[14px] tw-font-Inter tw-text-[14px] tw-leading-[1.55] tw-text-[var(--text)] tw-outline-none placeholder:tw-text-[var(--text-2)]"
                    onChange={(e) => {
                      setpageDescription(e.target.value);
                    }}
                    disabled={isSaving}
                  />
                </div>
              </Card>

              <Card pad={20}>
                <div className="tw-flex tw-flex-col tw-gap-[14px]">
                  <div className="tw-flex tw-flex-col tw-gap-[4px]">
                    <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                      Page Admin / Moderators
                    </span>
                    <span className="tw-text-[12px] tw-font-Inter tw-text-[var(--text-2)]">
                      Add people who can manage the page.
                    </span>
                  </div>

                  <div className="tw-flex tw-flex-col tw-gap-[10px]">
                    <div className="tw-flex tw-flex-col tw-gap-[6px]">
                      <span className="tw-text-[12px] tw-font-semibold tw-font-Inter tw-text-[var(--text-2)]">
                        Add people
                      </span>
                      <input
                        value={searchFilter}
                        onChange={(e) => {
                          setsearchFilter(e.target.value);
                        }}
                        type="text"
                        placeholder="Type a name of a user"
                        className={`${inputThemeClass} cl-pages-create-control tw-px-[14px] tw-py-[12px] tw-font-Inter tw-text-[14px]`}
                        disabled={isSaving}
                      />
                    </div>

                    <motion.div
                      animate={{
                        minHeight: markedMembers.length > 0 ? "auto" : "0px",
                        height: markedMembers.length > 0 ? "auto" : "0px",
                      }}
                      className="tw-flex tw-flex-col tw-gap-[8px] tw-overflow-hidden"
                    >
                      {markedMembers.map((member: any) => (
                        <div
                          key={member.id}
                          className="cl-pages-create-member-card tw-flex tw-items-center tw-justify-between tw-gap-[12px] tw-px-[12px] tw-py-[10px]"
                        >
                          <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-font-Inter tw-text-[14px] tw-font-semibold tw-text-[var(--text)]">
                            {member.fullName}
                          </span>
                          <button
                            type="button"
                            className="cl-pages-create-member-chip tw-flex tw-h-[30px] tw-w-[30px] tw-items-center tw-justify-center tw-text-[var(--text-2)] tw-transition hover:tw-text-[var(--text)]"
                            onClick={() => {
                              removeFromList(member.id);
                            }}
                            disabled={isSaving}
                            aria-label={`Remove ${member.fullName}`}
                          >
                            <IoClose style={{ fontSize: "16px" }} />
                          </button>
                        </div>
                      ))}
                    </motion.div>

                    {isLoading ? (
                      <div className="tw-w-full tw-min-h-[280px] tw-flex tw-items-center tw-justify-center">
                        <motion.div
                          animate={{
                            rotate: -360,
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                          }}
                          id="div_loader_request"
                        >
                          <AiOutlineLoading3Quarters
                            style={{ fontSize: "28px" }}
                          />
                        </motion.div>
                      </div>
                    ) : (
                      <div className="tw-w-full tw-max-h-[460px] tw-overflow-y-auto x-scroll tw-pr-[4px]">
                        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 xl:tw-grid-cols-1 tw-gap-[10px]">
                          {rows.flatMap((candidate: ContactRowData) => {
                            const isSelected = selectedMemberExists(
                              candidate.entityID,
                            );

                            return (
                              <button
                                type="button"
                                key={candidate.id}
                                onClick={() => {
                                  toggleMember({
                                    id: candidate.id,
                                    entityID: candidate.entityID,
                                    userID: candidate.id,
                                    fullName: `${candidate.firstName} ${candidate.lastName}`,
                                    profile: candidate.profile,
                                  });
                                }}
                                disabled={isSaving}
                                className={`tw-group tw-flex tw-items-center tw-gap-[12px] tw-rounded-[16px] tw-border tw-p-[10px] tw-text-left tw-transition ${
                                  isSelected
                                    ? "tw-border-transparent cl-pages-create-member-chip--selected"
                                    : "tw-border-transparent tw-bg-[var(--surface-2)] hover:tw-bg-[var(--surface-hover)]"
                                }`}
                              >
                                <Avatar
                                  id={candidate.id}
                                  name={`${candidate.firstName} ${candidate.lastName}`}
                                  src={
                                    candidate.profile &&
                                    candidate.profile !== "none"
                                      ? candidate.profile
                                      : null
                                  }
                                  size={40}
                                  ring
                                />
                                <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-font-Inter tw-text-[14px] tw-font-semibold tw-text-[var(--text)]">
                                  {`${candidate.firstName} ${candidate.lastName}`}
                                </span>
                                <span
                                  className={`tw-flex tw-h-[24px] tw-w-[24px] tw-items-center tw-justify-center tw-rounded-full tw-border tw-transition ${
                                    isSelected
                                      ? "tw-border-[var(--brand)] tw-bg-[var(--brand)] tw-text-white"
                                      : "tw-border-transparent tw-bg-[var(--surface)] tw-text-[var(--text-2)] group-hover:tw-bg-[var(--surface)]"
                                  }`}
                                >
                                  {isSelected ? (
                                    <AiOutlineCheck size={14} />
                                  ) : null}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {isSaving && (
          <OverlayLoader className="tw-absolute tw-inset-0 tw-z-[3] tw-bg-[var(--surface)] tw-opacity-[0.82] tw-flex tw-items-center tw-justify-center" />
        )}
      </div>
    </div>
  );
}

export default CreatePage;

