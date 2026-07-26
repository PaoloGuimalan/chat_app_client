import Skeleton from "react-loading-skeleton";
import { Card } from "@/reusables/design";

// Shimmer placeholders shaped like NetworkRow / GroupTile so loading never
// reflows the grids or the rail.

const SKELETON_COLORS = {
  baseColor: "var(--surface-3)",
  highlightColor: "var(--surface-hover)",
} as const;

export function NetworkRowSkeleton() {
  return (
    <Card
      pad={10}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}
    >
      <Skeleton circle height={42} width={42} {...SKELETON_COLORS} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton width="60%" height={13} {...SKELETON_COLORS} />
        <Skeleton width="35%" height={11} {...SKELETON_COLORS} />
      </div>
      <Skeleton
        width={78}
        height={30}
        {...SKELETON_COLORS}
        style={{ borderRadius: "var(--r-sm)" }}
      />
    </Card>
  );
}

export function GroupTileSkeleton() {
  return (
    <div
      style={{
        flex: "none",
        width: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Skeleton
        height={60}
        width={60}
        {...SKELETON_COLORS}
        style={{ borderRadius: 18 }}
      />
      <Skeleton width={80} height={11} {...SKELETON_COLORS} />
    </div>
  );
}
