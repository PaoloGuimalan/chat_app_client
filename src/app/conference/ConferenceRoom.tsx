/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiArrowRight, FiVideo, FiVideoOff } from "react-icons/fi";
import { BsFillMicFill, BsFillMicMuteFill } from "react-icons/bs";
import ConferenceVoiceWindow from "./ConferenceVoiceWindow";
import { ConversationInfoRequest } from "@/reusables/hooks/requests";
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
  const { theme } = useTheme();

  const roomSlug = params.slug ?? "";
  const [roomInfo, setRoomInfo] = useState<any>(null);
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
      initialEnableMic: lobbyMicEnabled,
      initialEnableCamera: lobbyCameraEnabled,
      instance: roomInfo.instance ?? null,
    };
  }, [
    authentication.user.fullName.firstName,
    authentication.user.userID,
    lobbyCameraEnabled,
    lobbyMicEnabled,
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
                  Set your camera and microphone before joining.
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
                onClick={() => {
                  if (meetingWindowState.canJoin) {
                    setHasJoined(true);
                  }
                }}
                disabled={!meetingWindowState.canJoin}
                className="tw-h-[48px] tw-rounded-[var(--r-md)] tw-border-none tw-bg-[var(--brand)] tw-text-white tw-font-semibold tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-gap-[10px] tw-shadow-[var(--shadow-sm)] disabled:tw-opacity-[0.55] disabled:tw-cursor-not-allowed"
              >
                {meetingWindowState.canJoin
                  ? "Join conference"
                  : "Stay in lobby"}
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
