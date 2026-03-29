/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { AuthenticationInterface, IContact } from "@/reusables/vars/interfaces";
import {
  ContactsListReusableRequest,
  CreatePageRequest,
} from "@/reusables/hooks/requests";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { useLocation, useNavigate } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { hasNullValues } from "@/reusables/hooks/reusable";
import OverlayLoader from "@/app/reusables/loaders/OverlayLoader";

function CreatePage() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [selectedProfile, setselectedProfile] = useState<File | null>(null);
  const [selectedCover, setselectedCover] = useState<File | null>(null);
  const [pageName, setpageName] = useState<string>("");
  const [pageDescription, setpageDescription] = useState<string>("");
  const [email, setemail] = useState<string>("");
  const [slug, setslug] = useState<string>("");
  const [markedMembers, setmarkedMembers] = useState<any[]>([]);

  const finalData = useMemo(
    () => ({
      pageName,
      pageDescription,
      email,
      slug,
      otherUsers: markedMembers.map((mp) => mp.userID),
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

  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const handleDivClick = () => {
    profileInputRef.current?.click();
  };

  const handleCoverClick = () => {
    coverPhotoInputRef.current?.click();
  };

  const handleProfileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setselectedProfile(file);
    }
  };

  const handleCoverChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setselectedCover(file);
    }
  };

  const [contactslist, setcontactslist] = useState<IContact[]>([]);
  const [isLoading, setisLoading] = useState<boolean>(true);
  const [searchFilter, setsearchFilter] = useState<string>("");
  const [isSaving, setisSaving] = useState<boolean>(false);

  const valueToArrayChecker = (userID: any) => {
    const userIDExistInArray = markedMembers.filter(
      (flt: any) => flt.userID == userID,
    );

    return userIDExistInArray.length > 0 ? true : false;
  };

  const removeFromList = (userID: any) => {
    const userIDnotSimilar = markedMembers.filter(
      (flt: any) => flt.userID != userID,
    );

    setmarkedMembers(userIDnotSimilar);
  };

  useEffect(() => {
    ContactsListReusableRequest(setcontactslist, setisLoading);
  }, []);

  const navigate = useNavigate();

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const location = useLocation();

  const SavePageProcess = () => {
    setisSaving(true);
    if (payloadValid) {
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
    }
  };

  return (
    <motion.div
      initial={{
        paddingLeft:
          screensizelistener.W <= 900
            ? location.pathname.split("/").length < 4
              ? "0px"
              : "7px"
            : "0px",
      }}
      animate={{
        paddingLeft:
          screensizelistener.W <= 900
            ? location.pathname.split("/").length < 4
              ? "0px"
              : "7px"
            : "0px",
      }}
      className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-center tw-pt-[15px] tw-pb-[10px] tw-pr-[7px]"
    >
      <div
        className={`tw-rounded-[10px] tw-shadow-lg tw-bg-white tw-flex tw-flex-col tw-items-center tw-justify-start tw-w-full tw-h-full x-scroll tw-relative ${isSaving ? "tw-overflow-y-hidden" : "tw-overflow-y-scroll"}`}
      >
        {isSaving && (
          <OverlayLoader
            className={`tw-z-[2] tw-absolute tw-w-full tw-h-full tw-bg-white tw-opacity-[0.8] tw-flex tw-items-center tw-justify-center`}
          />
        )}
        <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center">
          <div
            className={`tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[20px] ${isMobileView ? "tw-max-w-[calc(100%-30px)] tw-p-[20px] tw-pt-[15px] tw-pr-[10px]" : "tw-max-w-[calc(100%-80px)] tw-p-[40px] tw-pt-[35px]"}`}
          >
            <div className={`tw-w-full tw-flex tw-justify-between tw-h-[34px]`}>
              <div
                className={`tw-flex tw-flex-wrap tw-flex-1 tw-gap-[5px] tw-justify-between tw-h-fit ${isMobileView && "tw-items-end"}`}
              >
                <div className="tw-flex">
                  <span
                    className={`${
                      isMobileView ? "tw-text-[14px]" : "tw-text-[16px]"
                    } tw-font-Inter tw-font-semibold`}
                  >
                    My Pages
                  </span>
                  <IoIosArrowForward size={20} />
                  <span
                    className={`${
                      isMobileView ? "tw-text-[14px]" : "tw-text-[16px]"
                    } tw-font-Inter tw-font-semibold`}
                  >
                    Create
                  </span>
                </div>
                <div className="tw-flex tw-gap-[5px]">
                  {payloadValid && (
                    <button
                      id="btn_save_create_page"
                      disabled={isSaving}
                      onClick={() => {
                        SavePageProcess();
                      }}
                      className=" tw-min-w-[65px]"
                    >
                      <span id="span_btn_label" className="tw-font-Inter">
                        Save
                      </span>
                    </button>
                  )}
                  <button
                    id="btn_cancel_create_page"
                    disabled={isSaving}
                    onClick={() => {
                      navigate("/pages/my-pages");
                    }}
                  >
                    <span id="span_btn_label" className="tw-font-Inter">
                      Cancel
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="tw-w-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[10px] tw-pb-[20px] tw-bg-[#f0f2f5]">
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
              <div className="tw-w-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[10px] tw-pb-[20px]">
                <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-bg-white tw-max-w-[calc(1200px-0px)] tw-rounded-b-md">
                  <div className="tw-bg-white tw-w-full tw-h-[60%] tw-min-h-[300px] tw-border-solid tw-border-[0px] tw-border-b-[0px] tw-border-[#d2d2d2] tw-flex tw-flex-col tw-justify-center tw-items-center">
                    <div
                      onClick={handleCoverClick}
                      className="tw-bg-black tw-w-full tw-flex tw-flex-1 tw-max-h-[300px] tw-max-w-[1200px] tw-rounded-b-[10px] tw-cursor-pointer tw-relative"
                    >
                      {selectedCover && (
                        <CachedImage
                          src={URL.createObjectURL(selectedCover)}
                          className="tw-bg-black tw-max-h-full tw-max-w-full tw-w-full tw-h-full tw-object-cover tw-rounded-b-[10px] tw-cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                  <div className="tw-w-[calc(100%-80px)] tw-h-auto sm:tw-h-[150px] tw-bg-transparent tw-max-w-[calc(1200px-0px)] tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-flex-wrap tw-pl-[40px] tw-pr-[40px]">
                    <div className="tw-bg-transparent tw-w-full tw-max-w-[180px] tw-flex tw-justify-center tw-relative">
                      {!selectedProfile ? (
                        <div
                          onClick={handleDivClick}
                          className="tw-cursor-pointer tw-bg-[#d2d2d2] tw-w-full tw-max-w-[120px] tw-h-[120px] sm:tw-max-w-[160px] sm:tw-h-[160px] tw-border-solid tw-border-[5px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative tw--mt-[80px]"
                        >
                          <CachedImage
                            src={DefaultProfile}
                            id="img_default_profile"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={handleDivClick}
                          className="tw-cursor-pointer tw-bg-[#d2d2d2] tw-w-full tw-max-w-[120px] tw-h-[120px] sm:tw-max-w-[160px] sm:tw-h-[160px] tw-border-solid tw-border-[5px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative tw--mt-[80px]"
                        >
                          <CachedImage
                            src={URL.createObjectURL(selectedProfile)}
                            id="img_actual_profile_main"
                          />
                        </div>
                      )}
                    </div>
                    <div className="tw-bg-transparent tw-flex tw-flex-col sm:tw-flex-row tw-flex-1 tw-h-auto sm:tw-h-full tw-items-center">
                      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center sm:tw-items-start tw-justify-center tw-h-full tw-p-[20px] tw-sm:p-[0px] tw-gap-[5px]">
                        <input
                          type="text"
                          placeholder="Your Page Name"
                          className="tw-text-[25px] tw-w-full tw-text-center sm:tw-text-left sm:tw-w-auto tw-font-bold tw-font-Inter tw-rounded-md tw-border-none"
                          onChange={(e) => {
                            setpageName(e.target.value);
                          }}
                          disabled={isSaving}
                        />
                        <input
                          type="text"
                          placeholder="Your page email"
                          className="tw-text-[14px] tw-mb-[20px] tw-text-center sm:tw-text-left tw-font-Inter tw-rounded-md tw-border-none tw-w-full tw-p-[4px]"
                          onChange={(e) => {
                            setemail(e.target.value);
                          }}
                          disabled={isSaving}
                        />
                        <input
                          type="text"
                          placeholder="@page_username"
                          className="tw-text-[14px] tw-text-center sm:tw-text-left tw-font-Inter tw-rounded-md tw-border-none tw-w-full tw-p-[4px]"
                          onChange={(e) => {
                            setslug(e.target.value);
                          }}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tw-bg-transparent tw-max-w-[1200px] tw-w-[98%] tw-flex tw-flex-col md:tw-flex-row tw-gap-[10px] tw-items-center md:tw-items-start">
                  <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center md:tw-sticky tw-top-[10px] tw-max-w-[100%] md:tw-max-w-[400px]">
                    <div className="tw-w-full tw-h-fit tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex">
                      <div className="tw-w-full tw-p-[20px] tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
                        <span className="tw-text-[14px] tw-font-semibold">
                          Description
                        </span>
                        <div className="tw-w-full">
                          <textarea
                            autoComplete="off"
                            id="input_page_desc"
                            className="tw-font-Inter tw-resize-none tw-h-auto tw-whitespace-pre-line tw-pt-[12px]"
                            placeholder="Write description here..."
                            onChange={(e) => {
                              setpageDescription(e.target.value);
                            }}
                            disabled={isSaving}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-1 tw-flex-col tw-gap-[10px] tw-items-center md:tw-sticky tw-top-[10px] tw-max-w-[100%]">
                    <div className="tw-w-full tw-h-auto tw-flex-1 tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex">
                      <div className="tw-w-full tw-p-[20px] tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
                        <span className="tw-text-[14px] tw-font-semibold">
                          Page Admin/Moderators
                        </span>
                        <div
                          id="div_modal_input_columns_add_people"
                          className="tw-w-full"
                        >
                          <div id="div_input_filter_container">
                            <span id="span_input_label">Add People</span>
                            <input
                              id="input_searchfilter"
                              value={searchFilter}
                              onChange={(e) => {
                                setsearchFilter(e.target.value);
                              }}
                              type="text"
                              placeholder="Type a name of a user"
                              disabled={isSaving}
                            />
                          </div>
                          <motion.div
                            animate={{
                              minHeight:
                                markedMembers.length > 0 ? "auto" : "0px",
                              height: markedMembers.length > 0 ? "auto" : "0px",
                            }}
                            id="div_selected_page_moderators_container"
                            className="scrollervert"
                          >
                            {markedMembers.map((mrkm: any, i: number) => {
                              return (
                                <div
                                  key={i}
                                  className="div_selected_page_holder"
                                >
                                  <span className="span_selected_label">
                                    {mrkm.fullName}
                                  </span>
                                  <button
                                    className="btn_remove_selected"
                                    onClick={() => {
                                      removeFromList(mrkm.userID);
                                    }}
                                    disabled={isSaving}
                                  >
                                    <IoClose
                                      style={{
                                        fontSize: "17px",
                                        color: "white",
                                      }}
                                    />
                                  </button>
                                </div>
                              );
                            })}
                          </motion.div>
                          {isLoading ? (
                            <div className="tw-w-full tw-flex tw-flex-1 tw-items-center tw-justify-center tw-max-h-[350px] tw-min-h-[350px]">
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
                            <motion.div
                              id="div_contacts_select_container"
                              className="scroller"
                              // animate={{
                              //     maxHeight: markedMembers.length > 0 ? "calc(100% - 520px)" : "calc(100% - 440px)"
                              // }}
                            >
                              <div className="tw-w-full tw-flex tw-flex-row tw-flex-wrap tw-h-auto tw-justify-between sm:tw-justify-around tw-max-h-[350px] tw-min-h-[350px]">
                                {contactslist.map(
                                  (cnts: IContact, i: number) => {
                                    if (cnts.type == "single") {
                                      if (
                                        cnts.action_by &&
                                        cnts.involved_user
                                      ) {
                                        if (
                                          cnts.action_by.username ==
                                          authentication.user.userID
                                        ) {
                                          const fullNameFilter = `${
                                            cnts.involved_user.first_name
                                          }${
                                            cnts.involved_user.middle_name ==
                                            "N/A"
                                              ? ""
                                              : ` ${cnts.involved_user.middle_name}`
                                          } ${cnts.involved_user.last_name}`;
                                          if (
                                            fullNameFilter.includes(
                                              searchFilter,
                                            )
                                          ) {
                                            return (
                                              <motion.div
                                                whileHover={{
                                                  backgroundColor: "#e6e6e6",
                                                }}
                                                key={i}
                                                className="div_page_moderators_cards"
                                                title={`${cnts.involved_user.first_name}${
                                                  cnts.involved_user
                                                    .middle_name == "N/A"
                                                    ? ""
                                                    : ` ${cnts.involved_user.middle_name}`
                                                } ${cnts.involved_user.last_name}`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={valueToArrayChecker(
                                                    cnts.involved_user.username,
                                                  )}
                                                  disabled={isSaving}
                                                  onChange={() => {
                                                    if (
                                                      !valueToArrayChecker(
                                                        cnts.involved_user
                                                          .username,
                                                      )
                                                    ) {
                                                      setmarkedMembers([
                                                        ...markedMembers,
                                                        {
                                                          userID:
                                                            cnts.involved_user
                                                              .username,
                                                          fullName: `${
                                                            cnts.involved_user
                                                              .first_name
                                                          }${
                                                            cnts.involved_user
                                                              .middle_name ==
                                                            "N/A"
                                                              ? ""
                                                              : ` ${cnts.involved_user.middle_name}`
                                                          } ${
                                                            cnts.involved_user
                                                              .last_name
                                                          }`,
                                                        },
                                                      ]);
                                                    } else {
                                                      removeFromList(
                                                        cnts.involved_user
                                                          .username,
                                                      );
                                                    }
                                                  }}
                                                  className="checkbox_selector_people_page"
                                                />
                                                <div id="div_img_cncts_container">
                                                  <div id="div_img_search_profiles_container_cncts">
                                                    <CachedImage
                                                      src={
                                                        cnts.involved_user
                                                          .profile == "none"
                                                          ? DefaultProfile
                                                          : cnts.involved_user
                                                              .profile
                                                      }
                                                      className={
                                                        cnts.involved_user
                                                          .profile == "none"
                                                          ? "img_search_profiles_ntfs"
                                                          : ""
                                                      }
                                                      id={
                                                        cnts.involved_user
                                                          .profile == "none"
                                                          ? ""
                                                          : "img_actual_profile"
                                                      }
                                                    />
                                                  </div>
                                                </div>
                                                <div className="div_contact_fullname_container">
                                                  <span className="span_cncts_fullname_label">
                                                    {
                                                      cnts.involved_user
                                                        .first_name
                                                    }
                                                    {cnts.involved_user
                                                      .middle_name == "N/A"
                                                      ? ""
                                                      : ` ${cnts.involved_user.middle_name}`}{" "}
                                                    {
                                                      cnts.involved_user
                                                        .last_name
                                                    }
                                                  </span>
                                                </div>
                                              </motion.div>
                                            );
                                          } else {
                                            return null;
                                          }
                                        } else {
                                          const fullNameFilter = `${
                                            cnts.action_by.first_name
                                          }${
                                            cnts.action_by.middle_name == "N/A"
                                              ? ""
                                              : ` ${cnts.action_by.middle_name}`
                                          } ${cnts.action_by.last_name}`;
                                          if (
                                            fullNameFilter.includes(
                                              searchFilter,
                                            )
                                          ) {
                                            return (
                                              <motion.div
                                                whileHover={{
                                                  backgroundColor: "#e6e6e6",
                                                }}
                                                key={i}
                                                className="div_page_moderators_cards"
                                                title={`${cnts.action_by.first_name}${
                                                  cnts.action_by.middle_name ==
                                                  "N/A"
                                                    ? ""
                                                    : ` ${cnts.action_by.middle_name}`
                                                } ${cnts.action_by.last_name}`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={valueToArrayChecker(
                                                    cnts.action_by.username,
                                                  )}
                                                  disabled={isSaving}
                                                  onChange={() => {
                                                    if (
                                                      !valueToArrayChecker(
                                                        cnts.action_by.username,
                                                      )
                                                    ) {
                                                      setmarkedMembers([
                                                        ...markedMembers,
                                                        {
                                                          userID:
                                                            cnts.action_by
                                                              .username,
                                                          fullName: `${
                                                            cnts.action_by
                                                              .first_name
                                                          }${
                                                            cnts.action_by
                                                              .middle_name ==
                                                            "N/A"
                                                              ? ""
                                                              : ` ${cnts.action_by.middle_name}`
                                                          } ${cnts.action_by.last_name}`,
                                                        },
                                                      ]);
                                                    } else {
                                                      removeFromList(
                                                        cnts.action_by.username,
                                                      );
                                                    }
                                                  }}
                                                  className="checkbox_selector_people_page"
                                                />
                                                <div id="div_img_cncts_container">
                                                  <div id="div_img_search_profiles_container_cncts">
                                                    <CachedImage
                                                      src={
                                                        cnts.action_by
                                                          .profile == "none"
                                                          ? DefaultProfile
                                                          : cnts.action_by
                                                              .profile
                                                      }
                                                      className={
                                                        cnts.action_by
                                                          .profile == "none"
                                                          ? "img_search_profiles_ntfs"
                                                          : ""
                                                      }
                                                      id={
                                                        cnts.action_by
                                                          .profile == "none"
                                                          ? ""
                                                          : "img_actual_profile"
                                                      }
                                                    />
                                                  </div>
                                                </div>
                                                <div className="div_contact_fullname_container">
                                                  <span className="span_cncts_fullname_label">
                                                    {cnts.action_by.first_name}
                                                    {cnts.action_by
                                                      .middle_name == "N/A"
                                                      ? ""
                                                      : ` ${cnts.action_by.middle_name}`}{" "}
                                                    {cnts.action_by.last_name}
                                                  </span>
                                                </div>
                                              </motion.div>
                                            );
                                          } else {
                                            return null;
                                          }
                                        }
                                      } else {
                                        return null;
                                      }
                                    } else {
                                      return null;
                                    }
                                  },
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CreatePage;
