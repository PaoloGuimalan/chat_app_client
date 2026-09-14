/**
 * A message stripped to one readable line.
 *
 * For the places a message is QUOTED rather than shown - the strip above the
 * composer, and the quoted bubble on a reply - where the box is a couple of
 * clipped lines and a heading or a code fence reads as debris.
 *
 * IN ITS OWN MODULE, NOT ALONGSIDE `MessageContent`
 * -------------------------------------------------
 * A file that exports both a component and a plain function breaks React Fast
 * Refresh for that component: the bundler can no longer tell whether an edit
 * touched rendering or module state, so it falls back to a full reload. The
 * lint rule that says so is `react-refresh/only-export-components`, and this
 * project runs eslint with `--max-warnings 0`, so it is an error here rather
 * than advice.
 *
 * It also replaced a `dangerouslySetInnerHTML` that was handed message content
 * with no escaping anywhere in its path - the one genuine injection point in
 * this flow. Replying to a message containing `<img src=x onerror=...>` ran it
 * in your own session, and the sender only had to be someone who could message
 * you.
 */
export function messagePreviewText(content?: string) {
  if (!content?.trim()) return "";
  return content
    .replace(/```[\s\S]*?```/g, " code ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/(\*\*|__|~~)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
