/* eslint-disable @typescript-eslint/no-explicit-any */
import { IoDocumentOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import MessageContent from "./MessageContent";
import CachedImage from "@/app/reusables/cachers/CachedImage";

// `theme` and `fromOther` are gone from the signature: both existed only to
// decide whether a quote was tinted with the sender's colour, and the quote is
// no longer tinted by sender at all - see `.cl-message-bubble--quote`. Call
// sites may still pass them; extra props are harmless.
function ReplyingToPreview({ cnvs, yourReply, members, commands }: any) {
  if (cnvs) {
    if (cnvs.isDeleted) {
      return (
        <motion.div className="div_messages_result_reply tw-items-center">
          <motion.div
            initial={{
              marginLeft: yourReply ? "auto" : "0px",
              alignItems: "flex-end",
            }}
            animate={{
              marginLeft: yourReply ? "auto" : "0px",
              alignItems: "flex-end",
            }}
            className="tw-flex tw-flex-col tw-w-fit tw-max-w-[100%]"
          >
            {/*
              No inline colours: `.cl-message-bubble--deleted` already sets a
              transparent background, a dashed `--border-2` and `--text-3`,
              with `!important`, so it was winning over these anyway. What was
              here asked for #dedede text on a white background - about 1.1:1,
              illegible in either theme - and only the stylesheet was keeping
              it readable.
            */}
            <motion.span
              className="span_messages_result c1 cl-message-bubble cl-message-bubble--deleted tw-flex tw-flex-col tw-gap-[2px]"
            >
              Message deleted
            </motion.span>
          </motion.div>
        </motion.div>
      );
    } else {
      if (cnvs.messageType == "text") {
        return (
          <motion.div className="div_messages_result_reply tw-items-center">
            <motion.div
              initial={{
                marginLeft: yourReply ? "auto" : "0px",
                alignItems: "flex-end",
              }}
              animate={{
                marginLeft: yourReply ? "auto" : "0px",
                alignItems: "flex-end",
              }}
              className="tw-flex tw-flex-col tw-w-fit tw-max-w-[100%]"
            >
              {/*
                Colours live in `.cl-message-bubble--quote` now. They were
                literals here - #ececec on #878787 for someone else's message,
                `theme.lighten` with white text for your own - so the quote was
                a pale box with low-contrast text in light mode and the
                brightest thing on the screen in dark mode.
              */}
              <motion.span className="span_messages_result c1 cl-message-bubble cl-message-bubble--quote">
                {/*
                  This was `dangerouslySetInnerHTML` fed raw `cnvs.content` -
                  no escaping anywhere in the path. Replying to a message
                  containing `<img src=x onerror=...>` ran it in your own
                  session, and the sender only had to be someone who could
                  message you. MessageContent has no markup path out of message
                  content at all, so that is closed by construction.

                  THE FULL RENDERER, not the flattened preview. A quote used to
                  take the plain-text form on the reasoning that a heading or a
                  code fence is debris at this size - but the messages people
                  quote most are bot replies, which are model prose: headings,
                  numbered steps, bold and bullets. Flattened, that arrives as a
                  wall of run-together sentences, which is harder to read than
                  the formatting ever was.

                  The COMPOSER STRIP still flattens (see ConversationV2): it is
                  a clamped two lines, where blocks genuinely cannot render.
                */}
                <MessageContent
                  content={cnvs.content}
                  members={members ?? []}
                  commands={commands ?? []}
                />
              </motion.span>
            </motion.div>
          </motion.div>
        );
      } else if (cnvs.messageType == "image") {
        return (
          <motion.div className="div_messages_result_reply tw-items-center">
            <motion.div
              initial={{
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
              animate={{
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
              className="tw-flex tw-flex-col tw-w-fit tw-max-w-[100%]"
            >
              <div className="div_pending_content_container_sending">
                <CachedImage
                  src={cnvs.content}
                  className="img_pending_images"
                />
              </div>
            </motion.div>
          </motion.div>
        );
      } else if (cnvs.messageType.includes("video")) {
        return (
          <motion.div className="div_messages_result_reply tw-items-center">
            <motion.div
              initial={{
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
              animate={{
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
              className="tw-flex tw-flex-col tw-w-fit tw-max-w-[100%]"
            >
              <div className="div_pending_content_container_sending">
                <video
                  src={cnvs.content.split("%%%")[0].replace("###", "%23%23%23")}
                  controls
                  className="cl-chat-video"
                />
              </div>
            </motion.div>
          </motion.div>
        );
      } else if (cnvs.messageType.includes("audio")) {
        return (
          <motion.div className="div_messages_result_reply tw-items-center">
            <motion.div
              initial={{
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
              animate={{
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
              className="tw-flex tw-flex-col tw-w-[250px] tw-max-w-[100%]"
            >
              <div className="div_pending_audio_content_container_sending">
                <audio
                  src={cnvs.content.split("%%%")[0].replace("###", "%23%23%23")}
                  controls
                  className="tw-w-full tw-border-[7px]"
                />
              </div>
            </motion.div>
          </motion.div>
        );
      } else {
        return (
          <motion.div className="div_messages_result_reply tw-items-center">
            <motion.div
              initial={{
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
              animate={{
                marginLeft: "auto",
                alignItems: "flex-end",
              }}
              className="tw-opacity-[0.7] tw-flex tw-flex-col tw-w-[250px] tw-max-w-[100%]"
            >
              <div className="tw-w-[calc(100%-20px)] tw-h-[70px] tw-bg-[#e4e4e4] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px]">
                <div className="tw-w-full tw-max-w-[40px]">
                  <IoDocumentOutline style={{ fontSize: "40px" }} />
                </div>
                <span className="cl-text-caption tw-break-all ellipsis-3-lines tw-font-semibold">
                  {cnvs.content.split("%%%")[1]}
                </span>
              </div>
            </motion.div>
          </motion.div>
        );
      }
    }
  }
}

export default ReplyingToPreview;
