/** Community realms share the same top-level profile routes as users/pages. */
export function communityProfilePath(community: { slug?: string | null; realm_id: string }): string {
  return `/${encodeURIComponent(community.slug || community.realm_id)}`;
}
