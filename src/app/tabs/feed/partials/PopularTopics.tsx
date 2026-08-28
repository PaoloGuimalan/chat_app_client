/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { Card, Icon } from "@/reusables/design";
import { Avatar } from "@/reusables/design/primitives2";
import { GetPopularTopicsRequest } from "@/reusables/hooks/requests";

export interface TopicFace {
  entity_id: string;
  name: string;
  /** Profile picture URL, or null when the participant has none. */
  profile: string | null;
  initials: string;
}

export interface PopularTopic {
  id: number;
  name: string;
  slug: string;
  category: string;
  score: number;
  posts: number;
  faces: TopicFace[];
}

// The category pill's colour. Derived from the CATEGORY rather than stored
// per-topic, so every topic under "Technology" is the same colour in every
// session without the backend having to remember which one it picked - and so
// the endpoint keeps returning taxonomy rather than hex values.
//
// The classes carry the actual colours (see .cl-topic-pill--N in styles.css)
// instead of inline vars, because each needs a different value per theme and a
// style attribute cannot express that.
const PILL_VARIANTS = 8;

/**
 * Stable hash of a string. Same value every render and every session, so a
 * category's colour does not change as the list reorders - which is what makes
 * it recognisable at a glance.
 */
const hash = (value: string): number => {
  let h = 0;
  for (let i = 0; i < value.length; i++)
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
};

const pillClassFor = (category: string) =>
  `cl-topic-pill cl-topic-pill--${hash(category) % PILL_VARIANTS}`;

const TOPIC_COUNT = 8;

function PopularTopics() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read off the path rather than useParams: this rail renders both inside
  // the /topics/:slug route and beside the feed at "/", and useParams only
  // sees the params of the route it is actually rendered under.
  const activeSlug = location.pathname.startsWith("/topics/")
    ? decodeURIComponent(
        location.pathname.slice("/topics/".length).split("/")[0],
      )
    : null;

  const [topics, setTopics] = useState<PopularTopic[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    GetPopularTopicsRequest({ limit: TOPIC_COUNT })
      .then((response: any) => {
        // Guarded against a late resolve after the feed has been left: setting
        // state on an unmounted component is a warning at best and a leak at
        // worst, and this request outlives a fast tab switch easily.
        if (cancelled) return;
        setTopics(Array.isArray(response?.data) ? response.data : []);
        setIsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        // A sidebar is not worth an error state. An empty topics list renders
        // as nothing at all, which is the correct outcome for a widget the
        // feed does not depend on.
        setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Renders nothing until there is something to show, rather than an empty
  // shell. A brand-new platform legitimately has no popular topics yet.
  if (isLoaded && topics.length === 0) return null;

  return (
    <aside
      className="cl-topics-widget"
      style={{
        width: 380,
        flex: "none",
        position: "sticky",
        top: 16,
        alignSelf: "flex-start",
      }}
    >
      <Card pad={14}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "var(--fs-body)",
              fontWeight: 750,
              letterSpacing: "-0.01em",
              color: "var(--text)",
            }}
          >
            Popular Topics
          </h3>
          <Icon n="local_fire_department" s={18} c="var(--text-3)" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {!isLoaded
            ? Array.from({ length: TOPIC_COUNT }, (_, i) => (
                <TopicSkeleton key={i} />
              ))
            : topics.map((topic) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  isActive={topic.slug === activeSlug}
                  // The slug, not the name: it is the interest's normalized
                  // key, which is what the topic endpoint resolves on and
                  // what a hashtag normalises to - so "#NorthEdsa" typed in a
                  // caption and this row lead to the same page.
                  onOpen={() => navigate(`/topics/${topic.slug}`)}
                />
              ))}
        </div>
      </Card>
    </aside>
  );
}

