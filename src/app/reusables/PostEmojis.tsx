/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Emoji } from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  CommentReactionSaveRequest,
  LottieJSONRequest,
  ReactionSaveRequest,
} from "@/reusables/hooks/requests";
import {
  getLottieData,
  persistLottieData,
} from "@/reusables/hooks/localforagehelper";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import { useCommunityInteractionIdentity } from "@/reusables/hooks/communityInteractionIdentity";

function DotLottieButton({
  mp,
  post_id,
  comment_id,
  reaction,
  identityChoice,
  identityChanged,
  onIdentitySaved,
  onProcessEmojiSelection,
  onSuccessEmojiSelection,
}: any) {
  const [onScale, setonScale] = useState<boolean>(false);
  const [lottieData, setlottieData] = useState<any>(null);

  const LottieJsonProcess = () => {
    getLottieData("lottie", mp.animated_preview)
      .then((value) => {
        if (value) {
          setlottieData(value);
        } else {
          LottieJSONRequest(mp.animated_preview)
            .then((response) => {
              if (response) {
                setlottieData(response);
                persistLottieData("lottie", mp.animated_preview, response);
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    LottieJsonProcess();
  }, []);

  const pending = useRef(false);
  const onSelectEmoji = () => {
    if (pending.current) return;
    pending.current = true;
    const reactionMethod = reaction
      ? reaction === mp.emoji_id && !identityChanged
        ? "DELETE"
        : "PUT"
      : "POST";

    onProcessEmojiSelection(reactionMethod === "DELETE" ? null : mp.emoji_id);

    // Comment reactions share the post's identity choice but use their own endpoint.
    const saveReaction = comment_id
      ? CommentReactionSaveRequest({
          comment_id,
          emoji_id: mp.emoji_id,
          method: reactionMethod,
          ...(typeof identityChoice === "boolean"
            ? { is_anonymous: identityChoice }
            : {}),
        })
      : ReactionSaveRequest({
          post_id,
          emoji_id: mp.emoji_id,
          method: reactionMethod,
          ...(typeof identityChoice === "boolean"
            ? { is_anonymous: identityChoice }
            : {}),
        });

    saveReaction
      .then(() => {
        onIdentitySaved?.();
        onSuccessEmojiSelection(true);
      })
      .catch((err) => {
        onSuccessEmojiSelection(false);
        console.log(err);
        notifyRequestError(err, "We couldn't save that reaction.");
      })
      .finally(() => {
        pending.current = false;
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
      {mp.animated_preview && lottieData ? (
        <DotLottieReact
          data={lottieData}
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
          useFrameInterpolation
        />
      ) : (
        <button onClick={onSelectEmoji}>{mp.emoji_content}</button>
      )}
    </motion.div>
  );
}

function PostEmojis({
  post_id,
  // Present only for a comment's reaction row; see DotLottieButton.
  comment_id,
  reaction,
  community,
  viewerReactionIsAnonymous,
  onProcessEmojiSelection,
  onSuccessEmojiSelection,
}: any) {
  const actor = useSelector(
    (state: any) =>
      state.authentication.active_entity_context?.id ??
      state.authentication.user.entity_id,
  );
  const [identityChoice] = useCommunityInteractionIdentity(actor, post_id);
  const [storedIdentity, setStoredIdentity] = useState<boolean>(
    viewerReactionIsAnonymous ?? false,
  );
  useEffect(() => {
    setStoredIdentity(viewerReactionIsAnonymous ?? false);
  }, [actor, community?.entity_id, viewerReactionIsAnonymous]);
  const emojilist: Emoji[] = useSelector((state: any) => state.emojilist);

  if (community?.is_private && !community.is_member) return null;
  return (
    <div
      role="group"
      aria-label="Choose a reaction"
      className="tw-p-[0px] tw-flex tw-flex-col tw-justify-center tw-items-center tw-h-full"
    >
      <div className="tw-flex tw-flex-row tw-gap-[0px] tw-min-w-fit">
        {emojilist
          .sort((a, b) => a.priority - b.priority)
          .map((mp: Emoji) => {
            return (
              <DotLottieButton
                key={mp.emoji_id}
                mp={mp}
                post_id={post_id}
                comment_id={comment_id}
                reaction={reaction}
                identityChoice={community ? identityChoice : undefined}
                identityChanged={
                  Boolean(community) && identityChoice !== storedIdentity
                }
                onIdentitySaved={() => {
                  setStoredIdentity(identityChoice ?? storedIdentity);
                }}
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
