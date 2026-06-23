/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "../../styles/styles.css";
import { motion } from "framer-motion";
// import { RxEnterFullScreen } from "react-icons/rx";
import {
  BsFillMicFill,
  BsFillMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsFillChatDotsFill,
  BsThreeDots,
} from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { HiPhoneMissedCall } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { FiUsers, FiCheck, FiX } from "react-icons/fi";
import { FaCircleArrowUp, FaCircleArrowDown } from "react-icons/fa6";
import { IoPersonRemove } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { END_CALL_LIST } from "@/redux/types";
import UserVideoBlock from "../absolutes/calls_v2/UserVideoBlock";
import Conversation from "../tabs/messenger/Conversation";
import { Device } from "mediasoup-client";
import {
  ConsumeRequest,
  CreateTransportRequest,
  EndCallRequest,
  JoinRoomRequest,
  LeaveRoomRequest,
  ParticipantStatusRequest,
  CloseProducerRequest,
  TransportConnectRequest,
  TransportProduceRequest,
  VoiceRequest,
  GetEncodingsRequest,
  GetRealmInviteRequest,
  UpdateRealmInviteRequest,
  GetRealmMembersRequest,
  UpdateMemberRoleRequest,
  RemoveRealmMemberRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import RemoteVideo from "../absolutes/calls_v2/RemoteVideo";
import envs from "@/reusables/hooks/env_configs";
import { useNavigate } from "react-router-dom";
import { useReconnect } from "@/reusables/hooks/useReconnect";
import { useTheme } from "@/reusables/design";

function ConferenceVoiceWindow({
  data,
  realmId,
  canManageRequests,
  selfUsername,
}: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const { theme: conferenceTheme } = useTheme();

  const navigate = useNavigate();

  const [mediaStream, setmediaStream] = useState<MediaStream | null>(null);
  const [device, setDevice] = useState<any>(null);

  const [enableMic, setenableMic] = useState<boolean>(
    data.initialEnableMic ?? true,
  );
  const [enableCamera, setenableCamera] = useState<boolean>(
    data.initialEnableCamera ?? (data.type || data.callType) === "video",
  );

  const [connectTransportState, setconnectTransportState] = useState<any>({
    params: null,
    instance: null,
    triggered: false,
  });
  const [connectRecvTransportState, setconnectRecvTransportState] =
    useState<any>({
      params: null,
      instance: null,
      triggered: false,
    });

  const [sendTransport, setSendTransport] = useState<any>(null);
  const [recvTransport, setRecvTransport] = useState<any>(null);
  const [pendingConsumeResponses, setPendingConsumeResponses] = useState<any[]>(
    [],
  );
  const [consumers, setConsumers] = useState<Map<string, any>>(new Map());
  const [joinedParticipants, setJoinedParticipants] = useState<
    { clientId: string; username: string }[]
  >([]);
  const [pendingProducerIds, setPendingProducerIds] = useState<string[]>([]);
  const [participantStatuses, setParticipantStatuses] = useState<
    Map<string, { muted: boolean; cameraOff: boolean }>
  >(new Map());
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState<boolean>(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState<boolean>(false);
  const [updatingRequestToken, setUpdatingRequestToken] = useState<
    string | null
  >(null);
  // username -> { member_id, role, account_id } for realm members, used to
  // show roles and offer promote/demote on conference participants.
  const [memberRoleMap, setMemberRoleMap] = useState<
    Map<string, { member_id: string; role: string; account_id: string }>
  >(new Map());
  const [roleMenuFor, setRoleMenuFor] = useState<string | null>(null);
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);
  const hasLeftRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const isConsumingRef = useRef(false);
  const producerOwnerRef = useRef<Map<string, string>>(new Map());
  const producerSourceRef = useRef<Map<string, string>>(new Map());
  const leaveCallProcessRef = useRef<any>(null);
  const pendingProduceTracksRef = useRef<
    { kind: string; track: MediaStreamTrack; source?: string }[]
  >([]);
  const clientIdRef = useRef<string>(
    (() => {
      // 1. Safe guard check for Server-Side Rendering (SSR) / Window context
      if (typeof window !== "undefined") {
        const savedDevice = localStorage.getItem("device");
        if (savedDevice) return savedDevice;
      }

      // 2. Fallback identifier generator
      return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    })(), // <--- Added () here to invoke the function immediately
  );

  const audioProducerRef = useRef<any>(null);
  const videoProducerRef = useRef<any>(null);
  const screenProducerRef = useRef<any>(null);
  const screenAudioProducerRef = useRef<any>(null);
  const encodingsRef = useRef<{ camera: any[]; screenshare: any[] } | null>(
    null,
  );
  const isReconnectingRef = useRef(false);

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const conversationID = useMemo(
    () => data.conversationID || data.conversationid,
    [data],
  );
  const isGroupCall = useMemo(
    () => data.isGroup ?? data.conversationType === "group",
    [data],
  );
  const members = useMemo(() => {
    if (!isGroupCall) {
      const candidateMembers = [
        data.userdetails?.userID,
        data.caller?.userID,
        ...(Array.isArray(data.recepients) ? data.recepients : []),
      ].filter(Boolean) as string[];

      return Array.from(new Set(candidateMembers)).filter(
        (flt: string) => flt !== authentication.user.userID,
      );
    } else {
      return (data.groupdetails?.receivers || data.recepients || []).filter(
        (flt: string) => flt !== authentication.user.userID,
      );
    }
  }, [data, authentication, isGroupCall]);

  const conferenceConversationSetup = useMemo(
    () => ({
      conversationid: conversationID,
      type: "conference",
      userdetails: {
        userID: "",
        fullname: { firstName: "", middleName: "", lastName: "" },
        profile: "",
      },
      groupdetails: {
        ...(data.groupdetails || {}),
        groupName:
          data.groupdetails?.groupName || data.callDisplayName || "Conference",
        profile: data.groupdetails?.profile ?? "none",
        receivers: data.groupdetails?.receivers || data.recepients || members,
        serverID: null,
      },
    }),
    [conversationID, data, members],
  );

  const fetchPendingRequests = useCallback(
    (showLoader = false) => {
      if (!realmId || !canManageRequests) {
        return;
      }
      if (showLoader) {
        setRequestsLoading(true);
      }
      GetRealmInviteRequest({
        realm_id: realmId,
        kind: "request",
        status: "pending",
      })
        .then((response) => {
          const result = response?.result;
          setPendingRequests(Array.isArray(result) ? result : []);
        })
        .catch((err) => {
          console.log("Failed to load join requests:", err);
        })
        .finally(() => {
          if (showLoader) {
            setRequestsLoading(false);
          }
        });
    },
    [realmId, canManageRequests],
  );

  const resolveRequest = useCallback(
    async (inviteToken: string, nextStatus: "accepted" | "declined") => {
      if (!inviteToken || updatingRequestToken) {
        return;
      }
      setUpdatingRequestToken(inviteToken);
      try {
        await UpdateRealmInviteRequest({
          invite_token: inviteToken,
          status: nextStatus,
        });
        setPendingRequests((prev) =>
          prev.filter((req) => req.invite_token !== inviteToken),
        );
      } catch (err) {
        console.log("Failed to update join request:", err);
        fetchPendingRequests();
      } finally {
        setUpdatingRequestToken(null);
      }
    },
    [updatingRequestToken, fetchPendingRequests],
  );

  // Load the current pending requests once for hosts/admins; realtime
  // additions afterwards arrive via SSE (see the listener below).
  useEffect(() => {
    if (!canManageRequests || !realmId) {
      return;
    }
    fetchPendingRequests(true);
  }, [canManageRequests, realmId]);

  // Realtime: a new join request for this room pushed over SSE.
  useEffect(() => {
    if (!canManageRequests) {
      return;
    }

    const handler = (event: any) => {
      if (event.detail?.event !== "conference_request") {
        return;
      }

      let payload: any;
      try {
        payload = JSON.parse(event.detail.data);
      } catch {
        return;
      }

      if (
        realmId &&
        payload?.realm_id &&
        String(payload.realm_id) !== String(realmId)
      ) {
        return;
      }

      const invite = payload?.invite;
      if (!invite || (invite.status && invite.status !== "pending")) {
        return;
      }

      setPendingRequests((prev) =>
        prev.some((req) => req.invite_token === invite.invite_token)
          ? prev
          : [invite, ...prev],
      );
    };

    document.addEventListener("room-events-relay", handler);
    return () => {
      document.removeEventListener("room-events-relay", handler);
    };
  }, [canManageRequests, realmId]);

  const fetchMemberRoles = useCallback(() => {
    if (!realmId) {
      return;
    }
    GetRealmMembersRequest(realmId, 1, 200)
      .then((response) => {
        const results = response?.results;
        if (!Array.isArray(results)) {
          return;
        }
        setMemberRoleMap(() => {
          const next = new Map<
            string,
            { member_id: string; role: string; account_id: string }
          >();
          results.forEach((member: any) => {
            const username = member?.account?.username;
            if (username) {
              next.set(username, {
                member_id: member.member_id,
                role: member.role,
                account_id: member.account.id,
              });
            }
          });
          return next;
        });
      })
      .catch((err) => {
        console.log("Failed to load realm members:", err);
      });
  }, [realmId]);

  // Hosts/admins need member roles to render and manage promote/demote.
  useEffect(() => {
    if (!canManageRequests || !realmId) {
      return;
    }
    fetchMemberRoles();
  }, [canManageRequests, realmId]);

  const changeMemberRole = useCallback(
    async (username: string, nextRole: "admin" | "member") => {
      const member = memberRoleMap.get(username);
      if (!member || updatingRoleFor) {
        return;
      }
      setRoleMenuFor(null);
      setUpdatingRoleFor(username);
      // Optimistic update; SSE will reconcile across all clients.
      setMemberRoleMap((prev) => {
        const next = new Map(prev);
        const current = next.get(username);
        if (current) {
          next.set(username, { ...current, role: nextRole });
        }
        return next;
      });
      try {
        await UpdateMemberRoleRequest(realmId, member.member_id, nextRole);
      } catch (err) {
        console.log("Failed to update member role:", err);
        // Revert on failure.
        setMemberRoleMap((prev) => {
          const next = new Map(prev);
          const current = next.get(username);
          if (current) {
            next.set(username, { ...current, role: member.role });
          }
          return next;
        });
      } finally {
        setUpdatingRoleFor(null);
      }
    },
    [memberRoleMap, updatingRoleFor, realmId],
  );

  const removeParticipant = useCallback(
    async (username: string) => {
      const member = memberRoleMap.get(username);
      if (!member?.account_id || updatingRoleFor) {
        return;
      }
      setRoleMenuFor(null);
      setUpdatingRoleFor(username);
      try {
        // Removes realm membership and pushes a realtime removal notice to
        // the target, whose client then leaves the call (see eject listener).
        await RemoveRealmMemberRequest(realmId, [member.account_id]);
        setMemberRoleMap((prev) => {
          const next = new Map(prev);
          next.delete(username);
          return next;
        });
      } catch (err) {
        console.log("Failed to remove participant:", err);
      } finally {
        setUpdatingRoleFor(null);
      }
    },
    [memberRoleMap, updatingRoleFor, realmId],
  );

  // Realtime: this user was removed from the realm; leave the call.
  useEffect(() => {
    const eventNames = Array.from(
      new Set([realmId, conversationID].filter(Boolean)),
    ) as string[];
    if (eventNames.length === 0) {
      return;
    }

    const handler = (event: any) => {
      if (event.detail?.event === "removed_user_notif") {
        leaveCallProcessRef.current?.();
      }
    };

    eventNames.forEach((name) => document.addEventListener(name, handler));
    return () => {
      eventNames.forEach((name) => document.removeEventListener(name, handler));
    };
  }, [realmId, conversationID]);

  // Realtime: a member's role changed; update the local role map.
  useEffect(() => {
    const handler = (event: any) => {
      if (event.detail?.event !== "conference_member_role") {
        return;
      }

      let payload: any;
      try {
        payload = JSON.parse(event.detail.data);
      } catch {
        return;
      }

      if (
        realmId &&
        payload?.realm_id &&
        String(payload.realm_id) !== String(realmId)
      ) {
        return;
      }

      if (!payload?.username) {
        return;
      }

      setMemberRoleMap((prev) => {
        const next = new Map(prev);
        const current = next.get(payload.username);
        next.set(payload.username, {
          member_id: payload.member_id ?? current?.member_id ?? "",
          role: payload.role,
          account_id: payload.account_id ?? current?.account_id ?? "",
        });
        return next;
      });
    };

    document.addEventListener("room-events-relay", handler);
    return () => {
      document.removeEventListener("room-events-relay", handler);
    };
  }, [realmId]);

  const dispatch = useDispatch();

  const cleanupLocalCallResources = useCallback(() => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    screenStream?.getTracks().forEach((track) => track.stop());
    sendTransport?.close?.();
    recvTransport?.close?.();
    consumers.forEach(({ consumer }) => consumer?.close?.());
    setConsumers(new Map());
    setPendingProducerIds([]);
    setPendingConsumeResponses([]);
    setJoinedParticipants([]);
    setParticipantStatuses(new Map());
    producerOwnerRef.current.clear();
    producerSourceRef.current.clear();
    audioProducerRef.current?.close?.();
    videoProducerRef.current?.close?.();
    screenProducerRef.current?.close?.();
    screenAudioProducerRef.current?.close?.();
    audioProducerRef.current = null;
    videoProducerRef.current = null;
    screenProducerRef.current = null;
    screenAudioProducerRef.current = null;
    pendingProduceTracksRef.current = [];
    setScreenStream(null);
    setIsScreenSharing(false);
  }, [mediaStream, screenStream, sendTransport, recvTransport, consumers]);

  const cleanupTransportsOnly = useCallback(() => {
    sendTransport?.close?.();
    recvTransport?.close?.();
    consumers.forEach(({ consumer }) => consumer?.close?.());
    setConsumers(new Map());
    setPendingProducerIds([]);
    setPendingConsumeResponses([]);
    producerOwnerRef.current.clear();
    producerSourceRef.current.clear();
    audioProducerRef.current?.close?.();
    videoProducerRef.current?.close?.();
    audioProducerRef.current = null;
    videoProducerRef.current = null;
    pendingProduceTracksRef.current = [];
    setSendTransport(null);
    setRecvTransport(null);
    setDevice(null);
    setconnectTransportState({
      params: null,
      instance: null,
      triggered: false,
    });
    setconnectRecvTransportState({
      params: null,
      instance: null,
      triggered: false,
    });
  }, [sendTransport, recvTransport, consumers]);

  const rejoinRoom = useCallback(() => {
    hasJoinedRef.current = false;
    isReconnectingRef.current = true;
    JoinRoomRequest({
      conversationID,
      members,
      instance:
        connectTransportState.instance ||
        connectRecvTransportState.instance ||
        data.instance,
      clientId: clientIdRef.current,
      username: authentication.user.username,
      muted: !enableMic,
      cameraOff: !enableCamera,
    }).finally(() => {
      hasJoinedRef.current = true;
      isReconnectingRef.current = false;
    });
  }, [
    conversationID,
    members,
    connectTransportState.instance,
    connectRecvTransportState.instance,
    data.instance,
    authentication.user.username,
    enableMic,
    enableCamera,
  ]);

  const leaveCallProcess = useCallback(
    ({ keepalive = false }: { keepalive?: boolean } = {}) => {
      if (hasLeftRef.current) {
        return;
      }
      hasLeftRef.current = true;

      const instance =
        connectTransportState.instance ||
        connectRecvTransportState.instance ||
        data.instance;
      const payload = { conversationID, instance };

      const endCallRecepients =
        Array.isArray(data?.recepients) && data.recepients.length > 0
          ? data.recepients
          : members;

      const payloadWithClient = {
        ...payload,
        clientId: clientIdRef.current,
        recipients: endCallRecepients,
      };

      const localUserID = authentication.user.userID;
      const callerUserID = data?.caller?.userID || null;
      const isCaller = callerUserID === localUserID;

      if (!keepalive && isCaller && endCallRecepients.length > 0) {
        EndCallRequest({
          conversationID,
          conversationType:
            data.conversationType || (isGroupCall ? "group" : "single"),
          recepients: endCallRecepients,
        });
      }

      if (keepalive) {
        fetch(`${envs.CHATTERLOOP_API}/webrtc/leave-room-keepalive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": localStorage.getItem("authtoken") || "",
          },
          body: JSON.stringify(payloadWithClient),
          keepalive: true,
        }).catch(() => {
          // no-op
        });
      } else {
        LeaveRoomRequest(payloadWithClient).catch((err) => {
          console.log("Leave room request failed:", err);
        });
      }

      cleanupLocalCallResources();
      //   dispatch({
      //     type: END_CALL_LIST,
      //     payload: {
      //       callID: data.conversationid || conversationID,
      //     },
      //   });
      navigate("/conference");
    },
    [
      cleanupLocalCallResources,
      connectTransportState.instance,
      connectRecvTransportState.instance,
      data,
      conversationID,
      dispatch,
      authentication.user.userID,
      isGroupCall,
      members,
    ],
  );

  useEffect(() => {
    leaveCallProcessRef.current = leaveCallProcess;
  }, [leaveCallProcess]);

  useReconnect({
    conversationID,
    clientId: clientIdRef.current,
    instance:
      connectTransportState.instance ||
      connectRecvTransportState.instance ||
      data.instance,
    sendTransport,
    recvTransport,
    onBeforeRejoin: cleanupTransportsOnly,
    onRejoin: rejoinRoom,
    hasLeft: hasLeftRef.current,
  });

  const createTransportProcess = useCallback(
    async (instance: string | null) => {
      await VoiceRequest({
        userID: authentication.user.userID,
        profile: authentication.user.profile,
        clientID: clientIdRef.current,
        channelID: conversationID,
        recipients: members,
        instance,
      });
      CreateTransportRequest({
        conversationID,
        instance,
        direction: "send",
        clientId: clientIdRef.current,
      });
      CreateTransportRequest({
        conversationID,
        instance,
        direction: "recv",
        clientId: clientIdRef.current,
      });
    },
    [device, conversationID],
  );

  const joinRoomProcess = async (
    routerRtpCapabilities: any,
    instance: string | null,
    participants: {
      clientId: string;
      username: string;
      muted?: boolean;
      cameraOff?: boolean;
    }[] = [],
  ) => {
    const incomingParticipants = participants.filter(
      (participant) => participant.clientId !== clientIdRef.current,
    );

    // Set placeholders immediately, before transport/device setup and consume flow.
    setJoinedParticipants((prev) => {
      const next = new Map(
        prev.map((participant) => [participant.clientId, participant]),
      );
      incomingParticipants.forEach((participant) => {
        next.set(participant.clientId, participant);
      });
      return Array.from(next.values());
    });
    setParticipantStatuses((prev) => {
      const next = new Map(prev);
      incomingParticipants.forEach((participant) => {
        next.set(participant.clientId, {
          muted: participant.muted ?? false,
          cameraOff: participant.cameraOff ?? false,
        });
      });
      return next;
    });

    const newDevice = new Device();
    await newDevice.load({ routerRtpCapabilities });
    setDevice(newDevice);

    createTransportProcess(instance);
  };

  useEffect(() => {
    if (
      device &&
      connectTransportState.params &&
      mediaStream &&
      !connectTransportState.triggered
    ) {
      setconnectTransportState((prev: any) => ({
        ...prev,
        triggered: true,
      }));
      const transport = device.createSendTransport(
        connectTransportState.params,
      );
      setSendTransport(transport);

      transport.on(
        "connect",
        async ({ dtlsParameters }: any, callback: any, errback: any) => {
          try {
            TransportConnectRequest({
              conversationID,
              transportId: connectTransportState.params.id,
              dtlsParameters,
              instance: connectTransportState.instance,
              clientId: clientIdRef.current,
            });
            callback();
          } catch (error) {
            errback(error);
          }
        },
      );

      transport.on(
        "produce",
        async (
          { kind, rtpParameters, appData }: any,
          callback: any,
          errback: any,
        ) => {
          const pendingIndex = pendingProduceTracksRef.current.findIndex(
            (entry) =>
              entry.kind === kind &&
              (!appData?.source || entry.source === appData?.source),
          );
          const pendingEntry =
            pendingIndex >= 0
              ? pendingProduceTracksRef.current.splice(pendingIndex, 1)[0]
              : null;
          const targetTrack =
            pendingEntry?.track ||
            (kind === "audio"
              ? mediaStream.getAudioTracks()[0]
              : mediaStream.getVideoTracks()[0]);

          if (!targetTrack) {
            errback(new Error(`Missing ${kind} track`));
            return;
          }

          const temporaryListener = async (event: any) => {
            const data = JSON.parse(event.detail.data);
            if (data.clientId && data.clientId !== clientIdRef.current) {
              return;
            }
            switch (event.detail.event) {
              case "produce-response":
                callback({ id: data.id });
                document.removeEventListener(
                  "room-events-relay-produce",
                  temporaryListener,
                );
                break;
              default:
                break;
            }
          };

          document.addEventListener(
            "room-events-relay-produce",
            temporaryListener,
          );
          try {
            await TransportProduceRequest({
              conversationID,
              transportId: connectTransportState.params.id,
              kind,
              rtpParameters,
              instance: connectTransportState.instance,
              members,
              track: targetTrack,
              clientId: clientIdRef.current,
              appData,
            });
          } catch (error) {
            console.error("❌ SERVER CONNECT FAILED:", error);
            document.removeEventListener(
              "room-events-relay-produce",
              temporaryListener,
            );
            errback(error);
          }
        },
      );

      const startStreaming = async () => {
        try {
          const videoTrack = mediaStream.getVideoTracks()[0];
          const audioTrack = mediaStream.getAudioTracks()[0];

          if (videoTrack) {
            pendingProduceTracksRef.current.push({
              kind: videoTrack.kind,
              track: videoTrack,
              source: "camera",
            });
            videoProducerRef.current = await transport.produce({
              track: videoTrack,
              kind: videoTrack.kind,
              encodings: encodingsRef.current?.camera,
              appData: { source: "camera" },
            });
            if ((data.type || data.callType) !== "video") {
              videoProducerRef.current.pause();
            }
            console.log("Video producer created!", videoProducerRef.current.id);
          }

          if (audioTrack) {
            pendingProduceTracksRef.current.push({
              kind: audioTrack.kind,
              track: audioTrack,
              source: "microphone",
            });
            audioProducerRef.current = await transport.produce({
              track: audioTrack,
              kind: audioTrack.kind,
              appData: { source: "microphone" },
            });
            console.log("Audio producer created!", audioProducerRef.current.id);
          }
        } catch (e) {
          console.error("Produce failed", e);
        }
      };

      startStreaming();
    }
  }, [device, connectTransportState, mediaStream, members]);

  useEffect(() => {
    if (!sendTransport || !screenStream || screenProducerRef.current) {
      return;
    }

    const screenTrack = screenStream.getVideoTracks()[0];
    const screenAudioTrack = screenStream.getAudioTracks()[0];
    if (!screenTrack && !screenAudioTrack) {
      return;
    }

    const produceScreen = async () => {
      try {
        if (screenTrack) {
          pendingProduceTracksRef.current.push({
            kind: screenTrack.kind,
            track: screenTrack,
            source: "screen",
          });
          screenProducerRef.current = await sendTransport.produce({
            track: screenTrack,
            kind: screenTrack.kind,
            encodings: encodingsRef.current?.screenshare,
            appData: { source: "screen" },
          });
        }

        if (screenAudioTrack) {
          pendingProduceTracksRef.current.push({
            kind: screenAudioTrack.kind,
            track: screenAudioTrack,
            source: "screen-audio",
          });
          screenAudioProducerRef.current = await sendTransport.produce({
            track: screenAudioTrack,
            kind: screenAudioTrack.kind,
            appData: { source: "screen-audio" },
          });
        }

        const handleScreenEnded = () => {
          setIsScreenSharing(false);
          notifyProducerClosed(screenProducerRef.current?.id);
          notifyProducerClosed(screenAudioProducerRef.current?.id);
          screenProducerRef.current?.close?.();
          screenProducerRef.current = null;
          screenAudioProducerRef.current?.close?.();
          screenAudioProducerRef.current = null;
          screenStream.getTracks().forEach((track) => track.stop());
          setScreenStream(null);
        };
        if (screenTrack) {
          screenTrack.onended = handleScreenEnded;
        }
      } catch (err) {
        console.log("Screen share produce failed:", err);
        setIsScreenSharing(false);
      }
    };

    produceScreen();
  }, [sendTransport, screenStream]);

  const connectTransport = (params: any, instance: string) => {
    setconnectTransportState({ params, instance, triggered: false });
  };

  useEffect(() => {
    if (
      device &&
      connectRecvTransportState.params &&
      // recvTransportMetadata &&
      !connectRecvTransportState.triggered
    ) {
      setconnectRecvTransportState((prev: any) => ({
        ...prev,
        triggered: true,
      }));
      const transport = device.createRecvTransport(
        connectRecvTransportState.params,
      );
      setRecvTransport(transport);

      transport.on(
        "connect",
        async ({ dtlsParameters }: any, callback: any) => {
          await TransportConnectRequest({
            conversationID,
            transportId: connectRecvTransportState.params.id,
            dtlsParameters,
            instance: connectRecvTransportState.instance,
            clientId: clientIdRef.current,
          });
          callback();
        },
      );
    }
  }, [device, connectRecvTransportState]);

  const connectRecvTransport = (params: any, instance: string) => {
    setconnectRecvTransportState({ params, instance, triggered: false });
  };

  const consumeProducers = useCallback(
    (conversationID: string, producerId: any) => {
      const recvTransportId = connectRecvTransportState.params?.id;
      const instance =
        connectRecvTransportState.instance || connectTransportState.instance;

      if (!recvTransportId || !instance || !device) {
        setPendingProducerIds((prev) =>
          prev.includes(producerId) ? prev : [...prev, producerId],
        );
        return;
      }

      ConsumeRequest({
        conversationID,
        transportId: recvTransportId,
        producerId,
        rtpCapabilities: device.rtpCapabilities,
        instance,
        clientId: clientIdRef.current,
      });
    },
    [connectRecvTransportState, connectTransportState, device],
  );

  const consumeResponseHandler = useCallback(
    async (
      id: any,
      producerId: any,
      kind: any,
      rtpParameters: any,
      ownerClientId: string | null,
      source: string | null,
    ) => {
      if (!recvTransport) {
        return;
      }

      const consumer = await recvTransport.consume({
        id,
        producerId,
        kind,
        rtpParameters,
      });

      const removeConsumer = () => {
        setConsumers((prev) => {
          if (!prev.has(producerId)) {
            return prev;
          }
          const next = new Map(prev);
          const entry = next.get(producerId);
          entry?.consumer?.close?.();
          next.delete(producerId);
          return next;
        });
      };

      consumer.on("producerclose", removeConsumer);
      consumer.on("transportclose", removeConsumer);
      consumer.on("trackended", removeConsumer);

      setConsumers((prev) => {
        if (prev.has(producerId)) {
          consumer?.close?.();
          return prev;
        }
        const next = new Map(prev);
        next.set(producerId, { id, kind, consumer, ownerClientId, source });
        return next;
      });
    },
    [recvTransport],
  );

  const notifyProducerClosed = useCallback(
    (producerId?: string) => {
      if (!producerId) {
        return;
      }
      const instance =
        connectTransportState.instance ||
        connectRecvTransportState.instance ||
        data.instance;
      CloseProducerRequest({
        conversationID,
        producerId,
        instance,
        clientId: clientIdRef.current,
      }).catch((err) => {
        console.log("Close producer request failed:", err);
      });
    },
    [
      CloseProducerRequest,
      conversationID,
      connectTransportState.instance,
      connectRecvTransportState.instance,
      data.instance,
    ],
  );

  useEffect(() => {
    if (
      !recvTransport ||
      pendingConsumeResponses.length === 0 ||
      isConsumingRef.current
    ) {
      return;
    }

    const nextConsume = pendingConsumeResponses[0];
    isConsumingRef.current = true;

    consumeResponseHandler(
      nextConsume.id,
      nextConsume.producerId,
      nextConsume.kind,
      nextConsume.rtpParameters,
      nextConsume.ownerClientId || null,
      nextConsume.source || null,
    )
      .catch((err) => {
        console.log("Consume response handler failed:", err);
      })
      .finally(() => {
        setPendingConsumeResponses((prev) => prev.slice(1));
        isConsumingRef.current = false;
      });
  }, [recvTransport, pendingConsumeResponses, consumeResponseHandler]);

  useEffect(() => {
    if (
      pendingProducerIds.length === 0 ||
      !connectRecvTransportState.params?.id ||
      !connectRecvTransportState.instance ||
      !device
    ) {
      return;
    }

    pendingProducerIds.forEach((producerId) => {
      ConsumeRequest({
        conversationID,
        transportId: connectRecvTransportState.params.id,
        producerId,
        rtpCapabilities: device.rtpCapabilities,
        instance: connectRecvTransportState.instance,
        clientId: clientIdRef.current,
      });
    });

    setPendingProducerIds([]);
  }, [
    pendingProducerIds,
    connectRecvTransportState,
    device,
    conversationID,
    consumeProducers,
  ]);

  useEffect(() => {
    const initLocalMedia = async () => {
      let audioStream: MediaStream | null = null;
      let videoStream: MediaStream | null = null;

      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (err) {
        console.log("Audio device not available:", err);
      }

      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err) {
        console.log("Video device not available:", err);
      }

      const tracks = [
        ...(audioStream?.getAudioTracks() || []),
        ...(videoStream?.getVideoTracks() || []),
      ];

      if (tracks.length === 0) {
        return;
      }

      const combined = new MediaStream(tracks);
      setmediaStream(combined);
    };

    initLocalMedia();
  }, []);

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setScreenStream(displayStream);
      setIsScreenSharing(true);
    } catch (err) {
      console.log("Screen share request failed:", err);
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = () => {
    notifyProducerClosed(screenProducerRef.current?.id);
    notifyProducerClosed(screenAudioProducerRef.current?.id);
    screenProducerRef.current?.close?.();
    screenProducerRef.current = null;
    screenAudioProducerRef.current?.close?.();
    screenAudioProducerRef.current = null;
    screenStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setIsScreenSharing(false);
  };

  useEffect(() => {
    const instance =
      connectTransportState.instance ||
      connectRecvTransportState.instance ||
      data.instance;

    if (!instance || hasLeftRef.current) {
      return;
    }

    ParticipantStatusRequest({
      conversationID,
      instance,
      clientId: clientIdRef.current,
      muted: !enableMic,
      cameraOff: !enableCamera,
    }).catch((err) => {
      console.log("Participant status request failed:", err);
    });
  }, [
    enableMic,
    enableCamera,
    connectTransportState.instance,
    connectRecvTransportState.instance,
    data.instance,
    conversationID,
  ]);

  useEffect(() => {
    const mainListener = async (event: any) => {
      const data = JSON.parse(event.detail.data);
      const isScopedEvent =
        data?.clientId &&
        [
          "join-room-response",
          "create-transport-response",
          "transport-connect-response",
          "consume-response",
          "consume-error",
          "consume-transport-error",
        ].includes(event.detail.event);

      if (isScopedEvent && data.clientId !== clientIdRef.current) {
        return;
      }

      switch (event.detail.event) {
        case "join-room-response":
          joinRoomProcess(
            data.routerRtpCapabilities,
            data.instance,
            data.participants || [],
          );
          break;
        case "create-transport-response":
          if (data.direction === "send") {
            connectTransport(data.response, data.instance);
          } else {
            connectRecvTransport(data.response, data.instance);
          }
          break;
        case "transport-connect-response":
          console.log(data);
          break;
        case "participant-joined":
          if (
            data.conversationID === conversationID &&
            data.clientId &&
            data.username &&
            data.clientId !== clientIdRef.current
          ) {
            setJoinedParticipants((prev) => {
              if (
                prev.some(
                  (participant) => participant.clientId === data.clientId,
                )
              ) {
                return prev;
              }
              return [
                ...prev,
                { clientId: data.clientId, username: data.username },
              ];
            });
            setParticipantStatuses((prev) => {
              const next = new Map(prev);
              next.set(data.clientId, {
                muted: Boolean(data.muted),
                cameraOff: Boolean(data.cameraOff),
              });
              return next;
            });
          }
          break;
        case "participant-left":
          if (data.conversationID === conversationID) {
            const leftClientId = data.clientId || null;
            const leftUsername = data.username || null;

            setJoinedParticipants((prev) => {
              const next = leftClientId
                ? prev.filter(
                    (participant) => participant.clientId !== leftClientId,
                  )
                : leftUsername
                  ? prev.filter(
                      (participant) => participant.username !== leftUsername,
                    )
                  : prev;

              if (
                !isGroupCall &&
                next.length === 0 &&
                ((leftClientId && leftClientId !== clientIdRef.current) ||
                  (!leftClientId &&
                    leftUsername &&
                    leftUsername !== authentication.user.username))
              ) {
                setTimeout(() => {
                  leaveCallProcess();
                }, 0);
              }

              return next;
            });
            if (leftClientId) {
              setParticipantStatuses((prev) => {
                if (!prev.has(leftClientId)) {
                  return prev;
                }
                const next = new Map(prev);
                next.delete(leftClientId);
                return next;
              });
            }

            const producerIds = data.producerIds || [];
            setConsumers((prev) => {
              const next = new Map(prev);
              producerIds.forEach((producerId: string) => {
                const found = next.get(producerId);
                found?.consumer?.close?.();
                next.delete(producerId);
                producerSourceRef.current.delete(producerId);
              });
              return next;
            });
          }
          break;
        case "callreject": {
          const rejectedConversationID =
            data?.rejectdata?.conversationID || data?.conversationID;
          const rejectedBy = data?.rejectdata?.rejectedBy || data?.rejectedBy;
          const endedBy = data?.rejectdata?.endedBy || data?.endedBy;
          const hasRemoteParticipant =
            joinedParticipants.length > 0 || consumers.size > 0;

          if (!isGroupCall && rejectedConversationID === conversationID) {
            if (endedBy) {
              leaveCallProcess();
              break;
            }

            if (rejectedBy && !hasRemoteParticipant) {
              leaveCallProcess();
            }
          }
          break;
        }
        case "participant-status":
          if (
            data.conversationID === conversationID &&
            data.clientId &&
            data.clientId !== clientIdRef.current
          ) {
            setParticipantStatuses((prev) => {
              const next = new Map(prev);
              next.set(data.clientId, {
                muted: Boolean(data.muted),
                cameraOff: Boolean(data.cameraOff),
              });
              return next;
            });
          }
          break;
        case "producer-closed":
          if (data.conversationID === conversationID && data.producerId) {
            setConsumers((prev) => {
              if (!prev.has(data.producerId)) {
                return prev;
              }
              const next = new Map(prev);
              const entry = next.get(data.producerId);
              entry?.consumer?.close?.();
              next.delete(data.producerId);
              return next;
            });
            producerOwnerRef.current.delete(data.producerId);
            producerSourceRef.current.delete(data.producerId);
          }
          break;
        case "new_producer":
          if (data.clientId === clientIdRef.current) {
            break;
          }
          if (data.conversationID === conversationID) {
            if (data.producerId && data.clientId) {
              producerOwnerRef.current.set(data.producerId, data.clientId);
              if (data.source) {
                producerSourceRef.current.set(data.producerId, data.source);
              }
            }
            if (
              data.clientId &&
              data.username &&
              data.clientId !== clientIdRef.current
            ) {
              setJoinedParticipants((prev) => {
                if (
                  prev.some(
                    (participant) => participant.clientId === data.clientId,
                  )
                ) {
                  return prev;
                }
                return [
                  ...prev,
                  { clientId: data.clientId, username: data.username },
                ];
              });
            }
            consumeProducers(data.conversationID, data.producerId);
          }
          break;
        case "consume-response":
          if (data.conversationID === conversationID) {
            const { id, producerId, kind, rtpParameters, source } = data;
            const ownerClientId =
              producerOwnerRef.current.get(producerId) || null;
            const resolvedSource =
              source || producerSourceRef.current.get(producerId) || null;
            setPendingConsumeResponses((prev) => {
              const isExisting = prev.some((mp) => mp.id === id);
              if (isExisting) {
                return prev;
              }
              return [
                ...prev,
                {
                  id,
                  producerId,
                  kind,
                  rtpParameters,
                  ownerClientId,
                  source: resolvedSource,
                },
              ];
            });
          }
          break;
        case "consume-error":
        case "consume-transport-error":
          console.log("Consume failed:", event.detail.event, data);
          break;
        default:
          break;
      }
    };

    document.addEventListener("room-events-relay", mainListener);

    return () => {
      document.removeEventListener("room-events-relay", mainListener);
    };
  }, [
    consumeProducers,
    leaveCallProcess,
    conversationID,
    isGroupCall,
    authentication,
    joinedParticipants,
    consumers,
  ]);

  useEffect(() => {
    if (data && !hasJoinedRef.current) {
      hasJoinedRef.current = true;

      GetEncodingsRequest()
        .then((res) => {
          if (res) encodingsRef.current = res;
        })
        .catch(() => {
          // Non-fatal — produce will fall back to browser defaults
        });

      JoinRoomRequest({
        conversationID,
        members,
        instance: data.instance,
        clientId: clientIdRef.current,
        username: authentication.user.username,
        muted: !enableMic,
        cameraOff: !enableCamera,
      });
    }
  }, [data, members]);

  useEffect(() => {
    const handlePageExit = () => {
      leaveCallProcessRef.current?.({ keepalive: true });
    };

    window.addEventListener("beforeunload", handlePageExit);
    window.addEventListener("pagehide", handlePageExit);

    return () => {
      window.removeEventListener("beforeunload", handlePageExit);
      window.removeEventListener("pagehide", handlePageExit);
    };
  }, []);

  useEffect(() => {
    return () => {
      leaveCallProcessRef.current?.();
    };
  }, []);

  const videoConsumers = Array.from(consumers.values()).filter(
    ({ kind }) => kind === "video",
  );
  const audioConsumers = Array.from(consumers.values()).filter(
    ({ kind }) => kind === "audio",
  );
  const videoOwnerIds = new Set(
    videoConsumers
      .map(({ ownerClientId }) => ownerClientId)
      .filter((ownerClientId) => Boolean(ownerClientId)),
  );
  const waitingParticipants = joinedParticipants.filter(
    (participant) => !videoOwnerIds.has(participant.clientId),
  );
  const participantByClientId = new Map(
    joinedParticipants.map((participant) => [
      participant.clientId,
      participant,
    ]),
  );

  return (
    <div className="tw-flex tw-flex-row tw-w-full tw-h-full tw-relative">
      <motion.div
        animate={{
          borderWidth: "0px",
        }}
        id="div_conference_indv"
        style={{ flex: 1, minWidth: 0 }}
      >
        <div id="div_top_nav_call_window">
          <span id="span_call_displayname">{data.callDisplayName}</span>
          {/* <button
          onClick={() => {
            // sendVideoData()
          }}
          className="btn_top_nav_call_window"
        >
          <RxEnterFullScreen style={{ fontSize: "20px", color: "white" }} />
        </button> */}
        </div>
        <div className="div_voice_blocks_holder t-scroll">
          {mediaStream ? (
            <UserVideoBlock
              mediaStream={mediaStream}
              cameraOff={!enableCamera}
              muted={!enableMic}
            />
          ) : (
            <div className="div_video_blocks">
              <div className="video_call_display tw-rounded-[5px] tw-flex tw-items-center tw-justify-center tw-bg-[#1f1f1f] tw-text-[12px] tw-font-semibold tw-text-white">
                You
                {!enableCamera ? " • camera off" : ""}
                {!enableMic ? " • muted" : ""}
              </div>
            </div>
          )}
          {screenStream && (
            <div
              className={
                isMobileView ? "div_video_blocks" : "div_video_screen_blocks"
              }
            >
              <div className="video_call_display tw-rounded-[5px] tw-overflow-hidden tw-bg-[#1f1f1f]">
                <video
                  className="video_call_display"
                  autoPlay
                  playsInline
                  muted
                  ref={(node) => {
                    if (node && screenStream) {
                      node.srcObject = screenStream;
                    }
                  }}
                />
              </div>
            </div>
          )}
          {waitingParticipants.map((participant) => (
            <div
              key={`placeholder-${participant.clientId}`}
              className="div_video_blocks"
            >
              <div className="video_call_display tw-rounded-[5px] tw-flex tw-items-center tw-justify-center tw-bg-[#1f1f1f] tw-text-[12px] tw-font-semibold tw-text-white">
                @{participant.username}
                {participantStatuses.get(participant.clientId)?.muted
                  ? " • muted"
                  : ""}
                {participantStatuses.get(participant.clientId)?.cameraOff
                  ? " • camera off"
                  : ""}
              </div>
            </div>
          ))}
          {videoConsumers.map(({ id, consumer, ownerClientId, source }) => {
            const owner = ownerClientId
              ? participantByClientId.get(ownerClientId)
              : null;
            const status = ownerClientId
              ? participantStatuses.get(ownerClientId)
              : null;
            return (
              <RemoteVideo
                key={id}
                consumer={consumer}
                cameraOff={Boolean(status?.cameraOff)}
                muted={Boolean(status?.muted)}
                label={owner ? `@${owner.username}` : "Participant"}
                source={source || undefined}
              />
            );
          })}
        </div>
        <div style={{ display: "none" }}>
          {audioConsumers.map(({ id, consumer, ownerClientId, source }) => {
            const owner = ownerClientId
              ? participantByClientId.get(ownerClientId)
              : null;
            const status = ownerClientId
              ? participantStatuses.get(ownerClientId)
              : null;
            return (
              <RemoteVideo
                key={id}
                consumer={consumer}
                cameraOff={Boolean(status?.cameraOff)}
                muted={Boolean(status?.muted)}
                label={owner ? `@${owner.username}` : "Participant"}
                source={source || undefined}
              />
            );
          })}
        </div>
        <div id="div_voice_controls">
          <button
            onClick={async () => {
              const nextEnableMic = !enableMic;
              setenableMic(nextEnableMic);
              if (audioProducerRef.current) {
                if (enableMic) {
                  await audioProducerRef.current.pause();
                } else {
                  await audioProducerRef.current.resume();
                }
              }
            }}
            className={`btn_call_controls ${enableMic ? "" : "btn_call_controls_enable"}`}
          >
            {enableMic ? <BsFillMicFill /> : <BsFillMicMuteFill />}
          </button>
          <button
            onClick={async () => {
              const nextEnableCamera = !enableCamera;
              setenableCamera(nextEnableCamera);
              if (videoProducerRef.current) {
                if (enableCamera) {
                  await videoProducerRef.current.pause();
                } else {
                  await videoProducerRef.current.resume();
                }
              }
            }}
            className={`btn_call_controls ${enableCamera ? "" : "btn_call_controls_enable"}`}
          >
            {enableCamera ? <BsCameraVideoFill /> : <BsCameraVideoOffFill />}
          </button>
          <button
            onClick={() => {
              if (isScreenSharing) {
                stopScreenShare();
              } else {
                startScreenShare();
              }
            }}
            className={`btn_call_controls ${isScreenSharing ? "btn_call_controls_enable" : ""}`}
          >
            {isScreenSharing ? <MdStopScreenShare /> : <MdScreenShare />}
          </button>
          <button
            onClick={() => {
              setIsChatOpen((prev) => {
                if (!prev) {
                  setIsPeopleOpen(false);
                }
                return !prev;
              });
            }}
            className={`btn_call_controls ${isChatOpen ? "btn_call_controls_enable" : ""}`}
          >
            <BsFillChatDotsFill />
          </button>
          <button
            onClick={() => {
              setIsPeopleOpen((prev) => {
                if (!prev) {
                  setIsChatOpen(false);
                }
                return !prev;
              });
            }}
            className={`btn_call_controls tw-relative ${isPeopleOpen ? "btn_call_controls_enable" : ""}`}
          >
            <FiUsers />
            {canManageRequests && pendingRequests.length > 0 && (
              <span className="tw-absolute tw--top-[2px] tw--right-[2px] tw-min-w-[16px] tw-h-[16px] tw-px-[4px] tw-rounded-full tw-bg-[#e23b3b] tw-text-white tw-text-[10px] tw-font-semibold tw-flex tw-items-center tw-justify-center tw-leading-none">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              leaveCallProcess();
            }}
            className="btn_call_controls btn_call_controls_end"
          >
            <HiPhoneMissedCall />
          </button>
        </div>
      </motion.div>
      {isChatOpen && (
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={
            isMobileView
              ? "tw-absolute tw-inset-0 tw-z-20 tw-bg-white tw-flex tw-flex-col"
              : "tw-w-[360px] tw-h-full tw-bg-white tw-border-l tw-border-[#dedede] tw-flex tw-flex-col tw-flex-shrink-0"
          }
        >
          <div className="tw-flex-1 tw-min-h-0 tw-flex tw-bg-white">
            <Conversation
              conversationsetup={conferenceConversationSetup}
              theme={{ primary: "#4994ec", lighten: "#82b6ec" }}
              setIsChatOpen={setIsChatOpen}
            />
          </div>
        </motion.div>
      )}
      {isPeopleOpen && (
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={
            isMobileView
              ? "cl-redesign tw-absolute tw-inset-0 tw-z-20 tw-bg-[var(--surface)] tw-text-[var(--text)] tw-flex tw-flex-col"
              : "cl-redesign tw-w-[360px] tw-h-full tw-bg-[var(--surface)] tw-text-[var(--text)] tw-border-l tw-border-[var(--border)] tw-flex tw-flex-col tw-flex-shrink-0"
          }
          data-theme={conferenceTheme}
        >
          <div className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-px-[14px] tw-py-[12px] tw-border-b tw-border-[var(--border)] tw-flex-shrink-0">
            <span className="tw-text-[15px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
              People
            </span>
            <button
              type="button"
              aria-label="Close people panel"
              onClick={() => setIsPeopleOpen(false)}
              className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-p-[4px] tw-rounded-full hover:tw-bg-[var(--surface-hover)] tw-flex tw-items-center tw-justify-center tw-text-[var(--text-2)]"
            >
              <IoMdClose style={{ fontSize: "18px" }} />
            </button>
          </div>
          <div className="tw-flex-1 tw-min-h-0 tw-overflow-y-auto t-scroll tw-px-[14px] tw-py-[12px] tw-flex tw-flex-col tw-gap-[18px]">
            {canManageRequests && (
              <div className="tw-flex tw-flex-col tw-gap-[8px]">
                <div className="tw-flex tw-flex-row tw-items-center tw-justify-between">
                  <span className="tw-text-[12px] tw-font-semibold tw-uppercase tw-tracking-[0.04em] tw-text-[var(--text-2)]">
                    Pending requests ({pendingRequests.length})
                  </span>
                  {requestsLoading && (
                    <AiOutlineLoading3Quarters className="tw-animate-spin tw-text-[13px] tw-text-[var(--text-2)]" />
                  )}
                </div>
                {!requestsLoading && pendingRequests.length === 0 ? (
                  <span className="tw-text-[12px] tw-text-[var(--text-2)] tw-font-Inter">
                    No pending join requests.
                  </span>
                ) : (
                  pendingRequests.map((req) => (
                    <div
                      key={req.invite_token || req.id}
                      className="tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-rounded-[10px] tw-border tw-border-[#ededed] tw-bg-[var(--surface)] tw-px-[10px] tw-py-[8px]"
                    >
                      <div className="tw-w-[34px] tw-h-[34px] tw-rounded-full tw-bg-[#e3edfb] tw-text-[var(--brand)] tw-flex tw-items-center tw-justify-center tw-text-[13px] tw-font-semibold tw-flex-shrink-0">
                        {(req.target_email || "?").charAt(0).toUpperCase()}
                      </div>
                      <span
                        title={req.target_email}
                        className="tw-flex-1 tw-min-w-0 tw-text-[12px] tw-text-[var(--text)] tw-font-Inter tw-truncate"
                      >
                        {req.target_email || "Unknown user"}
                      </span>
                      <button
                        type="button"
                        aria-label="Approve request"
                        disabled={updatingRequestToken === req.invite_token}
                        onClick={() =>
                          resolveRequest(req.invite_token, "accepted")
                        }
                        className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-border-none tw-bg-[#2fae5f] tw-text-white tw-flex tw-items-center tw-justify-center tw-cursor-pointer disabled:tw-opacity-[0.5] disabled:tw-cursor-not-allowed tw-flex-shrink-0"
                      >
                        {updatingRequestToken === req.invite_token ? (
                          <AiOutlineLoading3Quarters className="tw-animate-spin tw-text-[13px]" />
                        ) : (
                          <FiCheck size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="Decline request"
                        disabled={updatingRequestToken === req.invite_token}
                        onClick={() =>
                          resolveRequest(req.invite_token, "declined")
                        }
                        className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-border-none tw-bg-[#e23b3b] tw-text-white tw-flex tw-items-center tw-justify-center tw-cursor-pointer disabled:tw-opacity-[0.5] disabled:tw-cursor-not-allowed tw-flex-shrink-0"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="tw-flex tw-flex-col tw-gap-[8px]">
              <span className="tw-text-[12px] tw-font-semibold tw-uppercase tw-tracking-[0.04em] tw-text-[var(--text-2)]">
                In call ({joinedParticipants.length + 1})
              </span>
              <div className="tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-rounded-[10px] tw-px-[10px] tw-py-[8px] tw-bg-[var(--surface)]">
                <div className="tw-w-[34px] tw-h-[34px] tw-rounded-full tw-bg-[#4994ec] tw-text-white tw-flex tw-items-center tw-justify-center tw-text-[13px] tw-font-semibold tw-flex-shrink-0">
                  {(authentication.user.username || "Y")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <span className="tw-flex-1 tw-min-w-0 tw-text-[12px] tw-text-[var(--text)] tw-font-Inter tw-truncate">
                  {authentication.user.username} (You)
                </span>
                {memberRoleMap.get(authentication.user.username)?.role ===
                  "admin" && (
                  <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.04em] tw-text-[var(--brand)] tw-bg-[#e3edfb] tw-rounded-full tw-px-[6px] tw-py-[2px]">
                    Admin
                  </span>
                )}
                <div className="tw-flex tw-flex-row tw-items-center tw-gap-[8px] tw-text-[var(--text-2)]">
                  {!enableMic && <BsFillMicMuteFill size={13} />}
                  {!enableCamera && <BsCameraVideoOffFill size={13} />}
                </div>
              </div>
              {joinedParticipants.map((participant) => {
                const status = participantStatuses.get(participant.clientId);
                const memberInfo = memberRoleMap.get(participant.username);
                const isAdminMember = memberInfo?.role === "admin";
                const canManageThisMember = Boolean(
                  canManageRequests &&
                  memberInfo?.member_id &&
                  participant.username !== selfUsername,
                );
                const isMenuOpen = roleMenuFor === participant.username;
                return (
                  <div
                    key={participant.clientId}
                    className="tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-rounded-[10px] tw-px-[10px] tw-py-[8px] hover:tw-bg-[var(--surface)]"
                  >
                    <div className="tw-w-[34px] tw-h-[34px] tw-rounded-full tw-bg-[#e7e7e7] tw-text-[#555] tw-flex tw-items-center tw-justify-center tw-text-[13px] tw-font-semibold tw-flex-shrink-0">
                      {(participant.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="tw-flex-1 tw-min-w-0 tw-text-[12px] tw-text-[var(--text)] tw-font-Inter tw-truncate">
                      @{participant.username}
                    </span>
                    {isAdminMember && (
                      <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.04em] tw-text-[var(--brand)] tw-bg-[#e3edfb] tw-rounded-full tw-px-[6px] tw-py-[2px]">
                        Admin
                      </span>
                    )}
                    <div className="tw-flex tw-flex-row tw-items-center tw-gap-[8px] tw-text-[var(--text-2)]">
                      {status?.muted && <BsFillMicMuteFill size={13} />}
                      {status?.cameraOff && <BsCameraVideoOffFill size={13} />}
                    </div>
                    {canManageThisMember && (
                      <div className="tw-relative tw-flex-shrink-0">
                        <button
                          type="button"
                          aria-label="Member options"
                          disabled={updatingRoleFor === participant.username}
                          onClick={() =>
                            setRoleMenuFor((prev) =>
                              prev === participant.username
                                ? null
                                : participant.username,
                            )
                          }
                          className="tw-w-[26px] tw-h-[26px] tw-rounded-full tw-border-none tw-bg-transparent tw-text-[#555] tw-flex tw-items-center tw-justify-center tw-cursor-pointer hover:tw-bg-[#ececec] disabled:tw-opacity-[0.5]"
                        >
                          {updatingRoleFor === participant.username ? (
                            <AiOutlineLoading3Quarters className="tw-animate-spin tw-text-[13px]" />
                          ) : (
                            <BsThreeDots size={15} />
                          )}
                        </button>
                        {isMenuOpen && (
                          <div
                            className="tw-fixed tw-inset-0 tw-z-[2]"
                            onClick={() => setRoleMenuFor(null)}
                          />
                        )}
                        {isMenuOpen && (
                          <div className="tw-absolute tw-right-0 tw-top-[30px] tw-z-[3] tw-min-w-[170px] tw-bg-[var(--surface)] tw-rounded-md tw-border tw-border-[#d2d2d2] tw-shadow-md tw-p-[6px] tw-flex tw-flex-col tw-gap-[2px]">
                            {isAdminMember ? (
                              <button
                                type="button"
                                onClick={() =>
                                  changeMemberRole(
                                    participant.username,
                                    "member",
                                  )
                                }
                                className="tw-flex tw-items-center tw-gap-[6px] tw-text-[12px] tw-font-Inter tw-text-[var(--text)] tw-border-none tw-bg-transparent tw-rounded-sm tw-p-[7px] tw-cursor-pointer hover:tw-bg-[#f0f0f0]"
                              >
                                <FaCircleArrowDown size={14} />
                                <span>Demote to Member</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  changeMemberRole(
                                    participant.username,
                                    "admin",
                                  )
                                }
                                className="tw-flex tw-items-center tw-gap-[6px] tw-text-[12px] tw-font-Inter tw-text-[var(--text)] tw-border-none tw-bg-transparent tw-rounded-sm tw-p-[7px] tw-cursor-pointer hover:tw-bg-[#f0f0f0]"
                              >
                                <FaCircleArrowUp size={14} />
                                <span>Promote to Admin</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                removeParticipant(participant.username)
                              }
                              className="tw-flex tw-items-center tw-gap-[6px] tw-text-[12px] tw-font-Inter tw-text-[#e23b3b] tw-border-none tw-bg-transparent tw-rounded-sm tw-p-[7px] tw-cursor-pointer hover:tw-bg-[#fdecec]"
                            >
                              <IoPersonRemove size={14} />
                              <span>Remove from call</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ConferenceVoiceWindow;
