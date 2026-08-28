/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Card, Icon, useTheme } from "@/reusables/design";
import { GetTopicPostsRequest } from "@/reusables/hooks/requests";
import { IPost } from "@/reusables/vars/interfaces";
import PostItem from "../profile/user/PostItem";
import PostItemLoader from "@/app/reusables/loaders/PostItemLoader";
import PopularTopics from "./partials/PopularTopics";

interface TopicInfo {
  id: number;
  name: string;
  slug: string;
  category: string;
}

/**
 * Everything posted under one topic - what a Popular Topics row opens.
 *
 * Reads the paginated topic endpoint rather than filtering the feed on the
 * client: the posts in a topic are not a subset of the page of feed the
 * browser happens to be holding, and the server is the only side that knows
 * which of them this viewer is allowed to see.
 *
 * The scroll/lazy-load shape mirrors Feed deliberately, down to the loader
 * sentinel, so both lists behave identically when you reach the bottom.
 */
function TopicFeed() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [posts, setPosts] = useState<IPost[]>([]);
  const [topic, setTopic] = useState<TopicInfo | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // A topic change is a different list, not more of this one. Without this
  // reset, navigating from one topic to another would append the new topic's
  // first page onto the previous topic's posts.
  useEffect(() => {
    setPosts([]);
    setTopic(null);
    setPage(1);
    setHasNext(false);
    setIsLoaded(false);
    setNotFound(false);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    GetTopicPostsRequest({ slug, page, page_size: 10 })
      .then((response: any) => {
        if (cancelled) return;
        setTopic(response?.topic ?? null);
        setHasNext(Boolean(response?.next));
        setPosts((previous) => {
          const combined = [...previous, ...(response?.results ?? [])];
          // Same de-duplication the feed does. Two pages fetched either side
          // of a new post arriving overlap by one row otherwise.
          return combined.filter(
            (post, index, self) =>
              index ===
              self.findIndex((other) => other.post_id === post.post_id),
          );
        });
        setIsLoaded(true);
      })
      .catch((error: any) => {
        if (cancelled) return;
        if (error?.response?.status === 404) setNotFound(true);
        setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, page]);

  useEffect(() => {
    let currentView = false;
    if (contentRef.current) {
      contentRef.current.onscroll = () => {
        if (loaderRef.current) {
          const top = loaderRef.current.getBoundingClientRect().top;
          const isVisible = top >= 0 && top <= window.innerHeight;
          if (currentView != isVisible) {
            currentView = isVisible;
            if (currentView) setPage((prev) => prev + 1);
          }
        }
      };
    }
  }, []);

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      ref={contentRef}
      style={{ flex: 1, minHeight: 0, overflowY: "auto", width: "100%" }}
    >
      {/* Same two-column shape as Feed, so the topics rail stays put when you
          open a topic instead of vanishing at the moment it becomes most
          useful - it is how you move between topics, and it marks which one
          you are reading. Inside this scroll container for the same reason it
          is inside Feed's: sticky resolves against the nearest scroller. */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 16,
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "16px 18px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 680,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <Card pad={14} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="cl-rowbtn"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 6,
                  borderRadius: "var(--r-sm)",
                  display: "flex",
                }}
              >
                <Icon n="arrow_back" s={20} c="var(--text-2)" />
              </button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "var(--fs-body)",
                    fontWeight: 750,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  #{topic?.slug ?? slug}
                </div>
                {topic && (
                  <div
                    style={{
                      fontSize: "var(--fs-meta)",
                      color: "var(--text-3)",
                    }}
                  >
                    {topic.category}
                  </div>
                )}
              </div>
              <Icon n="local_fire_department" s={18} c="var(--text-3)" />
            </div>
          </Card>

          {notFound && (
            <Card
              pad={20}
              style={{ textAlign: "center", color: "var(--text-2)" }}
            >
              That topic does not exist yet.
            </Card>
          )}

          {!notFound && posts.length === 0 && !isLoaded
            ? Array.from({ length: 5 }, (_, i) => (
                <Card
                  pad={10}
                  style={{ marginBottom: 8 }}
                  key={i}
                  className="tw-flex tw-justify-center"
                >
                  <PostItemLoader />
                </Card>
              ))
            : null}

          {!notFound && posts.length === 0 && isLoaded && (
            <Card
              pad={20}
              style={{ textAlign: "center", color: "var(--text-2)" }}
            >
              Nothing has been posted under this topic yet.
            </Card>
          )}

          {posts.map((post: IPost, i: number) => (
            <Card
              pad={10}
              style={{ marginBottom: 8 }}
              key={post.post_id ?? i}
              className="tw-flex tw-justify-center"
            >
              <PostItem isSharePreview={false} mp={post} />
            </Card>
          ))}

          {hasNext && (
            <div
              ref={loaderRef}
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 16,
                color: "var(--text-3)",
              }}
            >
              <AiOutlineLoading3Quarters
                className="cl-spin"
                style={{ fontSize: 22 }}
              />
            </div>
          )}
        </div>

        <PopularTopics />
      </div>
    </div>
  );
}

export default TopicFeed;
