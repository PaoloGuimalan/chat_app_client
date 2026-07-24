import Skeleton from "react-loading-skeleton";

// Shimmer placeholder matching NotificationRow's shape so paging doesn't
// reflow the columns / detail list.

const SKELETON_COLORS = {
  baseColor: "var(--surface-3)",
  highlightColor: "var(--surface-hover)",
} as const;

export function NotificationRowSkeleton({
  size = "column",
}: {
  size?: "column" | "detail";
}) {
  const isDetail = size === "detail";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: isDetail ? 12 : 10,
        padding: isDetail ? 13 : 9,
        borderRadius: isDetail ? "var(--r-md)" : "var(--r-sm)",
        background: "var(--surface)",
        border: isDetail ? "1px solid var(--border)" : "none",
        flex: "none",
      }}
    >
      <Skeleton
        circle
        height={isDetail ? 44 : 38}
        width={isDetail ? 44 : 38}
        {...SKELETON_COLORS}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton height={12} {...SKELETON_COLORS} />
        <Skeleton width="40%" height={10} {...SKELETON_COLORS} />
      </div>
    </div>
  );
}
