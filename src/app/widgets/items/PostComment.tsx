/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { commentsliststate } from "@/redux/actions/states";
import {
  CommentTypingBroadcastRequest,
  DeleteCommentRequest,
  GetCommentReactionTotalRequest,
  GetCommentsRequest,
  NetworkOverviewRequest,
  SaveCommentRequest,
  SearchOverviewRequest,
} from "@/reusables/hooks/requests";
import {
  AuthenticationInterface,
  Emoji,
  IPostComment,
} from "@/reusables/vars/interfaces";
import PostEmojis from "@/app/reusables/PostEmojis";
import { PaginationProp, PostCommentProp } from "@/reusables/vars/props";
import { IoSend } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUniqueItemsOfObjects } from "@/reusables/hooks/validatevariables";
import { getActiveAvatar, timeSince, urlify } from "@/reusables/hooks/reusable";
import {
  extractMentionHandles,
  highlightMentions,
} from "@/reusables/hooks/mentions";
import {
  highlightHashtagsInMarkup,
  useHashtagNavigation,
} from "@/reusables/hooks/hashtags";
import HashtagField from "@/app/reusables/HashtagField";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { FaFileAlt } from "react-icons/fa";
import PostCommentLoader from "@/app/reusables/loaders/PostCommentLoader";
import CommentOptions from "./CommentOptions";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useSelector } from "react-redux";
import { Avatar, BotFlag, PageFlag } from "@/reusables/design";
import { useLinkPreview } from "@/reusables/hooks/useLinkPreview";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import DOMPurify from "dompurify";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import {
  PostActivityEvent,
  usePostActivityStream,
} from "@/reusables/hooks/postRealtime";

/**
 * How long a "typing" ping keeps the indicator up.
 *
 * There is deliberately no "stopped typing" event to wait for - one that got
 * lost would leave the dots on screen forever - so the indicator expires on
 * its own and an active typist re-broadcasts to keep it alive. Matches the
 * broadcast throttle below, plus a beat of slack so a re-broadcast that is
 * merely slow does not make the dots blink.
 */
const TYPING_INDICATOR_TTL_MS = 7000;

/** One broadcast per this long while typing - same cadence as the messenger. */
const TYPING_BROADCAST_THROTTLE_MS = 5000;

/** Someone typing on this post, as the indicator renders them. */
interface CommentTyper {
  entity_id: string;
  handle: string | null;
  name: string | null;
  /**
   * WHICH box they are typing in: null for the post's main comment box, or a
   * top-level comment's id for that comment's reply box. The same axis a
   * comment event's `parent_id` names, so "which list is this about" is one
   * rule rather than two - and what lets the indicator say where the reply is
   * going to land, not just that somebody is writing.
   */
  parent_id: string | null;
}

// The @handle to type when mentioning an entity. EmbeddedRealmSerializer maps
// a realm's slug onto `username` precisely so entity-embedding surfaces don't
// need a branch here, but `slug` is kept as a fallback for older payloads.
const getEntityHandle = (entity: any): string =>
  entity?.details?.username || entity?.details?.slug || "";

