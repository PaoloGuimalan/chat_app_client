/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { UIEvent, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FollowRealmRequest,
  GroupShortcutsRequest,
  NetworkOverviewRequest,
  NetworkSectionRequest,
  UnfollowRealmRequest,
} from "@/reusables/hooks/requests";
import {
  ContactsSectionKey,
  GroupShortcut,
  NetworkEntityResult,
  NetworkOverview,
  NetworkSectionKey,
} from "@/reusables/vars/interfaces";
import {
  isUserOnline,
  needsMoreToFill,
  userSessionStatusFromContacts,
} from "@/reusables/hooks/reusable";
import {
  Chip,
  HScrollRail,
  Icon,
  IconBtn,
  SectionTitle,
  useTheme,
} from "@/reusables/design";
import { useRailFillCount } from "@/reusables/hooks/useRailFillCount";
import NetworkRow, { NetworkRowKind } from "./partials/NetworkRow";
import GroupTile from "./partials/GroupTile";
import {
  GroupTileSkeleton,
  NetworkRowSkeleton,
} from "./partials/NetworkSkeletons";

// Redesigned Contacts page ("ChatterLoop Upgrade" - Contacts Page.dc.html).
// Four sections - Group chats / Connections / Followers / Following - each
// with a preview and its own paginated "See all" infinite scroll.
//
// Two services feed it. The three graph sections come from Django
// (/api/entity/network/*), ranked by interaction score so the people you
// actually deal with sit on top. Group chats come from Node
// (/m/v2/group-shortcuts): they are shortcuts into conversations you are
// really in, ordered by most recent activity - not a realm directory.

const GROUP_TILE_W = 120;
const PAGE_SIZE = 12;
const GROUPS_PREVIEW = 10;

const SECTION_TITLES: Record<ContactsSectionKey, string> = {
  groups: "Group chats",
  connections: "Connections",
  followers: "Followers",
  following: "Following",
};

const ROW_KIND: Record<string, NetworkRowKind> = {
  connections: "connection",
  followers: "follower",
  following: "following",
};

const EMPTY_STATES: Record<
  ContactsSectionKey,
  { icon: string; title: string; subtitle: string }
> = {
  groups: {
    icon: "groups",
    title: "No group chats yet",
    subtitle: "Group conversations you join show up here.",
  },
  connections: {
    icon: "group",
    title: "No connections yet",
    subtitle: "People you connect with land here.",
  },
  followers: {
    icon: "person_add",
    title: "No followers yet",
    subtitle: "When someone follows you, they'll show here.",
  },
  following: {
    icon: "how_to_reg",
    title: "Not following anyone yet",
    subtitle: "Follow people to see them here.",
  },
};

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

function SeeAllButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 12.5,
        fontWeight: 650,
        color: "var(--brand)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      See all {count}
    </button>
  );
}

