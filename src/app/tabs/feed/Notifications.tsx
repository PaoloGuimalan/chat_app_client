/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { UIEvent, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AcceptContactRequest,
  AnswerFollowRequest,
  DeclineContactRequest,
  NotificationsOverviewV2Request,
  NotificationsSectionV2Request,
  ReadNotificationsRequest,
} from "../../../reusables/hooks/requests";
import {
  INotificationV2,
  NotificationSectionKey,
} from "@/reusables/vars/interfaces";
import { needsMoreToFill } from "@/reusables/hooks/reusable";
import { Card, Icon, IconBtn, useTheme } from "@/reusables/design";
import NotificationRow from "./partials/NotificationRow";
import { NotificationRowSkeleton } from "./partials/NotificationSkeletons";

// Redesigned Notifications page ("ChatterLoop Upgrade" -
// Notification Page.dc.html). Three sections - Activity / Connections /
// System - fed by the sectioned v2 Node endpoints: one overview call
// settles all three on load, then each section pages its OWN endpoint.
// Desktop: side-by-side screen-height columns, each with its own infinite
// scroll. Mobile: stacked 3-item previews + a See-all detail view.
// The v1 flow (/getNotifications + redux notificationslist) still serves
// the topbar badge and SSE - untouched.

const SECTION_DEFS: {
  key: NotificationSectionKey;
  title: string;
  icon: string;
  color: string;
  emptyText: string;
}[] = [
  {
    key: "activity",
    title: "Activity",
    icon: "bolt",
    color: "var(--brand)",
    emptyText: "New reactions, comments and shares land here.",
  },
  {
    key: "connections",
    title: "Connections",
    icon: "person",
    color: "var(--green)",
    emptyText: "Contact requests and new followers land here.",
  },
  {
    key: "system",
    title: "System",
    icon: "campaign",
    color: "#8b5cf6",
    emptyText: "Updates from ChatterLoop land here.",
  },
];

// One value for the overview preview AND the per-page size so the Mongo
// $skip arithmetic stays aligned across loads (page 2 starts at item 11).
const RANGE = 10;
const MOBILE_PREVIEW = 3;

interface SectionState {
  items: INotificationV2[];
  total: number;
  unread: number;
  page: number;
  next: boolean;
  loadingMore: boolean;
}

const EMPTY_SECTION: SectionState = {
  items: [],
  total: 0,
  unread: 0,
  page: 1,
  next: false,
  loadingMore: false,
};

type SectionsState = Record<NotificationSectionKey, SectionState>;

const INITIAL_SECTIONS: SectionsState = {
  activity: EMPTY_SECTION,
  connections: EMPTY_SECTION,
  system: EMPTY_SECTION,
};

function SectionEmptyState({
  icon,
  emptyText,
}: {
  icon: string;
  emptyText: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "24px 12px",
        textAlign: "center",
      }}
    >
      <Icon n={icon} s={34} c="var(--text-3)" />
      <div style={{ fontWeight: 700, fontSize: "var(--fs-title)", color: "var(--text)" }}>
        You&rsquo;re all caught up!
      </div>
      <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-3)" }}>{emptyText}</div>
    </div>
  );
}

function UnreadPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 19,
        height: 19,
        padding: "0 5px",
        background: "var(--pink)",
        color: "#fff",
        fontSize: "var(--fs-micro)",
        fontWeight: 700,
        borderRadius: 999,
        flex: "none",
      }}
    >
      {count}
    </span>
  );
}

