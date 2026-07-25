/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Dispatch,
  SetStateAction,
  UIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FollowRealmRequest,
  GetPostPreviewRequest,
  JoinRealmGroupRequest,
  SearchOverviewRequest,
  SearchPeopleRequest,
  SearchPostsRequest,
  SearchRealmsRequest,
  UnfollowRealmRequest,
} from "@/reusables/hooks/requests";
import {
  AuthenticationInterface,
  IPost,
  SearchOverview,
  SearchPersonResult,
  SearchPostResult,
  SearchRealmResult,
} from "@/reusables/vars/interfaces";
import { isUserOnline } from "@/reusables/hooks/reusable";
import {
  Card,
  Chip,
  Icon,
  IconBtn,
  SectionTitle,
  useTheme,
} from "@/reusables/design";
import PostPreviewModal from "@/app/tabs/profile/user/PostPreviewModal";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import PersonCard from "./partials/PersonCard";
import RealmCard from "./partials/RealmCard";
import ContentCard from "./partials/ContentCard";
import {
  ContentCardSkeleton,
  PersonCardSkeleton,
  RealmCardSkeleton,
} from "./partials/SearchSkeletons";

// Redesigned Search page ("ChatterLoop Upgrade" - Search Page.dc.html).
// One overview call settles all three section previews per query; each
// "See all" detail view infinite-scrolls its OWN paginated v2 endpoint.

type DetailKind = "people" | "realms" | "posts";
type FilterKey = "All" | "People" | "Realms" | "Posts";

const FILTERS: { key: FilterKey; icon: string }[] = [
  { key: "All", icon: "apps" },
  { key: "People", icon: "group" },
  { key: "Realms", icon: "public" },
  { key: "Posts", icon: "article" },
];

const DETAIL_TITLES: Record<DetailKind, string> = {
  people: "People",
  realms: "Realms",
  posts: "Content",
};

const PEOPLE_PAGE_SIZE = 12;
const REALMS_PAGE_SIZE = 12;
const POSTS_PAGE_SIZE = 10;

function SeeAllButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 13,
        fontWeight: 650,
        color: "var(--brand)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      See all
    </button>
  );
}

function EmptySection({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        width: "100%",
        padding: "26px 14px",
        textAlign: "center",
        background: "var(--surface)",
        border: "1px dashed var(--border-2)",
        borderRadius: "var(--r-md)",
      }}
    >
      <Icon n={icon} s={32} c="var(--text-3)" />
      <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{subtitle}</div>
    </div>
  );
}

