/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import MessageContent from "./MessageContent";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import VideoPlayer from "@/app/reusables/VideoPlayer";
import FileMessageCard from "./FileMessageCard";
import { messageFileUrl } from "./fileMessage";

// A quote draws its message the way the message itself is drawn. Text and
// voice quotes are tinted by whether the QUOTED message was yours - same
// `theme.primary` treatment the real bubble uses - not by `yourReply`, which
// answers a different question (who sent the REPLY, not who sent the quote).
// This used to be dropped for text on the reasoning that the "replied to X"
// label above already says whose message it is, so the tint "bought nothing" -
// true for telling apart two OTHER people, but it also meant your own quoted
// message never looked like yours, which read as broken rather than
// intentional. `fromOther` is the current viewer's own entity id, compared
// against the quoted message's `sender` - same field/value the "replied to X"
// label already keys on.
// Image, video and file quotes take no tint: their real messages carry no
// sender colour either (the media itself, or a neutral file card), so there
// is nothing to match. A file quote used to be accent-filled when yours,
// which made it look like no file message in the thread.
function ReplyingToPreview({
  cnvs,
  yourReply,
  members,
  commands,
  theme,
  fromOther,
}: any) {
  const quotedByMe = cnvs && cnvs.sender === fromOther;
  const accent = theme?.primary ?? "var(--brand)";
  // The quote sits on the side of the REPLY it heads. The media, voice and
  // file quotes were pinned right, so above somebody else's reply (left)
  // they hung on the far side of the column.
  const side = {
    marginLeft: yourReply ? "auto" : "0px",
    alignItems: yourReply ? "flex-end" : "flex-start",
  };

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
              // `tw-opacity-[0.8]`, same as the file and voice quotes below -
              // full contrast made the quote compete with the reply it sits
              // above rather than recede behind it.
              className="tw-flex tw-flex-col tw-w-fit tw-max-w-[100%] tw-opacity-[0.8]"
            >
              {/*
                Base colours live in `.cl-message-bubble--quote` (neutral -
                for someone ELSE's message, the "replied to X" label already
                names them, so a tint would only cost contrast). Quoting your
                OWN message is the one case that label can't cover - it never
                says "replied to your message" here, so without an inline
                override this looked identical to quoting a stranger.

                `cl-message-bubble--own` ALSO added when quoting yourself, not
                just the inline colours: MessageContent renders the same
                `cl-message-mention`/`cl-message-command` chips here as in the
                real bubble, but their "filled with the accent" styling
                (white-on-translucent, mixed from `currentColor`) is keyed off
                that exact class in styles.css. Without it a mention/command
                inside your own quoted message fell back to the chip's
                neutral-surface look - a pale outline that doesn't match the
                solid accent fill it's actually sitting on.
              */}
              <motion.span
                className={`span_messages_result c1 cl-message-bubble cl-message-bubble--quote ${
                  quotedByMe ? "cl-message-bubble--own" : ""
                }`}
                style={
                  quotedByMe
                    ? {
                        backgroundColor: accent,
                        border: `1px solid ${accent}`,
                        color: "white",
                      }
                    : undefined
                }
              >
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
              initial={side}
              animate={side}
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
              initial={side}
              animate={side}
              className="tw-flex tw-flex-col tw-w-fit tw-max-w-[100%]"
            >
              <div className="div_pending_content_container_sending">
                <VideoPlayer
                  src={messageFileUrl(cnvs)}
                  className="cl-chat-video-frame"
                  videoClassName="cl-chat-video"
                />
              </div>
            </motion.div>
          </motion.div>
        );
      } else if (cnvs.messageType.includes("audio")) {
        return (
          <motion.div className="div_messages_result_reply tw-items-center">
            <motion.div
              initial={side}
              animate={side}
              // `tw-w-fit`, not a fixed width: VoiceMessagePlayer sizes itself
              // to its own waveform, same as the actual message bubble -
              // matching that intrinsic size IS matching "the same
              // dimensions", rather than independently picking a width.
              // `tw-opacity-[0.8]` recedes it behind the actual message below,
              // same treatment the file quote already uses - full contrast
              // here made the quote compete with, rather than sit behind,
              // the reply it's attached to.
              className="tw-flex tw-flex-col tw-w-fit tw-max-w-[100%] tw-opacity-[0.8]"
            >
              {/*
                Was a bare native `<audio controls>` - the browser's own
                widget, nothing like the waveform player the actual message
                renders with (VoiceMessagePlayer).
              */}
              <VoiceMessagePlayer
                src={messageFileUrl(cnvs)}
                isSender={quotedByMe}
                accentColor={accent}
                // Only the actual message keeps `.cl-voice-message`'s lift -
                // the quote sits flush, so it doesn't out-compete it.
                style={{ boxShadow: "none" }}
              />
            </motion.div>
          </motion.div>
        );
      } else {
        return (
          <motion.div className="div_messages_result_reply tw-items-center">
            <motion.div
              initial={side}
              animate={side}
              className="tw-opacity-[0.8] tw-flex tw-flex-col tw-w-[250px] tw-max-w-[100%]"
            >
              {/* The message's own card - see FileMessageCard. */}
              <FileMessageCard message={cnvs} quote />
            </motion.div>
          </motion.div>
        );
      }
    }
  }
}

export default ReplyingToPreview;
