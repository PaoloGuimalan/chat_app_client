import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { IoDocumentOutline, IoPlay } from "react-icons/io5";
import {
  ConversationFileItem,
  ConversationFileKind,
} from "@/reusables/vars/interfaces";
import { ConversationFilesRequest } from "@/reusables/hooks/requests";
import { timeSince } from "@/reusables/hooks/reusable";
import FullscreenImageViewer from "@/app/reusables/FullscreenImageViewer";
import { FullscreenVideoViewer } from "@/app/reusables/VideoPlayer";
import VoiceMessagePlayer from "@/app/tabs/messenger/partials/VoiceMessagePlayer";
import {
  fileMessageName,
  fileMessageUrl,
} from "@/app/tabs/messenger/partials/fileMessage";

/**
 * The conversation info modal's shared files: Photos / Videos / Audio / Files.
 *
 * Paged from /m/conversationfiles, ONE tab at a time - a tab is fetched the
 * first time it is opened, then a page more each time its end scrolls near.
 * Nothing is fetched until the modal is open; that list used to ride along on
 * every /conversationinfo call, whole.
 *
 * Each tab keeps what it has loaded while the modal stays open, so switching
 * back and forth costs nothing. Closing the modal drops it all.
 */

interface FilesTab {
  kind: ConversationFileKind;
  label: string;
  /** A grid of square thumbnails, rather than a list of rows. */
  grid: boolean;
  empty: string;
}

const TABS: FilesTab[] = [
  { kind: "image", label: "Photos", grid: true, empty: "No photos yet" },
  { kind: "video", label: "Videos", grid: true, empty: "No videos yet" },
  { kind: "audio", label: "Audio", grid: false, empty: "No audio yet" },
  { kind: "file", label: "Files", grid: false, empty: "No files yet" },
];

// A grid page is three columns' worth of whole rows.
const GRID_PAGE = 30;
const LIST_PAGE = 20;

interface TabState {
  items: ConversationFileItem[];
  nextCursor: string | null;
  /** At least one page has come back. */
  loaded: boolean;
  loading: boolean;
  failed: boolean;
}

const EMPTY_TAB: TabState = {
  items: [],
  nextCursor: null,
  loaded: false,
  loading: false,
  failed: false,
};

const freshTabs = (): Record<ConversationFileKind, TabState> => ({
  image: EMPTY_TAB,
  video: EMPTY_TAB,
  audio: EMPTY_TAB,
  file: EMPTY_TAB,
});

type OpenViewer =
  | { kind: "image"; src: string }
  | { kind: "video"; src: string; ratio: number }
  | null;

const VIDEO_FALLBACK_RATIO = 16 / 9;

/**
 * An Audio-tab clip's look: a tint of the brand rather than a surface step.
 * The player's own received-bubble surface is the modal's colour exactly, and
 * in the light theme --surface-2 is within a shade of it too - either one
 * disappeared into the panel. The tint reads as its own thing in both themes,
 * and the waveform's grey track stays legible on it. Same corners as a Files
 * row, and flat, like one.
 */
const AUDIO_ROW_STYLE: CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--brand) 9%, var(--surface))",
  border: "1px solid color-mix(in srgb, var(--brand) 24%, var(--border))",
  borderRadius: "var(--r-sm)",
  boxShadow: "none",
};

/** Local calendar day, so a group is a day where the reader is. */
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/** "Today", "Yesterday", else "Jul 16, 2026". */
const dayLabel = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return "Today";
  if (dayKey(date) === dayKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface DayGroup {
  key: string;
  label: string;
  items: ConversationFileItem[];
}

/**
 * Consecutive items of one day, in the order they came. The list is newest
 * first, so each day is one run - and a page that ends mid-day just carries
 * on into the same group when the next one lands.
 */
const groupByDay = (items: ConversationFileItem[]): DayGroup[] => {
  const groups: DayGroup[] = [];
  for (const item of items) {
    const date = item.sentAt ? new Date(item.sentAt) : null;
    const valid = date && !isNaN(date.getTime());
    const key = valid ? dayKey(date) : "undated";
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, label: valid ? dayLabel(date) : "Earlier", items: [item] });
    }
  }
  return groups;
};

interface ConversationFilesPanelProps {
  conversationID: string;
  conversationType: string;
}

