/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import "../../../styles/styles.css";
import DefaultProfile from "../../../assets/imgs/default.png";
import { FcAddImage } from "react-icons/fc";
// import ChatterLoopImg from "../../../assets/imgs/chatterloop.png";
import { Fragment, useEffect, useRef, useState } from "react";
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
import { FaBook } from "react-icons/fa6";
import { BiCalendarEdit } from "react-icons/bi";
import { HiOutlinePencil } from "react-icons/hi";
import { TfiThought } from "react-icons/tfi";
import ServerBanner from "./banners/ServerBanner";
import PagesBanner from "./banners/PagesBanner";
import { FiMap } from "react-icons/fi";
import { FaWalking } from "react-icons/fa";
import { MdCardTravel } from "react-icons/md";
import { GiCarWheel } from "react-icons/gi";
import { BsPinMap } from "react-icons/bs";
import { IoExtensionPuzzle } from "react-icons/io5";

function Feed() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
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
  const [postsIsLoaded, setpostsIsLoaded] = useState<boolean>(false);

  const divcontentRef = useRef<HTMLDivElement | null>(null);
  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);

  const GetFeedProcess = () => {
    GetFeedRequest({
      current_user_id: authentication.user.userID,
      page: page,
      range: range,
    })
      .then((response) => {
        setpostsIsLoaded(true);
        setpaginatedPosts((prev) => {
          const combinedList = [...prev.results, ...response.results];
          const uniqueById = combinedList.filter(
            (obj, index, self) =>
              index === self.findIndex((t) => t.post_id === obj.post_id),
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

  useEffect(() => {
    if (setpaginatedPosts && setpage && divcontentRef) {
      window.addEventListener("broadcast_reload_feed", (e: any) => {
        if (e.detail) {
          divcontentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => {
            setpostsIsLoaded(false);
            setpaginatedPosts(postsliststate);
            setpage((prev) => {
              if (prev === 1) {
                GetFeedProcess();
                return 1;
              }
              return 1;
            });
          }, 500);
        }
      });
    }

    return () => {
      window.removeEventListener("broadcast_reload_feed", () => {});
    };
  }, [setpaginatedPosts, setpage, divcontentRef]);

  return (
    <div id="div_feed" className="thinscroller" ref={divcontentRef}>
      <div id="div_feed_header_post_input" className="tw-border-[0px]">
        {authentication.user.profile !== "none" ? (
          <div id="img_default_profile_container">
            <CachedImage
              src={authentication.user.profile}
              id="img_actual_profile"
            />
          </div>
        ) : (
          <div id="img_default_profile_container">
            <CachedImage src={DefaultProfile} id="img_default_profile" />
          </div>
        )}
        <div id="div_input_feed_flex">
          {toggleNewPostModal.toggle && (
            <NewPostModal
              toShare={false}
              sharePreviewData={null}
              withImage={toggleNewPostModal.withImage}
              profileInfo={{
                id: authentication.user.userID,
                username: authentication.user.username,
              }}
              realmInfo={null}
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
        {paginatedPosts.results.length === 0 && postsIsLoaded && (
          <Fragment>
            <div className="div_feed_post_container">
              {" "}
              {/** div container fpr all posts */}
              <div className="div_post_content">
                {/* <div id="div_img_welcome_container">
                <img src={ChatterLoopImg} id="img_welcome_post_pic" />
              </div> */}
                <div id="div_welcome_post_labels_container">
                  <span className="tw-text-[#3b3b3b] tw-font-semibold tw-text-[20px] tw-font-Inter">
                    You're all caught up!
                  </span>{" "}
                  <div className="tw-flex tw-flex-col">
                    {/* <span id="span_welcome_post_label_cl">
                    Welcome to Chatterloop
                  </span> */}
                    <span id="span_welcome_post_label_h2">
                      Link . Share . Explore
                    </span>
                  </div>
                  <span id="span_welcome_post_par_cl">
                    A new way of connection. A visual connection, more visible
                    and interactable way of social media.
                  </span>
                </div>
              </div>
            </div>
            <div className="div_feed_post_container tw-gap-[30px] tw-pb-[25px]">
              <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[4px]">
                <div className="tw-flex tw-w-full tw-items-center tw-gap-[4px]">
                  <FaBook style={{ fontSize: "17px", color: "#666666" }} />
                  <span className="tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[#3b3b3b]">
                    Chatterloop Diary
                  </span>
                </div>
                <span className="tw-text-[12px] tw-text-left">
                  Have your daily life written, privately, or let someone see
                  it.
                </span>
              </div>
              <div className="tw-w-full tw-flex tw-flex-1 tw-items-center tw-justify-evenly tw-gap-[10px]">
                <div className="tw-flex tw-items-center tw-flex-col tw-gap-[4px]">
                  <BiCalendarEdit
                    style={{
                      fontSize: "60px",
                      color: "#666666",
                    }}
                  />
                  <span className="tw-text-[12px] tw-max-w-[120px]">
                    Take track of you entries
                  </span>
                </div>
                <div className="tw-flex tw-items-center tw-flex-col tw-gap-[4px]">
                  <HiOutlinePencil
                    style={{
                      fontSize: "58px",
                      color: "#666666",
                    }}
                  />
                  <span className="tw-text-[12px] tw-max-w-[120px]">
                    Write entries as many as you like
                  </span>
                </div>
                <div className="tw-flex tw-items-center tw-flex-col tw-gap-[4px]">
                  <TfiThought
                    style={{
                      fontSize: "58px",
                      color: "#666666",
                    }}
                  />
                  <span className="tw-text-[12px] tw-max-w-[120px]">
                    Let people know a part of your thoughts
                  </span>
                </div>
              </div>
              <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[4px]">
                <span className="tw-text-[12px]">
                  Click{" "}
                  <a href={`/${authentication.user.username}/diary`}>here</a> to
                  get your writing started or view your existing entries.
                </span>
              </div>
            </div>
            <ServerBanner />
            <div className="div_feed_post_container tw-gap-[30px] tw-pb-[25px]">
              <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[4px]">
                <div className="tw-flex tw-w-full tw-items-center tw-gap-[4px]">
                  <FiMap style={{ fontSize: "18px", color: "#666666" }} />
                  <span className="tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[#3b3b3b]">
                    Map Feed
                  </span>
                </div>
                <span className="tw-text-[12px] tw-text-left">
                  Browse your feed in a new way. Walk, Travel, Drive, Share, and
                  Socialize interactively base on where you are. (In
                  Development)
                </span>
              </div>
              <div className="tw-w-full tw-flex tw-flex-1 tw-items-center tw-justify-evenly tw-gap-[10px]">
                <div className="tw-flex tw-items-center tw-flex-col tw-gap-[4px]">
                  <FaWalking
                    style={{
                      fontSize: "60px",
                      color: "#666666",
                    }}
                  />
                  <span className="tw-text-[12px] tw-max-w-[120px]">
                    Socialize nearby while you walk.
                  </span>
                </div>
                <div className="tw-flex tw-items-center tw-flex-col tw-gap-[4px]">
                  <MdCardTravel
                    style={{
                      fontSize: "58px",
                      color: "#666666",
                    }}
                  />
                  <span className="tw-text-[12px] tw-max-w-[120px]">
                    Document your travel on the map.
                  </span>
                </div>
                <div className="tw-flex tw-items-center tw-flex-col tw-gap-[4px]">
                  <GiCarWheel
                    style={{
                      fontSize: "58px",
                      color: "#666666",
                    }}
                  />
                  <span className="tw-text-[12px] tw-max-w-[120px]">
                    Connect to fellow drivers on the road.
                  </span>
                </div>
                <div className="tw-flex tw-items-center tw-flex-col tw-gap-[4px]">
                  <BsPinMap
                    style={{
                      fontSize: "58px",
                      color: "#666666",
                    }}
                  />
                  <span className="tw-text-[12px] tw-max-w-[120px]">
                    Share your posts on the map.
                  </span>
                </div>
              </div>
              <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[4px]">
                <span className="tw-text-[12px]">
                  Explore Map Feed now. Click <a href={`/mapfeed`}>here</a>.
                </span>
              </div>
            </div>
            <PagesBanner />
            <div className="div_feed_post_container tw-gap-[30px] tw-pb-[30px]">
              <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[4px]">
                <div className="tw-flex tw-w-full tw-items-center tw-gap-[4px]">
                  <IoExtensionPuzzle
                    style={{ fontSize: "20px", color: "#666666" }}
                  />
                  <span className="tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[#3b3b3b]">
                    Chatterloop Extension
                  </span>
                </div>
                <span className="tw-text-[12px] tw-text-left">
                  Sick of switching social platforms frequently? Coming soon,
                  Chatterloop Extension will allow you to share contents from
                  different platforms to your Chatterloop account. (In
                  Development)
                </span>
              </div>
              <div className="tw-w-full tw-flex tw-flex-1 tw-items-center tw-justify-evenly tw-gap-[10px]">
                <div className="tw-flex tw-items-center tw-flex-col tw-gap-[4px]">
                  <IoExtensionPuzzle
                    style={{
                      fontSize: "60px",
                      color: "#666666",
                    }}
                  />
                  <span className="tw-text-[12px] tw-max-w-[200px]">
                    Will be first released in Chrome Browser as Extension.
                  </span>
                </div>
              </div>
            </div>
          </Fragment>
        )}
        {/* map posts here */}
        {posts.length === 0
          ? !postsIsLoaded
            ? Array.from({ length: 10 }, (_, i: number) => {
                return <PostItemLoader key={i} />;
              })
            : null
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
