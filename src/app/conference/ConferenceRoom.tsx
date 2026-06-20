/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiArrowRight, FiVideo, FiVideoOff } from "react-icons/fi";
import { BsFillMicFill, BsFillMicMuteFill } from "react-icons/bs";
import ConferenceVoiceWindow from "./ConferenceVoiceWindow";
import {
  ConversationInfoRequest,
  CreateRealmInviteRequest,
  GetRealmInviteRequest,
  UpdateRealmInviteRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { useTheme } from "@/reusables/design";
import {
  CloseSSENotifications,
  SSENotificationsTRequest,
} from "@/reusables/hooks/sse";

function ConferenceRoom() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const roomSlug = params.slug ?? "";
  const routeInvites = (location.state as any)?.invites ?? [];
  const inviteToken = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return query.get("invite_token")?.trim() ?? "";
  }, [location.search]);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [inviteLoadError, setInviteLoadError] = useState<string | null>(null);
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [isInviteUpdating, setIsInviteUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [lobbyMicEnabled, setLobbyMicEnabled] = useState(true);
  const [lobbyCameraEnabled, setLobbyCameraEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    if (!roomSlug) {
      setLoadError("Missing conference slug.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    ConversationInfoRequest({
      conversationID: roomSlug,
      type: "conference",
    })
      .then((response) => {
        setRoomInfo(response);
        setIsLoading(false);
      })
      .catch((err) => {
        setRoomInfo(null);
        setLoadError(err?.message || "Unable to load conference room.");
        setIsLoading(false);
      });
  }, [roomSlug]);

  useEffect(() => {
    setHasJoined(false);
    setLobbyMicEnabled(true);
    setLobbyCameraEnabled(true);
  }, [roomSlug]);

  useEffect(() => {
    if (!inviteToken || !authentication.auth) {
      setInviteInfo(null);
      setInviteLoadError(null);
      setIsInviteLoading(false);
      return;
    }

    setIsInviteLoading(true);
    setInviteLoadError(null);

    GetRealmInviteRequest({ invite_token: inviteToken })
      .then((response) => {
        setInviteInfo(response?.result ?? null);
      })
      .catch((err) => {
        setInviteInfo(null);
        setInviteLoadError(err?.message || "Unable to load invite.");
      })
      .finally(() => {
        setIsInviteLoading(false);
      });
  }, [authentication.auth, inviteToken]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!roomSlug || !authentication.auth) {
      return;
    }

    SSENotificationsTRequest(dispatch, alerts, authentication);

    return () => {
      CloseSSENotifications();
    };
  }, [roomSlug, authentication.auth]);

  const roomData = useMemo(() => {
    if (!roomInfo) {
      return null;
    }

    const groupdetails = roomInfo.conversationInfo ?? roomInfo;
    const resolvedConversationID =
      roomInfo.conversationInfo?._id ||
      roomInfo.contactID ||
      roomInfo.realm_id ||
      roomSlug;
    const receivers =
      roomInfo.usersWithInfo?.map((mp: any) => mp._id) ??
      roomInfo.users?.map((mp: any) => mp._id) ??
      [];

    return {
      ...roomInfo,
      ...groupdetails,
      conversationID: resolvedConversationID,
      conversationType: "group",
      type: "video",
      callType: "video",
      isGroup: true,
      caller: {
        name: authentication.user.fullName.firstName,
        userID: authentication.user.userID,
      },
      recepients: receivers,
      groupdetails: {
        ...(groupdetails || {}),
        groupName:
          groupdetails?.groupName ??
          groupdetails?.name ??
          roomSlug ??
          "Conference",
        privacy: groupdetails?.privacy ?? true,
        profile: groupdetails?.profile ?? "none",
        receivers,
        serverID: null,
      },
      invites: roomInfo.invites ?? routeInvites,
      initialEnableMic: lobbyMicEnabled,
      initialEnableCamera: lobbyCameraEnabled,
      instance: roomInfo.instance ?? null,
    };
  }, [
    authentication.user.fullName.firstName,
    authentication.user.userID,
    lobbyCameraEnabled,
    lobbyMicEnabled,
    routeInvites,
    roomInfo,
    roomSlug,
  ]);

  const meetingWindowState = useMemo(() => {
    if (!roomData) {
      return {
        canJoin: false,
        statusLabel: "Preparing room",
        helperLabel: "Loading meeting schedule.",
      };
    }

    const scheduleSource = roomData.data ?? roomData;
    const startAtRaw =
      scheduleSource.starts_at ??
      scheduleSource.conversationInfo?.starts_at ??
      null;
    const expiresAtRaw =
      scheduleSource.expires_at ??
      scheduleSource.conversationInfo?.expires_at ??
      null;

    const startAt = startAtRaw ? new Date(startAtRaw) : null;
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
    const now = new Date();

    const validStartAt = startAt && !isNaN(startAt.getTime()) ? startAt : null;
    const validExpiresAt =
      expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt : null;

    if (validStartAt && now < validStartAt) {
      return {
        canJoin: false,
        statusLabel: "Waiting to start",
        helperLabel: `Opens ${validStartAt.toLocaleString()}`,
      };
    }

    if (validExpiresAt && now > validExpiresAt) {
      return {
        canJoin: false,
        statusLabel: "Meeting ended",
        helperLabel: `Expired ${validExpiresAt.toLocaleString()}`,
      };
    }

    return {
      canJoin: true,
      statusLabel: "Ready to join",
      helperLabel: "Set your camera and microphone before joining.",
    };
  }, [roomData, currentTime]);

  const normalizedUserEmail = authentication.user.email
    ? String(authentication.user.email).trim().toLowerCase()
    : "";
  const roomIsPrivate = Boolean(
    roomData?.data.conversationInfo?.privacy ??
    roomData?.privacy ??
    roomData?.is_private ??
    false,
  );
  const roomInvites = Array.isArray(roomData?.invites) ? roomData.invites : [];
  const roomInviteForUser = useMemo(() => {
    if (!normalizedUserEmail) {
      return null;
    }

    return (
      roomInvites.find((invite: any) => {
        const targetEmail = invite?.target_email
          ? String(invite.target_email).trim().toLowerCase()
          : "";

        return targetEmail === normalizedUserEmail;
      }) ?? null
    );
  }, [normalizedUserEmail, roomInvites]);
  const inviteTargetEmail = inviteInfo?.target_email
    ? String(inviteInfo.target_email).trim().toLowerCase()
    : "";
  const inviteMatchesUser =
    Boolean(inviteTargetEmail) && inviteTargetEmail === normalizedUserEmail;
  const invitePending =
    inviteInfo?.status === "pending" &&
    inviteMatchesUser &&
    Boolean(inviteToken);
  const inviteAccepted =
    inviteInfo?.status === "accepted" &&
    inviteMatchesUser &&
    Boolean(inviteToken);
  const inviteBlocked =
    Boolean(inviteToken) &&
    Boolean(inviteInfo) &&
    !inviteMatchesUser &&
    inviteInfo?.status !== "accepted";
  const effectiveInviteInfo = inviteInfo ?? roomInviteForUser;
  const effectiveInviteTargetEmail = effectiveInviteInfo?.target_email
    ? String(effectiveInviteInfo.target_email).trim().toLowerCase()
    : "";
  const effectiveInviteMatchesUser =
    Boolean(effectiveInviteTargetEmail) &&
    effectiveInviteTargetEmail === normalizedUserEmail;
  const effectiveInvitePending =
    effectiveInviteInfo?.status === "pending" && effectiveInviteMatchesUser;
  const effectiveInviteAccepted =
    effectiveInviteInfo?.status === "accepted" && effectiveInviteMatchesUser;
  const effectiveInviteBlocked =
    roomIsPrivate &&
    Boolean(effectiveInviteInfo) &&
    !effectiveInviteMatchesUser &&
    effectiveInviteInfo?.status !== "accepted";
  const inviteRequiresSignIn =
    (Boolean(inviteToken) || roomIsPrivate) && authentication.auth !== true;
  const canProceedToConference =
    meetingWindowState.canJoin &&
    (!roomIsPrivate || effectiveInvitePending || effectiveInviteAccepted);

  const inviteStatusContent = useMemo(() => {
    if (authentication.auth === null) {
      return {
        title: "Checking invitation access",
        description: "We're confirming your session before we load the invite.",
      };
    }

    if (inviteRequiresSignIn) {
      return {
        title: "Sign in to verify this invite",
        description:
          "This room uses invite matching, so we need your account first.",
      };
    }

    if (inviteToken && isInviteLoading) {
      return {
        title: "Loading invitation",
        description: "We're checking the invite details for this meeting.",
      };
    }

    if (inviteToken && inviteLoadError) {
      return {
        title: "Invitation unavailable",
        description: inviteLoadError,
      };
    }

    if (inviteToken && !inviteInfo) {
      return {
        title: "No invitation found",
        description: "This link does not include a valid invite token.",
      };
    }

    if ((inviteToken && inviteBlocked) || effectiveInviteBlocked) {
      return {
        title: "Invitation belongs to another account",
        description: `Signed in as ${normalizedUserEmail || "this user"}, but this invite is for ${inviteTargetEmail}.`,
      };
    }

    if (inviteToken && invitePending) {
      return {
        title: "Invitation pending",
        description: `Ready for ${inviteTargetEmail}. You can accept it before joining.`,
      };
    }

    if (inviteToken && inviteAccepted) {
      return {
        title: "Invitation accepted",
        description: "You're cleared to enter this conference room.",
      };
    }

    if (roomIsPrivate && !effectiveInviteInfo) {
      return {
        title: "Private conference",
        description:
          "You cannot access this conference yet. Please send a request to join.",
      };
    }

    if (roomIsPrivate && effectiveInvitePending) {
      return {
        title: "Access request pending",
        description:
          "Your request is waiting for approval before you can join.",
      };
    }

    if (roomIsPrivate && effectiveInviteAccepted) {
      return {
        title: "Access approved",
        description: "You're cleared to enter this private conference room.",
      };
    }

    return {
      title: "Invitation loaded",
      description: roomIsPrivate
        ? "This private room can only be entered by invited members."
        : `Invite status: ${String(effectiveInviteInfo?.status ?? "none")}`,
    };
  }, [
    authentication.auth,
    effectiveInviteAccepted,
    effectiveInviteBlocked,
    effectiveInviteInfo,
    effectiveInvitePending,
    inviteAccepted,
    inviteBlocked,
    inviteInfo,
    inviteLoadError,
    invitePending,
    inviteRequiresSignIn,
    inviteTargetEmail,
    inviteToken,
    isInviteLoading,
    roomIsPrivate,
    normalizedUserEmail,
  ]);

  const acceptInvite = async () => {
    if (!inviteToken && !roomInviteForUser) return;
    if (!inviteInfo && !roomInviteForUser) return;

    setIsInviteUpdating(true);
    try {
      const response = await UpdateRealmInviteRequest({
        invite_token: inviteToken || roomInviteForUser?.invite_token,
        status: "accepted",
      });

      setInviteInfo(response?.result ?? inviteInfo ?? roomInviteForUser);
      if (meetingWindowState.canJoin) {
        setHasJoined(true);
      }
    } finally {
      setIsInviteUpdating(false);
    }
  };

  const requestAccess = async () => {
    if (!roomData?.realm_id || !normalizedUserEmail) return;

    setIsInviteUpdating(true);
    try {
      const response = await CreateRealmInviteRequest({
        realm_id: roomData.realm_id,
        target_email: normalizedUserEmail,
        kind: "request",
      });

      setInviteInfo(response?.result ?? roomInviteForUser);
    } finally {
      setIsInviteUpdating(false);
    }
  };

  const canJoinNow = canProceedToConference;
  const showRequestAccess = roomIsPrivate && !effectiveInviteInfo;

  if (isLoading) {
    return (
      <div
        className="cl-redesign tw-w-full tw-h-[100dvh] tw-flex tw-items-center tw-justify-center tw-bg-[var(--bg)]"
        data-theme={theme}
      >
        <AiOutlineLoading3Quarters className="tw-animate-spin tw-text-[22px] tw-text-[var(--text-2)]" />
      </div>
    );
  }

  if (loadError || !roomData) {
    return (
      <div
        className="cl-redesign tw-w-full tw-h-[100dvh] tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[12px] tw-bg-[var(--bg)] tw-p-[24px]"
        data-theme={theme}
      >
        <span className="tw-text-[18px] tw-font-semibold tw-text-[var(--text)]">
          Conference room unavailable
        </span>
        <span className="tw-text-[13px] tw-text-[var(--text-2)] tw-text-center tw-max-w-[420px]">
          {loadError ?? "We couldn't load this meeting room."}
        </span>
        <button
          onClick={() => navigate("/conference")}
          className="tw-border-none tw-bg-[var(--brand)] tw-text-white tw-rounded-[var(--r-md)] tw-px-[14px] tw-py-[10px] tw-font-semibold tw-cursor-pointer"
        >
          Back to Conference
        </button>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div
        data-theme={theme}
        className="cl-redesign tw-w-full tw-h-[100dvh] tw-bg-[var(--bg)] tw-text-[var(--text)] tw-overflow-hidden tw-flex tw-flex-col"
      >
        <div className="tw-flex-1 tw-min-h-0 tw-flex tw-items-center tw-justify-center tw-p-[16px] sm:tw-p-[24px]">
          <div className="tw-w-full tw-max-w-[1180px] tw-grid tw-grid-cols-1 lg:tw-grid-cols-[1.3fr_0.9fr] tw-gap-[16px]">
            <div className="tw-rounded-[24px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-md)] tw-p-[18px] sm:tw-p-[24px] tw-flex tw-flex-col tw-gap-[16px]">
              <div className="tw-flex tw-items-center tw-justify-between tw-gap-[12px]">
                <div className="tw-flex tw-items-center tw-gap-[12px] tw-min-w-0">
                  <div className="tw-w-[46px] tw-h-[46px] tw-rounded-[18px] tw-bg-[var(--brand-soft)] tw-text-[var(--brand)] tw-flex tw-items-center tw-justify-center tw-border tw-border-[var(--border)]">
                    <FiVideo size={22} />
                  </div>
                  <div className="tw-flex tw-flex-col tw-items-start tw-min-w-0">
                    <span className="tw-text-[18px] sm:tw-text-[22px] tw-font-semibold tw-tracking-[-0.02em] tw-truncate">
                      {roomData.groupdetails?.groupName || "Conference"}
                    </span>
                    <span className="tw-text-[12px] sm:tw-text-[13px] tw-text-[var(--text-2)]">
                      Ready to join the meeting
                    </span>
                  </div>
                </div>
                <span className="tw-text-[12px] tw-text-[var(--text-2)] tw-rounded-[var(--r-pill)] tw-bg-[var(--surface-2)] tw-px-[10px] tw-py-[6px] tw-border tw-border-[var(--border)]">
                  Lobby
                </span>
              </div>

              <div className="tw-flex-1 tw-min-h-[260px] tw-rounded-[24px] tw-bg-[var(--surface-1)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-p-[24px]">
                <div className="tw-w-[84px] tw-h-[84px] tw-rounded-[28px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-flex tw-items-center tw-justify-center tw-text-[var(--brand)] tw-shadow-[var(--shadow-sm)]">
                  <FiVideo size={34} />
                </div>
                <span className="tw-text-[18px] tw-font-semibold tw-text-[var(--text)]">
                  {roomData.groupdetails?.groupName || "Conference"}
                </span>
                <span className="tw-text-[13px] tw-text-[var(--text-2)] tw-text-center tw-max-w-[420px]">
                  {effectiveInviteBlocked
                    ? "This invite belongs to a different account."
                    : effectiveInvitePending
                      ? "You can accept this invitation before joining."
                      : inviteRequiresSignIn
                        ? "Sign in to verify the invite before joining."
                        : roomIsPrivate && !effectiveInviteInfo
                          ? "This conference is private. Please send a request to join."
                          : "Set your camera and microphone before joining."}
                </span>
              </div>

              <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-[12px]">
                <button
                  type="button"
                  onClick={() => setLobbyMicEnabled((prev) => !prev)}
                  className={`tw-h-[46px] tw-rounded-[var(--r-md)] tw-border tw-font-semibold tw-flex tw-items-center tw-justify-center tw-gap-[10px] tw-cursor-pointer ${
                    lobbyMicEnabled
                      ? "tw-bg-[var(--surface-2)] tw-border-[var(--border)] tw-text-[var(--text)]"
                      : "tw-bg-[var(--surface-1)] tw-border-[var(--border)] tw-text-[var(--text-2)]"
                  }`}
                >
                  {lobbyMicEnabled ? (
                    <BsFillMicFill size={18} />
                  ) : (
                    <BsFillMicMuteFill size={18} />
                  )}
                  {lobbyMicEnabled ? "Mic on" : "Mic off"}
                </button>
                <button
                  type="button"
                  onClick={() => setLobbyCameraEnabled((prev) => !prev)}
                  className={`tw-h-[46px] tw-rounded-[var(--r-md)] tw-border tw-font-semibold tw-flex tw-items-center tw-justify-center tw-gap-[10px] tw-cursor-pointer ${
                    lobbyCameraEnabled
                      ? "tw-bg-[var(--surface-2)] tw-border-[var(--border)] tw-text-[var(--text)]"
                      : "tw-bg-[var(--surface-1)] tw-border-[var(--border)] tw-text-[var(--text-2)]"
                  }`}
                >
                  {lobbyCameraEnabled ? (
                    <FiVideo size={18} />
                  ) : (
                    <FiVideoOff size={18} />
                  )}
                  {lobbyCameraEnabled ? "Camera on" : "Camera off"}
                </button>
              </div>
            </div>

            <div className="tw-rounded-[24px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-md)] tw-p-[18px] sm:tw-p-[24px] tw-flex tw-flex-col tw-gap-[16px] tw-justify-between">
              <div className="tw-flex tw-flex-col tw-gap-[8px]">
                <span className="tw-text-[18px] tw-font-semibold tw-text-[var(--text)]">
                  Join now
                </span>
                <span className="tw-text-[13px] tw-text-[var(--text-2)]">
                  You're about to enter the conference room.
                </span>
              </div>

              <div className="tw-flex tw-flex-col tw-gap-[12px]">
                <div className="tw-rounded-[20px] tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-p-[14px] tw-flex tw-flex-col tw-gap-[8px] tw-shadow-[var(--shadow-sm)]">
                  <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                    Room status
                  </span>
                  <span className="tw-text-[14px] tw-font-semibold tw-text-[var(--text)]">
                    {meetingWindowState.statusLabel}
                  </span>
                  <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                    {meetingWindowState.helperLabel}
                  </span>
                </div>
                {(inviteToken || roomIsPrivate) && (
                  <div className="tw-rounded-[20px] tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-p-[14px] tw-flex tw-flex-col tw-gap-[8px] tw-shadow-[var(--shadow-sm)]">
                    <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                      Invitation
                    </span>
                    <span className="tw-text-[14px] tw-font-semibold tw-text-[var(--text)]">
                      {inviteStatusContent?.title ?? "Invitation"}
                    </span>
                    <span className="tw-text-[12px] tw-text-[var(--text-2)] tw-leading-[1.5]">
                      {inviteStatusContent?.description ??
                        "We'll verify the invitation for this room."}
                    </span>
                  </div>
                )}
                {Array.isArray(roomData.invites) &&
                  roomData.invites.length > 0 && (
                    <div className="tw-rounded-[20px] tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-p-[14px] tw-flex tw-flex-col tw-gap-[8px] tw-shadow-[var(--shadow-sm)]">
                      <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                        Invites
                      </span>
                      <span className="tw-text-[14px] tw-font-semibold tw-text-[var(--text)]">
                        {roomData.invites.length} invite
                        {roomData.invites.length === 1 ? "" : "s"} prepared
                      </span>
                    </div>
                  )}
                <div className="tw-rounded-[20px] tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-p-[14px] tw-flex tw-flex-col tw-gap-[8px] tw-shadow-[var(--shadow-sm)]">
                  <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                    Microphone
                  </span>
                  <span className="tw-text-[14px] tw-font-semibold tw-text-[var(--text)]">
                    {lobbyMicEnabled
                      ? "Will join with mic on"
                      : "Will join muted"}
                  </span>
                </div>
                <div className="tw-rounded-[20px] tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-p-[14px] tw-flex tw-flex-col tw-gap-[8px] tw-shadow-[var(--shadow-sm)]">
                  <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                    Camera
                  </span>
                  <span className="tw-text-[14px] tw-font-semibold tw-text-[var(--text)]">
                    {lobbyCameraEnabled
                      ? "Will join with camera on"
                      : "Will join camera off"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (effectiveInvitePending) {
                    await acceptInvite();
                    return;
                  }

                  if (showRequestAccess) {
                    await requestAccess();
                    return;
                  }

                  if (canJoinNow) {
                    setHasJoined(true);
                  }
                }}
                disabled={
                  (!canJoinNow &&
                    !effectiveInvitePending &&
                    !showRequestAccess) ||
                  isInviteUpdating ||
                  inviteRequiresSignIn ||
                  (effectiveInviteBlocked && !meetingWindowState.canJoin)
                }
                className="tw-h-[48px] tw-rounded-[var(--r-md)] tw-border-none tw-bg-[var(--brand)] tw-text-white tw-font-semibold tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-gap-[10px] tw-shadow-[var(--shadow-sm)] disabled:tw-opacity-[0.55] disabled:tw-cursor-not-allowed"
              >
                {isInviteUpdating ? (
                  <>
                    <AiOutlineLoading3Quarters className="tw-animate-spin" />
                    Updating invite
                  </>
                ) : inviteRequiresSignIn ? (
                  "Sign in to continue"
                ) : effectiveInvitePending ? (
                  meetingWindowState.canJoin ? (
                    "Accept invitation & join"
                  ) : (
                    "Accept invitation"
                  )
                ) : showRequestAccess ? (
                  "Request access"
                ) : meetingWindowState.canJoin ? (
                  "Join conference"
                ) : (
                  "Stay in lobby"
                )}
                <FiArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cl-redesign tw-w-full tw-h-[100dvh] tw-flex tw-flex-col tw-bg-[var(--bg)] tw-overflow-hidden"
      data-theme={theme}
    >
      <div className="tw-flex-1 tw-min-h-0 tw-h-full">
        <ConferenceVoiceWindow key={roomSlug} data={roomData} />
      </div>
    </div>
  );
}

export default ConferenceRoom;