function ConversationFilesPanel({
  conversationID,
  conversationType,
}: ConversationFilesPanelProps) {
  const [active, setActive] = useState<ConversationFileKind>("image");
  const [tabs, setTabs] = useState(freshTabs);
  const [viewer, setViewer] = useState<OpenViewer>(null);

  // Read by loadPage without re-creating it on every page that lands.
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  // A second scroll event can arrive before the first request's setState has
  // rendered - this, not tab state, is what stops a duplicate page request.
  const inFlight = useRef<Set<ConversationFileKind>>(new Set());
  // Bumped when the conversation changes, so a page still on its way for the
  // previous one is dropped instead of landing in this one's tabs.
  const generation = useRef(0);

  useEffect(() => {
    generation.current += 1;
    inFlight.current.clear();
    setTabs(freshTabs());
    setViewer(null);
  }, [conversationID, conversationType]);

  const patchTab = (
    kind: ConversationFileKind,
    patch: (tab: TabState) => Partial<TabState>,
  ) => {
    setTabs((current) => ({
      ...current,
      [kind]: { ...current[kind], ...patch(current[kind]) },
    }));
  };

  const loadPage = useCallback(
    (kind: ConversationFileKind) => {
      const tab = tabsRef.current[kind];
      if (inFlight.current.has(kind)) return;
      if (tab.loaded && !tab.nextCursor) return;

      inFlight.current.add(kind);
      const requestGeneration = generation.current;
      patchTab(kind, () => ({ loading: true, failed: false }));

      ConversationFilesRequest({
        conversationID,
        type: conversationType,
        kinds: [kind],
        cursor: tab.nextCursor,
        limit: kind === "image" || kind === "video" ? GRID_PAGE : LIST_PAGE,
      })
        .then((page) => {
          if (requestGeneration !== generation.current) return;
          patchTab(kind, (current) => {
            // Keyset paging cannot repeat a row, but a retried page after a
            // dropped response could - keyed rendering needs them unique.
            const seen = new Set(current.items.map((item) => item.messageID));
            return {
              items: [
                ...current.items,
                ...page.items.filter((item) => !seen.has(item.messageID)),
              ],
              nextCursor: page.nextCursor,
              loaded: true,
              loading: false,
            };
          });
        })
        .catch(() => {
          if (requestGeneration !== generation.current) return;
          patchTab(kind, () => ({ loading: false, failed: true }));
        })
        .finally(() => {
          if (requestGeneration === generation.current) {
            inFlight.current.delete(kind);
          }
        });
    },
    [conversationID, conversationType],
  );

  const current = tabs[active];

  // First open of a tab - and again after a conversation change empties it.
  // Keyed on the tab's own state rather than on the conversation, because the
  // reset above only lands on the NEXT render.
  useEffect(() => {
    if (!current.loaded && !current.loading && !current.failed) {
      loadPage(active);
    }
  }, [active, current.loaded, current.loading, current.failed, loadPage]);

  // Infinite loading. The sentinel sits a little ABOVE the end of the list
  // (see its style), so the next page is asked for before the end shows.
  //
  // Observed against the viewport rather than a scroll container: the modal
  // scrolls as one column on a narrow screen and per column on a wide one, and
  // an intersection is clipped by whichever of them is scrolling either way.
  //
  // Re-subscribed whenever the tab's length changes, because an observer only
  // reports CHANGES - a sentinel still on screen after a page lands (a short
  // page, a tall window) would otherwise never ask for the next one. The
  // initial report of a fresh observer is what keeps filling until it is off
  // screen.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !current.loaded || !current.nextCursor) return;
    if (current.loading || current.failed) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadPage(active);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    active,
    current.items.length,
    current.loaded,
    current.loading,
    current.failed,
    current.nextCursor,
    loadPage,
  ]);

  const activeTab = TABS.find((tab) => tab.kind === active) || TABS[0];
  const initialLoading = !current.loaded && !current.failed;
  const loadingMore = current.loaded && current.loading;

  const openVideo = (src: string, thumb: HTMLVideoElement | null) => {
    setViewer({
      kind: "video",
      src,
      ratio:
        thumb && thumb.videoWidth > 0 && thumb.videoHeight > 0
          ? thumb.videoWidth / thumb.videoHeight
          : VIDEO_FALLBACK_RATIO,
    });
  };

  const renderItem = (item: ConversationFileItem) => {
    const url = fileMessageUrl(item.content);
    const sent = item.sentAt ? timeSince(item.sentAt) : "";

    switch (item.kind) {
      case "image":
        return (
          <button
            key={item.messageID}
            type="button"
            className="cl-conversation-files__tile"
            aria-label="Open photo"
            title={sent}
            onClick={() => setViewer({ kind: "image", src: url })}
          >
            {/* A plain lazy <img>, not CachedImage: a page is 30 tiles, and
                CachedImage's error fallback is the default PROFILE picture. */}
            <img src={url} alt="" loading="lazy" decoding="async" />
          </button>
        );
      case "video":
        return (
          <button
            key={item.messageID}
            type="button"
            className="cl-conversation-files__tile"
            aria-label="Play video"
            title={sent}
            onClick={(event) =>
              openVideo(url, event.currentTarget.querySelector("video"))
            }
          >
            {/* A still, not a player: #t picks a frame to show, which a
                bare preload="metadata" leaves black in some browsers. */}
            <video src={`${url}#t=0.1`} preload="metadata" muted playsInline />
            <span className="cl-conversation-files__play" aria-hidden="true">
              <IoPlay size={18} />
            </span>
          </button>
        );
      case "audio":
        // No date of its own: its day group's label says it once for all of
        // them. The exact time is still a hover away.
        return (
          <div
            key={item.messageID}
            className="cl-conversation-files__audio"
            title={
              item.sentAt
                ? new Date(item.sentAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : undefined
            }
          >
            <VoiceMessagePlayer
              src={url}
              isSender={false}
              accentColor="var(--brand)"
              fullWidth
              style={AUDIO_ROW_STYLE}
            />
          </div>
        );
      default:
        return (
          <button
            key={item.messageID}
            type="button"
            className="cl-conversation-files__row"
            onClick={() => window.open(url, "_blank", "noopener")}
          >
            <span className="cl-conversation-files__file-icon">
              <IoDocumentOutline size={20} />
            </span>
            <span className="tw-flex tw-flex-col tw-min-w-0 tw-flex-1">
              <span className="cl-text-title cl-conversation-files__name">
                {fileMessageName(item.content)}
              </span>
              {sent && (
                <span className="cl-text-caption cl-conversation-files__meta">
                  {sent}
                </span>
              )}
            </span>
          </button>
        );
    }
  };

  const renderSkeletons = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      active === "audio" ? (
        <span
          key={`skeleton-${i}`}
          className="cl-conversation-files__skeleton cl-conversation-files__skeleton--audio"
        />
      ) : activeTab.grid ? (
        <span
          key={`skeleton-${i}`}
          className="cl-conversation-files__skeleton cl-conversation-files__skeleton--tile"
        />
      ) : (
        <span
          key={`skeleton-${i}`}
          className="cl-conversation-files__skeleton-row"
          aria-hidden="true"
        >
          <span className="cl-conversation-files__skeleton cl-conversation-files__skeleton--icon" />
          <span className="tw-flex tw-flex-col tw-flex-1 tw-gap-[6px]">
            <span className="cl-conversation-files__skeleton cl-conversation-files__skeleton--line" />
            <span className="cl-conversation-files__skeleton cl-conversation-files__skeleton--line-short" />
          </span>
        </span>
      ),
    );

  return (
    <div className="cl-conversation-files">
      <div className="cl-conversation-files__tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            role="tab"
            aria-selected={active === tab.kind}
            className="cl-conversation-files__tab cl-text-label"
            onClick={() => setActive(tab.kind)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="cl-conversation-files__body" role="tabpanel">
        {current.loaded && current.items.length === 0 && !current.loading ? (
          <div className="cl-conversation-files__empty">
            <span className="cl-text-title">{activeTab.empty}</span>
            <span className="cl-text-caption">
              What's shared in this conversation shows up here.
            </span>
          </div>
        ) : !current.loaded && current.failed ? (
          <div className="cl-conversation-files__empty">
            <span className="cl-text-title">Couldn't load this tab</span>
            <button
              type="button"
              className="cl-conversation-files__retry cl-text-label"
              onClick={() => loadPage(active)}
            >
              Try again
            </button>
          </div>
        ) : active === "audio" ? (
          // Grouped by day: one label per day over that day's clips, which
          // sit side by side when there's room, and a wider gap between days.
          <div className="cl-conversation-files__days" aria-busy={current.loading}>
            {groupByDay(current.items).map((group) => (
              <section
                key={group.key}
                className="cl-conversation-files__day"
                aria-label={group.label}
              >
                <span className="cl-conversation-files__day-label cl-text-caption">
                  {group.label}
                </span>
                <div className="cl-conversation-files__day-items">
                  {group.items.map(renderItem)}
                </div>
              </section>
            ))}
            {(initialLoading || loadingMore) && (
              <div className="cl-conversation-files__day" aria-hidden="true">
                {initialLoading && (
                  <span className="cl-conversation-files__skeleton cl-conversation-files__skeleton--day-label" />
                )}
                <div className="cl-conversation-files__day-items">
                  {renderSkeletons(initialLoading ? 4 : 2)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              activeTab.grid
                ? "cl-conversation-files__grid"
                : "cl-conversation-files__list"
            }
            aria-busy={current.loading}
          >
            {current.items.map(renderItem)}
            {initialLoading && renderSkeletons(activeTab.grid ? 12 : 5)}
            {loadingMore && renderSkeletons(activeTab.grid ? 6 : 2)}
          </div>
        )}

        {current.loaded && current.failed && (
          <div className="cl-conversation-files__more-failed cl-text-caption">
            Couldn't load more.
            <button
              type="button"
              className="cl-conversation-files__retry cl-text-label"
              onClick={() => loadPage(active)}
            >
              Try again
            </button>
          </div>
        )}

        {current.nextCursor && (
          <div ref={sentinelRef} className="cl-conversation-files__sentinel" />
        )}
      </div>

      {viewer?.kind === "image" && (
        <FullscreenImageViewer src={viewer.src} onClose={() => setViewer(null)} />
      )}
      {viewer?.kind === "video" && (
        <FullscreenVideoViewer
          src={viewer.src}
          initial={{ time: 0, playing: true, muted: false }}
          ratio={viewer.ratio}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}

export default ConversationFilesPanel;
