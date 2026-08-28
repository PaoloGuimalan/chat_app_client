/* eslint-disable react-hooks/exhaustive-deps */
import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import DOMPurify from "dompurify";
import { highlightHashtags } from "@/reusables/hooks/hashtags";

/**
 * Live #hashtag highlighting inside a plain <textarea>.
 *
 * WHY A MIRROR AND NOT A RICH EDITOR
 * ----------------------------------
 * A textarea cannot contain markup - its value is a string, and there is no
 * way to colour part of it. The alternative is a contenteditable, which means
 * owning caret placement, paste sanitising, undo history and IME composition
 * for every composer on the platform. That is a large amount of behaviour to
 * re-implement in exchange for colouring a word.
 *
 * So the textarea stays exactly what it was and keeps every native behaviour.
 * A div is painted BEHIND it holding the same text with the hashtags wrapped,
 * and the textarea's own text is made transparent so the div shows through.
 * The caret is kept visible with caret-color, which is the one part of a
 * transparent textarea that would otherwise disappear.
 *
 * WHY THE STYLES ARE COPIED AT RUNTIME
 * ------------------------------------
 * The mirror only lines up if it wraps text identically - same font, same
 * padding, same border width, same letter spacing. Hardcoding those would
 * mean duplicating the styling of every textarea this wraps, and silently
 * drifting the first time one of them is restyled. Reading the real computed
 * values from the textarea itself is the only version that cannot drift.
 *
 * The trailing newline in the mirror is deliberate: a value ending in "\n"
 * leaves a textarea scrolled one line further than a div renders, and the two
 * disagree by a line at the bottom without it.
 */

// Copied from the textarea onto the mirror. Anything affecting how text wraps
// or where it starts has to be here or the two drift apart mid-paragraph.
const MIRRORED_PROPERTIES = [
  "boxSizing",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontVariant",
  "letterSpacing",
  "wordSpacing",
  "lineHeight",
  "textIndent",
  "textTransform",
  "textAlign",
  "borderRadius",
] as const;

interface HashtagFieldProps {
  /** The textarea's current value. */
  value: string;
  /** The textarea itself. */
  children: ReactNode;
  /** Ref to the textarea being mirrored. */
  inputRef: RefObject<HTMLTextAreaElement | null>;
  className?: string;
}

function HashtagField({
  value,
  children,
  inputRef,
  className,
}: HashtagFieldProps) {
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState("");

  useEffect(() => {
    // Escaped by highlightHashtags, then sanitized - this is dangerouslySet
    // innerHTML over text the user is typing this instant.
    setHtml(DOMPurify.sanitize(highlightHashtags(value ?? "")));
  }, [value]);

  const syncStyles = useCallback(() => {
    const input = inputRef.current;
    const mirror = mirrorRef.current;
    if (!input || !mirror) return;

    const computed = window.getComputedStyle(input);
    for (const property of MIRRORED_PROPERTIES) {
      mirror.style[property] = computed[property];
    }

    // The mirror paints the field's background because the textarea's own is
    // made transparent to let it show through. The border stays on the
    // textarea, which is why the mirror's is transparent but still occupies
    // the same width - remove the width and the text shifts by a pixel.
    mirror.style.background = computed.backgroundColor;
    mirror.style.borderColor = "transparent";
    mirror.style.borderStyle = "solid";
  }, [inputRef]);

  // Layout effect, not effect: styles must be copied before the browser
  // paints, or the mirror is briefly visible at the wrong size.
  useLayoutEffect(() => {
    syncStyles();
  }, [syncStyles, html]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    // A textarea can be resized by the user and by its container. Both change
    // the wrap width, so both have to re-sync.
    const observer = new ResizeObserver(syncStyles);
    observer.observe(input);

    const onScroll = () => {
      const mirror = mirrorRef.current;
      if (mirror) {
        mirror.scrollTop = input.scrollTop;
        mirror.scrollLeft = input.scrollLeft;
      }
    };
    input.addEventListener("scroll", onScroll);

    return () => {
      observer.disconnect();
      input.removeEventListener("scroll", onScroll);
    };
  }, [inputRef, syncStyles]);

  return (
    <div className={`cl-hashtag-field ${className ?? ""}`}>
      <div
        ref={mirrorRef}
        className="cl-hashtag-field__mirror"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: `${html}\n` }}
      />
      {children}
    </div>
  );
}

export default HashtagField;
