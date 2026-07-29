/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { commentsliststate } from "@/redux/actions/states";
import {
  DeleteCommentRequest,
  GetCommentsRequest,
  NetworkOverviewRequest,
  SaveCommentRequest,
  SearchOverviewRequest,
} from "@/reusables/hooks/requests";
import {
  AuthenticationInterface,
  IPostComment,
} from "@/reusables/vars/interfaces";
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
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { FaFileAlt } from "react-icons/fa";
import PostCommentLoader from "@/app/reusables/loaders/PostCommentLoader";
import CommentOptions from "./CommentOptions";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useSelector } from "react-redux";
import { Avatar } from "@/reusables/design";
import { useLinkPreview } from "@/reusables/hooks/useLinkPreview";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import DOMPurify from "dompurify";

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
  onCommentPosted,
  onCommentCountChange,
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

  const navigate = useNavigate();

  useEffect(() => {
    GetPostCommentProcess(page, 20);
  }, [post_id, parent_id, page]);

  useEffect(() => {
    if (autoFocusComposer) {
      composerRef.current?.focus();
    }
  }, [autoFocusComposer]);

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
          const found = [...people, ...realms].filter((mp: any) => mp.handle);
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
          ),
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
          ),
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
      });
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

  const openThreadToReply = (mp: IPostComment) => {
    if (isThread) {
      // Already inside a thread: replying to a reply doesn't nest further, it
      // just addresses that person in THIS thread's composer - which is also
      // what carries the "aimed at you" signal the backend would otherwise
      // lose when it re-parents the reply. Same pre-fill the messenger does.
      const handle = getEntityHandle(mp.entity);
      const alreadyMentioned = extractMentionHandles(writeComment).includes(
        handle.toLowerCase(),
      );

      if (handle && !alreadyMentioned) {
        setwriteComment((prev) =>
          prev ? `${prev} @${handle} ` : `@${handle} `,
        );
      }
      composerRef.current?.focus();
      return;
    }

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
          <textarea
            ref={composerRef}
            placeholder={isThread ? "Write a reply..." : "Write a comment..."}
            id={isThread ? "textarea_feed_reply_box" : "textarea_feed_box"}
            className="cl-comment-section__field tw-font-Inter"
            value={writeComment}
            onChange={(e) => {
              setwriteComment(e.target.value);
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
                    name={`${mp.entity.details.first_name} ${mp.entity.details.last_name}`}
                    src={
                      mp.entity.details.profile == "none"
                        ? undefined
                        : mp.entity.details.profile
                    }
                    size={isThread ? 38 : 46}
                  />
                  <div className="tw-flex tw-flex-col tw-items-start tw-gap-[6px] tw-text-left tw-flex-1 tw-min-w-0">
                    <div className="cl-comment-section__bubble tw-w-full tw-rounded-[14px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-p-[12px] tw-text-left tw-shadow-sm">
                      <div className="tw-w-full tw-flex tw-items-start tw-justify-between tw-gap-[10px]">
                        <span
                          className="cl-comment-section__name tw-break-keep cl-text-caption tw-w-fit tw-font-semibold tw-select-none tw-cursor-pointer tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[var(--text-2)] tw-text-[var(--text)]"
                          onClick={() => {
                            if (mp.entity.type === "user") {
                              navigate(`/${mp.entity.details.username}`);
                              return;
                            }

                            navigate(`/${mp.entity.details.slug}`);
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
                            </div>
                          )}
                        </span>
                        <span className="tw-flex tw-items-center tw-gap-[6px] tw-flex-none">
                          <span className="cl-text-meta tw-text-[var(--text-3)] tw-whitespace-nowrap tw-text-right">
                            {timeSince(mp.created_at)}
                          </span>
                          {isMyComment(mp) && (
                            <CommentOptions
                              isBusy={deletingCommentID === mp.comment_id}
                              onDelete={() => DeleteCommentProcess(mp)}
                            />
                          )}
                        </span>
                      </div>
                      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[4px] tw-mt-[4px]">
                        {/* Mentions are plain "@handle" text (see
                            reusables/hooks/mentions.ts) - escaped, highlighted
                            and linkified here, then sanitized, exactly as the
                            messenger renders message content. */}
                        <span
                          className="cl-comment-section__text cl-text-body tw-leading-[1.5] tw-break-words tw-text-[var(--text)]"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(
                              urlify(
                                highlightMentions(
                                  mp.text ?? "",
                                  "cl-comment-mention",
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
                      </div>
                    )}

                    {!isThread && isOpen && (
                      <div className="cl-comment-section__thread tw-w-full">
                        <PostComment
                          post_id={post_id}
                          parent_id={mp.comment_id}
                          autoFocusComposer={focusedThread === mp.comment_id}
                          onCommentCountChange={onCommentCountChange}
                          onCommentPosted={() =>
                            setExtraReplies((prev) => ({
                              ...prev,
                              [mp.comment_id]: (prev[mp.comment_id] ?? 0) + 1,
                            }))
                          }
                        />
                      </div>
                    )}
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
      {authentication.auth && isThread && composer}
    </div>
  );
}

export default PostComment;
