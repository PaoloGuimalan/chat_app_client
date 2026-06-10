/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion, useInView } from "framer-motion";
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
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";

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

  const [toggleEmojiPicker, settoggleEmojiPicker] = useState<boolean>(false);
  const [reactions, setreactions] = useState<any[]>(
    cnvs.reactions ? cnvs.reactions : [],
  );

  const [toggleReactions, settoggleReactions] = useState<boolean>(false);

  const reactionsWithInfoVar = useMemo(
    () =>
      reactions.map((t1) => ({
        ...t1,
        ...cnvs.reactionsWithInfo.find((t2: any) => t2.userID === t1.userID),
      })),
    [reactions, cnvs.reactions],
  );

  useEffect(() => {
    setreactions(cnvs.reactions ? cnvs.reactions : []);
  }, [cnvs.reactions]);

  const getMemberInfo = (userID: string) => {
    const member = members.filter((flt) => flt._id === userID);

    if (member.length > 0) {
      return member[0].fullname.firstName;
    }

    return "Someone";
  };

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    amount: "some", // 0.6 , 0.1
  });

  useEffect(() => {
    if (isInView) {
      if (authentication.user.userID) {
        if (!cnvs.seeners.includes(authentication.user.userID)) {
          setunreadmessages((prev) => {
            const prevWithoutMessageID = prev.filter(
              (flt) => flt !== cnvs.messageID,
            );

            return [cnvs.messageID, ...prevWithoutMessageID];
          });
        }
      }
    }
  }, [isInView, authentication.user.userID]);

  if (cnvs.isDeleted) {
    return (
      <motion.div ref={ref} className="div_messages_result tw-items-center">
        <motion.div
          initial={{
            marginLeft:
              cnvs.sender == authentication.user.userID ? "auto" : "0px",
            alignItems:
              cnvs.sender == authentication.user.userID
                ? "flex-end"
                : "flex-start",
          }}
          animate={{
            marginLeft:
              cnvs.sender == authentication.user.userID ? "auto" : "0px",
            alignItems:
              cnvs.sender == authentication.user.userID
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
          {conversationsetup.type == "group" &&
            authentication.user.userID != cnvs.sender && (
              <span className="span_sender_label">
                {getMemberInfo(cnvs.sender)}
              </span>
            )}
          {cnvs.isReply && (
            <ReplyingToPreview
              cnvs={cnvs.replyedmessage[0]}
              fromOther={authentication.user.userID}
              yourReply={
                cnvs.sender == authentication.user.userID ? true : false
              }
              theme={theme}
            />
          )}
          <motion.span
            title={
              cnvs.messageDate.time
                ? `${cnvs.messageDate.date} ${cnvs.messageDate.time}`
                : cnvs.messageDate.date
                  ? timeSince(cnvs.messageDate.date)
                  : timeSince(cnvs.messageDate)
            }
            initial={{
              backgroundColor:
                cnvs.sender == authentication.user.userID ? "white" : "white",
              border:
                cnvs.sender == authentication.user.userID
                  ? "solid 1px ${theme.primary}"
                  : "solid 1px rgb(222, 222, 222)",
              color:
                cnvs.sender == authentication.user.userID ? "white" : "#3b3b3b",
              // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
            }}
            animate={{
              backgroundColor:
                cnvs.sender == authentication.user.userID ? "white" : "white",
              border:
                cnvs.sender == authentication.user.userID
                  ? "solid 1px rgb(222, 222, 222)"
                  : "solid 1px rgb(222, 222, 222)",
              color:
                cnvs.sender == authentication.user.userID
                  ? "rgb(222, 222, 222)"
                  : "rgb(222, 222, 222)",
              // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
            }}
            className="span_messages_result c1"
          >
            Message deleted
          </motion.span>
          {conversationsetup.type == "group" ||
          conversationsetup.type == "server"
            ? i === 0 &&
              cnvs.seeners.filter(
                (mp: any) =>
                  mp != cnvs.sender && mp != authentication.user.userID,
              ).length > 0 && ( //conversationList.length - 1 == i
                <motion.div
                  initial={{
                    justifyContent:
                      cnvs.sender == authentication.user.userID
                        ? "flex-end"
                        : "flex-start",
                  }}
                  animate={{
                    justifyContent:
                      cnvs.sender == authentication.user.userID
                        ? "flex-end"
                        : "flex-start",
                  }}
                  className="div_seen_container"
                >
                  <span className="span_seenby">Seen by </span>
                  {cnvs.seeners
                    .filter(
                      (mp: any) =>
                        mp != cnvs.sender && mp != authentication.user.userID,
                    )
                    .map((mp: any, i: number) => {
                      if (
                        mp != authentication.user.userID &&
                        mp != cnvs.sender
                      ) {
                        return (
                          <span className="span_seenby" key={i}>
                            {getMemberInfo(mp)}
                          </span>
                        );
                      }
                    })}
                </motion.div>
              )
            : i === 0 &&
              cnvs.seeners.filter(
                (mp: any) =>
                  mp != cnvs.sender && mp != authentication.user.userID,
              ).length > 0 && (
                <motion.div
                  initial={{
                    justifyContent:
                      cnvs.sender == authentication.user.userID
                        ? "flex-end"
                        : "flex-start",
                  }}
                  animate={{
                    justifyContent:
                      cnvs.sender == authentication.user.userID
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
          {cnvs.sender === authentication.user.userID && (
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
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
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
            {(conversationsetup.type == "group" ||
              conversationsetup.type == "server") &&
              authentication.user.userID != cnvs.sender && (
                <span className="span_sender_label tw-font-Inter">
                  {getMemberInfo(cnvs.sender)}
                </span>
              )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.userID ? true : false
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
                  cnvs.sender == authentication.user.userID
                    ? theme.primary
                    : "rgb(222, 222, 222)",
                border:
                  cnvs.sender == authentication.user.userID
                    ? `solid 1px ${theme.primary}`
                    : "solid 1px rgb(222, 222, 222)",
                color:
                  cnvs.sender == authentication.user.userID
                    ? "white"
                    : "#3b3b3b",
                // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
              }}
              animate={{
                backgroundColor:
                  cnvs.sender == authentication.user.userID
                    ? theme.primary
                    : "rgb(222, 222, 222)",
                border:
                  cnvs.sender == authentication.user.userID
                    ? `solid 1px ${theme.primary}`
                    : "solid 1px rgb(222, 222, 222)",
                color:
                  cnvs.sender == authentication.user.userID
                    ? "white"
                    : "#3b3b3b",
                // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
              }}
              className="span_messages_result c1 tw-mb-[7px]"
            >
              <span
                className="tw-whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: urlify(cnvs.content) }}
              />
              <span className="cl-message-inline-time">
                {cnvs.messageDate.time
                  ? cnvs.messageDate.time
                  : cnvs.messageDate.date
                    ? timeSince(cnvs.messageDate.date)
                    : timeSince(cnvs.messageDate)}
              </span>
              <div
                className={`tw-w-full tw--mb-[15px] tw-mt-[5px] tw-bg-transparent tw-flex tw-flex-row tw-items-center ${
                  cnvs.sender == authentication.user.userID
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="tw-w-fit tw-bg-white tw-rounded-[20px] tw-h-[20px] tw-text-[#3b3b3b] tw-pl-[2px] tw-pr-[2px]"
                  style={{
                    border: "solid 1px rgb(222, 222, 222)",
                  }}
                >
                  {toggleEmojiPicker && (
                    <EmojiPickerHandler
                      conversationID={cnvs.conversationID}
                      messageID={cnvs.messageID}
                      fromSender={
                        cnvs.sender == authentication.user.userID ? true : false
                      }
                      settoggleEmojiPicker={settoggleEmojiPicker}
                      setreactions={setreactions}
                    />
                  )}
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[100px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {reactions.filter(
                      (flt: any) => flt.userID === authentication.user.userID,
                    ).length === 0 && (
                      <button
                        onClick={() => {
                          settoggleEmojiPicker(!toggleEmojiPicker);
                        }}
                        className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                      >
                        <MdOutlineAddReaction />
                      </button>
                    )}
                    {cnvs.sender !== authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            {conversationsetup.type == "group" ||
            conversationsetup.type == "server"
              ? i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {cnvs.seeners
                      .filter(
                        (mp: any) =>
                          mp != cnvs.sender && mp != authentication.user.userID,
                      )
                      .map((mp: any, i: number) => {
                        if (
                          mp != authentication.user.userID &&
                          mp != cnvs.sender
                        ) {
                          return (
                            <span className="span_seenby" key={i}>
                              {getMemberInfo(mp)}
                            </span>
                          );
                        }
                      })}
                  </motion.div>
                )
              : i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.userID && (
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
          {cnvs.sender === authentication.user.userID && (
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
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
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
            {(conversationsetup.type == "group" ||
              conversationsetup.type == "server") &&
              authentication.user.userID != cnvs.sender && (
                <span className="span_sender_label">
                  {getMemberInfo(cnvs.sender)}
                </span>
              )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.userID ? true : false
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
                  cnvs.sender == authentication.user.userID
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="tw-w-fit tw-bg-white tw-rounded-[20px] tw-h-[20px] tw-text-[#3b3b3b] tw-pl-[2px] tw-pr-[2px]"
                  style={{
                    border: "solid 1px rgb(222, 222, 222)",
                  }}
                >
                  {toggleEmojiPicker && (
                    <EmojiPickerHandler
                      conversationID={cnvs.conversationID}
                      messageID={cnvs.messageID}
                      fromSender={
                        cnvs.sender == authentication.user.userID ? true : false
                      }
                      settoggleEmojiPicker={settoggleEmojiPicker}
                      setreactions={setreactions}
                    />
                  )}
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[100px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {reactions.filter(
                      (flt: any) => flt.userID === authentication.user.userID,
                    ).length === 0 && (
                      <button
                        onClick={() => {
                          settoggleEmojiPicker(!toggleEmojiPicker);
                        }}
                        className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                      >
                        <MdOutlineAddReaction />
                      </button>
                    )}
                    {cnvs.sender !== authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {conversationsetup.type == "group" ||
            conversationsetup.type == "server"
              ? i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {cnvs.seeners
                      .filter((mp: any) => mp != cnvs.sender)
                      .map((mp: any, i: number) => {
                        if (mp != authentication.user.userID) {
                          return (
                            <span className="span_seenby" key={i}>
                              {getMemberInfo(mp)}
                            </span>
                          );
                        }
                      })}
                  </motion.div>
                )
              : i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.userID && (
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
          {cnvs.sender === authentication.user.userID && (
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
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
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
            {(conversationsetup.type == "group" ||
              conversationsetup.type == "server") &&
              authentication.user.userID != cnvs.sender && (
                <span className="span_sender_label">
                  {getMemberInfo(cnvs.sender)}
                </span>
              )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.userID ? true : false
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
                  cnvs.sender == authentication.user.userID
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="tw-w-fit tw-bg-white tw-rounded-[20px] tw-h-[20px] tw-text-[#3b3b3b] tw-pl-[2px] tw-pr-[2px]"
                  style={{
                    border: "solid 1px rgb(222, 222, 222)",
                  }}
                >
                  {toggleEmojiPicker && (
                    <EmojiPickerHandler
                      conversationID={cnvs.conversationID}
                      messageID={cnvs.messageID}
                      fromSender={
                        cnvs.sender == authentication.user.userID ? true : false
                      }
                      settoggleEmojiPicker={settoggleEmojiPicker}
                      setreactions={setreactions}
                    />
                  )}
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[100px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {reactions.filter(
                      (flt: any) => flt.userID === authentication.user.userID,
                    ).length === 0 && (
                      <button
                        onClick={() => {
                          settoggleEmojiPicker(!toggleEmojiPicker);
                        }}
                        className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                      >
                        <MdOutlineAddReaction />
                      </button>
                    )}
                    {cnvs.sender !== authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {conversationsetup.type == "group" ||
            conversationsetup.type == "server"
              ? i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {cnvs.seeners
                      .filter((mp: any) => mp != cnvs.sender)
                      .map((mp: any, i: number) => {
                        if (mp != authentication.user.userID) {
                          return (
                            <span className="span_seenby" key={i}>
                              {getMemberInfo(mp)}
                            </span>
                          );
                        }
                      })}
                  </motion.div>
                )
              : i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.userID && (
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
          {cnvs.sender === authentication.user.userID && (
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
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
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
            {(conversationsetup.type == "group" ||
              conversationsetup.type == "server") &&
              authentication.user.userID != cnvs.sender && (
                <span className="span_sender_label">{cnvs.sender}</span>
              )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.userID ? true : false
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
              <div className="tw-w-full tw-bg-[#f1f3f4] tw-pb-[5px] tw-rounded-[7px]">
                <audio
                  src={cnvs.content.split("%%%")[0].replace("###", "%23%23%23")}
                  controls
                  className="tw-w-full tw-border-[7px]"
                  onLoad={() => {
                    scrollBottom();
                  }}
                />
              </div>
              <div
                className={`tw-w-[calc(100%-14px)] tw-pl-[7px] tw-pr-[7px] tw-mb-[0px] tw--mt-[10px] tw-bg-transparent tw-flex tw-flex-row tw-items-center ${
                  cnvs.sender == authentication.user.userID
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="tw-w-fit tw-bg-white tw-rounded-[20px] tw-h-[20px] tw-text-[#3b3b3b] tw-pl-[2px] tw-pr-[2px]"
                  style={{
                    border: "solid 1px rgb(222, 222, 222)",
                  }}
                >
                  {toggleEmojiPicker && (
                    <EmojiPickerHandler
                      conversationID={cnvs.conversationID}
                      messageID={cnvs.messageID}
                      fromSender={
                        cnvs.sender == authentication.user.userID ? true : false
                      }
                      settoggleEmojiPicker={settoggleEmojiPicker}
                      setreactions={setreactions}
                    />
                  )}
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[100px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {reactions.filter(
                      (flt: any) => flt.userID === authentication.user.userID,
                    ).length === 0 && (
                      <button
                        onClick={() => {
                          settoggleEmojiPicker(!toggleEmojiPicker);
                        }}
                        className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                      >
                        <MdOutlineAddReaction />
                      </button>
                    )}
                    {cnvs.sender !== authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {conversationsetup.type == "group" ||
            conversationsetup.type == "server"
              ? i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {cnvs.seeners
                      .filter((mp: any) => mp != cnvs.sender)
                      .map((mp: any, i: number) => {
                        if (mp != authentication.user.userID) {
                          return (
                            <span className="span_seenby" key={i}>
                              {getMemberInfo(mp)}
                            </span>
                          );
                        }
                      })}
                  </motion.div>
                )
              : i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.userID && (
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
          <span className="tw-text-[12px] tw-font-inter tw-text-[#888] tw-w-full tw-text-center">
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
          {cnvs.sender === authentication.user.userID && (
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
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
                  ? "flex-end"
                  : "flex-start",
            }}
            animate={{
              marginLeft:
                cnvs.sender == authentication.user.userID ? "auto" : "0px",
              alignItems:
                cnvs.sender == authentication.user.userID
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
            {(conversationsetup.type == "group" ||
              conversationsetup.type == "server") &&
              authentication.user.userID != cnvs.sender && (
                <span className="span_sender_label">
                  {getMemberInfo(cnvs.sender)}
                </span>
              )}
            {cnvs.isReply && (
              <ReplyingToPreview
                cnvs={cnvs.replyedmessage[0]}
                fromOther={authentication.user.userID}
                yourReply={
                  cnvs.sender == authentication.user.userID ? true : false
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
                className="tw-w-[calc(100%-20px)] tw-h-[70px] tw-bg-[#e4e4e4] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px] cl-message-file"
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
                <span className="tw-text-[12px] tw-break-all ellipsis-3-lines tw-font-semibold">
                  {cnvs.content.includes("storage.googleapis.com")
                    ? cnvs.content.split("%%%")[1]
                    : cnvs.content.split("/")[
                        cnvs.content.split("/").length - 1
                      ]}
                </span>
              </div>
              <div
                className={`tw-w-[calc(100%-14px)] tw-pl-[7px] tw-pr-[7px] tw-mb-[4px] tw--mt-[7px] tw-bg-transparent tw-flex tw-flex-row tw-items-center ${
                  cnvs.sender == authentication.user.userID
                    ? "tw-justify-end"
                    : "tw-justify-start"
                }`}
              >
                <div
                  className="tw-w-fit tw-bg-white tw-rounded-[20px] tw-h-[20px] tw-text-[#3b3b3b] tw-pl-[2px] tw-pr-[2px]"
                  style={{
                    border: "solid 1px rgb(222, 222, 222)",
                  }}
                >
                  {toggleEmojiPicker && (
                    <EmojiPickerHandler
                      conversationID={cnvs.conversationID}
                      messageID={cnvs.messageID}
                      fromSender={
                        cnvs.sender == authentication.user.userID ? true : false
                      }
                      settoggleEmojiPicker={settoggleEmojiPicker}
                      setreactions={setreactions}
                    />
                  )}
                  <div className="tw-select-none tw-w-fit tw-h-[20px] tw-max-w-[100px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                    {toggleReactions && (
                      <ReactionsModal
                        reactions={reactionsWithInfoVar}
                        onclose={settoggleReactions}
                      />
                    )}
                    {cnvs.sender === authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                    {cnvs.sender === authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {reactions.filter(
                      (flt: any) => flt.userID === authentication.user.userID,
                    ).length === 0 && (
                      <button
                        onClick={() => {
                          settoggleEmojiPicker(!toggleEmojiPicker);
                        }}
                        className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer"
                      >
                        <MdOutlineAddReaction />
                      </button>
                    )}
                    {cnvs.sender !== authentication.user.userID &&
                      reactions.length > 4 && (
                        <span
                          className="tw-text-[10px] tw-w-fit"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          +{reactions.length - 4}
                        </span>
                      )}
                    {cnvs.sender !== authentication.user.userID && (
                      <div
                        onClick={() => {
                          settoggleReactions(true);
                        }}
                        className="tw-cursor-pointer tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden"
                      >
                        {reactions.map((mp: any) => {
                          return mp.emoji;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {conversationsetup.type == "group" ||
            conversationsetup.type == "server"
              ? i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen by </span>
                    {cnvs.seeners
                      .filter((mp: any) => mp != cnvs.sender)
                      .map((mp: any, i: number) => {
                        if (mp != authentication.user.userID) {
                          return (
                            <span className="span_seenby" key={i}>
                              {getMemberInfo(mp)}
                            </span>
                          );
                        }
                      })}
                  </motion.div>
                )
              : i === 0 &&
                cnvs.seeners.filter(
                  (mp: any) =>
                    mp != cnvs.sender && mp != authentication.user.userID,
                ).length > 0 && (
                  <motion.div
                    initial={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    animate={{
                      justifyContent:
                        cnvs.sender == authentication.user.userID
                          ? "flex-end"
                          : "flex-start",
                    }}
                    className="div_seen_container"
                  >
                    <span className="span_seenby">Seen</span>
                  </motion.div>
                )}
          </motion.div>
          {cnvs.sender !== authentication.user.userID && (
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
