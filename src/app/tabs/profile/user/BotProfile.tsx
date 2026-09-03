/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { Avatar, BotFlag, Btn, Card, Icon } from "@/reusables/design";
import {
  CreateInitialConversation,
  FollowRealmRequest,
  UnfollowRealmRequest,
} from "@/reusables/hooks/requests";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import {
  ConfirmPrompt,
  unfollowPrompt,
} from "@/app/widgets/modals/confirmPrompts";
import { SET_MINIMIZED_CONVERSATION } from "@/redux/types";
import {
  AuthenticationInterface,
  IBotProfileInfo,
} from "@/reusables/vars/interfaces";

interface BotProfileProps {
  botInfo: IBotProfileInfo;
  GetProfileInfoProcess: (callback?: () => void) => void;
  isSharePage?: boolean;
}

/**
 * A bot's profile.
 *
 * Rendered by ProfileContainer at the SAME route as every other profile -
 * /api/user/auth/<handle>/ resolves a bot and maps it onto the realm payload,
 * so nothing about the URL or the fetch changes here. Only the layout does.
 *
 * It is a separate component rather than conditionals inside RealmProfile
 * because almost none of that screen applies:
 *
 *  - NO COVER PHOTO. A bot has no cover to set and no admin to set one, so the
 *    realm header's tall banner would render an empty grey band above every
 *    bot on the platform.
 *  - NO POST FEED. Bots cannot post, so the tab, its pagination and its empty
 *    state would all be permanent furniture around nothing.
 *  - NO MEMBERS, ROLES OR ADMIN CONTROLS. A bot has no membership of its own.
 *
 * What is left is what a bot actually is: who it is, what it is for, who runs
 * it, and the two things you can do with it - follow it, or talk to it.
 */
function BotProfile({ botInfo }: BotProfileProps) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isFollower, setisFollower] = useState<boolean>(
    !!botInfo.is_follower,
  );
  const [followersCount, setfollowersCount] = useState<number>(
    botInfo.followers_count ?? 0,
  );
  const [isFollowBusy, setisFollowBusy] = useState<boolean>(false);
  const [confirmAction, setconfirmAction] = useState<{
    prompt: ConfirmPrompt;
    run: () => void;
  } | null>(null);

  const avatarSrc =
    botInfo.profile != null && botInfo.profile !== "none"
      ? botInfo.profile
      : undefined;

  const navigateToConversation = (conversationID: any) => {
    // Same split the realm profile uses: a narrow screen has nowhere to dock a
    // minimised thread, so it navigates instead.
    if (screensizelistener.W <= 1100) {
      navigate(`/messages/${conversationID}`);
    } else {
      dispatch({
        type: SET_MINIMIZED_CONVERSATION,
        payload: { conversation: { conversationID } },
      });
    }
  };

  const MessageProcess = () => {
    CreateInitialConversation(botInfo.entity)
      .then((response) => {
        if (response) navigateToConversation(response);
      })
      .catch((err) => console.log(err));
  };

  const SubmitFollowProcess = () => {
    if (isFollowBusy) return;
    setisFollowBusy(true);

    const wasFollowing = isFollower;
    // Optimistic, and the count moves with the button - a follower count that
    // lags a round trip behind reads as a bug.
    setisFollower(!wasFollowing);
    setfollowersCount((prev) => Math.max(0, prev + (wasFollowing ? -1 : 1)));

    const request = wasFollowing ? UnfollowRealmRequest : FollowRealmRequest;
    request({ entity_id: botInfo.entity })
      .then((response: any) => {
        if (!response) {
          setisFollower(wasFollowing);
          setfollowersCount(botInfo.followers_count ?? 0);
        }
      })
      .catch(() => {
        setisFollower(wasFollowing);
        setfollowersCount(botInfo.followers_count ?? 0);
      })
      .finally(() => setisFollowBusy(false));
  };

  // Unfollowing asks first, the same as a person or a page.
  //
  // The BUTTON IS ITS OWN OPPOSITE - "Following" becomes "Follow" - so a stray
  // tap silently undoes the thing it is reporting, and the only feedback is the
  // label you were not looking at. That is true of a bot exactly as it is of a
  // page, so the gesture is the same here; only the prompt's wording differs,
  // because a bot has no feed to stop seeing.
  //
  // Following is not confirmed: it is additive and the same button undoes it.
  const ToggleFollowProcess = () => {
    if (isFollowBusy) return;
    if (!isFollower) {
      SubmitFollowProcess();
      return;
    }
    setconfirmAction({
      prompt: unfollowPrompt(botInfo.name, true, false, "bot"),
      run: SubmitFollowProcess,
    });
  };

  const isSelf = authentication.active_entity_context?.id === botInfo.entity;

  return (
    <div
      className="cl-profile-page__shell tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[6px] tw-overflow-y-scroll x-scroll"
      style={{ paddingTop: 24 }}
    >
      {confirmAction && (
        <ConfirmModal
          {...confirmAction.prompt}
          onClose={() => setconfirmAction(null)}
          onConfirm={() => {
            const { run } = confirmAction;
            setconfirmAction(null);
            run();
          }}
        />
      )}
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          padding: "0 16px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <Card pad={0} style={{ overflow: "hidden", textAlign: "left" }}>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              padding: 20,
            }}
          >
            <Avatar
              id={botInfo.entity}
              name={botInfo.name}
              src={avatarSrc}
              size={76}
              shape="rounded"
            />

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "var(--fs-title)",
                    fontWeight: 700,
                    color: "var(--text)",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {botInfo.name}
                </h1>
                <BotFlag is size={16} />
              </div>

              <div
                style={{
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-3)",
                  marginTop: 2,
                }}
              >
                @{botInfo.slug} · {followersCount.toLocaleString()}{" "}
                {followersCount === 1 ? "follower" : "followers"}
              </div>
            </div>
          </div>

          {botInfo.description && (
            <div
              style={{
                padding: "0 20px 18px",
                fontSize: "var(--fs-body)",
                color: "var(--text-2)",
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
              }}
            >
              {botInfo.description}
            </div>
          )}

          {!isSelf && authentication.auth && (
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "0 20px 20px",
                flexWrap: "wrap",
              }}
            >
              {/* can_follow is the server's call, not `!is_system` - a client
                  second-guessing it drifts. */}
              {botInfo.can_follow !== false && (
                <Btn
                  size="sm"
                  variant={isFollower ? "soft" : "primary"}
                  disabled={isFollowBusy}
                  onClick={ToggleFollowProcess}
                >
                  {isFollower ? "Following" : "Follow"}
                </Btn>
              )}
              <Btn
                size="sm"
                variant="soft"
                iconL="forum"
                onClick={MessageProcess}
              >
                Message
              </Btn>
              {/* No Add contact, and no disabled one either: can_connect is
                  false for every bot, so the button would exist only to be
                  refused. */}
            </div>
          )}
        </Card>

        {/* Stated plainly rather than left as an absence. Without it the page
            reads as a profile that failed to load its feed, which is exactly
            what a person would report as a bug. */}
        <Card style={{ textAlign: "left" }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: 4,
            }}
          >
            <Icon n="smart_toy" s={18} c="var(--text-3)" />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "var(--fs-body)",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                This is a bot
              </div>
              <div
                style={{
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-3)",
                  marginTop: 2,
                }}
              >
                Bots don't post. You can follow it, message it directly, or add
                it to a group chat and mention it there.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default BotProfile;