function Notifications() {
  const notificationslist = useSelector(
    (state: any) => state.notificationslist,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const [sections, setSections] = useState<SectionsState>(INITIAL_SECTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<NotificationSectionKey | null>(null);
  const [isDisabledByRequest, setIsDisabledByRequest] = useState(false);

  // Auto-read on open is kept behavior (user decision) - fire once per
  // visit, after the first successful overview load. The topbar badge
  // re-syncs by itself: /readnotifications triggers the notifications_reload
  // SSE, which refreshes redux notificationslist.
  const hasAutoReadRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Each desktop column scrolls on its own, so the fill check below needs
  // each element, not just the page container.
  const columnRefs = useRef<
    Partial<Record<NotificationSectionKey, HTMLDivElement | null>>
  >({});

  const isMobile = screensizelistener.W < 760;

  const fetchOverview = () => {
    NotificationsOverviewV2Request(RANGE)
      .then((result) => {
        if (result) {
          const toState = (s: any): SectionState => ({
            items: s.items,
            total: s.total,
            unread: s.unread,
            page: 1,
            next: !!s.next,
            loadingMore: false,
          });
          setSections({
            activity: toState(result.activity),
            connections: toState(result.connections),
            system: toState(result.system),
          });
          if (!hasAutoReadRef.current) {
            hasAutoReadRef.current = true;
            ReadNotificationsRequest();
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
      });
  };

  // Initial load + live updates with zero SSE plumbing: a NEW notification
  // bumps redux notificationslist.total (SSE already refreshes it via
  // NotificationOverrideRequest), which re-settles the sections. Deliberately
  // NOT keyed on totalunread - the auto-read above zeroes it a moment after
  // load, and refetching then would instantly wipe the unread highlights.
  useEffect(() => {
    fetchOverview();
  }, [notificationslist.total]);

  const loadMore = (key: NotificationSectionKey) => {
    const current = sections[key];
    if (current.loadingMore || !current.next) return;
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], loadingMore: true },
    }));
    NotificationsSectionV2Request(key, current.page + 1, RANGE)
      .then((result) => {
        setSections((prev) => ({
          ...prev,
          [key]: result
            ? {
                items: [...prev[key].items, ...result.items],
                total: result.total,
                // Keep the locally-known unread count - after the auto-read
                // the server already reports 0, which would blank the badge
                // mid-visit.
                unread: prev[key].unread,
                page: current.page + 1,
                next: !!result.next,
                loadingMore: false,
              }
            : { ...prev[key], loadingMore: false },
        }));
      })
      .catch((err) => {
        console.log(err);
        setSections((prev) => ({
          ...prev,
          [key]: { ...prev[key], loadingMore: false },
        }));
      });
  };

  const markAllRead = () => {
    ReadNotificationsRequest();
    setSections((prev) => {
      const zero = (s: SectionState): SectionState => ({
        ...s,
        unread: 0,
        items: s.items.map((n) => ({ ...n, isRead: true })),
      });
      return {
        activity: zero(prev.activity),
        connections: zero(prev.connections),
        system: zero(prev.system),
      };
    });
  };

  // Accept/decline reuse the SAME contact endpoints as everywhere else;
  // referenceStatus flips locally so the buttons disappear immediately.
  const setReferenceHandled = (referenceID: string) => {
    setSections((prev) => {
      const flip = (s: SectionState): SectionState => ({
        ...s,
        items: s.items.map((n) =>
          n.referenceID === referenceID ? { ...n, referenceStatus: true } : n,
        ),
      });
      return {
        activity: flip(prev.activity),
        connections: flip(prev.connections),
        system: flip(prev.system),
      };
    });
  };

  // The two request kinds share the row and its buttons but hit different
  // endpoints, so each handler branches on the notification type.
  //
  // A follow_request's referenceID is the REQUESTER's entity id (there is no
  // connection row to address), which is exactly what the follow endpoint
  // wants as target_id - the followee is always the caller.
  const acceptRequestProcess = (n: INotificationV2) => {
    setIsDisabledByRequest(true);
    setReferenceHandled(n.referenceID);

    if (n.type === "follow_request") {
      AnswerFollowRequest(
        { target_id: n.referenceID, action: "approve" },
        dispatch,
        alerts,
        setIsDisabledByRequest,
      );
      return;
    }

    AcceptContactRequest(
      { connection_id: n.referenceID, entity_id: n.fromUserID },
      dispatch,
      alerts,
      setIsDisabledByRequest,
    );
  };

  const declineRequestProcess = (n: INotificationV2) => {
    setIsDisabledByRequest(true);
    setReferenceHandled(n.referenceID);

    if (n.type === "follow_request") {
      AnswerFollowRequest(
        { target_id: n.referenceID, action: "decline" },
        dispatch,
        alerts,
        setIsDisabledByRequest,
      );
      return;
    }

    DeclineContactRequest(
      {
        connection_id: n.referenceID,
        entity_id: n.fromUserID,
        action: "decline",
      },
      dispatch,
      alerts,
      setIsDisabledByRequest,
    );
  };

  const openDetail = (key: NotificationSectionKey) => {
    setDetail(key);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  // Mobile See-all detail pages the shared section list through the page's
  // own scroll container; desktop columns page through their own onScroll.
  const handlePageScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!detail) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 250) {
      loadMore(detail);
    }
  };

  const handleColumnScroll =
    (key: NotificationSectionKey) => (e: UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
        loadMore(key);
      }
    };

  // Keep pulling pages until each view actually overflows. Without this a
  // column (or a See-all on a tall screen) stalls at page 1: its first page
  // doesn't fill the available height, so no scroll event can ever fire to
  // request the next one.
  useEffect(() => {
    if (isLoading) return;

    if (detail) {
      const section = sections[detail];
      if (
        section.next &&
        !section.loadingMore &&
        needsMoreToFill(scrollRef.current)
      ) {
        loadMore(detail);
      }
      return;
    }

    // Desktop columns scroll independently, so each one is checked against
    // its own element. Mobile previews are capped at 3 items and never page.
    if (isMobile) return;
    SECTION_DEFS.forEach((def) => {
      const section = sections[def.key];
      if (
        section.next &&
        !section.loadingMore &&
        needsMoreToFill(columnRefs.current[def.key])
      ) {
        loadMore(def.key);
      }
    });
  }, [sections, detail, isLoading, isMobile]);

  const detailDef = detail
    ? SECTION_DEFS.find((d) => d.key === detail) || null
    : null;

  const renderRows = (
    key: NotificationSectionKey,
    size: "column" | "detail",
    limit?: number,
  ) => {
    const s = sections[key];
    const items = limit ? s.items.slice(0, limit) : s.items;
    return items.map((n) => (
      <NotificationRow
        key={n.notificationID}
        notification={n}
        size={size}
        actionBusy={isDisabledByRequest}
        onAccept={acceptRequestProcess}
        onDecline={declineRequestProcess}
      />
    ));
  };

  const renderMainView = () => (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "var(--fs-screen-title)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--text)",
          }}
        >
          Notifications
        </h1>
        <button
          type="button"
          onClick={markAllRead}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 34,
            padding: "0 14px",
            borderRadius: "var(--r-sm)",
            border: "none",
            background: "transparent",
            color: "var(--brand)",
            fontSize: "var(--fs-body-sm)",
            fontWeight: 650,
            cursor: "pointer",
          }}
        >
          <Icon n="done_all" s={18} c="var(--brand)" />
          Mark all read
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {SECTION_DEFS.map((def) => {
          const s = sections[def.key];
          return (
            <Card
              key={def.key}
              pad={14}
              hover
              style={{
                flex: "1 1 260px",
                minWidth: 260,
                height: isMobile ? "auto" : "calc(100vh - 170px)",
                minHeight: isMobile ? 0 : 380,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Icon n={def.icon} s={19} c={def.color} />
                <h3
                  style={{
                    margin: 0,
                    fontSize: "var(--fs-section-title)",
                    fontWeight: 750,
                    letterSpacing: "-0.01em",
                    color: "var(--text)",
                  }}
                >
                  {def.title}
                </h3>
                <UnreadPill count={s.unread} />
              </div>

              <div
                ref={(el) => {
                  columnRefs.current[def.key] = el;
                }}
                className="cl-scroll"
                onScroll={isMobile ? undefined : handleColumnScroll(def.key)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                  minHeight: 0,
                  overflowY: isMobile ? "visible" : "auto",
                }}
              >
                {isLoading ? (
                  Array.from(
                    { length: isMobile ? MOBILE_PREVIEW : 6 },
                    (_, i) => <NotificationRowSkeleton key={i} />,
                  )
                ) : s.items.length === 0 ? (
                  <SectionEmptyState
                    icon={def.icon}
                    emptyText={def.emptyText}
                  />
                ) : (
                  <>
                    {renderRows(
                      def.key,
                      "column",
                      isMobile ? MOBILE_PREVIEW : undefined,
                    )}
                    {!isMobile &&
                      s.loadingMore &&
                      Array.from({ length: 2 }, (_, i) => (
                        <NotificationRowSkeleton key={`more-${i}`} />
                      ))}
                  </>
                )}
              </div>

              {isMobile && !isLoading && s.total > MOBILE_PREVIEW && (
                <button
                  type="button"
                  onClick={() => openDetail(def.key)}
                  style={{
                    marginTop: 12,
                    alignSelf: "flex-start",
                    fontSize: "var(--fs-label)",
                    fontWeight: 650,
                    color: "var(--brand)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  See all {s.total} →
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );

  const renderDetailView = () =>
    detailDef && (
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
          <div className="tw-flex tw-items-center tw-gap-[5px]">
            <Icon n={detailDef.icon} s={22} c={detailDef.color} />
            <h1
              style={{
                margin: 0,
                fontSize: "var(--fs-screen-title)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              {detailDef.title}
            </h1>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: 640,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {sections[detailDef.key].items.length === 0 && !isLoading ? (
            <div
              style={{
                width: "100%",
                padding: "30px 14px",
                textAlign: "center",
                background: "var(--surface)",
                border: "1px dashed var(--border-2)",
                borderRadius: "var(--r-md)",
              }}
            >
              <Icon n={detailDef.icon} s={34} c="var(--text-3)" />
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "var(--fs-title)",
                  marginTop: 6,
                  color: "var(--text)",
                }}
              >
                You&rsquo;re all caught up!
              </div>
              <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-3)" }}>
                {detailDef.emptyText}
              </div>
            </div>
          ) : (
            <>
              {renderRows(detailDef.key, "detail")}
              {sections[detailDef.key].loadingMore &&
                Array.from({ length: 3 }, (_, i) => (
                  <NotificationRowSkeleton key={`more-${i}`} size="detail" />
                ))}
            </>
          )}
        </div>
      </>
    );

  return (
    <div
      ref={scrollRef}
      onScroll={handlePageScroll}
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
            maxWidth: 1180,
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

export default Notifications;

