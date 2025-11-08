/* eslint-disable @typescript-eslint/no-explicit-any */
import { Emoji } from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { ReactionSaveRequest } from "@/reusables/hooks/requests";

function DotLottieButton({
  mp,
  post_id,
  reaction,
  onProcessEmojiSelection,
  onSuccessEmojiSelection,
}: any) {
  const [onScale, setonScale] = useState<boolean>(false);

  const onSelectEmoji = () => {
    const reactionMethod = reaction
      ? reaction === mp.emoji_id
        ? "DELETE"
        : "PUT"
      : "POST";

    onProcessEmojiSelection(reactionMethod === "DELETE" ? null : mp.emoji_id);
    ReactionSaveRequest({
      post_id,
      emoji_id: mp.emoji_id,
      method: reactionMethod,
    })
      .then(() => {
        onSuccessEmojiSelection(true);
      })
      .catch((err) => {
        onSuccessEmojiSelection(false);
        console.log(err);
      });
  };

  return (
    <motion.div
      animate={{
        scale: onScale ? 1.5 : 1,
        marginTop: onScale ? -5 : 0,
        backgroundColor:
          reaction === mp.emoji_id ? mp.emoji_theme : "transparent",
      }}
      onHoverStart={() => {
        setonScale(true);
      }}
      onHoverEnd={() => {
        setonScale(false);
      }}
      className="tw-w-fit tw-h-fit tw-min-h-[45px] tw-min-w-[45px] tw-flex tw-items-center tw-justify-center tw-rounded-[100px]"
    >
      {mp.animated_preview ? (
        <DotLottieReact
          src={mp.animated_preview!}
          loop
          autoplay
          width={30}
          height={30}
          style={{ width: "100%", height: "100%" }}
          renderConfig={{
            devicePixelRatio: 2,
            autoResize: false,
          }}
          onClick={onSelectEmoji}
          className="hover:tw-scale-1"
        />
      ) : (
        <button onClick={onSelectEmoji}>{mp.emoji_content}</button>
      )}
    </motion.div>
  );
}

function PostEmojis({
  post_id,
  reaction,
  onProcessEmojiSelection,
  onSuccessEmojiSelection,
}: any) {
  const emojilist: Emoji[] = useSelector((state: any) => state.emojilist);

  return (
    <div className="tw-p-[0px] tw-flex tw-flex-col tw-justify-center tw-items-center tw-h-full">
      <div className="tw-flex tw-flex-row tw-gap-[0px] tw-min-w-fit">
        {emojilist.map((mp: Emoji) => {
          return (
            <DotLottieButton
              key={mp.emoji_id}
              mp={mp}
              post_id={post_id}
              reaction={reaction}
              onProcessEmojiSelection={onProcessEmojiSelection}
              onSuccessEmojiSelection={onSuccessEmojiSelection}
            />
          );
        })}
      </div>
    </div>
  );
}

export default PostEmojis;
