/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import "../../../styles/styles.css";
import DefaultProfile from "../../../assets/imgs/default.png";
import { FcAddImage } from "react-icons/fc";
// import ChatterLoopImg from "../../../assets/imgs/chatterloop.png";
import { useEffect, useRef, useState } from "react";
import { GetFeedRequest } from "@/reusables/hooks/requests";
import PostItem from "../profile/user/PostItem";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { postsliststate } from "@/redux/actions/states";
import { PaginationProp } from "@/reusables/vars/props";
import { AuthenticationInterface, IPost } from "@/reusables/vars/interfaces";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { useSelector } from "react-redux";
import PostItemLoader from "@/app/reusables/loaders/PostItemLoader";
import CachedImage from "@/app/reusables/cachers/CachedImage";

function Feed() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication
  );

  const [page, setpage] = useState<number>(1); //setrange
  const [range] = useState<number>(20); //setrange
  const [paginatedPosts, setpaginatedPosts] =
    useState<PaginationProp<IPost>>(postsliststate);
  const posts: IPost[] = paginatedPosts.results;

  const [toggleNewPostModal, settoggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });
  const [createposttext, setcreateposttext] = useState<string>("");

  const divcontentRef = useRef<HTMLDivElement | null>(null);
  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);

  const GetFeedProcess = () => {
    GetFeedRequest({
      page: page,
      range: range,
    })
      .then((response) => {
        setpaginatedPosts((prev) => {
          const combinedList = [...prev.results, ...response.results];
          const uniqueById = combinedList.filter(
            (obj, index, self) =>
              index === self.findIndex((t) => t.post_id === obj.post_id)
          );

          return {
            ...response,
            results: uniqueById,
          };
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

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
                // setrange((prev) => prev + 10);
                setpage((prev) => prev + 1);
              }
            }
          }
        };
      }
    }
  }, [divcontentRef, divlazyloaderRef]);

  useEffect(() => {
    GetFeedProcess();
  }, [page]);

  return (
    <div id="div_feed" className="thinscroller" ref={divcontentRef}>
      <div id="div_feed_header_post_input" className="tw-border-[0px]">
        <div id="div_img_feed_header_container">
          <CachedImage src={DefaultProfile} id="img_feed_header" />
        </div>
        <div id="div_input_feed_flex">
          {toggleNewPostModal.toggle && (
            <NewPostModal
              toShare={false}
              sharePreviewData={null}
              withImage={toggleNewPostModal.withImage}
              profileInfo={{
                userID: authentication.user.userID,
              }}
              setcreateposttext={setcreateposttext}
              getpostprocess={() => {}}
              onclose={settoggleNewPostModal}
            />
          )}
          <input
            type="text"
            placeholder="Share your thoughts..."
            id="input_feed_box"
            value={createposttext}
            onFocus={() => {
              settoggleNewPostModal({ toggle: true, withImage: false });
            }}
            onChange={(e) => {
              setcreateposttext(e.target.value);
            }}
          />
        </div>
        <div id="div_btn_image_container">
          <button
            onClick={() => {
              settoggleNewPostModal({ toggle: true, withImage: true });
            }}
            id="btn_image_feed"
            // disabled={true}
          >
            <FcAddImage style={{ fontSize: "35px" }} />
          </button>
        </div>
      </div>
      <div id="div_feed_contents_container">
        {/* map posts here */}
        {/* {posts.length === 0 && (
          <div className="div_feed_post_container"> */}{" "}
        {/** div container fpr all posts */}
        {/* <div className="div_post_content">
              <div id="div_img_welcome_container">
                <img src={ChatterLoopImg} id="img_welcome_post_pic" />
              </div>
              <div id="div_welcome_post_labels_container">
                <span id="span_welcome_post_label_cl">
                  Welcome to Chatterloop
                </span>
                <span id="span_welcome_post_label_h2">
                  Link . Share . Explore
                </span>
                <span id="span_welcome_post_par_cl">
                  A new way of connection. A visual connection, more visible and
                  interactable way of social media.
                </span>
              </div>
            </div>
          </div> */}
        {/* )} */}
        {/* map posts here */}
        {posts.length === 0
          ? Array.from({ length: 10 }, (_, i: number) => {
              return <PostItemLoader key={i} />;
            })
          : posts.map((mp: IPost, i: number) => {
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
    </div>
  );
}

export default Feed;
