import { RefObject, UIEvent, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Scrolling for a chat thread drawn `column-reverse`: newest first in the DOM,
 * scrollTop 0 at the bottom and negative going back in time.
 *
 * WHY THE HOLD-THEN-GLIDE
 * -----------------------
 * A column-reverse scroller pins its bottom: at scrollTop 0, anything added
 * under the newest message is simply THERE on the next paint, and everything
 * above it jumps up by its height. NeonRemote's chat slides instead, because
 * its scroller runs top-down - a new message lands below the fold and a
 * smooth `scrollIntoView` brings it up. To get that here, `follow` measures
 * how much more thread sits under the newest message than at the last look;
 * if it grew while the reader is following, it scrolls UP by exactly that
 * much (so the frame paints the view the reader already had, the new content
 * still below the edge) and then glides to the bottom anchor. Both happen
 * before paint - from a layout effect, or a ResizeObserver callback - so the
 * jump is never seen.
 *
 * Column-reverse itself stays: it is what keeps the view still while older
 * pages load in above, and what opens a thread at its bottom with no scroll.
 *
 * WHAT IT NEEDS FROM THE THREAD
 * -----------------------------
 * - `anchorRef` on an empty `.cl-thread-bottom-anchor` as the scroller's
 *   FIRST child: the bottom edge, as an element.
 * - `data-message-id` on every loaded message's root, so the newest one can be
 *   found (pending sends, the typing bubble and receipts carry none - they are
 *   what appears UNDER it).
 * - `onScroll` on the scroller.
 */

/** How close to the bottom still counts as "reading the newest". */
const FOLLOW_DISTANCE = 100;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function useThreadScroll(scrollerRef: RefObject<HTMLElement>) {
  const anchorRef = useRef<HTMLElement | null>(null);

  // Whether new content should pull the view down. A ref, not state: as
  // state, every flip re-ran the scroll effect and snapped the thread to the
  // bottom under the reader's hand.
  const followingRef = useRef<boolean>(true);
  // A glide this hook started is still travelling. While it is, the reader
  // counts as following even past FOLLOW_DISTANCE - a message landing
  // mid-glide is caught - until they scroll against it.
  const glidingRef = useRef<boolean>(false);
  // Distance from the bottom at the last scroll event, to tell scrolling
  // away from the bottom from travelling back to it.
  const lastAwayRef = useRef<number>(0);
  // The newest message as last measured: how much thread sat under its top
  // edge (scroll-independent - both edges move together), and where it was
  // on screen (kept current by onScroll too).
  const markerRef = useRef<{
    el: Element;
    below: number;
    screenTop: number;
  } | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const observedRef = useRef<Set<Element>>(new Set());

  // Whether the reader has scrolled far enough back that returning by hand
  // is a chore - a screenful, not FOLLOW_DISTANCE.
  const [showJumpToBottom, setShowJumpToBottom] = useState<boolean>(false);

  const glide = () => {
    glidingRef.current = true;
    // `nearest` so an ancestor only scrolls if the thread's bottom is out of
    // ITS view; `end` would also pull a scrollable page around.
    anchorRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  };

  const belowOf = (anchor: Element, el: Element) =>
    anchor.getBoundingClientRect().top - el.getBoundingClientRect().top;

  const screenTopOf = (scroller: Element, el: Element) =>
    el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;

  /**
   * The thread SHRANK under the newest message - a pending send replaced by
   * its slightly shorter sent copy, the typing bubble going - and everything
   * above dropped by `px`. Scrolling cannot hold that (the bottom is as far
   * as it goes), so the anchor takes the height for a frame, which puts the
   * view back, and then eases to nothing.
   */
  const collapse = (px: number) => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const start = anchor.getBoundingClientRect().height + px;
    anchor.style.transition = "none";
    anchor.style.height = `${start}px`;
    // Lay the start height out before the transition is armed, or the
    // browser animates from wherever it last painted.
    anchor.getBoundingClientRect();
    anchor.style.transition = prefersReducedMotion()
      ? "none"
      : "height 220ms ease-out";
    anchor.style.height = "0px";
  };

  /**
   * Everything that can grow under the newest message, observed so a size
   * change between commits (an image or a voice note loading, a link card
   * filling in) is followed the same way a new message is. Re-observed only
   * when the set changes: observing fires an initial notification, which
   * calls back into `follow`, which would otherwise observe again forever.
   */
  const observeBottom = (scroller: Element, marker: Element | null) => {
    const observer = observerRef.current;
    if (!observer) return;
    const next = new Set<Element>();
    for (const child of Array.from(scroller.children)) {
      next.add(child);
      if (child === marker) break;
    }
    // No newest message: nothing loaded yet - leave it to the next commit.
    if (!marker) next.clear();
    observedRef.current.forEach((el) => {
      if (!next.has(el)) observer.unobserve(el);
    });
    next.forEach((el) => {
      if (!observedRef.current.has(el)) observer.observe(el);
    });
    observedRef.current = next;
  };

  /**
   * Holds and glides if the thread grew under the newest message while the
   * reader is following; otherwise only re-measures. Safe to call any time -
   * after a commit, from a media `onLoad` - and takes no arguments, so it can
   * be passed straight to one.
   */
  const follow = () => {
    const scroller = scrollerRef.current;
    const anchor = anchorRef.current;
    if (!scroller || !anchor) {
      markerRef.current = null;
      return;
    }

    const previous = markerRef.current;
    if (previous && previous.el.isConnected && followingRef.current) {
      const grew = belowOf(anchor, previous.el) - previous.below;
      // How far the change actually moved what the reader was looking at.
      // NOT always `grew`: off the very bottom, Chrome's scroll anchoring
      // already holds the view still on its own (Safari has none), and
      // holding by `grew` on top of that threw the thread down before the
      // glide. Measured, it is right in every browser.
      const moved = screenTopOf(scroller, previous.el) - previous.screenTop;
      if (grew > 0.5) {
        if (moved < -0.5) scroller.scrollTop += moved;
        // The glide's own scroll events then read as travelling back.
        lastAwayRef.current = -scroller.scrollTop;
        glide();
      } else if (grew < -0.5 && moved > 0.5) {
        collapse(moved);
      }
    }

    const marker = scroller.querySelector("[data-message-id]");
    markerRef.current = marker
      ? {
          el: marker,
          below: belowOf(anchor, marker),
          screenTop: screenTopOf(scroller, marker),
        }
      : null;
    observeBottom(scroller, marker);
  };

  // Every commit of the thread. Before paint, which is the point.
  useLayoutEffect(follow);

  // The observer outlives renders; it calls whichever `follow` is current.
  const followRef = useRef(follow);
  followRef.current = follow;

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    // ResizeObserver delivers after layout and before paint, same as the
    // layout effect - a growing image is held and glided without a frame
    // of it jumping first.
    const observer = new ResizeObserver(() => followRef.current());
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      observerRef.current = null;
      observedRef.current = new Set();
    };
  }, []);

  const onScroll = (e: UIEvent<HTMLElement>) => {
    const scroller = e.currentTarget;
    const away = -scroller.scrollTop;
    const movingAway = away > lastAwayRef.current + 0.5;

    // Scrolling moves the newest message on screen without anything having
    // changed; `follow` must not read that as a change.
    const marker = markerRef.current;
    if (marker?.el.isConnected) {
      marker.screenTop = screenTopOf(scroller, marker.el);
    }

    // Arrived, or the reader scrolled against the glide: it is over.
    if (away <= 1 || (glidingRef.current && movingAway)) {
      glidingRef.current = false;
    }
    followingRef.current = away <= FOLLOW_DISTANCE || glidingRef.current;

    // Measured against the viewport rather than a fixed pixel count: "far
    // enough that scrolling back is a chore" is a screenful, and a screenful
    // is a different number of pixels on a laptop and on a phone.
    const far = away > Math.max(360, scroller.clientHeight * 0.75);
    // Only APPEARS while moving away from the bottom: a glide back down is
    // itself a stream of scroll events, still "far" for most of the trip,
    // and brought the button straight back under the reader's click.
    if (!far) {
      setShowJumpToBottom(false);
    } else if (movingAway) {
      setShowJumpToBottom(true);
    }
    lastAwayRef.current = away;
  };

  /** Back to the newest message - the jump button. */
  const jumpToBottom = () => {
    setShowJumpToBottom(false);
    glide();
  };

  /**
   * A different conversation in the same mounted thread. It opens at its
   * bottom (column-reverse starts there) and no scroll event says so, so a
   * reader who was scrolled up in the LAST one would otherwise get no follow
   * and a stray jump button in this one.
   */
  const reset = () => {
    followingRef.current = true;
    glidingRef.current = false;
    lastAwayRef.current = 0;
    markerRef.current = null;
    setShowJumpToBottom(false);
  };

  return {
    anchorRef,
    follow,
    onScroll,
    jumpToBottom,
    reset,
    showJumpToBottom,
  };
}
