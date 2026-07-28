/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useEffect, useRef, useState } from "react";
import { GetFeedRequest } from "@/reusables/hooks/requests";
import PostItem from "../profile/user/PostItem";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { postsliststate } from "@/redux/actions/states";
import { PaginationProp } from "@/reusables/vars/props";
import { AuthenticationInterface, IPost } from "@/reusables/vars/interfaces";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { useSelector } from "react-redux";
import PostItemLoader from "@/app/reusables/loaders/PostItemLoader";
import ServerBanner from "./banners/ServerBanner";
import PagesBanner from "./banners/PagesBanner";
import { Btn, Card, Icon, useTheme } from "@/reusables/design";
import { Avatar } from "@/reusables/design/primitives2";
import { getActiveAvatar } from "@/reusables/hooks/reusable";

function Feed() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const { theme } = useTheme();

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
              index === self.findIndex((t) => t.post_id === obj.post_id),
          );
          return { ...response, results: uniqueById };
        });
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    let currentView = false;
    if (divcontentRef.current) {
      divcontentRef.current.onscroll = () => {
        if (divlazyloaderRef.current) {
          const top = divlazyloaderRef.current.getBoundingClientRect().top;
          const isVisible = top >= 0 && top <= window.innerHeight;
          if (currentView != isVisible) {
            currentView = isVisible;
            if (currentView) setpage((prev) => prev + 1);
          }
        }
      };
    }
  }, []);

  useEffect(() => {
    GetFeedProcess();
  }, [page]);

  useEffect(() => {
    const handler = (e: any) => {
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
    };
    window.addEventListener("broadcast_reload_feed", handler);
    return () => {
      window.removeEventListener("broadcast_reload_feed", handler);
    };
  }, []);

  const activeAvatar = getActiveAvatar(authentication);

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      ref={divcontentRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "16px 18px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {toggleNewPostModal.toggle && (
          <NewPostModal
            toShare={false}
            sharePreviewData={null}
            withImage={toggleNewPostModal.withImage}
            profileInfo={{
              id: authentication.user.userID,
              entityID: authentication.user.entity_id,
              username: authentication.user.username,
            }}
            otherEntityID={null}
            setcreateposttext={setcreateposttext}
            getpostprocess={() => {}}
            onclose={settoggleNewPostModal}
          />
        )}

        <Card pad={14} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Avatar
              id={authentication.user.userID}
              name={activeAvatar.name}
              src={activeAvatar.src}
              size={42}
            />
            <input
              type="text"
              placeholder="Share something with your loop…"
              value={createposttext}
              onFocus={() =>
                settoggleNewPostModal({ toggle: true, withImage: false })
              }
              onChange={(e) => setcreateposttext(e.target.value)}
              style={{
                flex: 1,
                height: 42,
                border: "none",
                outline: "none",
                background: "var(--input)",
                padding: "0 16px",
                borderRadius: 21,
                color: "var(--text)",
                fontSize: "var(--fs-body)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() =>
                settoggleNewPostModal({ toggle: true, withImage: true })
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 34,
                padding: "0 12px",
                border: "none",
                background: "transparent",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                color: "var(--text-2)",
                fontSize: "var(--fs-body-sm)",
                fontWeight: 600,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Icon n="image" s={20} c="var(--green)" />
              Photo
            </button>
            <Btn
              size="sm"
              style={{
                marginLeft: "auto",
                opacity: createposttext.trim() ? 1 : 0.7,
              }}
              onClick={() =>
                settoggleNewPostModal({ toggle: true, withImage: false })
              }
            >
              Post
            </Btn>
          </div>
        </Card>

        {paginatedPosts.results.length === 0 && postsIsLoaded && (
          <Fragment>
            <Card pad={20} style={{ marginBottom: 8, textAlign: "center" }}>
              <div
                style={{
                  fontSize: "var(--fs-hero-sm)",
                  fontWeight: 800,
                  color: "var(--text)",
                  marginBottom: 6,
                }}
              >
                You're all caught up!
              </div>
              <div
                style={{
                  fontSize: "var(--fs-body-sm)",
                  color: "var(--brand)",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  marginBottom: 8,
                }}
              >
                Link · Share · Explore
              </div>
              <div
                style={{
                  fontSize: "var(--fs-body-sm)",
                  color: "var(--text-2)",
                  lineHeight: 1.55,
                }}
              >
                A new way of connection. A visual connection, more visible and
                interactable way of social media.
              </div>
            </Card>

            <Card pad={20} style={{ marginBottom: 8 }}>
              <FeatureCardHeader icon="menu_book" title="Chatterloop Diary">
                Have your daily life written, privately, or let someone see it.
              </FeatureCardHeader>
              <FeatureRow
                items={[
                  ["edit_calendar", "Take track of your entries"],
                  ["edit", "Write entries as many as you like"],
                  ["psychology", "Let people know a part of your thoughts"],
                ]}
              />
              <div
                style={{
                  textAlign: "center",
                  fontSize: "var(--fs-label)",
                  color: "var(--text-2)",
                  marginTop: 12,
                }}
              >
                Click{" "}
                <a
                  href={`/${authentication.user.username}/diary`}
                  style={{ color: "var(--brand)", fontWeight: 700 }}
                >
                  here
                </a>{" "}
                to get your writing started or view your existing entries.
              </div>
            </Card>

            <Card
              pad={20}
              style={{ marginBottom: 8 }}
              className="tw-flex tw-justify-center"
            >
              <ServerBanner />
            </Card>

            <Card pad={20} style={{ marginBottom: 8 }}>
              <FeatureCardHeader icon="map" title="Map Feed">
                Browse your feed in a new way. Walk, Travel, Drive, Share, and
                Socialize interactively based on where you are. (In Development)
              </FeatureCardHeader>
              <FeatureRow
                items={[
                  ["directions_walk", "Socialize nearby while you walk."],
                  ["card_travel", "Document your travel on the map."],
                  ["drive_eta", "Connect to fellow drivers on the road."],
                  ["place", "Share your posts on the map."],
                ]}
              />
              <div
                style={{
                  textAlign: "center",
                  fontSize: "var(--fs-label)",
                  color: "var(--text-2)",
                  marginTop: 12,
                }}
              >
                Explore Map Feed now. Click{" "}
                <a
                  href="/mapfeed"
                  style={{ color: "var(--brand)", fontWeight: 700 }}
                >
                  here
                </a>
                .
              </div>
            </Card>

            <Card
              pad={20}
              style={{ marginBottom: 8 }}
              className="tw-flex tw-justify-center"
            >
              <PagesBanner />
            </Card>

            <Card pad={20} style={{ marginBottom: 8 }}>
              <FeatureCardHeader icon="extension" title="Chatterloop Extension">
                Sick of switching social platforms frequently? Coming soon,
                Chatterloop Extension will allow you to share contents from
                different platforms to your Chatterloop account. (In
                Development)
              </FeatureCardHeader>
              <FeatureRow
                items={[
                  [
                    "extension",
                    "Will be first released in Chrome Browser as Extension.",
                  ],
                ]}
              />
            </Card>
          </Fragment>
        )}

        {posts.length === 0
          ? !postsIsLoaded
            ? Array.from({ length: 10 }, (_, i: number) => (
                <Card
                  pad={10}
                  style={{ marginBottom: 8 }}
                  key={i}
                  className="tw-flex tw-justify-center"
                >
                  <PostItemLoader />
                </Card>
              ))
            : null
          : posts.map((mp: IPost, i: number) => (
              <Card
                pad={10}
                style={{ marginBottom: 8 }}
                key={i}
                className="tw-flex tw-justify-center"
              >
                <PostItem key={i} isSharePreview={false} mp={mp} />
              </Card>
            ))}

        {paginatedPosts.next && (
          <div
            ref={divlazyloaderRef}
            style={{
              display: "flex",
              justifyContent: "center",
              padding: 16,
              color: "var(--text-3)",
            }}
          >
            <AiOutlineLoading3Quarters
              className="cl-spin"
              style={{ fontSize: "var(--fs-screen-title)" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCardHeader({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <Icon n={icon} s={20} c="var(--text-2)" />
        <span
          style={{
            fontSize: "var(--fs-section-title)",
            fontWeight: 750,
            color: "var(--text)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ fontSize: "var(--fs-label)", color: "var(--text-2)", lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}

function FeatureRow({ items }: { items: [string, string][] }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        justifyContent: "space-evenly",
      }}
    >
      {items.map(([icon, label], i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            flex: "1 1 110px",
            maxWidth: 160,
          }}
        >
          <Icon n={icon} s={44} c="var(--text-2)" />
          <span
            style={{
              fontSize: "var(--fs-caption)",
              color: "var(--text-2)",
              textAlign: "center",
              lineHeight: 1.35,
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default Feed;