// Connections, following and search results overlap freely, and entity_id is
// the one field every one of those shapes agrees on.
const dedupeSuggestions = (rows: any[]): any[] => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = String(row?.entity_id ?? "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function PostComment({
  post_id,
  parent_id,
  autoFocusComposer,
  initialMention,
  onCommentPosted,
  onCommentCountChange,
  realtime = false,
  remoteActivity,
  onPostReaction,
}: PostCommentProp) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const activeAvatar = getActiveAvatar(authentication);

  // A thread instance: this component renders itself recursively, once per
  // expanded top-level comment. `parent_id` is the whole difference - it
  // switches the fetch to that comment's replies and moves the composer below
  // the list. Threads are two levels deep (the backend re-parents a reply to
  // a reply onto its top-level ancestor), so this never recurses further.
  const isThread = Boolean(parent_id);

  // Delegated onto the comment text span - the tags inside it are raw HTML,
  // so there is no React element per tag to bind a handler to.
  const hashtagHandlers = useHashtagNavigation();

  const [comments, setComments] =
    useState<PaginationProp<IPostComment>>(commentsliststate);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  // const [range, setRange] = useState<number>(20);

  const [writeComment, setwriteComment] = useState<string>("");
  const [isCommentSaving, setisCommentSaving] = useState<boolean>(false);
  const [deletingCommentID, setDeletingCommentID] = useState<string | null>(
    null,
  );

  // Which top-level comments have their thread open. Kept as ids rather than a
  // boolean per row so opening one thread never re-mounts the others.
  const [openThreads, setOpenThreads] = useState<string[]>([]);
  // The thread opened by a "Reply" click (as opposed to "View replies"), so
  // only that one steals focus into its composer.
  const [focusedThread, setFocusedThread] = useState<string | null>(null);
  // Local nudge to reply_count, which is fetched once with the comment and
  // would otherwise go stale the moment a reply is posted into an open thread.
  const [extraReplies, setExtraReplies] = useState<Record<string, number>>({});

  const emojilist: Emoji[] = useSelector((state: any) => state.emojilist);
  // Which comment's reaction picker is open, and the hover-close timer -
  // same open-on-hover, close-after-a-beat behaviour the post card uses.
  const [openEmojiFor, setOpenEmojiFor] = useState<string | null>(null);
  const emojiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The reaction each comment had before an optimistic change, so a failed
  // request can put it back.
  const previousReactionRef = useRef<Record<string, string | null>>({});

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [mentionState, setMentionState] = useState<{
    open: boolean;
    query: string;
    start: number;
  }>({ open: false, query: "", start: -1 });
  const [mentionActiveIndex, setMentionActiveIndex] = useState<number>(0);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);

  const linkPreview = useLinkPreview({
    text: writeComment,
    enabled: !isCommentSaving,
  });

  // --- Realtime ------------------------------------------------------------
  // Who is typing right now, keyed by entity id, and one expiry timer each.
  // The timers live in a ref rather than in state because they are bookkeeping,
  // not something the render reads - and rescheduling one must not itself
  // cause a render.
  const [typers, setTypers] = useState<Record<string, CommentTyper>>({});
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  // The last stream event a thread might care about, handed down to every open
  // thread so each can decide whether it is about a row it holds. Only the
  // top-level instance ever sets this.
  const [remoteActivitySignal, setRemoteActivitySignal] = useState<{
    event: PostActivityEvent;
    nonce: number;
  } | null>(null);
  // Throttles our own outgoing typing broadcasts.
  const lastTypingSentRef = useRef<number>(0);

  const navigate = useNavigate();

  useEffect(() => {
    GetPostCommentProcess(page, 20);
  }, [post_id, parent_id, page]);

  // Every timer is cleared on unmount - closing the post modal while somebody
  // is mid-sentence would otherwise leave a timer running against a component
  // that is gone.
  useEffect(() => {
    const timers = typingTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  /**
   * Live activity on this post.
   *
   * Held by the TOP-LEVEL instance only. A thread is a nested instance of this
   * same component, and it is the same post - so letting threads subscribe
   * would open one more connection per expanded thread and deliver every event
   * as many times over. Replies reach their thread through `remoteReply`
   * instead.
   */
  usePostActivityStream(post_id, realtime && !isThread, (event) => {
    if (event.event_type === "typing") {
      RegisterTyperProcess(event);
      return;
    }

    // Our own change, already applied optimistically. Acting on the echo
    // would refetch for nothing and, for a comment, double the count.
    if (event.entity?.entity_id === authentication.user.entity_id) return;

    if (event.event_type === "reaction") {
      if (event.target_type === "post") {
        // The post's tallies belong to whoever owns the post, not to the
        // comment section - handed up rather than acted on here.
        onPostReaction?.();
        return;
      }

      if (event.target_type === "comment" && event.comment_id) {
        // The row may be in this list or in an open thread's, so both the
        // handler here and the passed-down signal below run the same check.
        RefreshCommentReactionsProcess(event.comment_id);
        setRemoteActivitySignal({ event, nonce: Date.now() });
      }

      return;
    }

    if (event.event_type !== "comment") return;

    // The post's total counts replies as well as top-level comments (the
    // backend increments for both), so this fires for either - and only here,
    // on the one instance that sees every event, so a reply cannot be counted
    // twice by a thread that also heard about it.
    onCommentCountChange?.(1);

    if (event.parent_id) {
      // A reply. Handed to the thread it belongs to; if that thread is closed
      // nothing listens, which is right - it will be fetched when opened.
      setRemoteActivitySignal({ event, nonce: Date.now() });

      // The parent row's "View N replies" should still move, since the count
      // is fetched once with the comment and would otherwise stay behind.
      setExtraReplies((prev) => ({
        ...prev,
        [event.parent_id as string]: (prev[event.parent_id as string] ?? 0) + 1,
      }));

      return;
    }

    GetPostCommentOnLoadProcess();
  });

  /**
   * A stream event that reached an open THREAD.
   *
   * The top-level instance holds the one connection and relays down, so every
   * open thread sees every relayed event and has to decide whether it is about
   * a row it actually holds - a reply filed under THIS thread, or a reaction
   * on a comment in this thread's list.
   */
  useEffect(() => {
    if (!remoteActivity || !isThread) return;

    const event = remoteActivity.event;

    if (event.event_type === "comment") {
      if (event.parent_id !== parent_id) return;
      GetPostCommentOnLoadProcess();
      return;
    }

    if (
      event.event_type === "reaction" &&
      event.target_type === "comment" &&
      event.comment_id
    ) {
      RefreshCommentReactionsProcess(event.comment_id);
    }
  }, [remoteActivity]);

  /**
   * Record that somebody is typing, and in which box.
   *
   * Kept ENTIRELY by the top-level instance, including replies. A thread is
   * only mounted while it is expanded, so letting threads hold their own
   * typers would mean nobody could see that a collapsed thread is being
   * answered - which is exactly when knowing would change what you do. The
   * indicator for a thread is therefore rendered by the row that owns it,
   * whether or not the replies are on screen.
   *
   * ONE entry per entity, because a person types in one box at a time: moving
   * from the main comment box into a thread replaces their entry rather than
   * leaving them showing in both.
   */
  const RegisterTyperProcess = (event: PostActivityEvent) => {
    const typer = event.entity;
    // Your own keystrokes come back to you: the event goes to the post's
    // channel, and you are on it. Nobody needs telling that they are typing.
    if (!typer || typer.entity_id === authentication.user.entity_id) return;

    setTypers((prev) => ({
      ...prev,
      [typer.entity_id]: {
        entity_id: typer.entity_id,
        handle: typer.handle,
        name: typer.name,
        parent_id: event.parent_id ?? null,
      },
    }));

    // Rescheduled rather than stacked. Each broadcast used to be able to
    // schedule its own removal, and an earlier one firing after a later one
    // arrived would clear the indicator out from under someone still typing -
    // the same trap the mobile messenger fell into.
    clearTimeout(typingTimersRef.current[typer.entity_id]);
    typingTimersRef.current[typer.entity_id] = setTimeout(() => {
      delete typingTimersRef.current[typer.entity_id];
      setTypers((prev) => {
        const next = { ...prev };
        delete next[typer.entity_id];
        return next;
      });
    }, TYPING_INDICATOR_TTL_MS);
  };

  /**
   * Re-read one comment's reaction tallies after somebody else reacted to it.
   *
   * Silent when the comment is not in THIS instance's list: the relay reaches
   * every open thread, and only one of them holds any given row.
   *
   * Only `preview` is replaced. `entity_reaction` is the VIEWER's own
   * reaction, which somebody else reacting cannot change - refetching it here
   * would fight with an optimistic update still in flight.
   */
  const RefreshCommentReactionsProcess = (comment_id: string) => {
    if (!comments.results.some((row) => row.comment_id === comment_id)) return;

    GetCommentReactionTotalRequest(comment_id)
      .then((response) => {
        patchComment(comment_id, { preview: response });
      })
      .catch((err) => {
        // The tallies stay as they were until the next fetch of the list -
        // a stale count is not worth interrupting anyone over.
        console.log(err);
      });
  };

  /**
   * Tell the post that this person is writing.
   *
   * Throttled to one call per TYPING_BROADCAST_THROTTLE_MS, matching the
   * messenger: an indicator that says "still typing" does not get truer by
   * being said on every keystroke.
   *
   * Fired from THREADS too, carrying this instance's `parent_id` so the
   * indicator shows under the comment being answered rather than at the foot
   * of the section.
   */
  const BroadcastTypingProcess = (value: string) => {
    if (!authentication.auth || value.trim() === "") return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_BROADCAST_THROTTLE_MS) return;

    lastTypingSentRef.current = now;
    CommentTypingBroadcastRequest(post_id, parent_id);
  };

  useEffect(() => {
    if (autoFocusComposer) {
      composerRef.current?.focus();
    }
  }, [autoFocusComposer]);

  // A thread opened via "Reply" pre-fills the parent's handle, the same way
  // replying to a reply pre-fills that reply's. Keyed on the handle so
  // re-opening the same thread for the same person doesn't insert twice;
  // startReplyInComposer skips it anyway if the draft already has it.
  useEffect(() => {
    if (!initialMention) return;
    startReplyInComposer(initialMention);
  }, [initialMention]);

  // --- Mentions -----------------------------------------------------------
  // Same convention as messages: the mention is plain "@handle" text in the
  // comment body, and the backend parses it back out to decide who to notify.
  // Nothing about the picker is sent to the server - it only helps the user
  // type a handle that actually resolves.

  const closeMentionSuggestions = () => {
    setMentionState({ open: false, query: "", start: -1 });
    setMentionActiveIndex(0);
    setMentionSuggestions([]);
  };

  const updateMentionSuggestions = (
    value: string,
    cursorPosition: number = value.length,
  ) => {
    const beforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/(^|\s)@([^\s@]*)$/);

    if (!mentionMatch) {
      closeMentionSuggestions();
      return;
    }

    setMentionState({
      open: true,
      query: mentionMatch[2] ?? "",
      start: beforeCursor.lastIndexOf("@"),
    });
    setMentionActiveIndex(0);
  };

  // The messenger opens on a bare "@" because a conversation already has a
  // member list to offer. A comment has no such set and can mention ANYONE, so
  // this fetches the closest equivalent once and reuses it: the people you
  // actually deal with, which is what "@" should offer before you've typed a
  // query. Network rows carry the same {entity_id, handle, display_name,
  // profile} shape search v2 returns, so both feed the panel unchanged.
  const [mentionDefaults, setMentionDefaults] = useState<any[]>([]);
  const mentionDefaultsRequested = useRef<boolean>(false);

  // Fetched on the first "@" rather than on mount, and once per instance:
  // this component is mounted per post card AND per opened thread, so eager
  // loading would fire the request for people who never type a mention.
  useEffect(() => {
    if (
      !mentionState.open ||
      !authentication.auth ||
      mentionDefaultsRequested.current
    ) {
      return;
    }
    mentionDefaultsRequested.current = true;

    NetworkOverviewRequest()
      .then((result: any) => {
        if (!result) return;

        const connections = result.connections?.results ?? [];
        const following = result.following?.results ?? [];
        setMentionDefaults(
          [...connections, ...following].filter((mp: any) => mp.handle),
        );
      })
      .catch(() => {
        // A missing default list just means "@" waits for a query - never a
        // reason to break the composer.
        setMentionDefaults([]);
      });
  }, [mentionState.open, authentication.auth]);

  // Typing past "@" searches EVERYONE - people AND pages, matching the two
  // handle namespaces the backend resolves against (username / slug), so
  // anyone reachable by search is mentionable.
  useEffect(() => {
    if (!mentionState.open) {
      setMentionSuggestions([]);
      return;
    }

    const query = mentionState.query.trim();

    if (query.length < 1) {
      // Bare "@": no search to run yet, so offer the pre-fetched defaults.
      setMentionSuggestions(dedupeSuggestions(mentionDefaults).slice(0, 6));
      return;
    }

    // Local matches show instantly; the search below replaces them once it
    // lands, so the panel never blanks out mid-keystroke.
    const localMatches = dedupeSuggestions(mentionDefaults).filter(
      (mp: any) =>
        mp.handle?.toLowerCase().includes(query.toLowerCase()) ||
        mp.display_name?.toLowerCase().includes(query.toLowerCase()),
    );
    setMentionSuggestions(localMatches.slice(0, 6));

    let cancelled = false;
    // Debounced: this fires per keystroke inside an "@..." token.
    const timer = setTimeout(() => {
      SearchOverviewRequest(query)
        .then((result: any) => {
          if (cancelled || !result) return;

          const people = result.people?.results ?? [];
          const realms = result.realms?.results ?? [];
          // Bots too: the overview endpoint already returns them, and
          // @mentioning one in a comment is how you ask it something - so
          // dropping them here hid the only interaction a comment has with a
          // bot. They carry the same {handle, display_name, profile} shape.
          const bots = result.bots?.results ?? [];
          const found = [...people, ...realms, ...bots].filter(
            (mp: any) => mp.handle,
          );
          setMentionSuggestions(
            dedupeSuggestions([...localMatches, ...found]).slice(0, 6),
          );
        })
        .catch(() => {
          // Keep whatever the local pass already offered.
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mentionState.open, mentionState.query, mentionDefaults]);

  const insertMentionAtCursor = (suggestion: any) => {
    const field = composerRef.current;
    if (!field || mentionState.start < 0) return;

    const selectionStart = field.selectionStart ?? writeComment.length;
    const selectionEnd = field.selectionEnd ?? selectionStart;
    const mentionText = `@${suggestion.handle} `;
    const before = writeComment.slice(0, mentionState.start);
    const after = writeComment.slice(selectionEnd);

    setwriteComment(`${before}${mentionText}${after}`);
    closeMentionSuggestions();

    requestAnimationFrame(() => {
      field.focus();
      const nextCursor = (before + mentionText).length;
      field.setSelectionRange(nextCursor, nextCursor);
    });
  };

  // --- Data ---------------------------------------------------------------

  const GetPostCommentProcess = (to_page: number, to_range: number) => {
    setIsLoaded(false);
    setIsError(false);
    GetCommentsRequest(post_id, parent_id, to_page, to_range)
      .then((response: PaginationProp<IPostComment>) => {
        setComments((prev: PaginationProp<IPostComment>) => ({
          ...response,
          results: getUniqueItemsOfObjects(
            [...prev.results, ...response.results],
            "comment_id",
            "created_at",
          ).reverse(),
        }));
        setIsLoaded(true);
        setIsError(false);
      })
      .catch((err) => {
        setIsLoaded(true);
        setIsError(true);
        console.log(err);
      });
  };

  // Own-comment deletion. The comment's `entity.id` is an entity id, so this
  // compares against entity_id (which follows entity switching) rather than
  // the account id - a page's comment is deletable while acting as that page.
  // The backend soft-deletes and enforces ownership itself (assert_owns), so
  // this gate is only about not showing a button that would 403.
  const isMyComment = (mp: IPostComment) =>
    mp.entity?.id === authentication.user.entity_id;

  const DeleteCommentProcess = (mp: IPostComment) => {
    if (deletingCommentID) return;
    setDeletingCommentID(mp.comment_id);

    const previous = comments;
    // The backend soft-deletes a top-level comment's whole thread and gives
    // the post back the count for all of it, so the card has to drop the same
    // amount. Taken from the row's own reply_count rather than the response,
    // which is a bare "OK" the live mobile app depends on.
    const removed = 1 + (isThread ? 0 : replyCountOf(mp));

    // Optimistic: drop the row immediately, restore it if the call fails.
    //
    // Same stray .reverse() removed as in patchComment below - and it did
    // double damage here, because `previous` above holds the SAME array, so
    // reversing in place corrupted the snapshot the rollback restores from.
    setComments((prev: PaginationProp<IPostComment>) => ({
      ...prev,
      count: Math.max(0, prev.count - 1),
      results: prev.results.filter((flt) => flt.comment_id !== mp.comment_id),
    }));
    onCommentCountChange?.(-removed);

    DeleteCommentRequest(mp.comment_id)
      .catch((err) => {
        console.log(err);
        setComments(previous);
        onCommentCountChange?.(removed);
        // The row reappearing is the only other sign anything went wrong,
        // and on its own that reads like a rendering glitch.
        notifyRequestError(err, "We couldn't delete that comment.");
      })
      .finally(() => setDeletingCommentID(null));
  };

  const GetPostCommentOnLoadProcess = () => {
    GetCommentsRequest(post_id, parent_id, 1, 20)
      .then((response: PaginationProp<IPostComment>) => {
        setComments((prev: PaginationProp<IPostComment>) => ({
          ...prev,
          results: getUniqueItemsOfObjects(
            [...prev.results, ...response.results],
            "comment_id",
            "created_at",
          ).reverse(),
        }));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const SaveCommentProcess = () => {
    setisCommentSaving(true);
    closeMentionSuggestions();
    SaveCommentRequest(post_id, parent_id, writeComment, null)
      .then(() => {
        setwriteComment("");
        linkPreview.dismiss();
        setisCommentSaving(false);
        GetPostCommentOnLoadProcess();
        // Lets the parent row's "N replies" keep up without a refetch.
        onCommentPosted?.();
        // A reply counts toward the POST's total exactly like a top-level
        // comment does (post() increments for both), so this fires from a
        // thread too - it just travels one more hop to reach the card.
        onCommentCountChange?.(1);
      })
      .catch((err) => {
        setisCommentSaving(false);
        console.log(err);
        notifyRequestError(err, "We couldn't post that comment.");
      });
  };

  // --- Reactions ----------------------------------------------------------
  // Mirrors the post card's flow: the picker reports the chosen emoji
  // optimistically, then reports success or failure. The authoritative
  // tallies come back from the server afterwards rather than being guessed
  // here, so a concurrent reaction from someone else lands too.

  // No .reverse() here, deliberately. It used to lead this chain, and
  // Array#reverse mutates IN PLACE - so patching one row silently flipped the
  // whole list, which is stored oldest-first (GetPostCommentProcess sorts
  // newest-first then reverses). Reacting to a comment turned the thread
  // upside down. It survived because React's StrictMode runs this updater
  // twice in development, and two flips look like none.
  const patchComment = (comment_id: string, patch: Partial<IPostComment>) => {
    setComments((prev: PaginationProp<IPostComment>) => ({
      ...prev,
      results: prev.results.map((row) =>
        row.comment_id === comment_id ? { ...row, ...patch } : row,
      ),
    }));
  };

  const onProcessCommentReaction = (
    mp: IPostComment,
    emoji_id: string | null,
  ) => {
    previousReactionRef.current[mp.comment_id] = mp.entity_reaction ?? null;
    setOpenEmojiFor(null);
    patchComment(mp.comment_id, { entity_reaction: emoji_id });
  };

  const onSuccessCommentReaction = (
    comment_id: string,
    isReactionProcessed: boolean,
  ) => {
    if (!isReactionProcessed) {
      patchComment(comment_id, {
        entity_reaction: previousReactionRef.current[comment_id] ?? null,
      });
      return;
    }

    GetCommentReactionTotalRequest(comment_id)
      .then((response) => {
        patchComment(comment_id, { preview: response });
      })
      .catch((err) => {
        // The reaction itself landed; only the refreshed tallies are missing,
        // and the next fetch of the list will carry them.
        console.log(err);
      });
  };

  const reactionTotalOf = (mp: IPostComment) =>
    (mp.preview ?? []).reduce((sum, item) => sum + item.count, 0);

  /**
   * "@handle is typing...", or who else, in one line.
   *
   * Names people rather than saying "someone": the handle is what identifies
   * an entity here, and a page writing as itself should read as the page. The
   * display name is the fallback, and only a typer whose identity did not
   * resolve at all falls through to "Someone".
   *
   * `box` is which comment box to describe: null for the post's main one, a
   * top-level comment's id for that comment's reply box. Both are rendered by
   * the top-level instance - the section's own at the foot, each comment's
   * under that comment - so a thread does not have to be expanded, or even
   * mounted, for somebody replying to it to be visible.
   */
  const typingLabelFor = (box: string | null) => {
    const rows = Object.values(typers).filter((row) => row.parent_id === box);
    if (rows.length === 0) return null;

    const nameOf = (typer: CommentTyper) =>
      typer.handle ? `@${typer.handle}` : (typer.name ?? "Someone");

    if (rows.length === 1) return `${nameOf(rows[0])} is typing...`;
    if (rows.length === 2)
      return `${nameOf(rows[0])} and ${nameOf(rows[1])} are typing...`;

    return `${nameOf(rows[0])} and ${rows.length - 1} others are typing...`;
  };

  /**
   * The dots-and-a-line row. Rendered twice from the same function: at the
   * foot of the section for the main comment box, and under a comment for its
   * own reply box.
   *
   * Not the messenger's IsTypingLoader - that one is a chat bubble, and a
   * bubble in a comment list reads as a comment that is still loading.
   */
  const renderTypingIndicator = (box: string | null, nested: boolean) => {
    const label = typingLabelFor(box);
    if (!label) return null;

    return (
      <div
        className={`cl-comment-typing ${
          nested ? "cl-comment-typing--thread" : ""
        }`}
        aria-live="polite"
      >
        <span className="cl-comment-typing__dots" aria-hidden="true">
          <span className="cl-comment-typing__dot" />
          <span className="cl-comment-typing__dot" />
          <span className="cl-comment-typing__dot" />
        </span>
        <span className="cl-comment-typing__label cl-text-meta">{label}</span>
      </div>
    );
  };

  // --- Threads ------------------------------------------------------------

  const replyCountOf = (mp: IPostComment) =>
    (mp.reply_count ?? 0) + (extraReplies[mp.comment_id] ?? 0);

  const toggleThread = (comment_id: string) => {
    setOpenThreads((prev) =>
      prev.includes(comment_id)
        ? prev.filter((id) => id !== comment_id)
        : [...prev, comment_id],
    );
    setFocusedThread(null);
  };

  /**
   * The handle to pre-fill when replying to `mp`, or null when there is
   * nothing worth inserting.
   *
   * Null for your OWN comment - @-ing yourself notifies nobody and just eats
   * characters - and null for a missing handle. Mirrors the mobile app's
   * replyMentionHandleFor so the two can't drift.
   */
  const replyMentionHandle = (mp: IPostComment): string | null => {
    if (isMyComment(mp)) return null;
    const handle = getEntityHandle(mp.entity);
    return handle ? handle : null;
  };

  /**
   * Appends "@handle " to this composer and focuses it.
   *
   * Appends rather than replaces, so a reply started mid-draft keeps the
   * draft, and skips a handle the text already mentions - which is what stops
   * a second Reply tap from doubling it. The trailing space closes the "@..."
   * token so the mention autocomplete doesn't spring open on a complete
   * handle.
   *
   * A null handle still focuses: the reply is starting either way.
   */
  const startReplyInComposer = (handle: string | null) => {
    if (handle) {
      // Functional update, and the "already mentioned" test reads `prev`
      // rather than the captured writeComment - two Reply taps in one render
      // would otherwise both see the stale empty draft and insert twice.
      setwriteComment((prev) => {
        const already = extractMentionHandles(prev).includes(
          handle.toLowerCase(),
        );
        if (already) return prev;
        return prev ? `${prev} @${handle} ` : `@${handle} `;
      });
    }
    composerRef.current?.focus();
  };

  const openThreadToReply = (mp: IPostComment) => {
    if (isThread) {
      // Already inside a thread: replying to a reply doesn't nest further, it
      // just addresses that person in THIS thread's composer - which is also
      // what carries the "aimed at you" signal the backend would otherwise
      // lose when it re-parents the reply. Same pre-fill the messenger does.
      startReplyInComposer(replyMentionHandle(mp));
      return;
    }

    // Replying to a TOP-LEVEL comment: the thread this opens owns its own
    // composer, so the mention can't be inserted from here - it rides down as
    // `initialMention` and the thread applies it on mount.
    setOpenThreads((prev) =>
      prev.includes(mp.comment_id) ? prev : [...prev, mp.comment_id],
    );
    setFocusedThread(mp.comment_id);
  };

  // Plain JSX, deliberately NOT memoized: it closes over the composer's
  // handlers, which in turn close over writeComment / mentionState, so a
  // dependency list here buys nothing and risks sending a stale draft.
  const composer = (
    <div className="tw-w-full tw-flex tw-flex-col tw-gap-[8px] tw-pb-[10px]">
      <div className="cl-comment-section__composer tw-min-h-[60px] tw-flex tw-items-center tw-gap-[12px] tw-w-full">
        <Avatar
          id={authentication.user.userID}
          name={activeAvatar.name}
          src={activeAvatar.src}
          size={isThread ? 38 : 48}
        />
        <div
          id="div_input_feed_flex"
          className="cl-comment-section__field-shell tw-relative"
        >
          {mentionState.open && mentionSuggestions.length > 0 && (
            <div
              className={`cl-mention-suggestion-panel cl-comment-section__mentions ${
                isThread ? "" : "cl-comment-section__mentions--below"
              }`}
            >
              {mentionSuggestions.map((suggestion: any, index: number) => (
                <button
                  key={suggestion.entity_id}
                  type="button"
                  // onMouseDown, not onClick: the composer must not lose
                  // focus (and close the panel) before the pick registers.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMentionAtCursor(suggestion);
                  }}
                  className={`cl-mention-suggestion-item ${
                    index === mentionActiveIndex
                      ? "cl-mention-suggestion-item--active"
                      : ""
                  }`}
                >
                  <Avatar
                    id={suggestion.entity_id}
                    name={suggestion.display_name}
                    src={suggestion.profile ?? undefined}
                    size={28}
                  />
                  <span>@{suggestion.handle}</span>
                </button>
              ))}
            </div>
          )}
          {/* Wrapped so #hashtags colour as they are typed. composerRef is
              still the textarea's own ref - mention insertion writes through
              it and must keep working. */}
          <HashtagField value={writeComment} inputRef={composerRef}>
            <textarea
              ref={composerRef}
              placeholder={isThread ? "Write a reply..." : "Write a comment..."}
              id={isThread ? "textarea_feed_reply_box" : "textarea_feed_box"}
              className="cl-comment-section__field tw-font-Inter"
              value={writeComment}
              onChange={(e) => {
                setwriteComment(e.target.value);
                BroadcastTypingProcess(e.target.value);
                updateMentionSuggestions(
                  e.target.value,
                  e.target.selectionStart ?? e.target.value.length,
                );
              }}
              onKeyDown={(e) => {
                if (mentionState.open && mentionSuggestions.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setMentionActiveIndex((prev) =>
                      prev + 1 >= mentionSuggestions.length ? 0 : prev + 1,
                    );
                    return;
                  }

                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setMentionActiveIndex((prev) =>
                      prev - 1 < 0 ? mentionSuggestions.length - 1 : prev - 1,
                    );
                    return;
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    insertMentionAtCursor(
                      mentionSuggestions[mentionActiveIndex] ??
                        mentionSuggestions[0],
                    );
                    return;
                  }

                  if (e.key === "Escape") {
                    e.preventDefault();
                    closeMentionSuggestions();
                    return;
                  }
                }
              }}
              onBlur={() => closeMentionSuggestions()}
              disabled={isCommentSaving}
            />
          </HashtagField>
        </div>
        <div id="div_confirm_send" className="cl-comment-section__send-shell">
          <button
            onClick={() => {
              SaveCommentProcess();
            }}
            id="btn_image_feed"
            className="cl-comment-section__send"
            disabled={isCommentSaving || writeComment.trim() === ""}
          >
            {isCommentSaving ? (
              <div id="div_conversation_content_loader">
                <motion.div
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                  // id="div_loader_share_conv"
                  className="tw-w-[20px] tw-h-[20px] tw-flex tw-items-center tw-justify-center"
                >
                  <AiOutlineLoading3Quarters style={{ fontSize: "18px" }} />
                </motion.div>
              </div>
            ) : (
              <IoSend style={{ fontSize: "20px", color: "#3d4551" }} />
            )}
          </button>
        </div>
      </div>
      {linkPreview.status === "ok" && linkPreview.preview && (
        <LinkPreviewCard
          preview={linkPreview.preview}
          variant="composer"
          onRemove={linkPreview.dismiss}
        />
      )}
    </div>
  );

  return (
    <div
      className={`cl-comment-section ${
        isThread
          ? "cl-comment-section--thread tw-gap-[10px]"
          : "tw-p-[25px] tw-pt-[5px] tw-min-h-[250px] tw-gap-[16px]"
      } tw-w-full tw-flex tw-flex-1 tw-flex-col`}
    >
      {authentication.auth && !isThread && composer}
      <div className="cl-comment-section__list tw-flex tw-flex-col tw-gap-[14px] tw-w-full">
        {isError ? (
          <span>Error</span>
        ) : comments.results.length === 0 ? (
          isLoaded &&
          !isThread && (
            <div className="cl-comment-section__empty tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[40px] tw-text-[var(--text-2)]">
              <FaFileAlt style={{ fontSize: "40px", color: "var(--text-2)" }} />
              <div className="tw-flex tw-flex-col tw-gap-[0px] tw-text-[var(--text-2)]">
                <span className="tw-font-semibold cl-text-caption tw-text-[var(--text)]">
                  No Comments yet
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="cl-comment-section__rows tw-flex tw-flex-col tw-gap-[14px] tw-items-start tw-w-full">
            {comments.results.map((mp: IPostComment) => {
              const replyCount = replyCountOf(mp);
              const isOpen = openThreads.includes(mp.comment_id);

              return (
                <div
                  key={mp.comment_id}
                  className="cl-comment-section__row tw-flex tw-gap-[12px] tw-w-full tw-items-start"
                >
                  <Avatar
                    id={mp.entity.details.id}
                    name={
                      mp.entity.type === "user"
                        ? `${mp.entity.details.first_name} ${mp.entity.details.last_name}`
                        : mp.entity.details.name
                    }
                    src={
                      mp.entity.details.profile == "none"
                        ? undefined
                        : mp.entity.details.profile
                    }
                    kind={mp.entity.type}
                    size={isThread ? 38 : 46}
                  />
                  <div className="tw-flex tw-flex-col tw-items-start tw-gap-[6px] tw-text-left tw-flex-1 tw-min-w-0">
                    <div className="cl-comment-section__bubble tw-w-full tw-rounded-[14px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-p-[12px] tw-text-left tw-shadow-sm">
                      <div className="tw-w-full tw-flex tw-items-start tw-justify-between tw-gap-[10px]">
                        <span
                          className="cl-comment-section__name tw-break-keep cl-text-caption tw-w-fit tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[var(--text-2)] tw-text-[var(--text)]"
                          onClick={() => {
                            // Three kinds, three identifying fields - a bot's
                            // is `handle`, a realm's is `slug`. Before this,
                            // a bot fell into the realm branch (anything not
                            // "user") and read `.slug`, which a bot payload
                            // does not have - so the row navigated to
                            // "/undefined" instead of the bot's profile.
                            if (mp.entity.type === "user") {
                              navigate(`/${mp.entity.details.username}`);
                            } else if (mp.entity.type === "bot") {
                              navigate(`/${mp.entity.details.handle}`);
                            } else {
                              navigate(`/${mp.entity.details.slug}`);
                            }
                          }}
                        >
                          {mp.entity.type === "user" ? (
                            <div className="tw-flex tw-items-center tw-gap-[4px] tw-flex-wrap tw-text-left">
                              <span>
                                {mp.entity.details.first_name}
                                {mp.entity.details.middle_name == "N/A"
                                  ? ""
                                  : ` ${mp.entity.details.middle_name}`}{" "}
                                {mp.entity.details.last_name}
                              </span>
                              {mp.entity.details.is_badged && (
                                <RiVerifiedBadgeFill
                                  size={16}
                                  color="#1c7def"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="tw-flex tw-items-center tw-gap-[4px] tw-flex-wrap tw-text-left">
                              <span>{mp.entity.details.name}</span>
                              {mp.entity.details.is_verified && (
                                <RiVerifiedBadgeFill
                                  size={16}
                                  color="#1c7def"
                                />
                              )}
                              {mp.entity.type === "realm" && (
                                <PageFlag
                                  realmType={mp.entity.details.type}
                                  size={14}
                                />
                              )}
                              {mp.entity.type === "bot" && (
                                <BotFlag is size={14} />
                              )}
                            </div>
                          )}
                        </span>
                        <span className="tw-flex tw-items-center tw-gap-[6px] tw-flex-none">
                          <span className="cl-text-meta tw-text-[var(--text-3)] tw-whitespace-nowrap tw-text-right">
                            {timeSince(mp.created_at)}
                          </span>
                          {/* On every comment now, not just your own: the menu
                              carries Edit/Delete for the author and Report for
                              everyone else. */}
                          <CommentOptions
                            commentID={mp.comment_id}
                            isOwnComment={isMyComment(mp)}
                            isBusy={deletingCommentID === mp.comment_id}
                            onDelete={() => DeleteCommentProcess(mp)}
                          />
                        </span>
                      </div>
                      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[4px] tw-mt-[4px]">
                        {/* Mentions are plain "@handle" text (see
                            reusables/hooks/mentions.ts) - escaped, highlighted
                            and linkified here, then sanitized, exactly as the
                            messenger renders message content. */}
                        <span
                          className="cl-comment-section__text cl-text-body tw-leading-[1.5] tw-break-words tw-text-[var(--text)]"
                          {...hashtagHandlers}
                          dangerouslySetInnerHTML={{
                            /* Order matters. highlightMentions escapes the
                               text and returns markup, urlify then adds
                               anchors, so hashtags are highlighted LAST and
                               with the markup-aware variant - it only
                               transforms text between tags, which is what
                               stops a "#" inside an href from being wrapped
                               in a span inside an attribute value. */
                            __html: DOMPurify.sanitize(
                              highlightHashtagsInMarkup(
                                urlify(
                                  highlightMentions(
                                    mp.text ?? "",
                                    "cl-comment-mention",
                                  ),
                                ),
                              ),
                            ),
                          }}
                        />
                        {mp.link_preview && (
                          <LinkPreviewCard
                            preview={mp.link_preview}
                            variant="display"
                          />
                        )}
                      </div>
                      {/* <span className="cl-text-body">{mp.text}</span> */}
                    </div>

                    {authentication.auth && (
                      <div className="cl-comment-section__actions tw-flex tw-items-center tw-gap-[14px] tw-pl-[4px]">
                        <div
                          className="cl-comment-section__react tw-relative"
                          onMouseEnter={() => {
                            setOpenEmojiFor(mp.comment_id);
                            if (emojiTimeoutRef.current) {
                              clearTimeout(emojiTimeoutRef.current);
                              emojiTimeoutRef.current = null;
                            }
                          }}
                          onMouseLeave={() => {
                            emojiTimeoutRef.current = setTimeout(() => {
                              setOpenEmojiFor(null);
                            }, 700);
                          }}
                        >
                          <motion.div
                            className="cl-comment-section__reaction-popover tw-absolute tw-min-h-[44px] tw-rounded-full tw-shadow-lg tw-bottom-[calc(100%+10px)] tw-left-0 tw-z-[30]"
                            initial={{ scale: 0 }}
                            animate={{
                              scale: openEmojiFor === mp.comment_id ? 1 : 0,
                            }}
                          >
                            <PostEmojis
                              comment_id={mp.comment_id}
                              reaction={mp.entity_reaction}
                              onProcessEmojiSelection={(
                                emoji_id: string | null,
                              ) => onProcessCommentReaction(mp, emoji_id)}
                              onSuccessEmojiSelection={(ok: boolean) =>
                                onSuccessCommentReaction(mp.comment_id, ok)
                              }
                            />
                          </motion.div>
                          <button className="cl-comment-section__action">
                            {mp.entity_reaction ? (
                              emojilist.find(
                                (flt) => flt.emoji_id === mp.entity_reaction,
                              )?.emoji_content ? (
                                <span className="cl-comments-reaction">
                                  {
                                    emojilist.find(
                                      (flt) =>
                                        flt.emoji_id === mp.entity_reaction,
                                    )?.emoji_content
                                  }
                                </span>
                              ) : (
                                <span className="cl-text-meta">React</span>
                              )
                            ) : (
                              <span className="cl-text-meta">React</span>
                            )}
                          </button>
                        </div>
                        <button
                          className="cl-comment-section__action cl-text-meta"
                          onClick={() => openThreadToReply(mp)}
                        >
                          Reply
                        </button>
                        {!isThread && replyCount > 0 && (
                          <button
                            className="cl-comment-section__action cl-comment-section__action--thread cl-text-meta"
                            onClick={() => toggleThread(mp.comment_id)}
                          >
                            {isOpen
                              ? "Hide replies"
                              : `View ${replyCount} ${
                                  replyCount === 1 ? "reply" : "replies"
                                }`}
                          </button>
                        )}
                        {reactionTotalOf(mp) > 0 && (
                          <span className="cl-comment-section__reactions cl-text-meta tw-flex tw-items-center tw-gap-[4px]">
                            <span className="tw-flex tw-flex-row">
                              {(mp.preview ?? [])
                                .filter((flt) => flt.count > 0)
                                .map((prv, i) => (
                                  <span
                                    key={i}
                                    className="-tw-mr-[6px] tw-text-[16px]"
                                  >
                                    {
                                      emojilist.find(
                                        (flt) => flt.emoji_id === prv.emoji,
                                      )?.emoji_content
                                    }
                                  </span>
                                ))}
                            </span>
                            <span className="tw-pl-[8px] tw-text-[var(--text-3)]">
                              {reactionTotalOf(mp)}
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                    {!isThread && isOpen && (
                      <div className="cl-comment-section__thread tw-w-full">
                        <PostComment
                          post_id={post_id}
                          parent_id={mp.comment_id}
                          autoFocusComposer={focusedThread === mp.comment_id}
                          // Only for a thread opened by REPLY - "View replies"
                          // leaves focusedThread null and must not write into
                          // the composer.
                          initialMention={
                            focusedThread === mp.comment_id
                              ? replyMentionHandle(mp)
                              : null
                          }
                          onCommentCountChange={onCommentCountChange}
                          // Stream events relayed from the top-level
                          // instance, which holds the only connection - a
                          // reply for this thread, or a reaction on one of its
                          // rows. Each thread checks whether the event is
                          // about something it actually holds.
                          //
                          // Counting stays with whoever fired: a LOCAL reply
                          // is counted by this thread's own save, a REMOTE one
                          // by the top-level stream handler, and the stream
                          // ignores its own echoes - so neither path can count
                          // the same reply twice.
                          remoteActivity={remoteActivitySignal}
                          onCommentPosted={() =>
                            setExtraReplies((prev) => ({
                              ...prev,
                              [mp.comment_id]: (prev[mp.comment_id] ?? 0) + 1,
                            }))
                          }
                        />
                      </div>
                    )}

                    {/* Anyone writing a reply to THIS comment, at the foot of
                        its thread - where the reply itself will appear.
                        Deliberately OUTSIDE the `isOpen` block above:
                        somebody starting a reply to a thread you have
                        collapsed is exactly when you would want to know it is
                        happening. */}
                    {!isThread && renderTypingIndicator(mp.comment_id, true)}
                  </div>
                </div>
              );
            })}
            {comments.next && isLoaded && (
              <button
                className="cl-comment-section__more cl-text-caption tw-text-[var(--brand)] hover:tw-text-[var(--brand-hover)]"
                onClick={() => {
                  setPage((prev) => prev + 1);
                }}
              >
                {isThread ? "See more replies..." : "See more comments..."}
              </button>
            )}
          </div>
        )}
        {!isLoaded && <PostCommentLoader />}
      </div>
      {/* The MAIN comment box only - a reply's indicator belongs under the
          comment being answered, and is rendered there. Sits under the list
          because the messenger puts its indicator where the next message will
          land, and the same reasoning applies here.

          Renders nothing in a thread: threads never hold typers (the
          top-level instance keeps all of them, see RegisterTyperProcess). */}
      {renderTypingIndicator(null, false)}
      {authentication.auth && isThread && composer}
    </div>
  );
}

export default PostComment;
