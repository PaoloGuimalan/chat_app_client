/* eslint-disable @typescript-eslint/no-explicit-any */
// import React from 'react'
import { useEffect, useRef, useState } from "react";
import DefaultProfile from "../../../assets/imgs/default.png";
import { BiLike } from "react-icons/bi";
import { LiaComment } from "react-icons/lia";
import { PiShareFat } from "react-icons/pi";
import { BsPinMap } from "react-icons/bs";
import {
  AuthenticationInterface,
  IPost,
  IReference,
  ITagging,
} from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import Modal from "@/app/reusables/Modal";
import { IoMdClose } from "react-icons/io";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import LoadedPostItem from "./LoadedPostItem";

function PostItem({
  isSharePreview,
  mp,
}: {
  isSharePreview: boolean;
  mp: IPost;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication
  );
  const navigate = useNavigate();

  const [togglePostCarousel, settogglePostCarousel] = useState<boolean>(false);
  const [minimizedCaption, setminimizedCaption] = useState<boolean | null>(
    null
  );
  const [toggleNewPostModal, settoggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });

  const dateposted = new Date(mp.date_posted);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);

  const postOwnerUserID = mp.user.username;

  useEffect(() => {
    if (mp) {
      if (mp.caption.length >= 600) {
        setminimizedCaption(true);
      } else {
        setminimizedCaption(false);
      }
    }
  }, [mp]);

  return (
    minimizedCaption !== null && (
      <div className=" tw-bg-white tw-border-solid tw-border-[0px] tw-border-[1px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex tw-w-[calc(100%-40px)] tw-p-[20px] tw-pb-[7px] tw-flex tw-flex-col tw-gap-[10px]">
        <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px]">
          <div id="div_img_feed_post_container">
            <img src={DefaultProfile} id="img_feed_header" />
          </div>
          <div className="tw-flex tw-flex-col tw-items-start tw-gap-[2px]">
            <div className="tw-text-left">
              <span
                className="tw-break-keep tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-b tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                onClick={() => {
                  navigate(`/${mp.user.username}`);
                }}
              >
                {mp.user.first_name}
                {mp.user.middle_name == "N/A"
                  ? ""
                  : ` ${mp.user.middle_name}`}{" "}
                {mp.user.last_name}
              </span>
              &nbsp;
              {mp.tagging.length > 0 && (
                <span className="tw-text-[14px]">is with</span>
              )}
              &nbsp;
              {mp.tagging.length > 0 &&
                mp.tagging.map((mptg: ITagging, i: number) => {
                  return (
                    <span
                      className="tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-b tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                      onClick={() => {
                        navigate(`/${mptg.user.username}`);
                      }}
                      key={i}
                    >
                      {mptg.user.first_name}
                      {mptg.user.middle_name == "N/A"
                        ? ""
                        : ` ${mptg.user.middle_name}`}{" "}
                      {mptg.user.last_name}
                    </span>
                  );
                })}
            </div>
            <span className="tw-text-[12px]">
              {dateposted.toUTCString().split(" ").splice(0, 4).join(" ")}
            </span>
          </div>
        </div>
        <div
          className={`tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[10px] tw-min-h-[35px] tw-justify-center`}
        >
          <div
            ref={textContainerRef}
            className={`tw-w-full tw-flex tw-justify-center ${
              minimizedCaption ? "tw-max-h-[120px]" : "tw-max-h-none"
            } tw-overflow-y-hidden`}
          >
            <span ref={textRef} className={`tw-text-[14px] tw-text-left c1`}>
              {mp.caption}
            </span>
          </div>
          {minimizedCaption && (
            <button
              onClick={() => {
                setminimizedCaption(false);
              }}
              className={`tw-text-[12px] tw-text-left tw-bg-transparent tw-text-gray-700 tw-p-[5px] tw-border-none tw-cursor-pointer hover:tw-bg-gray-400 tw-rounded-[4px]`}
            >
              Expand
            </button>
          )}
          {!minimizedCaption && mp.caption.length >= 600 && (
            <button
              onClick={() => {
                setminimizedCaption(true);
              }}
              className={`tw-text-[12px] tw-text-left tw-bg-transparent tw-text-gray-700 tw-p-[5px] tw-border-none tw-cursor-pointer hover:tw-bg-gray-400 tw-rounded-[4px]`}
            >
              See less
            </button>
          )}
          {mp.references.length > 0 && !mp.is_shared && (
            <div className="tw-bg-white tw-w-[calc(100%+40px)] tw-flex tw-flex-row tw-flex-wrap tw-gap-[2px]">
              {" "}
              {/**tw-bg-black*/}
              {mp.references.map((mpu: IReference, i: number) => {
                if (i <= 3) {
                  if (mpu.reference_media_type.includes("image")) {
                    if (mp.references.length === 1) {
                      return (
                        <div
                          onClick={() => {
                            if (!isSharePreview) {
                              settogglePostCarousel(true);
                            }
                          }}
                          key={mpu.reference_id}
                          className="tw-flex tw-max-h-[500px] tw-flex-1 tw-bg-black tw-min-w-[100px] lg:tw-min-w-[200px]"
                        >
                          <img
                            src={mpu.reference}
                            className="tw-w-full tw-h-full tw-object-cover"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div
                          onClick={() => {
                            if (!isSharePreview) {
                              settogglePostCarousel(true);
                            }
                          }}
                          key={mpu.reference_id}
                          className="tw-flex tw-h-[400px] tw-flex-1 tw-bg-black tw-min-w-[100px] lg:tw-min-w-[200px]"
                        >
                          <img
                            src={mpu.reference}
                            className="tw-w-full tw-h-full tw-object-cover"
                          />
                        </div>
                      );
                    }
                  } else if (mpu.reference_media_type.includes("video")) {
                    return (
                      <div
                        key={mpu.reference_id}
                        className="tw-flex tw-h-[400px] tw-flex-1 tw-bg-black tw-min-w-[100px] lg:tw-min-w-[200px]"
                      >
                        <video
                          controls
                          src={mpu.reference}
                          className="tw-w-full tw-h-full tw-object-cover"
                        />
                      </div>
                    );
                  }
                }
              })}
              {togglePostCarousel && (
                <Modal
                  component={
                    <div className="tw-bg-white tw-rounded-[7px] tw-w-[95%] tw-max-w-[600px] tw-h-[95%] tw-max-h-[700px]">
                      <div className="tw-w-[calc(100%-22px)] tw-p-[10px] tw-pl-[12px] tw-pr-[10px] tw-pt-[10px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
                        <span className="tw-text-[14px] tw-font-semibold tw-flex tw-flex-1 tw-font-Inter">
                          Post
                        </span>
                        <button
                          onClick={() => {
                            settogglePostCarousel(false);
                          }}
                          className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
                        >
                          <IoMdClose style={{ fontSize: "17px" }} />
                        </button>
                      </div>
                      <Carousel
                        className="tw-bg-black tw-w-full tw-h-[calc(100%-55px)]"
                        showIndicators={false}
                        showThumbs={false}
                      >
                        {mp.references.map((mpr: IReference) => {
                          if (mpr.reference_media_type.includes("image")) {
                            return (
                              <div
                                key={mpr.reference_id}
                                className="tw-h-full tw-bg-black"
                              >
                                <img
                                  src={mpr.reference}
                                  className="tw-w-full tw-h-full tw-object-contain"
                                />
                              </div>
                            );
                          } else if (
                            mpr.reference_media_type.includes("video")
                          ) {
                            return (
                              <div
                                key={mpr.reference_id}
                                className="tw-h-full tw-max-h-[700px] tw-bg-black"
                              >
                                <video
                                  controls
                                  src={mpr.reference}
                                  className="tw-w-full tw-h-full"
                                />
                              </div>
                            );
                          } else {
                            return <></>;
                          }
                        })}
                      </Carousel>
                      <div className="tw-h-[15px]" />
                    </div>
                  }
                />
              )}
              {mp.references.length > 3 && (
                <div
                  onClick={() => {
                    settogglePostCarousel(true);
                  }}
                  className="tw-flex tw-max-h-[400px] tw-flex-1 tw-bg-black tw-min-w-[200px]"
                >
                  <div className="tw-cursor-pointer tw-select-none tw-relative tw-h-full tw-w-full tw-bg-black tw-opacity-[0.8] tw-top-0 tw-left-0 tw-z-[1] tw-flex tw-items-center tw-justify-center">
                    <div>
                      <span className="tw-text-white tw-font-Inter tw-font-semibold tw-text-[40px]">
                        + {mp.references.length - 4}
                      </span>
                    </div>
                  </div>
                  {mp.references[4].reference_media_type === "image" ? (
                    <img
                      src={mp.references[4].reference}
                      className="tw-w-full tw-h-full tw--ml-[100%] tw-object-cover"
                    />
                  ) : (
                    <video
                      src={mp.references[4].reference}
                      className="tw-w-full tw-h-full tw--ml-[100%]"
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {mp.is_shared &&
            mp.references.map((mpu: any, i: number) => {
              return <LoadedPostItem key={i} postID={mpu.reference} />;
            })}
          {toggleNewPostModal.toggle && (
            <NewPostModal
              toShare={true}
              sharePreviewData={mp}
              withImage={toggleNewPostModal.withImage}
              profileInfo={authentication.user}
              setcreateposttext={() => {}}
              getpostprocess={() => {}}
              onclose={settoggleNewPostModal}
            />
          )}
        </div>
        {!isSharePreview && (
          <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[0px] tw-justify-center">
            <hr className="tw-w-full tw-text-[#666666] tw-border-white tw-opacity-[0.4] tw-mb-[5px] tw-z-[0]" />
            <div className="tw-flex tw-flex-row tw-flex-wrap tw-w-full tw-justify-evenly tw-items-center">
              <button className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]">
                <BiLike style={{ fontSize: "25px", color: "#666666" }} />
              </button>
              <button className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]">
                <LiaComment style={{ fontSize: "25px", color: "#666666" }} />
              </button>
              <button
                onClick={() => {
                  settoggleNewPostModal({ toggle: true, withImage: false });
                }}
                className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]"
              >
                <PiShareFat style={{ fontSize: "25px", color: "#666666" }} />
              </button>
              {postOwnerUserID === authentication.user.userID && (
                <button className="tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]">
                  <BsPinMap style={{ fontSize: "22px", color: "#666666" }} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  );
}

export default PostItem;
