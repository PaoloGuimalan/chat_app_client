/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import "../../../styles/styles.css";
import DefaultProfile from "../../../assets/imgs/default.png";
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

const TRENDING_TAGS = [
  "#MapFeed",
  "#5amClub",
  "#DesignTokens",
  "#LinkShareExplore",
  "live pins",
  "Neon Systems",
];

function Feed() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [page, setpage] = useState<number>(1);
  const [range] = useState<number>(20);
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
      page,
      range,
    })
      .then((response) => {
        setpostsIsLoaded(true);
        setpaginatedPosts((prev) => {
          const combinedList = [...prev.results, ...response.results];
          const uniqueById = combinedList.filter(
            (obj, index, self) =>
              index === self.findIndex((item) => item.post_id === obj.post_id),
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
    if (divcontentRef.current) {
      divcontentRef.current.onscroll = () => {
        if (divlazyloaderRef.current) {
          const top = divlazyloaderRef.current.getBoundingClientRect().top;
          const isVisible = top + 0 >= 0 && top - 0 <= window.innerHeight;
          if (currentView !== isVisible) {
            currentView = isVisible;
            if (currentView) {
              setpage((prev) => prev + 1);
            }
          }
        }
      };
    }
  }, [divcontentRef, divlazyloaderRef]);

  useEffect(() => {
    GetFeedProcess();
  }, [page]);

  useEffect(() => {
    if (divcontentRef.current) {
      const onReloadFeed = (e: any) => {
        if (e.detail) {
          divcontentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => {
            setpostsIsLoaded(false);
            setpaginatedPosts(postsliststate);
            setpage(1);
            GetFeedProcess();
          }, 500);
        }
      };

      window.addEventListener("broadcast_reload_feed", onReloadFeed);
      return () => {
        window.removeEventListener("broadcast_reload_feed", onReloadFeed);
      };
    }
  }, [paginatedPosts, page, divcontentRef]);

  return (
    <div className="cl-feed-shell" ref={divcontentRef}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="cl-card cl-card-pad">
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  overflow: "hidden",
                  flex: "none",
                }}
              >
                <CachedImage
                  src={
                    authentication.user.profile !== "none"
                      ? authentication.user.profile
                      : DefaultProfile
                  }
                  id="img_actual_profile"
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
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
                <textarea
                  placeholder="Share something with your loop…"
                  value={createposttext}
                  onFocus={() => {
                    settoggleNewPostModal({ toggle: true, withImage: false });
                  }}
                  onChange={(e) => setcreateposttext(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    background: "transparent",
                    color: "var(--cl-text)",
                    fontSize: 15,
                    paddingTop: 8,
                    minHeight: 56,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid var(--cl-border)",
                flexWrap: "wrap",
              }}
            >
              {[
                ["image", "Photo", "var(--cl-green)"],
                ["location_on", "Location", "var(--cl-brand)"],
                ["mood", "Feeling", "var(--cl-gold)"],
                ["poll", "Poll", "var(--cl-pink)"],
              ].map(([icon, label, color]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    settoggleNewPostModal({
                      toggle: true,
                      withImage: label === "Photo",
                    })
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 34,
                    padding: "0 10px",
                    border: "none",
                    background: "transparent",
                    borderRadius: "var(--cl-radius-sm)",
                    cursor: "pointer",
                    color: "var(--cl-text-2)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span className="material-icons" style={{ color }}>
                    {icon}
                  </span>
                  <span className="hide-sm">{label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  settoggleNewPostModal({ toggle: true, withImage: false })
                }
                style={{
                  marginLeft: "auto",
                  height: 36,
                  padding: "0 16px",
                  border: "none",
                  borderRadius: "var(--cl-radius-sm)",
                  background: "var(--cl-brand)",
                  color: "#fff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {toggleNewPostModal.toggle ? "Posting…" : "Post"}
              </button>
            </div>
          </div>

          {posts.length === 0 ? (
            !postsIsLoaded ? (
              Array.from({ length: 10 }, (_, i: number) => (
                <PostItemLoader key={i} />
              ))
            ) : (
              <div
                className="cl-card cl-card-pad"
                style={{
                  textAlign: "center",
                  paddingTop: 28,
                  paddingBottom: 28,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                  You&apos;re all caught up
                </div>
                <div style={{ color: "var(--cl-text-2)" }}>
                  No new posts to show right now.
                </div>
              </div>
            )
          ) : (
            posts.map((mp: IPost) => (
              <PostItem key={mp.post_id} isSharePreview={false} mp={mp} />
            ))
          )}

          {paginatedPosts.next && (
            <div
              ref={divlazyloaderRef}
              id="divlazyloader"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 0",
              }}
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AiOutlineLoading3Quarters style={{ fontSize: 20 }} />
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <aside className="cl-feed-sidebar">
        <div className="cl-card cl-card-pad">
          <div className="cl-section-title">
            <h3>Trending</h3>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TRENDING_TAGS.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 34,
                  padding: "0 14px",
                  borderRadius: "var(--cl-radius-pill)",
                  border: "1px solid var(--cl-border-2)",
                  background: "var(--cl-surface)",
                  color: "var(--cl-text-2)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Feed;