function SearchPage() {
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");
  const [overview, setOverview] = useState<SearchOverview | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);

  // "See all" detail state - one kind at a time, page-appended lists.
  const [detail, setDetail] = useState<DetailKind | null>(null);
  const [detailPeople, setDetailPeople] = useState<SearchPersonResult[]>([]);
  const [detailRealms, setDetailRealms] = useState<SearchRealmResult[]>([]);
  const [detailPosts, setDetailPosts] = useState<SearchPostResult[]>([]);
  const [detailPage, setDetailPage] = useState(1);
  const [detailHasNext, setDetailHasNext] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailLoadingMore, setIsDetailLoadingMore] = useState(false);

  const [followBusy, setFollowBusy] = useState<Record<string, boolean>>({});
  const [joinBusy, setJoinBusy] = useState<Record<string, boolean>>({});
  // Post preview - same modal experience as saved posts' "View" on Profile.
  // previewPost keeps its data after the modal closes so the share composer
  // can read it as sharePreviewData (same pattern as SavedPostItem).
  const [previewPost, setPreviewPost] = useState<IPost | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [toggleNewPostModal, setToggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });

  const isMobile = screensizelistener.W <= 900;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const normalizedQuery = useMemo(() => query.trim(), [query]);
  const isNarrow = screensizelistener.W < 860;

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!normalizedQuery) {
        setOverview(null);
        setIsOverviewLoading(false);
        return;
      }
      setIsOverviewLoading(true);
      SearchOverviewRequest(normalizedQuery)
        .then((result) => setOverview(result))
        .catch((err) => {
          console.log(err);
          setOverview(null);
        })
        .finally(() => setIsOverviewLoading(false));
    }, 450);

    return () => clearTimeout(timeout);
  }, [normalizedQuery]);

  const fetchDetailPage = (kind: DetailKind, pageToLoad: number) => {
    if (!normalizedQuery) return;
    if (pageToLoad === 1) {
      setIsDetailLoading(true);
    } else {
      setIsDetailLoadingMore(true);
    }
    const done = () => {
      if (pageToLoad === 1) {
        setIsDetailLoading(false);
      } else {
        setIsDetailLoadingMore(false);
      }
    };
    const apply = <T,>(
      setter: Dispatch<SetStateAction<T[]>>,
      response: { next: string | null; results: T[] },
    ) => {
      setter((prev) =>
        pageToLoad === 1 ? response.results : [...prev, ...response.results],
      );
      setDetailHasNext(!!response.next);
      setDetailPage(pageToLoad);
    };

    if (kind === "people") {
      SearchPeopleRequest(normalizedQuery, pageToLoad, PEOPLE_PAGE_SIZE)
        .then((response) => apply(setDetailPeople, response))
        .catch((err) => console.log(err))
        .finally(done);
    } else if (kind === "realms") {
      SearchRealmsRequest(normalizedQuery, pageToLoad, REALMS_PAGE_SIZE)
        .then((response) => apply(setDetailRealms, response))
        .catch((err) => console.log(err))
        .finally(done);
    } else {
      SearchPostsRequest(normalizedQuery, pageToLoad, POSTS_PAGE_SIZE)
        .then((response) => apply(setDetailPosts, response))
        .catch((err) => console.log(err))
        .finally(done);
    }
  };

  const openDetail = (kind: DetailKind) => {
    setDetail(kind);
    setDetailPeople([]);
    setDetailRealms([]);
    setDetailPosts([]);
    setDetailPage(1);
    setDetailHasNext(false);
    scrollRef.current?.scrollTo({ top: 0 });
    fetchDetailPage(kind, 1);
  };

  const backToMain = () => {
    setDetail(null);
    setDetailPeople([]);
    setDetailRealms([]);
    setDetailPosts([]);
    setDetailHasNext(false);
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!detail || isDetailLoading || isDetailLoadingMore || !detailHasNext) {
      return;
    }
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 250) {
      fetchDetailPage(detail, detailPage + 1);
    }
  };

  // Follow state lives in FOUR lists (overview people/realms + both detail
  // lists); one applier keeps them consistent for optimistic flips/reverts.
  const applyFollowState = (entityID: string, next: boolean) => {
    setOverview((prev) =>
      prev
        ? {
            ...prev,
            people: {
              ...prev.people,
              results: prev.people.results.map((p) =>
                p.entity_id === entityID ? { ...p, is_followed: next } : p,
              ),
            },
            realms: {
              ...prev.realms,
              results: prev.realms.results.map((r) =>
                r.entity_id === entityID ? { ...r, is_follower: next } : r,
              ),
            },
          }
        : prev,
    );
    setDetailPeople((prev) =>
      prev.map((p) =>
        p.entity_id === entityID ? { ...p, is_followed: next } : p,
      ),
    );
    setDetailRealms((prev) =>
      prev.map((r) =>
        r.entity_id === entityID ? { ...r, is_follower: next } : r,
      ),
    );
  };

  const toggleFollowEntity = (
    entityID: string,
    currentlyFollowing: boolean,
  ) => {
    if (followBusy[entityID]) return;
    setFollowBusy((prev) => ({ ...prev, [entityID]: true }));
    applyFollowState(entityID, !currentlyFollowing);
    // The follow endpoint takes any entity target (person or page);
    // entity_id is the general alias - same convention as Profile.tsx.
    const request = currentlyFollowing
      ? UnfollowRealmRequest
      : FollowRealmRequest;
    request({ entity_id: entityID })
      .then((response) => {
        if (!response) applyFollowState(entityID, currentlyFollowing);
      })
      .catch((err) => {
        console.log(err);
        applyFollowState(entityID, currentlyFollowing);
      })
      .finally(() => {
        setFollowBusy((prev) => ({ ...prev, [entityID]: false }));
      });
  };

  // Joining flips is_member in every list the realm appears in, so the
  // button becomes "Open chat" without a refetch.
  const applyMemberState = (entityID: string, next: boolean) => {
    setOverview((prev) =>
      prev
        ? {
            ...prev,
            realms: {
              ...prev.realms,
              results: prev.realms.results.map((r) =>
                r.entity_id === entityID ? { ...r, is_member: next } : r,
              ),
            },
          }
        : prev,
    );
    setDetailRealms((prev) =>
      prev.map((r) =>
        r.entity_id === entityID ? { ...r, is_member: next } : r,
      ),
    );
  };

  // One-click join, PUBLIC groups only (the backend enforces it too -
  // private groups stay invite-only). Per design: joining does NOT
  // redirect; the card flips to "Open chat" and THAT navigates.
  const onJoinGroup = (realm: SearchRealmResult) => {
    if (joinBusy[realm.entity_id]) return;
    setJoinBusy((prev) => ({ ...prev, [realm.entity_id]: true }));
    JoinRealmGroupRequest({ realm_id: realm.id })
      .then((result) => {
        if (result) applyMemberState(realm.entity_id, true);
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setJoinBusy((prev) => ({ ...prev, [realm.entity_id]: false }));
      });
  };

  const onTogglePersonFollow = (person: SearchPersonResult) =>
    toggleFollowEntity(person.entity_id, person.is_followed);
  const onToggleRealmFollow = (realm: SearchRealmResult) =>
    toggleFollowEntity(realm.entity_id, realm.is_follower);
  const onOpenPerson = (person: SearchPersonResult) =>
    navigate(`/${person.handle}`);
  // Destination depends on the realm kind: pages have profile routes,
  // servers have their own shell, and a group IS a conversation (its
  // conversationID is the realm id) - members go straight to the thread,
  // non-members have no destination (Join is the only affordance).
  const onOpenRealm = (realm: SearchRealmResult) => {
    if (realm.realm_type === "server") {
      navigate(`/servers/${realm.id}`);
    } else if (realm.realm_type === "group") {
      if (realm.is_member) navigate(`/messages/${realm.id}`);
    } else {
      navigate(`/${realm.handle}`);
    }
  };
  const onOpenPost = (post: SearchPostResult) => {
    if (isPreviewLoading) return;
    setIsPreviewLoading(true);
    GetPostPreviewRequest({ postID: post.post_id })
      .then((response) => {
        if (response) {
          setPreviewPost(response);
          setIsPreviewOpen(true);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setIsPreviewLoading(false));
  };

  const showPeople = activeFilter === "All" || activeFilter === "People";
  const showRealms = activeFilter === "All" || activeFilter === "Realms";
  const showPosts = activeFilter === "All" || activeFilter === "Posts";

  const peopleResults = overview?.people.results ?? [];
  const realmResults = overview?.realms.results ?? [];
  const postResults = overview?.posts.results ?? [];

  const renderPeopleSection = () => (
    <div>
      <SectionTitle
        action={
          peopleResults.length > 0 ? (
            <SeeAllButton onClick={() => openDetail("people")} />
          ) : undefined
        }
      >
        People
      </SectionTitle>
      <div
        className="cl-scroll"
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 6,
        }}
      >
        {isOverviewLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <PersonCardSkeleton key={i} rail />
          ))
        ) : peopleResults.length === 0 ? (
          <EmptySection
            icon="group"
            title="No people found"
            subtitle="Try a different name or keyword."
          />
        ) : (
          peopleResults.map((person) => (
            <PersonCard
              key={person.entity_id}
              person={person}
              rail
              online={isUserOnline(activeuserslist, person.entity_id)}
              followBusy={!!followBusy[person.entity_id]}
              onToggleFollow={onTogglePersonFollow}
              onOpen={onOpenPerson}
            />
          ))
        )}
      </div>
    </div>
  );

  const renderRealmCards = (rail: boolean) =>
    isOverviewLoading ? (
      Array.from({ length: 4 }, (_, i) => (
        <RealmCardSkeleton key={i} rail={rail} />
      ))
    ) : realmResults.length === 0 ? (
      <EmptySection
        icon="public"
        title="No realms found"
        subtitle="Servers, groups and pages will show up here."
      />
    ) : (
      realmResults.map((realm) => (
        <RealmCard
          key={realm.entity_id}
          realm={realm}
          rail={rail}
          followBusy={!!followBusy[realm.entity_id]}
          joinBusy={!!joinBusy[realm.entity_id]}
          onToggleFollow={onToggleRealmFollow}
          onJoinGroup={onJoinGroup}
          onOpen={onOpenRealm}
        />
      ))
    );

  const renderContentCards = () =>
    isOverviewLoading ? (
      Array.from({ length: 3 }, (_, i) => <ContentCardSkeleton key={i} />)
    ) : postResults.length === 0 ? (
      <EmptySection
        icon="article"
        title="No posts found"
        subtitle="Try a different keyword."
      />
    ) : (
      postResults.map((post) => (
        <ContentCard key={post.post_id} post={post} onOpen={onOpenPost} />
      ))
    );

  const renderMainView = () => (
    <>
      <h2
        style={{
          margin: "0 0 16px",
          fontSize: isMobile ? 18 : 22,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--text)",
        }}
      >
        Search
      </h2>

      <Card
        pad={0}
        hover
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 50,
          padding: "0 16px",
          marginBottom: 16,
        }}
      >
        <Icon n="search" s={22} c="var(--text-3)" />
        <input
          id="input_search_box"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, realms, posts…"
          autoComplete="off"
          className="tw-border-none tw-outline-none"
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            color: "var(--text)",
            fontSize: 15,
          }}
        />
        {query.length > 0 && (
          <IconBtn
            n="close"
            title="Clear"
            onClick={() => setQuery("")}
            style={{ background: "transparent", color: "var(--text-2)" }}
          />
        )}
      </Card>

      <div
        className="cl-scroll"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 22,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {FILTERS.map((filter) => (
          <Chip
            key={filter.key}
            icon={filter.icon}
            active={activeFilter === filter.key}
            onClick={() => setActiveFilter(filter.key)}
            style={{ height: 34, padding: "0 14px", fontSize: 13 }}
          >
            {filter.key}
          </Chip>
        ))}
      </div>

      {!normalizedQuery ? (
        <Card
          pad={22}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 260,
          }}
        >
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--brand-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <Icon n="manage_search" s={34} c="var(--brand)" />
            </div>
            <span
              style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}
            >
              Search people, realms and posts
            </span>
            <span style={{ fontSize: 14, color: "var(--text-2)" }}>
              Start typing a name, handle or keyword.
            </span>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {showPeople && renderPeopleSection()}

          {isNarrow ? (
            <>
              {showRealms && (
                <div>
                  <SectionTitle
                    action={
                      realmResults.length > 0 ? (
                        <SeeAllButton onClick={() => openDetail("realms")} />
                      ) : undefined
                    }
                  >
                    Realms
                  </SectionTitle>
                  <div
                    className="cl-scroll"
                    style={{
                      display: "flex",
                      gap: 12,
                      overflowX: "auto",
                      paddingBottom: 6,
                    }}
                  >
                    {renderRealmCards(true)}
                  </div>
                </div>
              )}
              {showPosts && (
                <div>
                  <SectionTitle
                    action={
                      postResults.length > 0 ? (
                        <SeeAllButton onClick={() => openDetail("posts")} />
                      ) : undefined
                    }
                  >
                    Content
                  </SectionTitle>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {renderContentCards()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              {showRealms && (
                <div style={{ flex: "1 1 460px", minWidth: 0 }}>
                  <SectionTitle
                    action={
                      realmResults.length > 0 ? (
                        <SeeAllButton onClick={() => openDetail("realms")} />
                      ) : undefined
                    }
                  >
                    Realms
                  </SectionTitle>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 12,
                    }}
                  >
                    {renderRealmCards(false)}
                  </div>
                </div>
              )}
              {showPosts && (
                <div style={{ flex: "1 1 380px", minWidth: 0 }}>
                  <SectionTitle
                    action={
                      postResults.length > 0 ? (
                        <SeeAllButton onClick={() => openDetail("posts")} />
                      ) : undefined
                    }
                  >
                    Content
                  </SectionTitle>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {renderContentCards()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderDetailView = () => (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <IconBtn
          n="arrow_back"
          title="Back"
          onClick={backToMain}
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
          }}
        />
        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? 18 : 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--text)",
          }}
        >
          {detail ? DETAIL_TITLES[detail] : ""}
        </h1>
      </div>

      {detail === "people" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
            gap: 14,
          }}
        >
          {isDetailLoading ? (
            Array.from({ length: 8 }, (_, i) => <PersonCardSkeleton key={i} />)
          ) : detailPeople.length === 0 ? (
            <EmptySection
              icon="group"
              title="No people found"
              subtitle="Try a different name or keyword."
            />
          ) : (
            <>
              {detailPeople.map((person) => (
                <PersonCard
                  key={person.entity_id}
                  person={person}
                  online={isUserOnline(activeuserslist, person.entity_id)}
                  followBusy={!!followBusy[person.entity_id]}
                  onToggleFollow={onTogglePersonFollow}
                  onOpen={onOpenPerson}
                />
              ))}
              {isDetailLoadingMore &&
                Array.from({ length: 4 }, (_, i) => (
                  <PersonCardSkeleton key={`more-${i}`} />
                ))}
            </>
          )}
        </div>
      )}

      {detail === "realms" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {isDetailLoading ? (
            Array.from({ length: 8 }, (_, i) => <RealmCardSkeleton key={i} />)
          ) : detailRealms.length === 0 ? (
            <EmptySection
              icon="public"
              title="No realms found"
              subtitle="Servers, groups and pages will show up here."
            />
          ) : (
            <>
              {detailRealms.map((realm) => (
                <RealmCard
                  key={realm.entity_id}
                  realm={realm}
                  followBusy={!!followBusy[realm.entity_id]}
                  joinBusy={!!joinBusy[realm.entity_id]}
                  onToggleFollow={onToggleRealmFollow}
                  onJoinGroup={onJoinGroup}
                  onOpen={onOpenRealm}
                />
              ))}
              {isDetailLoadingMore &&
                Array.from({ length: 4 }, (_, i) => (
                  <RealmCardSkeleton key={`more-${i}`} />
                ))}
            </>
          )}
        </div>
      )}

      {detail === "posts" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 640,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {isDetailLoading ? (
            Array.from({ length: 5 }, (_, i) => <ContentCardSkeleton key={i} />)
          ) : detailPosts.length === 0 ? (
            <EmptySection
              icon="article"
              title="No posts found"
              subtitle="Try a different keyword."
            />
          ) : (
            <>
              {detailPosts.map((post) => (
                <ContentCard
                  key={post.post_id}
                  post={post}
                  onOpen={onOpenPost}
                />
              ))}
              {isDetailLoadingMore &&
                Array.from({ length: 2 }, (_, i) => (
                  <ContentCardSkeleton key={`more-${i}`} />
                ))}
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="cl-redesign cl-scroll"
      data-theme={theme}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "scroll",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          width: "100%",
          minHeight: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "22px 18px 28px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1080,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {detail ? renderDetailView() : renderMainView()}
        </div>
      </div>

      {isPreviewLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            background: "rgba(8, 12, 20, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AiOutlineLoading3Quarters
            className="cl-spin"
            style={{ fontSize: 28, color: "#fff" }}
          />
        </div>
      )}

      {toggleNewPostModal.toggle && (
        <NewPostModal
          toShare={true}
          sharePreviewData={previewPost}
          withImage={toggleNewPostModal.withImage}
          profileInfo={{
            id: authentication.user.userID,
            entityID: authentication.user.entity_id,
            username: authentication.user.username,
          }}
          otherEntityID={null}
          setcreateposttext={() => {}}
          getpostprocess={() => {}}
          onclose={setToggleNewPostModal}
        />
      )}

      {isPreviewOpen && previewPost && (
        <PostPreviewModal
          post={previewPost}
          setPost={setPreviewPost}
          onClose={() => setIsPreviewOpen(false)}
          onShare={() => {
            setIsPreviewOpen(false);
            setToggleNewPostModal({ toggle: true, withImage: false });
          }}
        />
      )}
    </div>
  );
}

export default SearchPage;

