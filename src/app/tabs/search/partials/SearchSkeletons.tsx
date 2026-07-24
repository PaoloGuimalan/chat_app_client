import Skeleton from "react-loading-skeleton";
import { Card } from "@/reusables/design";

// Shimmer placeholders for the redesigned Search page - one per card kind,
// shapes matching the real cards so loading doesn't reflow the layout.

const SKELETON_COLORS = {
  baseColor: "var(--surface-3)",
  highlightColor: "var(--surface-hover)",
} as const;

export function PersonCardSkeleton({ rail }: { rail?: boolean }) {
  return (
    <Card
      pad={16}
      style={{
        width: rail ? 168 : "100%",
        flex: rail ? "none" : undefined,
        textAlign: "center",
      }}
    >
      <Skeleton circle height={56} width={56} {...SKELETON_COLORS} />
      <div style={{ marginTop: 10 }}>
        <Skeleton width="70%" height={14} {...SKELETON_COLORS} />
        <Skeleton width="45%" height={11} {...SKELETON_COLORS} />
      </div>
      <Skeleton
        height={30}
        {...SKELETON_COLORS}
        style={{ marginTop: 10, borderRadius: "var(--r-sm)" }}
      />
    </Card>
  );
}

export function RealmCardSkeleton({ rail }: { rail?: boolean }) {
  return (
    <Card
      pad={0}
      style={{
        width: rail ? 200 : "100%",
        flex: rail ? "none" : undefined,
        overflow: "hidden",
      }}
    >
      <Skeleton
        height={74}
        {...SKELETON_COLORS}
        style={{ display: "block", borderRadius: 0 }}
      />
      <div style={{ padding: "10px 12px" }}>
        <Skeleton width="75%" height={13} {...SKELETON_COLORS} />
        <Skeleton width="55%" height={11} {...SKELETON_COLORS} />
        <Skeleton
          height={28}
          {...SKELETON_COLORS}
          style={{ marginTop: 8, borderRadius: "var(--r-sm)" }}
        />
      </div>
    </Card>
  );
}

export function ContentCardSkeleton() {
  return (
    <Card pad={14} style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Skeleton circle height={30} width={30} {...SKELETON_COLORS} />
        <Skeleton width={120} height={12} {...SKELETON_COLORS} />
      </div>
      <Skeleton height={11} {...SKELETON_COLORS} />
      <Skeleton width="70%" height={11} {...SKELETON_COLORS} />
    </Card>
  );
}
