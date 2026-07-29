// @mention parsing, shared by anything that renders user-authored text.
//
// The mention IS the text - "@ana" is stored verbatim in a message's content
// or a comment's text, nothing travels alongside it, and highlighting happens
// here at render time. Three implementations have to agree on what counts as
// a mention, so keep them in step when touching this:
//
//   - server/reusables/hooks/transformers.js  extractMentionUsernames()
//   - user_service/newsfeed/services/comment_mentions.py  MENTION_PATTERN
//   - this file
//
// The leading (^|\s) is what stops "you@example.com" from mentioning
// @example. Note the class includes "." and is greedy, so "thanks @ana."
// captures "ana." - the trailing lookahead is already satisfied by
// end-of-string with the dot consumed. The Python side compensates by also
// trying the dot-stripped handle when it resolves who to notify; here it only
// means the highlight swallows the full stop, which is cosmetic.
const MENTION_SOURCE = /(^|\s)@([A-Za-z0-9._-]{1,30})(?=$|\s|[.,!?;:])/;

export const buildMentionRegex = () => new RegExp(MENTION_SOURCE.source, "g");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Handles written as "@handle", deduplicated and lowercased.
 *
 * Mirrors the server's extraction so the client can predict who a comment
 * will notify - used to avoid double-inserting a handle the text already has.
 */
export const extractMentionHandles = (text: string): string[] => {
  if (!text) return [];

  const matches = [...text.matchAll(buildMentionRegex())];
  return [...new Set(matches.map((match) => match[2].toLowerCase()))];
};

/**
 * Escaped HTML with every @mention wrapped for highlighting.
 *
 * Unlike the messenger - which can check a handle against the conversation's
 * member list before highlighting it - a comment has no membership to check
 * against, so every well-formed @token is highlighted. A handle that matches
 * nobody is styled but inert, which is the same deal the server gives it:
 * unresolvable mentions are simply text that notifies no one.
 *
 * Callers must sanitize the result (DOMPurify) before it reaches
 * dangerouslySetInnerHTML.
 */
export const highlightMentions = (
  text: string,
  className = "cl-message-mention",
): string =>
  escapeHtml(text).replace(
    buildMentionRegex(),
    (_match, prefix: string, handle: string) =>
      `${prefix}<span class="${className}">@${handle}</span>`,
  );
