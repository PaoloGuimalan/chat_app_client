/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useSelector } from "react-redux";
import ReplyingToPreview from "./ReplyingToPreview";
import MessageOptions from "../MessageOptions";
import { IoDocumentOutline } from "react-icons/io5";
import { ContentHandlerProp } from "@/reusables/vars/props";
import { MdOutlineAddReaction } from "react-icons/md";
import { useEffect, useMemo, useRef, useState } from "react";
import EmojiPickerHandler from "./EmojiPickerHandler";
import ReactionsModal from "@/app/widgets/modals/Conversation/ReactionsModal";
import { timeSince, urlify } from "@/reusables/hooks/reusable";
import { SetMessageReactionRequest } from "@/reusables/hooks/requests";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { useTheme } from "@/reusables/design";
import DOMPurify from "dompurify";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getDisplayName = (member: any) => {
  return member?.userID || member?.fullname?.firstName || "someone";
};

/** Distinct emoji shown in the pill before the rest collapse into "+N". */
const MAX_PILL_REACTIONS = 3;

// Collapses cosmetic code-point differences so the same VISIBLE emoji groups as
// one: two clients can send a heart with and without the U+FE0F variation
// selector, or the same hand with different skin-tone modifiers. They render
// identically, so keying on the raw string left what looked like duplicates
// sitting side by side. ZWJ sequences are left alone - those join genuinely
// different emoji and must not be flattened.
const normalizeEmojiKey = (emoji: string) =>
  emoji.replace(/\uFE0F/g, "").replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "");

/**
 * Groups reactions by emoji, mirroring the app's buildReactionPill: ten
 * thumbs-up render as "👍 10" instead of ten identical glyphs clipped at the
 * pill's max width. Insertion-ordered so the pill does not reshuffle as
 * reactions arrive, and each group keeps the first glyph seen for its key.
 */
const groupReactions = (reactions: any[]) => {
  const groups: { key: string; emoji: string; count: number }[] = [];
  const byKey = new Map<string, { key: string; emoji: string; count: number }>();

  for (const reaction of reactions) {
    const emoji = reaction?.emoji ? String(reaction.emoji) : "";
    if (!emoji) continue;

    const key = normalizeEmojiKey(emoji);
    const existing = byKey.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      const group = { key, emoji, count: 1 };
      byKey.set(key, group);
      groups.push(group);
    }
  }

  return groups;
};

const buildMentionRegex = (members: any[]) => {
  const labels = members
    .map((member) => getDisplayName(member))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((label) => escapeRegExp(label));

  if (labels.length === 0) {
    return null;
  }

  return new RegExp(`(^|\\s)@(${labels.join("|")})(?=(?:\\s|[.,!?;:])|$)`, "g");
};

const formatConversationHtml = (content: string, members: any[]) => {
  let formatted = escapeHtml(content);
  const mentionRegex = buildMentionRegex(members);

  if (mentionRegex) {
    formatted = formatted.replace(
      mentionRegex,
      (_match, prefix: string, label: string) =>
        `${prefix}<span class="cl-message-mention">@${label}</span>`,
    );
  }

  return DOMPurify.sanitize(urlify(formatted));
};

