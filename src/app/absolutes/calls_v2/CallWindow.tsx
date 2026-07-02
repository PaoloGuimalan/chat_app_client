/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "../../../styles/styles.css";
import { motion } from "framer-motion";
import { RxEnterFullScreen } from "react-icons/rx";
import {
  BsFillMicFill,
  BsFillMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
} from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { HiPhoneMissedCall } from "react-icons/hi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { END_CALL_LIST } from "@/redux/types";
import UserVideoBlock from "./UserVideoBlock";
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
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import RemoteVideo from "./RemoteVideo";
import envs from "@/reusables/hooks/env_configs";
import { useReconnect } from "@/reusables/hooks/useReconnect";

function CallWindow({ data, lineNum }: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [mediaStream, setmediaStream] = useState<MediaStream | null>(null);
  const [device, setDevice] = useState<any>(null);

  const [enableMic, setenableMic] = useState<boolean>(true);
  const [enableCamera, setenableCamera] = useState<boolean>(
    (data.type || data.callType) === "video",
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
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
  // Tracks whether a reconnect cycle is in progress to guard hasJoinedRef
  const isReconnectingRef = useRef(false);

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
        data.userdetails?.entityID,
        data.caller?.entityID,
        ...(Array.isArray(data.recepients) ? data.recepients : []),
      ].filter(Boolean) as string[];

      return Array.from(new Set(candidateMembers)).filter(
        (flt: string) => flt !== authentication.user.entity_id,
      );
    } else {
      return (data.groupdetails?.receivers || data.recepients || []).filter(
        (flt: string) => flt !== authentication.user.entity_id,
      );
    }
  }, [data, authentication, isGroupCall]);

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

  // Tears down only transport/producer state for reconnect — does NOT stop
  // media tracks or clear participants, so the UI stays stable during the
  // brief reconnect window.
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

  // Re-runs the join flow using the same clientId so the server treats it as
  // a reconnect (no participant-left/joined broadcast to other users).
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
      dispatch({
        type: END_CALL_LIST,
        payload: {
          callID: data.conversationid || conversationID,
        },
      });
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

      // Fetch simulcast encoding presets before joining so they're ready
      // when startStreaming fires after transport setup
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
    <motion.div
      initial={{
        top: `${20 * lineNum == 0 ? 5 : 20 * lineNum}px`,
        left: `${20 * lineNum == 0 ? 5 : 20 * lineNum}px`,
      }}
      animate={{
        maxWidth: "100%",
        minHeight: "100%",
        top: "0px",
        left: "0px",
        borderRadius: "0px",
        borderWidth: "0px",
      }}
      id="div_call_indv"
    >
      <div id="div_top_nav_call_window">
        <span id="span_call_displayname">{data.callDisplayName}</span>
        <button
          onClick={() => {
            // sendVideoData()
          }}
          className="btn_top_nav_call_window"
        >
          <RxEnterFullScreen style={{ fontSize: "20px", color: "white" }} />
        </button>
      </div>
      <div className="div_video_blocks_holder t-scroll">
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
      <div id="div_call_controls">
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
            leaveCallProcess();
          }}
          className="btn_call_controls btn_call_controls_end"
        >
          <HiPhoneMissedCall />
        </button>
      </div>
    </motion.div>
  );
}

export default CallWindow;
