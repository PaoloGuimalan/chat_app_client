import {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

// #hashtag parsing, shared by anything that renders or composes user text.
//
// The hashtag IS the text - "#hiking" is stored verbatim in a caption or a
// comment, nothing travels alongside it, and highlighting happens here at
// render time. Same arrangement as mentions.ts, and the same hazard: FOUR
// implementations have to agree on what counts as a hashtag, because the
// backends turn them into permanent rows in interests_interest.
//
//   - moderation_service/core/vocabulary.py       hashtags()   <- canonical
//   - user_service/interests/services/hashtags.py extract_hashtags()
//   - server/reusables/hooks/hashtags.js          extractHashtags()
//   - this file
//
// Disagreement here is only cosmetic - the client highlights something the
// server will not save, or fails to highlight something it will - but that is
// exactly the mismatch a user notices and reports as a bug.

// Unicode classes rather than \w, and this is not pedantry: Python's \w
// matches accented letters and JavaScript's does not, so "#café" would be
// highlighted by one side and saved by the other. \p{L}\p{N} is what makes
// them agree, and the "u" flag is required for it to mean anything.
//
// The lookbehind excludes an HTML numeric entity. This platform stores
// authored text escaped, so "didn&#039;t" contains "#039", which a bare
// "#\w+" matched well enough to be saved as a declared interest. A "#"
// preceded by "&" is punctuation. Excluding a preceding word character also
// rules out a URL fragment - "example.com/page#section" is an address, not
// something anybody tagged, and it is why highlighting can run before or
// after linkification without corrupting a link.
const HASHTAG_SOURCE = /(?<![&\p{L}\p{N}_])#([\p{L}\p{N}_-]{2,50})/u;

const SEPARATOR_RUN = /[-_]+/g;
const WHITESPACE_RUN = /\s+/g;
const HAS_LETTER = /\p{L}/u;

export const buildHashtagRegex = () => new RegExp(HASHTAG_SOURCE.source, "gu");

/** The readable form stored in interests_interest.name - spaces kept. */
export const displayName = (value: string): string =>
  (value ?? "").trim().replace(WHITESPACE_RUN, " ");

/**
 * The key form stored in interests_interest.normalized_name - spaces removed
 * entirely, lowercased. Mirrors user_service normalize_key() exactly, and is
 * what the Popular Topics widget returns as a topic's `slug`.
 */
export const normalizeKey = (value: string): string =>
  displayName(value).replace(WHITESPACE_RUN, "").toLowerCase();

/**
 * Readable interest names for every hashtag in `text`, in order, deduplicated.
 *
 * "#north-edsa" gives "north edsa" - the readable form, not the squashed key,
 * because that is the name the backends will store if the tag is new. Use it
 * to show the author which interests their post is about to be filed under.
 */
export const extractHashtags = (text: string): string[] => {
  if (!text) return [];

  const seen = new Set<string>();
  const names: string[] = [];

  for (const match of text.matchAll(buildHashtagRegex())) {
    const raw = match[1];

    // At least one letter. "#2024" is a year and "#1" is a rank; neither is an
    // interest, and the taxonomy should not grow one.
    if (!HAS_LETTER.test(raw)) continue;

    const readable = displayName(raw.replace(SEPARATOR_RUN, " "));
    const key = normalizeKey(readable);
    if (key && !seen.has(key)) {
      seen.add(key);
      names.push(readable);
    }
  }

  return names;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Escaped HTML with every #hashtag wrapped for highlighting.
 *
 * NOTE the interaction with escaping. escapeHtml turns "&" into "&amp;", so a
 * literal "&#039;" in the source becomes "&amp;#039;" here - and the pattern's
 * lookbehind still sees an "&" immediately before the "#", so the entity stays
 * unhighlighted either way. That is why this is safe to run on raw text.
 *
 * The data-hashtag attribute carries the NORMALIZED key rather than the shown
 * text, so a click handler can route to the topic without re-deriving it and
 * getting a different answer than the server did.
 *
 * Callers must sanitize the result (DOMPurify) before it reaches
 * dangerouslySetInnerHTML. DOMPurify keeps data-* attributes on spans by
 * default, so the key survives sanitisation.
 */
export const highlightHashtags = (
  text: string,
  className = "cl-hashtag",
): string =>
  escapeHtml(text).replace(
    buildHashtagRegex(),
    (match: string, raw: string) => {
      if (!HAS_LETTER.test(raw)) return match;
      const key = normalizeKey(raw.replace(SEPARATOR_RUN, " "));
      return `<span class="${className}" data-hashtag="${key}" role="link" tabindex="0">#${raw}</span>`;
    },
  );

/**
 * Same highlighting, for text that has ALREADY been escaped by an earlier
 * step in a render chain (highlightMentions escapes, then returns markup).
 *
 * Running highlightHashtags on that output would escape the "<span>" the
 * mention pass just produced. This variant skips escaping and, critically,
 * skips anything already inside a tag - without that, a hashtag sitting in an
 * href or a class attribute would be wrapped in a span inside an attribute
 * value and destroy the markup.
 */
export const highlightHashtagsInMarkup = (
  markup: string,
  className = "cl-hashtag",
): string =>
  // Split on tags, keeping them, and only transform the text between them.
  markup
    .split(/(<[^>]*>)/g)
    .map((chunk) =>
      chunk.startsWith("<")
        ? chunk
        : chunk.replace(buildHashtagRegex(), (match: string, raw: string) => {
            if (!HAS_LETTER.test(raw)) return match;
            const key = normalizeKey(raw.replace(SEPARATOR_RUN, " "));
            return `<span class="${className}" data-hashtag="${key}" role="link" tabindex="0">#${raw}</span>`;
          }),
    )
    .join("");

/**
 * Click/keyboard handling for the spans the two highlighters emit.
 *
 * Returned as handlers to spread onto the CONTAINER, not onto each tag: the
 * tags live inside dangerouslySetInnerHTML, so there is no React element to
 * attach to. One delegated listener per block of text also beats one per
 * hashtag in a caption that has a dozen of them.
 *
 * The key is read from data-hashtag rather than from the visible text. The two
 * differ - "#North-Edsa" displays as typed but keys to "northedsa" - and the
 * key is what the topic endpoint resolves on, so re-deriving it here would be
 * a fifth implementation of a rule that already has enough.
 *
 * Propagation is stopped because authored text sits inside cards and rows with
 * their own click behaviour; opening a topic should not also open the post
 * that mentioned it.
 */
export const useHashtagNavigation = () => {
  const navigate = useNavigate();

  const open = useCallback(
    (
      target: EventTarget | null,
      event: { preventDefault(): void; stopPropagation(): void },
    ) => {
      const element = (target as HTMLElement | null)?.closest?.(
        "[data-hashtag]",
      );
      const key = element?.getAttribute("data-hashtag");
      if (!key) return;

      event.preventDefault();
      event.stopPropagation();
      navigate(`/topics/${encodeURIComponent(key)}`);
    },
    [navigate],
  );

  return {
    onClick: (event: ReactMouseEvent) => open(event.target, event),
    // Enter and Space, because the spans carry role="link" and tabindex="0" -
    // something focusable that cannot be activated from the keyboard is worse
    // than something that was never focusable at all.
    onKeyDown: (event: ReactKeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      open(event.target, event);
    },
  };
};