function ContentHandler({
  i,
  cnvs,
  conversationsetup,
  members,
  setisReplying,
  setfullImageScreen,
  scrollBottom,
  setunreadmessages,
  theme,
}: ContentHandlerProp) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const { theme: appTheme } = useTheme();

  const [toggleEmojiPicker, settoggleEmojiPicker] = useState<boolean>(false);
  const [reactions, setreactions] = useState<any[]>(
    cnvs.reactions ? cnvs.reactions : [],
  );

  const [toggleReactions, settoggleReactions] = useState<boolean>(false);
  const [isRemovingReaction, setIsRemovingReaction] = useState<boolean>(false);

  // Merge on entityID, not userID: a reaction records the ACTING entity in
  // `entityID` but always the human's account id in `userID`, so a reaction
  // made while switched to a page never matched its (realm) info row and
  // rendered nameless. entityID is also what the server resolves rows by.
  const reactionsWithInfoVar = useMemo(
    () =>
      reactions.map((t1) => ({
        ...t1,
        ...(cnvs.reactionsWithInfo || [])
          .filter((item: any) => item !== null)
          .find((t2: any) => String(t2.entityID) === String(t1.entityID)),
      })),
    [reactions, cnvs.reactions],
  );

  useEffect(() => {
    setreactions(cnvs.reactions ? cnvs.reactions : []);
  }, [cnvs.reactions]);

  // Senders and seeners are ENTITY ids, but usersWithInfo keys `_id` on the
  // account/realm pk and carries the entity id separately as `entityID` (see
  // the usersWithInfo projection in server routes/messages). Matching on
  // `_id` alone therefore never hit and every name fell back to "Someone";
  // `_id` is still checked second so other member shapes keep resolving.
  const getMemberInfo = (entityOrUserID: string) => {
    const member = members.filter(
      (flt: any) =>
        String(flt.entityID) === String(entityOrUserID) ||
        String(flt._id) === String(entityOrUserID),
    );

    if (member.length > 0) {
      return member[0].fullname.firstName;
    }

    return "Someone";
  };

  // ConversationV2 - the component actually routed today - holds the server's
  // conversation info, which names this `conversationType` and uses "channel"
  // for a server's conversation. The legacy Conversation.tsx still passes the
  // redux setup shape with `type`. Read both so the labels below work
  // whichever one mounts; without this the group branch never ran and every
  // group chat rendered a bare "Seen".
  const conversationKind =
    (conversationsetup as any)?.conversationType ?? conversationsetup?.type;
  const isGroupLike =
    conversationKind === "group" ||
    conversationKind === "server" ||
    conversationKind === "channel";

  // Seeners/sender are entity ids, so "is this me" must compare against
  // entity_id - comparing to userID (an account id) never matched, which left
  // the current user in their own "Seen by" list.
  const selfEntityID = authentication.user.entity_id;
  const otherSeeners = (cnvs.seeners || []).filter(
    (mp: any) => mp !== cnvs.sender && mp !== selfEntityID,
  );

  // Reactions are entity-scoped, so "mine" is whichever entity is acting -
  // removing while switched to a page takes away the page's reaction.
  const myReaction = reactions.find(
    (flt: any) => flt.entityID === selfEntityID,
  );

  // The pill shows the first few distinct emoji; anything past that collapses
  // into "+N", where N counts the remaining REACTIONS rather than the remaining
  // emoji kinds - that is the number people read it as.
  const reactionGroups = useMemo(() => groupReactions(reactions), [reactions]);
  const shownReactionGroups = reactionGroups.slice(0, MAX_PILL_REACTIONS);
  const hiddenReactionCount = reactionGroups
    .slice(MAX_PILL_REACTIONS)
    .reduce((sum, group) => sum + group.count, 0);

  /**
   * Single entry point for add / change / remove. `emoji: null` removes.
   * The server pulls the previous reaction before pushing, so selecting a
   * different emoji replaces rather than stacks.
   */
  const setMyReaction = (emoji: string | null) => {
    if (isRemovingReaction) return;
    setIsRemovingReaction(true);
    settoggleEmojiPicker(false);

    const previous = reactions;
    // Optimistic: the pill updates instantly, and restores if the call fails.
    setreactions((prev: any[]) => {
      const withoutMine = prev.filter(
        (flt: any) => flt.entityID !== selfEntityID,
      );
      return emoji
        ? [
            ...withoutMine,
            {
              entityID: selfEntityID,
              userID: authentication.user.userID,
              fullName: authentication.user.fullName,
              emoji,
            },
          ]
        : withoutMine;
    });

    SetMessageReactionRequest({
      conversationID: cnvs.conversationID,
      messageID: cnvs.messageID,
      userID: authentication.user.userID,
      emoji,
    })
      .catch((err) => {
        console.log(err);
        setreactions(previous);
      })
      .finally(() => setIsRemovingReaction(false));
  };

  // Picking the emoji you already have undoes it; picking a different one
  // swaps it.
  const toggleMyReaction = (emoji: string) =>
    setMyReaction(myReaction?.emoji === emoji ? null : emoji);

  const formatMessageClock = (messageDate: any) => {
    if (messageDate?.time) return messageDate.time;
    if (messageDate?.date) return timeSince(messageDate.date);
    return timeSince(messageDate);
  };

  const isCurrentUserSender = cnvs.sender === authentication.user.entity_id;
  const reactionPillStyle =
    isCurrentUserSender && appTheme === "dark"
      ? {
          backgroundColor: theme.primary,
          color: "var(--on-brand)",
          border: `1px solid ${theme.primary}`,
        }
      : {
          backgroundColor:
            "color-mix(in srgb, var(--surface-2) 88%, var(--surface) 12%)",
          color: "var(--text)",
          border: "1px solid var(--border)",
        };
  const deletedBubbleStyle =
    appTheme === "dark"
      ? {
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: "1px dashed var(--border-2)",
          color: "var(--text-2)",
        }
      : {
          backgroundColor: "transparent",
          border: "1px dashed var(--border-2)",
          color: "var(--text-3)",
        };

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    amount: "some", // 0.6 , 0.1
  });

  useEffect(() => {
    if (isInView) {
      if (authentication.user.entity_id) {
        if (!cnvs.seeners.includes(authentication.user.entity_id)) {
          setunreadmessages((prev) => {
            const prevWithoutMessageID = prev.filter(
              (flt) => flt !== cnvs.messageID,
            );

            return [cnvs.messageID, ...prevWithoutMessageID];
          });
        }
      }
    }
  }, [isInView, authentication.user.entity_id]);

  if (cnvs.isDeleted) {
    return (
      <motion.div ref={ref} className="div_messages_result tw-items-center">
        <motion.div
          initial={{
            marginLeft:
              cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
            alignItems:
              cnvs.sender == authentication.user.entity_id
                ? "flex-end"
                : "flex-start",
          }}
          animate={{
            marginLeft:
              cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
            alignItems:
              cnvs.sender == authentication.user.entity_id
                ? "flex-end"
                : "flex-start",
          }}
          className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
        >
          {cnvs.isReply && (
            <span className="span_sender_reply_label">
              replied to{" "}
              {cnvs.replyedmessage[0].sender === authentication.user.userID
                ? "your message"
                : `${getMemberInfo(cnvs.replyedmessage[0].sender)}`}
            </span>
          )}
          {isGroupLike && selfEntityID != cnvs.sender && (
            <span className="span_sender_label">
              {getMemberInfo(cnvs.sender)}
            </span>
          )}
          {cnvs.isReply && (
            <ReplyingToPreview
              cnvs={cnvs.replyedmessage[0]}
              fromOther={authentication.user.userID}
              yourReply={
                cnvs.sender == authentication.user.entity_id ? true : false
              }
              theme={theme}
            />
          )}
          <motion.div
            title={
              cnvs.messageDate.time
                ? `${cnvs.messageDate.date} ${cnvs.messageDate.time}`
                : cnvs.messageDate.date
                  ? timeSince(cnvs.messageDate.date)
                  : timeSince(cnvs.messageDate)
            }
            initial={{
              ...deletedBubbleStyle,
              // marginLeft: cnvs.sender == authentication.user.entity_id? "auto" : "0px"
            }}
            animate={{
              ...deletedBubbleStyle,
              // marginLeft: cnvs.sender == authentication.user.entity_id? "auto" : "0px"
            }}
            className="span_messages_result c1 cl-message-bubble cl-message-bubble--deleted tw-flex tw-flex-col tw-gap-[2px]"
          >
            <span>Message deleted</span>
            <span
              className={`cl-message-time ${
                cnvs.sender == authentication.user.entity_id
                  ? ""
                  : "cl-message-time--incoming"
              } cl-message-time--deleted`}
            >
              {formatMessageClock(cnvs.messageDate)}
            </span>
          </motion.div>
          {isGroupLike
            ? i === 0 &&
              otherSeeners.length > 0 && ( //conversationList.length - 1 == i
                <motion.div
                  initial={{
                    justifyContent:
                      cnvs.sender == authentication.user.entity_id
                        ? "flex-end"
                        : "flex-start",
                  }}
                  animate={{
                    justifyContent:
                      cnvs.sender == authentication.user.entity_id
                        ? "flex-end"
                        : "flex-start",
                  }}
                  className="div_seen_container"
                >
                  <span className="span_seenby">Seen by </span>
                  {otherSeeners.map((mp: any, i: number) => (
                    <span className="span_seenby" key={i}>
                      {getMemberInfo(mp)}
                    </span>
                  ))}
                </motion.div>
              )
            : i === 0 &&
              otherSeeners.length > 0 && (
                <motion.div
                  initial={{
                    justifyContent:
                      cnvs.sender == authentication.user.entity_id
                        ? "flex-end"
                        : "flex-start",
                  }}
                  animate={{
                    justifyContent:
                      cnvs.sender == authentication.user.entity_id
                        ? "flex-end"
                        : "flex-start",
                  }}
                  className="div_seen_container"
                >
                  <span className="span_seenby">Seen</span>
                </motion.div>
              )}
        </motion.div>
      </motion.div>
    );
  } else {
    if (cnvs.messageType == "text") {
      return (
        <motion.div ref={ref} className="div_messages_result tw-items-center">
          {cnvs.sender === authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="sender"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
          <motion.div
            initial={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
          >
            {cnvs.isReply && (
              <span className="span_sender_reply_label">
                replied to{" "}
                {cnvs.replyedmessage[0].sender === authentication.user.userID
                  ? "your message"
                  : `${getMemberInfo(cnvs.replyedmessage[0].sender)}`}
              </span>
            )}
            {isGroupLike && selfEntityID != cnvs.sender && (
              <span className="span_sender_label tw-font-Inter">
                {getMemberInfo(cnvs.sender)}
              </span>
            )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.entity_id ? true : false
                }
                theme={theme}
              />
            )}
            <motion.div
              title={
                cnvs.messageDate.time
                  ? `${cnvs.messageDate.date} ${cnvs.messageDate.time}`
                  : cnvs.messageDate.date
                    ? timeSince(cnvs.messageDate.date)
                    : timeSince(cnvs.messageDate)
              }
              initial={{
                backgroundColor:
                  cnvs.sender == authentication.user.entity_id
                    ? theme.primary
                    : "var(--surface)",
                border:
                  cnvs.sender == authentication.user.entity_id
                    ? `solid 1px ${theme.primary}`
                    : "solid 1px var(--border)",
                color:
                  cnvs.sender == authentication.user.entity_id
                    ? "white"
                    : "var(--text)",
                // marginLeft: cnvs.sender == authentication.user.entity_id? "auto" : "0px"
              }}
              animate={{
                backgroundColor:
                  cnvs.sender == authentication.user.entity_id
                    ? theme.primary
                    : "var(--surface)",
                border:
                  cnvs.sender == authentication.user.entity_id
                    ? `solid 1px ${theme.primary}`
                    : "solid 1px var(--border)",
                color:
                  cnvs.sender == authentication.user.entity_id
                    ? "white"
                    : "var(--text)",
                // marginLeft: cnvs.sender == authentication.user.entity_id? "auto" : "0px"
              }}
              style={
                cnvs.linkPreview?.embed_layout === "portrait"
                  ? { width: "380px" }
                  : undefined
              }
              className="span_messages_result c1 cl-message-bubble cl-message-bubble--text tw-mb-[7px] tw-flex tw-flex-col tw-gap-[2px]"
            >
              <span
                className="tw-whitespace-pre-line"
                dangerouslySetInnerHTML={{
                  __html: formatConversationHtml(cnvs.content, members ?? []),
                }}
              />
              {cnvs.linkPreview && (
                <LinkPreviewCard preview={cnvs.linkPreview} variant="display" />
              )}
              <span
                className={`cl-message-time ${
                  cnvs.sender == authentication.user.entity_id
                    ? ""
                    : "cl-message-time--incoming"
                }`}
              >
                {formatMessageClock(cnvs.messageDate)}
              </span>
              <div
                className={`tw-w-full tw--mb-[15px] tw-mt-[5px] tw-bg-transparent tw-flex tw-flex-row tw-items-center ${
                  cnvs.sender == authentication.user.entity_id
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="cl-message-reaction-pill tw-w-fit tw-rounded-[20px] tw-h-[20px] tw-text-[var(--text)] tw-px-[6px]"
                  style={reactionPillStyle}
                >
                  <AnimatePresence>
                    {toggleEmojiPicker && (
                      <EmojiPickerHandler
                        key="emoji-picker"
                        conversationID={cnvs.conversationID}
                        messageID={cnvs.messageID}
                        fromSender={
                          cnvs.sender == authentication.user.entity_id
                            ? true
                            : false
                        }
                        settoggleEmojiPicker={settoggleEmojiPicker}
                        myReactionEmoji={myReaction?.emoji ?? null}
                        onSelect={toggleMyReaction}
                      />
                    )}
                  </AnimatePresence>
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[135px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        selfEntityID={selfEntityID}
                        onRemoveOwn={() => {
                          settoggleReactions(false);
                          setMyReaction(null);
                        }}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {/* The count is dropped at 1: "👍 1" is just noise. */}
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    <button
                      title={myReaction ? "Change your reaction" : "Add a reaction"}
                      disabled={isRemovingReaction}
                      onClick={() => {
                        settoggleEmojiPicker(!toggleEmojiPicker);
                      }}
                      className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                    >
                      <MdOutlineAddReaction
                        style={myReaction ? { color: "var(--brand)" } : undefined}
                      />
                    </button>
                    {cnvs.sender !== authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            {isGroupLike
              ? i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {otherSeeners.map((mp: any, i: number) => (
                      <span className="span_seenby" key={i}>
                        {getMemberInfo(mp)}
                      </span>
                    ))}
                  </motion.div>
                )
              : i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="receiver"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
        </motion.div>
      );
    } else if (cnvs.messageType == "image") {
      return (
        <motion.div
          ref={ref}
          className="div_pending_images div_messages_result"
        >
          {cnvs.sender === authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="sender"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
          <motion.div
            initial={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
          >
            {cnvs.isReply && (
              <span className="span_sender_reply_label">
                replied to{" "}
                {cnvs.replyedmessage[0].sender === authentication.user.userID
                  ? "your message"
                  : `${getMemberInfo(cnvs.replyedmessage[0].sender)}`}
              </span>
            )}
            {isGroupLike && selfEntityID != cnvs.sender && (
              <span className="span_sender_label">
                {getMemberInfo(cnvs.sender)}
              </span>
            )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.entity_id ? true : false
                }
                theme={theme}
              />
            )}
            <div
              className="div_pending_content_container"
              title={
                cnvs.messageDate.time
                  ? `${cnvs.messageDate.date} ${cnvs.messageDate.time}`
                  : cnvs.messageDate.date
                    ? timeSince(cnvs.messageDate.date)
                    : timeSince(cnvs.messageDate)
              }
            >
              <CachedImage
                src={cnvs.content}
                className="img_pending_images"
                onClick={() => {
                  setfullImageScreen({
                    preview: cnvs.content,
                    toggle: true,
                  });
                }}
                onLoad={() => {
                  scrollBottom();
                }}
              />
              <div
                className={`tw-w-[calc(100%-14px)] tw-pl-[7px] tw-pr-[7px] tw-mb-[0px] tw--mt-[15px] tw-bg-transparent tw-flex tw-flex-row tw-items-center ${
                  cnvs.sender == authentication.user.entity_id
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="cl-message-reaction-pill tw-w-fit tw-rounded-[20px] tw-h-[20px] tw-text-[var(--text)] tw-px-[6px]"
                  style={reactionPillStyle}
                >
                  <AnimatePresence>
                    {toggleEmojiPicker && (
                      <EmojiPickerHandler
                        key="emoji-picker"
                        conversationID={cnvs.conversationID}
                        messageID={cnvs.messageID}
                        fromSender={
                          cnvs.sender == authentication.user.entity_id
                            ? true
                            : false
                        }
                        settoggleEmojiPicker={settoggleEmojiPicker}
                        myReactionEmoji={myReaction?.emoji ?? null}
                        onSelect={toggleMyReaction}
                      />
                    )}
                  </AnimatePresence>
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[135px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        selfEntityID={selfEntityID}
                        onRemoveOwn={() => {
                          settoggleReactions(false);
                          setMyReaction(null);
                        }}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {/* The count is dropped at 1: "👍 1" is just noise. */}
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    <button
                      title={myReaction ? "Change your reaction" : "Add a reaction"}
                      disabled={isRemovingReaction}
                      onClick={() => {
                        settoggleEmojiPicker(!toggleEmojiPicker);
                      }}
                      className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                    >
                      <MdOutlineAddReaction
                        style={myReaction ? { color: "var(--brand)" } : undefined}
                      />
                    </button>
                    {cnvs.sender !== authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {isGroupLike
              ? i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {otherSeeners.map((mp: any, i: number) => (
                      <span className="span_seenby" key={i}>
                        {getMemberInfo(mp)}
                      </span>
                    ))}
                  </motion.div>
                )
              : i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="receiver"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
        </motion.div>
      );
    } else if (cnvs.messageType.includes("video")) {
      return (
        <motion.div
          ref={ref}
          className="div_pending_images div_messages_result"
        >
          {cnvs.sender === authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="sender"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
          <motion.div
            initial={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
          >
            {cnvs.isReply && (
              <span className="span_sender_reply_label">
                replied to{" "}
                {cnvs.replyedmessage[0].sender === authentication.user.userID
                  ? "your message"
                  : `${getMemberInfo(cnvs.replyedmessage[0].sender)}`}
              </span>
            )}
            {isGroupLike && selfEntityID != cnvs.sender && (
              <span className="span_sender_label">
                {getMemberInfo(cnvs.sender)}
              </span>
            )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.entity_id ? true : false
                }
                theme={theme}
              />
            )}
            <div
              className="div_pending_content_container"
              title={
                cnvs.messageDate.time
                  ? `${cnvs.messageDate.date} ${cnvs.messageDate.time}`
                  : cnvs.messageDate.date
                    ? timeSince(cnvs.messageDate.date)
                    : timeSince(cnvs.messageDate)
              }
            >
              <video
                src={cnvs.content.split("%%%")[0].replace("###", "%23%23%23")}
                controls
                style={{ border: "solid 1px #e9e9e9" }}
                className="tw-rounded-[7px] tw-w-full tw-h-[300px]"
                onLoad={() => {
                  scrollBottom();
                }}
              />
              <div
                className={`tw-w-[calc(100%-14px)] tw-pl-[7px] tw-pr-[7px] tw-mb-[0px] tw--mt-[2px] tw-bg-transparent tw-flex tw-flex-row tw-items-center ${
                  cnvs.sender == authentication.user.entity_id
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="cl-message-reaction-pill tw-w-fit tw-rounded-[20px] tw-h-[20px] tw-text-[var(--text)] tw-px-[6px]"
                  style={reactionPillStyle}
                >
                  <AnimatePresence>
                    {toggleEmojiPicker && (
                      <EmojiPickerHandler
                        key="emoji-picker"
                        conversationID={cnvs.conversationID}
                        messageID={cnvs.messageID}
                        fromSender={
                          cnvs.sender == authentication.user.entity_id
                            ? true
                            : false
                        }
                        settoggleEmojiPicker={settoggleEmojiPicker}
                        myReactionEmoji={myReaction?.emoji ?? null}
                        onSelect={toggleMyReaction}
                      />
                    )}
                  </AnimatePresence>
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[135px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        selfEntityID={selfEntityID}
                        onRemoveOwn={() => {
                          settoggleReactions(false);
                          setMyReaction(null);
                        }}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {/* The count is dropped at 1: "👍 1" is just noise. */}
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    <button
                      title={myReaction ? "Change your reaction" : "Add a reaction"}
                      disabled={isRemovingReaction}
                      onClick={() => {
                        settoggleEmojiPicker(!toggleEmojiPicker);
                      }}
                      className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                    >
                      <MdOutlineAddReaction
                        style={myReaction ? { color: "var(--brand)" } : undefined}
                      />
                    </button>
                    {cnvs.sender !== authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {isGroupLike
              ? i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {otherSeeners.map((mp: any, i: number) => (
                      <span className="span_seenby" key={i}>
                        {getMemberInfo(mp)}
                      </span>
                    ))}
                  </motion.div>
                )
              : i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="receiver"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
        </motion.div>
      );
    } else if (cnvs.messageType.includes("audio")) {
      return (
        <motion.div
          ref={ref}
          className="div_pending_audios div_messages_result"
        >
          {cnvs.sender === authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="sender"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
          <motion.div
            initial={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
          >
            {cnvs.isReply && (
              <span className="span_sender_reply_label">
                replied to{" "}
                {cnvs.replyedmessage[0].sender === authentication.user.userID
                  ? "your message"
                  : `${getMemberInfo(cnvs.replyedmessage[0].sender)}`}
              </span>
            )}
            {isGroupLike && selfEntityID != cnvs.sender && (
              <span className="span_sender_label">{cnvs.sender}</span>
            )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.entity_id ? true : false
                }
                theme={theme}
              />
            )}
            <div
              className="tw-w-full"
              title={
                cnvs.messageDate.time
                  ? `${cnvs.messageDate.date} ${cnvs.messageDate.time}`
                  : cnvs.messageDate.date
                    ? timeSince(cnvs.messageDate.date)
                    : timeSince(cnvs.messageDate)
              }
            >
              <VoiceMessagePlayer
                src={cnvs.content.split("%%%")[0].replace("###", "%23%23%23")}
                isSender={isCurrentUserSender}
                accentColor={theme.primary}
                onReady={scrollBottom}
              />
              <div
                className={`tw-w-[calc(100%-14px)] tw-pl-[7px] tw-pr-[7px] tw-mb-[0px] tw--mt-[10px] tw-bg-transparent tw-flex tw-flex-row tw-items-center ${
                  cnvs.sender == authentication.user.entity_id
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="cl-message-reaction-pill tw-w-fit tw-rounded-[20px] tw-h-[20px] tw-text-[var(--text)] tw-px-[6px]"
                  style={reactionPillStyle}
                >
                  <AnimatePresence>
                    {toggleEmojiPicker && (
                      <EmojiPickerHandler
                        key="emoji-picker"
                        conversationID={cnvs.conversationID}
                        messageID={cnvs.messageID}
                        fromSender={
                          cnvs.sender == authentication.user.entity_id
                            ? true
                            : false
                        }
                        settoggleEmojiPicker={settoggleEmojiPicker}
                        myReactionEmoji={myReaction?.emoji ?? null}
                        onSelect={toggleMyReaction}
                      />
                    )}
                  </AnimatePresence>
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[135px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        selfEntityID={selfEntityID}
                        onRemoveOwn={() => {
                          settoggleReactions(false);
                          setMyReaction(null);
                        }}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {/* The count is dropped at 1: "👍 1" is just noise. */}
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    <button
                      title={myReaction ? "Change your reaction" : "Add a reaction"}
                      disabled={isRemovingReaction}
                      onClick={() => {
                        settoggleEmojiPicker(!toggleEmojiPicker);
                      }}
                      className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                    >
                      <MdOutlineAddReaction
                        style={myReaction ? { color: "var(--brand)" } : undefined}
                      />
                    </button>
                    {cnvs.sender !== authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {isGroupLike
              ? i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {otherSeeners.map((mp: any, i: number) => (
                      <span className="span_seenby" key={i}>
                        {getMemberInfo(mp)}
                      </span>
                    ))}
                  </motion.div>
                )
              : i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="receiver"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
        </motion.div>
      );
    } else if (cnvs.messageType.includes("notif")) {
      return (
        <div
          key={i}
          ref={ref}
          className="tw-w-full tw-pt-[5px] tw-pb-[10px] div_messages_result tw-justify-center"
        >
          <span className="cl-conversation-system-message tw-w-full tw-text-center">
            {cnvs.content}
          </span>
        </div>
      );
    } else {
      return (
        <motion.div
          ref={ref}
          className="div_pending_images div_messages_result"
        >
          {cnvs.sender === authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="sender"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
          <motion.div
            initial={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.entity_id ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.entity_id
                  ? "flex-end"
                  : "flex-start",
            }}
            className="tw-flex tw-flex-col tw-w-full tw-max-w-[70%]"
          >
            {cnvs.isReply && (
              <span className="span_sender_reply_label">
                replied to{" "}
                {cnvs.replyedmessage[0].sender === authentication.user.userID
                  ? "your message"
                  : `${getMemberInfo(cnvs.replyedmessage[0].sender)}`}
              </span>
            )}
            {isGroupLike && selfEntityID != cnvs.sender && (
              <span className="span_sender_label">
                {getMemberInfo(cnvs.sender)}
              </span>
            )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.entity_id ? true : false
                }
                theme={theme}
              />
            )}
            <div className="tw-w-full tw-flex tw-flex-col">
              <div
                onClick={() => {
                  if (cnvs.content.includes("storage.googleapis.com")) {
                    window.open(
                      cnvs.content.split("%%%")[0].replace("###", "%23%23%23"),
                      "_blank",
                    );
                  } else {
                    window.open(cnvs.content, "_blank");
                  }
                }}
                className="cl-message-file-card tw-w-full tw-h-[70px] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px]"
                style={{
                  backgroundColor: "var(--surface-2)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  boxSizing: "border-box",
                }}
                title={
                  cnvs.messageDate.time
                    ? `${cnvs.messageDate.date} ${cnvs.messageDate.time}`
                    : cnvs.messageDate.date
                      ? timeSince(cnvs.messageDate.date)
                      : timeSince(cnvs.messageDate)
                }
              >
                <div className="tw-w-full tw-max-w-[40px]">
                  <IoDocumentOutline style={{ fontSize: "40px" }} />
                </div>
                <span className="cl-text-caption tw-break-all ellipsis-3-lines tw-font-semibold">
                  {cnvs.content.includes("storage.googleapis.com")
                    ? cnvs.content.split("%%%")[1]
                    : cnvs.content.split("/")[
                        cnvs.content.split("/").length - 1
                      ]}
                </span>
              </div>
              <div
                className={`tw-w-[calc(100%-14px)] tw-pl-[7px] tw-pr-[7px] tw-mb-[4px] tw--mt-[7px] tw-bg-transparent tw-flex tw-flex-row tw-items-center ${
                  cnvs.sender == authentication.user.entity_id
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="cl-message-reaction-pill tw-w-fit tw-rounded-[20px] tw-h-[20px] tw-text-[var(--text)] tw-px-[6px]"
                  style={reactionPillStyle}
                >
                  <AnimatePresence>
                    {toggleEmojiPicker && (
                      <EmojiPickerHandler
                        key="emoji-picker"
                        conversationID={cnvs.conversationID}
                        messageID={cnvs.messageID}
                        fromSender={
                          cnvs.sender == authentication.user.entity_id
                            ? true
                            : false
                        }
                        settoggleEmojiPicker={settoggleEmojiPicker}
                        myReactionEmoji={myReaction?.emoji ?? null}
                        onSelect={toggleMyReaction}
                      />
                    )}
                  </AnimatePresence>
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[135px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        selfEntityID={selfEntityID}
                        onRemoveOwn={() => {
                          settoggleReactions(false);
                          setMyReaction(null);
                        }}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {/* The count is dropped at 1: "👍 1" is just noise. */}
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    <button
                      title={myReaction ? "Change your reaction" : "Add a reaction"}
                      disabled={isRemovingReaction}
                      onClick={() => {
                        settoggleEmojiPicker(!toggleEmojiPicker);
                      }}
                      className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                    >
                      <MdOutlineAddReaction
                        style={myReaction ? { color: "var(--brand)" } : undefined}
                      />
                    </button>
                    {cnvs.sender !== authentication.user.entity_id &&
                      hiddenReactionCount > 0 && (
                        <span
                          className="cl-text-micro tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{hiddenReactionCount}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.entity_id && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-row tw-items-center tw-gap-[3px] tw-overflow-hidden"
                      >
                        {shownReactionGroups.map((group) => (
                          <span
                            key={group.key}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[2px]"
                          >
                            <span>{group.emoji}</span>
                            {group.count > 1 && (
                              <span
                                className="cl-text-micro"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {group.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {isGroupLike
              ? i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {otherSeeners.map((mp: any, i: number) => (
                      <span className="span_seenby" key={i}>
                        {getMemberInfo(mp)}
                      </span>
                    ))}
                  </motion.div>
                )
              : i === 0 &&
                otherSeeners.length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.entity_id
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.entity_id && (
            <MessageOptions
              conversationID={cnvs.conversationID}
              messageID={cnvs.messageID}
              type="receiver"
              setisReplying={() => {
                setisReplying({ isReply: true, replyingTo: cnvs.messageID });
              }}
            />
          )}
        </motion.div>
      );
    }
  }
}

export default ContentHandler;
