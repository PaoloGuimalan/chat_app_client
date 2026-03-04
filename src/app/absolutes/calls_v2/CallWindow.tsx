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
import { HiPhoneMissedCall } from "react-icons/hi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { END_CALL_LIST } from "@/redux/types";
import UserVideoBlock from "./UserVideoBlock";
import { Device } from "mediasoup-client";
import {
  ConsumeRequest,
  CreateTransportRequest,
  JoinRoomRequest,
  LeaveRoomRequest,
  TransportConnectRequest,
  TransportProduceRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import RemoteVideo from "./RemoteVideo";
import envs from "@/reusables/hooks/env_configs";

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
  const [pendingProducerIds, setPendingProducerIds] = useState<string[]>([]);
  const hasLeftRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const isConsumingRef = useRef(false);
  const leaveCallProcessRef = useRef<any>(null);
  const clientIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

  console.log(conversationID, members, data.userdetails?.userID, data);

  const dispatch = useDispatch();

  const cleanupLocalCallResources = useCallback(() => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    sendTransport?.close?.();
    recvTransport?.close?.();
    consumers.forEach(({ consumer }) => consumer?.close?.());
    setConsumers(new Map());
    setPendingProducerIds([]);
    setPendingConsumeResponses([]);
  }, [mediaStream, sendTransport, recvTransport, consumers]);

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
      const payloadWithClient = { ...payload, clientId: clientIdRef.current };

      if (keepalive) {
        fetch(`${envs.CHATTERLOOP_API}/webrtc/leave-room`, {
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
    ],
  );

  useEffect(() => {
    leaveCallProcessRef.current = leaveCallProcess;
  }, [leaveCallProcess]);

  const createTransportProcess = useCallback(
    async (instance: string | null) => {
      console.log(instance);
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
  ) => {
    const newDevice = new Device();
    await newDevice.load({ routerRtpCapabilities });
    setDevice(newDevice);

    createTransportProcess(instance);
  };

  console.log(device, connectTransportState);

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
      console.log("Local producers:", transport._producers?.size || 0);
      setSendTransport(transport);

      transport.on(
        "connect",
        async ({ dtlsParameters }: any, callback: any, errback: any) => {
          console.log("🔌 CONNECT FIRED!");
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
        async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
          console.log("🎬 PRODUCE FIRED!");
          const targetTrack =
            kind === "audio"
              ? mediaStream.getAudioTracks()[0]
              : mediaStream.getVideoTracks()[0];

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
            console.log("📡 Calling TransportConnectRequest...");
            await TransportProduceRequest({
              conversationID,
              transportId: connectTransportState.params.id,
              kind,
              rtpParameters,
              instance: connectTransportState.instance,
              members,
              track: targetTrack,
              clientId: clientIdRef.current,
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

      transport.on("connectionstatechange", (state: any) => {
        console.log("🔗 STATE:", state);
      });
      transport.on("dtlsstatechange", (state: any) => {
        console.log("🔐 DTLS:", state);
      });

      const startStreaming = async () => {
        try {
          console.log("🚀 Kicking off the connection...");
          const videoTrack = mediaStream.getVideoTracks()[0];
          const audioTrack = mediaStream.getAudioTracks()[0];
          console.log("🎙️ Local audio tracks:", mediaStream.getAudioTracks().length);
          console.log("📷 Local video tracks:", mediaStream.getVideoTracks().length);

          if (videoTrack) {
            const videoProducer = await transport.produce({
              track: videoTrack,
              kind: videoTrack.kind,
            });
            console.log("✅ Video producer created!", videoProducer.id);
          }

          if (audioTrack) {
            const audioProducer = await transport.produce({
              track: audioTrack,
              kind: audioTrack.kind,
            });
            console.log("✅ Audio producer created!", audioProducer.id);
          }
        } catch (e) {
          console.error("Produce failed", e);
        }
      };

      startStreaming();
    }
  }, [device, connectTransportState, mediaStream, members]);

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

      transport.on("connectionstatechange", (state: any) => {
        console.log("🔗 RECV STATE CHANGED:", state);
        // Should see: "new" → "connecting" → "connected"
      });

      // transport.consume({
      //   id: recvTransportMetadata.id,
      //   producerId: recvTransportMetadata.producerId,
      //   kind: recvTransportMetadata.kind,
      //   rtpParameters: recvTransportMetadata.rtpParameters,
      // });
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
        console.log("Consume deferred: missing recv transport/device/instance");
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

  const consumeResponseHandler = useCallback(async (
    id: any,
    producerId: any,
    kind: any,
    rtpParameters: any,
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

    setConsumers((prev) => {
      if (prev.has(producerId)) {
        consumer?.close?.();
        return prev;
      }
      const next = new Map(prev);
      next.set(producerId, { id, kind, consumer });
      return next;
    });

    console.log("🎥 CONSUMER ADDED TO STATE:", producerId);
  }, [recvTransport]);

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

  console.log(consumers);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((value) => {
        setmediaStream(value);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

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
          joinRoomProcess(data.routerRtpCapabilities, data.instance);
          break;
        case "create-transport-response":
          if (data.direction === "send") {
            connectTransport(data.response, data.instance);
          } else {
            console.log("RECVVVVVVVVVVVVV");
            connectRecvTransport(data.response, data.instance);
          }
          break;
        case "transport-connect-response":
          console.log(data);
          break;
        case "participant-joined":
          console.log(data);
          break;
        case "participant-left":
          if (data.conversationID === conversationID) {
            const producerIds = data.producerIds || [];
            setConsumers((prev) => {
              const next = new Map(prev);
              producerIds.forEach((producerId: string) => {
                const found = next.get(producerId);
                found?.consumer?.close?.();
                next.delete(producerId);
              });
              return next;
            });

            const isSingleCall = !isGroupCall;
            const leftUserId = data.username;
            if (
              isSingleCall &&
              leftUserId &&
              leftUserId !== authentication.user.userID
            ) {
              leaveCallProcess();
            }
          }
          break;
        case "new_producer":
          console.log(data, conversationID);
          if (data.clientId === clientIdRef.current) {
            break;
          }
          if (data.conversationID === conversationID) {
            consumeProducers(data.conversationID, data.producerId);
          }
          break;
        case "consume-response":
          console.log(data, conversationID);
          if (data.conversationID === conversationID) {
            const { id, producerId, kind, rtpParameters } = data;
            setPendingConsumeResponses((prev) => {
              const isExisting = prev.some((mp) => mp.id === id);
              if (isExisting) {
                return prev;
              }
              return [...prev, { id, producerId, kind, rtpParameters }];
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
  }, [consumeProducers, leaveCallProcess, conversationID, isGroupCall, authentication]);

  useEffect(() => {
    if (data && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      JoinRoomRequest({
        conversationID,
        members,
        instance: data.instance,
        clientId: clientIdRef.current,
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
      <div className="div_video_blocks_holder">
        {mediaStream && <UserVideoBlock mediaStream={mediaStream} />}
        {Array.from(consumers.values())
          .filter(({ kind }) => kind === "video")
          .map(({ id, consumer }) => (
          <RemoteVideo key={id} consumer={consumer} />
          ))}
      </div>
      <div style={{ display: "none" }}>
        {Array.from(consumers.values())
          .filter(({ kind }) => kind === "audio")
          .map(({ id, consumer }) => (
            <RemoteVideo key={id} consumer={consumer} />
          ))}
      </div>
      <div id="div_call_controls">
        <button
          onClick={() => {
            setenableMic(!enableMic);
          }}
          className={`btn_call_controls ${enableMic ? "" : "btn_call_controls_enable"}`}
        >
          {enableMic ? <BsFillMicFill /> : <BsFillMicMuteFill />}
        </button>
        <button
          onClick={() => {
            setenableCamera(!enableCamera);
          }}
          className={`btn_call_controls ${enableCamera ? "" : "btn_call_controls_enable"}`}
        >
          {enableCamera ? <BsCameraVideoFill /> : <BsCameraVideoOffFill />}
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
