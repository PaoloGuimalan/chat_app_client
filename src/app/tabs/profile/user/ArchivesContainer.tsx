/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import {
  AuthenticationInterface,
  IPost,
  ProfileUserInfoInterface,
} from "@/reusables/vars/interfaces";
import { Fragment, useEffect, useRef, useState } from "react";
import DefaultProfile from "../../../../assets/imgs/default.png";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { FcAddImage } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import PostItemLoader from "@/app/reusables/loaders/PostItemLoader";
import { FaFileAlt } from "react-icons/fa";
import { motion, useInView } from "framer-motion";
import { GetPostRequest } from "@/reusables/hooks/requests";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { genericpaginationstate } from "@/redux/actions/states";
import { PaginationProp } from "@/reusables/vars/props";
import PostItem from "./PostItem";

function ArchivesContainer({
  profileInfo,
}: {
  profileInfo: ProfileUserInfoInterface;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const params = useParams();

  const [createposttext, setcreateposttext] = useState<string>("");
  const [page, setpage] = useState<number>(1);
  const [range] = useState<number>(20);

  const [toggleNewPostModal, settoggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });

  const [ispostsloaded, setispostsloaded] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [paginatedPosts, setpaginatedPosts] = useState<PaginationProp<IPost>>(
    genericpaginationstate,
  );
  const posts: IPost[] = paginatedPosts.results;

  const GetPostProcess = () => {
    setIsLoadingMore(true);
    GetPostRequest(
      {
        current_user_id: authentication.user.userID,
        userID: authentication.user.username,
        page: page,
        range: range,
      },
      true,
    )
      .then((response) => {
        setpaginatedPosts((prev: PaginationProp<IPost>) => {
          const combinedList = [...prev.results, ...response.results];
          const uniqueById = combinedList
            .filter(
              (obj, index, self) =>
                index === self.findIndex((t) => t.post_id === obj.post_id),
            )
            .sort(
              (a: any, b: any) =>
                new Date(b.date_posted).getTime() -
                new Date(a.date_posted).getTime(),
            );

          return {
            ...response,
            results: uniqueById,
          };
        });
        setispostsloaded(true);
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1500);
      })
      .catch((err) => {
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1500);
        console.log(err);
      });
  };

  useEffect(() => {
    setispostsloaded(false);
  }, [profileInfo, params.userID]);

  useEffect(() => {
    GetPostProcess();
  }, [params.userID, page, profileInfo]);

  useEffect(() => {
    setpage(1);

    return () => {
      setpaginatedPosts(genericpaginationstate);
    };
  }, [params.userID]);

  const loaderRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(loaderRef, {
    amount: 1,
  });

  useEffect(() => {
    if (isInView && paginatedPosts.next && !isLoadingMore)
      setpage((prev) => prev + 1);
  }, [isInView, paginatedPosts.next, isLoadingMore]);

  return (
    <Fragment>
      <div id="div_feed_header_post_input_profile" className="tw-border-[0px]">
        {profileInfo.profile !== "none" ? (
          <div id="img_default_profile_container">
            <CachedImage src={profileInfo.profile} id="img_actual_profile" />
          </div>
        ) : (
          <div id="div_img_feed_header_container">
            <CachedImage src={DefaultProfile} id="img_feed_header" />
          </div>
        )}
        <div id="div_input_feed_flex">
          {toggleNewPostModal.toggle && (
            <NewPostModal
              toShare={false}
              sharePreviewData={null}
              withImage={toggleNewPostModal.withImage}
              profileInfo={profileInfo}
              realmInfo={null}
              setcreateposttext={setcreateposttext}
              getpostprocess={GetPostProcess}
              onclose={settoggleNewPostModal}
            />
          )}
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
              profileInfo.userID === authentication.user.username
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
      </div>
      {paginatedPosts.count > 0 ? (
        <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[10px]">
          {posts.map((mp: IPost) => {
            return (
              <PostItem
                key={mp.post_id}
                mp={mp}
                isSharePreview={false}
                show_archived={true}
              />
            );
          })}
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
        <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[10px]">
          {Array.from({ length: 8 }, (_, i: number) => {
            return <PostItemLoader key={i} />;
          })}
        </div>
      )}
      <motion.div
        ref={loaderRef}
        id="divlazyloader"
        initial={{
          height: paginatedPosts.next ? "auto" : "0px",
        }}
        animate={{
          height: paginatedPosts.next ? "auto" : "0px",
        }}
        className="tw-bg-transparent tw-w-full tw-flex tw-items-center tw-justify-center tw-mt-[5px] tw-mb-[5px] tw-overflow-y-hidden"
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
      </motion.div>
    </Fragment>
  );
}

export default ArchivesContainer;