function TopicRow({
  topic,
  isActive,
  onOpen,
}: {
  topic: PopularTopic;
  isActive: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      className="cl-rowbtn"
      onClick={onOpen}
      aria-current={isActive ? "true" : undefined}
      // The count is not shown - it is a number the reader cannot act on and
      // it crowded the row - but it stays in the payload and surfaces here,
      // where hovering answers "how popular is popular".
      title={`#${topic.slug} - ${topic.posts} ${
        topic.posts === 1 ? "post" : "posts"
      }`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: 8,
        border: "none",
        borderRadius: "var(--r-sm)",
        cursor: "pointer",
        // Marks the topic currently being viewed, so the rail doubles as a
        // position indicator once it persists into the topic page.
        background: isActive ? "var(--brand-soft)" : "transparent",
      }}
    >
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          minWidth: 0,
          flex: 1,
        }}
      >
        <span
          style={{
            fontSize: "var(--fs-title)",
            fontWeight: 700,
            color: isActive ? "var(--brand)" : "var(--text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          #{topic.slug}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={pillClassFor(topic.category)}>{topic.category}</span>
        </span>
      </span>

      <span style={{ display: "flex", alignItems: "center", flex: "none" }}>
        {topic.faces.map((face) => (
          <Avatar
            key={face.entity_id}
            className="cl-topic-face"
            id={face.entity_id}
            name={face.name}
            // Avatar falls back to a gradient with initials when this is
            // absent AND when the image fails to load, so a dead URL degrades
            // to the same thing as no URL rather than a broken image.
            src={face.profile ?? undefined}
            size={22}
          />
        ))}
      </span>

      <Icon
        n="chevron_right"
        s={18}
        c="var(--text-3)"
        style={{ flex: "none" }}
      />
    </button>
  );
}

// Shaped like TopicRow to the PIXEL, because a loader that is a different
// size than what replaces it makes the whole list jump when the data lands.
// The real row measures 57px: 8 padding + a 16px title + a 5px gap + a 20px
// pill + 8 padding. Every number below is that row's, read off the rendered
// element rather than guessed - see the same values on TopicRow.
//
// react-loading-skeleton is the house shimmer, but its spans are inline by
// default and inherit the surrounding line-height, which inflated each row to
// 95px. Fixing the container's line-height and giving every piece an explicit
// pixel height is what holds the two in agreement.
const SKELETON_COLORS = {
  baseColor: "var(--surface-3)",
  highlightColor: "var(--surface-hover)",
} as const;

const ROW_PADDING = 8;
const TITLE_HEIGHT = 16;
const PILL_HEIGHT = 20;
const COLUMN_GAP = 5;
const FACE_SIZE = 22;
const CHEVRON_WIDTH = 18;

function TopicSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: ROW_PADDING,
      }}
    >
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          gap: COLUMN_GAP,
          minWidth: 0,
          flex: 1,
          // Without this the skeleton spans inherit the card's line-height and
          // each one occupies more space than the height it was given.
          lineHeight: 1,
        }}
      >
        <Skeleton
          height={TITLE_HEIGHT}
          width="55%"
          borderRadius={4}
          containerClassName="cl-topic-skeleton-line"
          {...SKELETON_COLORS}
        />
        <Skeleton
          height={PILL_HEIGHT}
          width={84}
          borderRadius={999}
          containerClassName="cl-topic-skeleton-line"
          {...SKELETON_COLORS}
        />
      </span>

      <span
        style={{
          display: "flex",
          alignItems: "center",
          flex: "none",
          lineHeight: 1,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ marginLeft: -6, display: "flex", lineHeight: 1 }}
          >
            <Skeleton
              circle
              height={FACE_SIZE}
              width={FACE_SIZE}
              containerClassName="cl-topic-skeleton-line"
              {...SKELETON_COLORS}
            />
          </span>
        ))}
      </span>

      {/* Holds the chevron's width so rows do not shift sideways on load. */}
      <span style={{ width: CHEVRON_WIDTH, flex: "none" }} />
    </div>
  );
}

export default PopularTopics;