function Contacts() {
  const activeuserslist = useSelector((state: any) => state.activeuserslist);
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [overview, setOverview] = useState<NetworkOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Group chats come from a different service, so they load independently -
  // a slow Mongo query never holds up the graph sections (or vice versa).
  const [groups, setGroups] = useState<GroupShortcut[]>([]);
  const [groupsTotal, setGroupsTotal] = useState(0);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);

  const [detail, setDetail] = useState<ContactsSectionKey | null>(null);
  const [detailItems, setDetailItems] = useState<NetworkEntityResult[]>([]);
  const [detailGroups, setDetailGroups] = useState<GroupShortcut[]>([]);
  const [detailPage, setDetailPage] = useState(1);
  const [detailHasNext, setDetailHasNext] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailLoadingMore, setIsDetailLoadingMore] = useState(false);

  const [followBusy, setFollowBusy] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [groupsRailRef, groupSkeletonCount] = useRailFillCount(GROUP_TILE_W, {
    max: 10,
  });

  // Adaptive header sizing - same convention as the other main pages.
  const isMobile = screensizelistener.W <= 900;

  useEffect(() => {
    setIsLoading(true);
    NetworkOverviewRequest()
      .then((result) => setOverview(result))
      .catch((err) => {
        console.log(err);
        setOverview(null);
      })
      .finally(() => setIsLoading(false));

    setIsGroupsLoading(true);
    GroupShortcutsRequest(1, GROUPS_PREVIEW)
      .then((result) => {
        if (result) {
          setGroups(result.items);
          setGroupsTotal(result.total);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setIsGroupsLoading(false));
  }, []);

  const fetchDetailPage = (section: ContactsSectionKey, pageToLoad: number) => {
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

    if (section === "groups") {
      GroupShortcutsRequest(pageToLoad, PAGE_SIZE)
        .then((result) => {
          if (!result) return;
          setDetailGroups((prev) =>
            pageToLoad === 1 ? result.items : [...prev, ...result.items],
          );
          setDetailHasNext(!!result.next);
          setDetailPage(pageToLoad);
        })
        .catch((err) => console.log(err))
        .finally(done);
      return;
    }

    NetworkSectionRequest(section, pageToLoad, PAGE_SIZE)
      .then((response) => {
        setDetailItems((prev) =>
          pageToLoad === 1 ? response.results : [...prev, ...response.results],
        );
        setDetailHasNext(!!response.next);
        setDetailPage(pageToLoad);
      })
      .catch((err) => console.log(err))
      .finally(done);
  };

  const openDetail = (section: ContactsSectionKey) => {
    setDetail(section);
    setDetailItems([]);
    setDetailGroups([]);
    setDetailPage(1);
    setDetailHasNext(false);
    scrollRef.current?.scrollTo({ top: 0 });
    fetchDetailPage(section, 1);
  };

  const canLoadMore =
    !!detail && detailHasNext && !isDetailLoading && !isDetailLoadingMore;

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!canLoadMore) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 250) {
      fetchDetailPage(detail!, detailPage + 1);
    }
  };

  // Keep pulling pages until the view actually overflows. Without this a
  // "See all" opened on a tall screen stalls at page 1: one page of results
  // doesn't fill the viewport, so no scroll event can ever fire to request
  // the next one.
  useEffect(() => {
    if (!canLoadMore) return;
    if (needsMoreToFill(scrollRef.current)) {
      fetchDetailPage(detail!, detailPage + 1);
    }
  }, [
    canLoadMore,
    detail,
    detailPage,
    detailItems.length,
    detailGroups.length,
  ]);

  // Follow state lives in two places at once (the overview previews and the
  // open detail list), so a toggle patches both. Optimistic: the button
  // flips immediately and only reverts if the request fails.
  const patchFollowState = (entityID: string, next: boolean) => {
    const patch = (item: NetworkEntityResult) =>
      item.entity_id === entityID
        ? { ...item, is_followed_back: next, is_followed: next }
        : item;

    setOverview((prev) =>
      prev
        ? {
            ...prev,
            connections: {
              ...prev.connections,
              results: prev.connections.results.map(patch),
            },
            followers: {
              ...prev.followers,
              results: prev.followers.results.map(patch),
            },
            following: {
              ...prev.following,
              results: prev.following.results.map(patch),
            },
          }
        : prev,
    );
    setDetailItems((prev) => prev.map(patch));
  };

  const onToggleFollow = (item: NetworkEntityResult) => {
    if (followBusy[item.entity_id]) return;
    // Follower rows track is_followed_back; following rows are always
    // followed, so either flag answers "am I following them right now".
    const isFollowing = !!(item.is_followed_back || item.is_followed);

    setFollowBusy((prev) => ({ ...prev, [item.entity_id]: true }));
    patchFollowState(item.entity_id, !isFollowing);

    const request = isFollowing ? UnfollowRealmRequest : FollowRealmRequest;
    request({ entity_id: item.entity_id })
      .then((result: any) => {
        if (!result) patchFollowState(item.entity_id, isFollowing);
      })
      .catch((err: any) => {
        console.log(err);
        patchFollowState(item.entity_id, isFollowing);
      })
      .finally(() => {
        setFollowBusy((prev) => ({ ...prev, [item.entity_id]: false }));
      });
  };

  const onOpenEntity = (item: NetworkEntityResult) =>
    navigate(`/${item.handle}`);

  const onMessage = (item: NetworkEntityResult) => {
    if (item.connection_id) navigate(`/messages/${item.connection_id}`);
  };

  // A group's conversationID IS its realm id, so this opens the thread.
  const onOpenGroup = (group: GroupShortcut) =>
    navigate(`/messages/${group.target_id}`);

  // Presence comes from the active-sessions state, keyed on entity id.
  // Pages are skipped entirely - a page is never "active now".
  const presenceFor = (item: NetworkEntityResult) => {
    if (item.type !== "user") return { online: false, presence: null };
    const online = isUserOnline(activeuserslist, item.entity_id);
    return {
      online,
      presence: online
        ? "Active now"
        : userSessionStatusFromContacts(activeuserslist, item.entity_id),
    };
  };

  const renderRows = (
    section: NetworkSectionKey,
    items: NetworkEntityResult[],
  ) =>
    items.map((item) => {
      const { online, presence } = presenceFor(item);
      return (
        <NetworkRow
          key={`${section}-${item.entity_id}`}
          item={item}
          kind={ROW_KIND[section]}
          online={online}
          presence={presence}
          busy={!!followBusy[item.entity_id]}
          onOpen={onOpenEntity}
          onMessage={onMessage}
          onToggleFollow={onToggleFollow}
        />
      );
    });

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 10,
  } as const;

  const renderPeopleSection = (section: NetworkSectionKey) => {
    const data = overview?.[section];
    const results = data?.results ?? [];
    const empty = EMPTY_STATES[section];

    return (
      <div id={section}>
        <SectionTitle
          action={
            data && data.total > results.length ? (
              <SeeAllButton
                count={data.total}
                onClick={() => openDetail(section)}
              />
            ) : undefined
          }
        >
          {SECTION_TITLES[section]}
        </SectionTitle>
        <div style={gridStyle}>
          {isLoading ? (
            Array.from({ length: 6 }, (_, i) => <NetworkRowSkeleton key={i} />)
          ) : results.length === 0 ? (
            <EmptySection {...empty} />
          ) : (
            renderRows(section, results)
          )}
        </div>
      </div>
    );
  };

  const renderMainView = () => {
    const counts = {
      connections: overview?.connections.total ?? 0,
      followers: overview?.followers.total ?? 0,
      following: overview?.following.total ?? 0,
      groups: groupsTotal,
    };

    return (
      <>
        {/* Title and counts share one column beside the icon, so the counts
            line starts flush with the title instead of under the icon. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="tw-flex tw-gap-[10px] tw-mb-[10px] tw-justify-center">
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--r-sm)",
                  background: "var(--green-soft)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                }}
              >
                <Icon n="contacts" s={18} c="var(--green)" />
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: isMobile ? 18 : 22,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                }}
              >
                Contacts
              </h2>
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "var(--text-3)",
                marginTop: 2,
              }}
            >
              {counts.connections} connections · {counts.followers} followers ·{" "}
              {counts.following} following
            </div>
          </div>
        </div>

        <HScrollRail
          gap={8}
          label="Sections"
          style={{ marginBottom: 26 }}
          trackStyle={{ paddingBottom: 2 }}
        >
          {(
            [
              { key: "groups", icon: "groups" },
              { key: "connections", icon: "group" },
              { key: "followers", icon: "person_add" },
              { key: "following", icon: "how_to_reg" },
            ] as { key: ContactsSectionKey; icon: string }[]
          ).map((chip) => (
            <Chip
              key={chip.key}
              icon={chip.icon}
              onClick={() =>
                document
                  .getElementById(chip.key)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              {SECTION_TITLES[chip.key]} · {counts[chip.key]}
            </Chip>
          ))}
        </HScrollRail>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div id="groups">
            <SectionTitle
              action={
                groupsTotal > groups.length ? (
                  <SeeAllButton
                    count={groupsTotal}
                    onClick={() => openDetail("groups")}
                  />
                ) : undefined
              }
            >
              {SECTION_TITLES.groups}
            </SectionTitle>
            <HScrollRail trackRef={groupsRailRef} label="Group chats">
              {isGroupsLoading ? (
                Array.from({ length: groupSkeletonCount }, (_, i) => (
                  <GroupTileSkeleton key={i} />
                ))
              ) : groups.length === 0 ? (
                <EmptySection {...EMPTY_STATES.groups} />
              ) : (
                groups.map((group) => (
                  <GroupTile
                    key={group.realm_id}
                    group={group}
                    onOpen={onOpenGroup}
                  />
                ))
              )}
            </HScrollRail>
          </div>

          {renderPeopleSection("connections")}
          {renderPeopleSection("followers")}
          {renderPeopleSection("following")}
        </div>
      </>
    );
  };

  const renderDetailView = () => {
    if (!detail) return null;
    const isGroups = detail === "groups";
    const empty = EMPTY_STATES[detail];

    return (
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
            onClick={() => setDetail(null)}
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
              letterSpacing: "-0.03em",
              color: "var(--text)",
            }}
          >
            {SECTION_TITLES[detail]}
          </h1>
        </div>

        <div
          style={
            isGroups
              ? {
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 16,
                  justifyItems: "center",
                }
              : gridStyle
          }
        >
          {isDetailLoading ? (
            Array.from({ length: 8 }, (_, i) =>
              isGroups ? (
                <GroupTileSkeleton key={i} />
              ) : (
                <NetworkRowSkeleton key={i} />
              ),
            )
          ) : isGroups ? (
            detailGroups.length === 0 ? (
              <EmptySection {...empty} />
            ) : (
              detailGroups.map((group) => (
                <GroupTile
                  key={group.realm_id}
                  group={group}
                  onOpen={onOpenGroup}
                />
              ))
            )
          ) : detailItems.length === 0 ? (
            <EmptySection {...empty} />
          ) : (
            renderRows(detail as NetworkSectionKey, detailItems)
          )}

          {isDetailLoadingMore &&
            Array.from({ length: 4 }, (_, i) =>
              isGroups ? (
                <GroupTileSkeleton key={`more-${i}`} />
              ) : (
                <NetworkRowSkeleton key={`more-${i}`} />
              ),
            )}
        </div>
      </>
    );
  };

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
        overflow: "auto",
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
            maxWidth: 980,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {detail ? renderDetailView() : renderMainView()}
        </div>
      </div>
    </div>
  );
}

export default Contacts;

