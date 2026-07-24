// Shared bits for the redesigned Search page cards (mockup: "ChatterLoop
// Upgrade" / Search Page.dc.html). Gradients are hashed off the entity id so
// a given realm always gets the same banner, matching the mockup's GRADS.

export const GRADS: [string, string][] = [
  ["var(--brand)", "#5aa9ff"],
  ["#20bd7c", "#5be0a8"],
  ["#e69500", "#ffc24d"],
  ["#ff5b6b", "#ff97a1"],
  ["#8b5cf6", "#b794ff"],
  ["#0ea5b7", "#4fd6e6"],
];

export function gradFor(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}

export function compactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
}

export const REALM_TYPE_LABEL: Record<string, string> = {
  page: "Page",
  server: "Server",
  group: "Group chat",
};

export const REALM_TYPE_ICON: Record<string, string> = {
  page: "campaign",
  server: "bolt",
  group: "groups",
};

export function realmReachLabel(realm: {
  realm_type: string;
  members_count: number;
  followers_count: number;
}): string {
  if (realm.realm_type === "page") {
    return `${compactCount(realm.followers_count)} follower${
      realm.followers_count === 1 ? "" : "s"
    }`;
  }
  return `${compactCount(realm.members_count)} member${
    realm.members_count === 1 ? "" : "s"
  }`;
}
