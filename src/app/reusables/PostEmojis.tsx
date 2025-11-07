/* eslint-disable @typescript-eslint/no-explicit-any */
import { Emoji } from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion } from "framer-motion";
import { useState } from "react";

function DotLottieButton(props: any) {
  const [onScale, setonScale] = useState<boolean>(false);
  return (
    <motion.div
      animate={{
        scale: onScale ? 1.5 : 1,
        marginTop: onScale ? -5 : 0,
      }}
      onHoverStart={() => {
        setonScale(true);
      }}
      onHoverEnd={() => {
        setonScale(false);
      }}
      className="tw-w-fit tw-h-fit"
    >
      {props.children}
    </motion.div>
  );
}

function PostEmojis() {
  const emojilist: Emoji[] = useSelector((state: any) => state.emojilist);

  return (
    <div className="tw-p-[0px] tw-flex tw-flex-col tw-justify-center tw-items-center tw-h-full">
      <div className="tw-flex tw-flex-row tw-gap-[0px] tw-w-fit">
        {emojilist.map((mp: Emoji) => {
          return (
            <DotLottieButton key={mp.emoji_id}>
              {mp.animated_preview ? (
                <DotLottieReact
                  src={mp.animated_preview!}
                  loop
                  autoplay
                  style={{ width: "100%", height: "100%" }}
                  renderConfig={{
                    devicePixelRatio: 2,
                    autoResize: true,
                  }}
                  className="hover:tw-scale-2"
                />
              ) : (
                <button>{mp.emoji_content}</button>
              )}
            </DotLottieButton>
          );
        })}
      </div>
    </div>
  );
}

export default PostEmojis;
