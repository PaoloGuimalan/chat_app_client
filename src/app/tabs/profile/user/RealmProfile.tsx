/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// import CachedImage from "@/app/reusables/cachers/CachedImage";
import { IPost, IRealmProfileInfo } from "@/reusables/vars/interfaces";
// import DefaultProfile from "../../../../assets/imgs/default.png";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ProfileCoverContainer from "./ProfileCoverContainer";
import ProfilePicContainer from "./ProfilePicContainer";
import { motion } from "framer-motion";
import { PaginationProp } from "@/reusables/vars/props";
import { postsliststate } from "@/redux/actions/states";
import PostItem from "./PostItem";
import PostItemLoader from "@/app/reusables/loaders/PostItemLoader";
import { FaFileAlt } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function RealmProfile({ realmInfo }: { realmInfo: IRealmProfileInfo }) {
  const navigate = useNavigate();

  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  const divcontentRef = useRef<HTMLDivElement | null>(null);

  const [paginatedPosts, _setpaginatedPosts] =
    useState<PaginationProp<IPost>>(postsliststate);
  const posts: IPost[] = paginatedPosts.results;
  const [ispostsloaded, _setispostsloaded] = useState<boolean>(true); // must be false when actual

  useEffect(() => {
    let currentView = false;
    if (divcontentRef) {
      if (divcontentRef.current) {
        divcontentRef.current.onscroll = () => {
          // console.log("Hello")
          if (divlazyloaderRef && divlazyloaderRef.current) {
            const top = divlazyloaderRef.current.getBoundingClientRect().top;
            const isVisible = top + 0 >= 0 && top - 0 <= window.innerHeight;
            // const isVisible = top > 0 ? true : false;
            // console.log((top + 0) >= 0 && (top - 0) <= window.innerHeight);
            if (currentView != isVisible) {
              currentView = isVisible;
              if (currentView) {
                // setrange((prev) => prev + 20);
                //   setpage((prev) => prev + 1);
              }
            }
          }
        };
      }
    }
  }, [divcontentRef, divlazyloaderRef, realmInfo]);

  return (
    <div
      ref={divcontentRef}
      className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-scroll x-scroll"
    >
      <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[10] tw-shadow-lg tw-bg-[#d2d2d2] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
      >
        <IoArrowBack style={{ fontSize: "20px" }} />
      </button>
      <div className="tw-bg-white tw-w-full tw-h-[40%] tw-min-h-[500px] tw-border-solid tw-border-[0px] tw-border-b-[0px] tw-border-[#d2d2d2] tw-flex tw-flex-col tw-justify-center tw-items-center">
        <ProfileCoverContainer
          userID={realmInfo.id}
          coverphoto={realmInfo.cover_photo}
          getpostprocess={() => {}}
        />
        <div className="tw-w-[calc(100%-80px)] tw-h-auto sm:tw-h-[150px] tw-bg-transparent tw-max-w-[calc(1200px-80px)] tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-flex-wrap tw-pl-[40px] tw-pr-[40px]">
          <ProfilePicContainer
            userID={realmInfo.id}
            profile={realmInfo.profile}
            getpostprocess={() => {}}
          />
          <div className="tw-bg-transparent tw-flex tw-flex-col sm:tw-flex-row tw-flex-1 tw-h-auto sm:tw-h-full tw-items-center">
            <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center sm:tw-items-start tw-justify-center tw-h-full tw-p-[20px] tw-sm:p-[0px]">
              <span className="tw-text-[25px] tw-font-bold">
                {realmInfo.name}
              </span>
              <span className="tw-text-[14px] tw-break-all tw-mb-[20px]">
                {realmInfo.email}
              </span>
              <span className="tw-text-[14px] tw-break-all">
                @{realmInfo.slug}
              </span>
            </div>
            <div className="tw-w-flex sm:tw-w-auto tw-w-full sm:tw-pb-[0px] tw-pb-[20px]">
              ...
            </div>
          </div>
        </div>
      </div>
      <div className="tw-bg-transparent tw-max-w-[1200px] tw-w-[98%] tw-flex tw-flex-col md:tw-flex-row tw-gap-[10px] tw-items-center md:tw-items-start">
        <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center md:tw-sticky tw-top-[10px] tw-max-w-[100%] md:tw-max-w-[400px]">
          <div className="tw-w-full tw-h-fit tw-bg-white tw-border-solid tw-border-[0px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex">
            <div className="tw-w-full tw-p-[20px] tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
              <span className="tw-text-[14px]">{realmInfo.description}</span>
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-pb-[20px] tw-flex tw-flex-col tw-items-center">
          {/* <div
            id="div_feed_header_post_input_profile"
            className="tw-border-[0px]"
          >
            {realmInfo.profile && realmInfo.profile !== "none" ? (
              <div id="img_default_profile_container">
                <CachedImage src={realmInfo.profile} id="img_actual_profile" />
              </div>
            ) : (
              <div id="div_img_feed_header_container">
                <CachedImage src={DefaultProfile} id="img_feed_header" />
              </div>
            )}
            <div id="div_input_feed_flex">
              <input
                type="text"
                autoComplete="off"
                value={createposttext}
                onFocus={() => {
                  settoggleNewPostModal({ toggle: true, withImage: false });
                }}
                onChange={(e) => {
                  setcreateposttext(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (createposttext.trim() !== "") {
                    if (e.key == "Enter") {
                      // CreatePostProcess()
                    }
                  }
                }}
                className="tw-font-Inter"
                placeholder={
                  profileInfo.userID === authentication.user.userID
                    ? "Share your thoughts..."
                    : `Write on ${profileInfo.fullname.firstName}'s wall...`
                }
                id="input_feed_box"
              />
            </div>
            <div id="div_btn_image_container">
              <button
                onClick={() => {
                  settoggleNewPostModal({ toggle: true, withImage: true });
                }}
                id="btn_image_feed"
              >
                <FcAddImage style={{ fontSize: "35px" }} />
              </button>
            </div>
          </div> */}
          {paginatedPosts.count > 0 ? (
            <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[20px]">
              {posts.map((mp: any, i: number) => {
                return <PostItem key={i} isSharePreview={false} mp={mp} />;
              })}
              {paginatedPosts.next && (
                <div
                  ref={divlazyloaderRef}
                  id="divlazyloader"
                  className="tw-bg-transparent tw-w-full tw-flex tw-items-center tw-justify-center tw-mt-[5px] tw-mb-[5px]"
                >
                  <motion.div
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                    id="div_loader_request_conv"
                  >
                    <AiOutlineLoading3Quarters style={{ fontSize: "20px" }} />
                  </motion.div>
                </div>
              )}
            </div>
          ) : ispostsloaded ? (
            <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[70px]">
              <FaFileAlt style={{ fontSize: "60px", color: "#333333" }} />
              <div className="tw-flex tw-flex-col tw-gap-[0px] tw-text-[#333333]">
                <span className="tw-font-semibold tw-text-[14px]">
                  No Posts yet
                </span>
              </div>
            </div>
          ) : (
            <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[20px]">
              {Array.from({ length: 8 }, (_, i: number) => {
                return <PostItemLoader key={i} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RealmProfile;
