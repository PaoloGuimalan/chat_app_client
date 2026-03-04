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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { END_CALL_LIST } from "@/redux/types";
import UserVideoBlock from "./UserVideoBlock";
import { Device } from "mediasoup-client";
import {
  ConsumeRequest,
  CreateTransportRequest,
  JoinRoomRequest,
  TransportConnectRequest,
  TransportProduceRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import RemoteVideo from "./RemoteVideo";

function CallWindow({ data, lineNum }: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [mediaStream, setmediaStream] = useState<MediaStream | null>(null);
  const [device, setDevice] = useState<any>(null);

  const [enableMic, setenableMic] = useState<boolean>(true);
  const [enableCamera, setenableCamera] = useState<boolean>(
    data.type === "video",
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

  const [_sendTransport, setSendTransport] = useState<any>(null);
  const [recvTransport, setRecvTransport] = useState<any>(null);
  const [recvTransportMetadata, setRecvTransportMetadata] = useState<any>(null);
  const [consumers, setConsumers] = useState<Map<string, any>>(new Map());

  const conversationID = useMemo(() => data.conversationID, [data]);
  const members = useMemo(() => {
    if (!data.isGroup) {
      return [data.userdetails.userID];
    } else {
      return data.groupdetails.receivers.filter(
        (flt: string) => flt !== authentication.user.userID,
      );
    }
  }, [data, authentication]);

  console.log(conversationID, members, data.userdetails.userID, data);

  const dispatch = useDispatch();

  const createTransportProcess = useCallback(
    async (instance: string | null) => {
      console.log(instance);
      CreateTransportRequest({ conversationID, instance, direction: "send" });
    },
    [device, conversationID],
  );

  const createRecvTransportProcess = (
    id: any,
    producerId: any,
    kind: any,
    rtpParameters: any,
  ) => {
    CreateTransportRequest({
      conversationID,
      instance: connectTransportState.instance,
      direction: "recv",
    });

    setRecvTransportMetadata({ id, producerId, kind, rtpParameters });
  };

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

          const temporaryListener = async (event: any) => {
            const data = JSON.parse(event.detail.data);
            switch (event.detail.event) {
              case "produce-response":
                callback({ id: data.id });
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
              track: mediaStream.getVideoTracks()[0],
            }).then(() => {
              document.removeEventListener(
                "room-events-relay-produce",
                temporaryListener,
              );
            });
          } catch (error) {
            console.error("❌ SERVER CONNECT FAILED:", error);
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
          const track = mediaStream.getVideoTracks()[0]; // Get the video track
          console.log("🚀 Kicking off the connection...");

          // THIS IS THE CALL that triggers the "connect" event above!
          const producer = await transport.produce({ track, kind: track.kind });

          console.log("✅ Producer created!", producer.id);
        } catch (e) {
          console.error("Produce failed", e);
        }
      };

      startStreaming();
    }
  }, [device, connectTransportState, mediaStream, members]);

  const connectTransport = (params: any, instance: string) => {
    setconnectTransportState({ params, instance });
  };

  useEffect(() => {
    if (
      device &&
      connectRecvTransportState.params &&
      mediaStream &&
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
            instance: connectRecvTransportState.params.instance,
          });
          callback();
        },
      );

      transport.on("connectionstatechange", (state: any) => {
        console.log("🔗 RECV STATE CHANGED:", state);
        // Should see: "new" → "connecting" → "connected"
      });

      transport.consume({
        dtlsParameters: connectRecvTransportState.params.dtlsParameters,
      });
    }
  }, [device, connectRecvTransportState, mediaStream]);

  const connectRecvTransport = (params: any, instance: string) => {
    setconnectRecvTransportState({ params, instance });
  };

  const consumeProducers = useCallback(
    (conversationID: string, transportId: any, producerId: any) => {
      if (!connectTransportState.instance) {
        console.log("Instance null");

        return;
      }

      ConsumeRequest({
        conversationID,
        transportId,
        producerId,
        rtpCapabilities: device.rtpCapabilities,
        instance: connectTransportState.instance,
      });
    },
    [connectTransportState, device],
  );

  const consumeResponseHandler = async (
    id: any,
    producerId: any,
    kind: any,
    rtpParameters: any,
  ) => {
    const consumer = await recvTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
    });

    const consumerData = { id, producerId, kind, consumer };
    console.log("CONSUMER DATA", consumerData);
    console.log("Recv transport:", recvTransport.connectionState);
    setConsumers((prev) => new Map(prev).set(producerId, consumerData));
  };

  useEffect(() => {
    if (recvTransport && recvTransportMetadata) {
      consumeResponseHandler(
        recvTransportMetadata.id,
        recvTransportMetadata.producerId,
        recvTransportMetadata.kind,
        recvTransportMetadata.rtpParameters,
      );
    }
  }, [recvTransport, recvTransportMetadata]);

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
      switch (event.detail.event) {
        case "join-room-response":
          joinRoomProcess(data.routerRtpCapabilities, data.instance);
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
          console.log(data);
          break;
        case "new_producer":
          console.log(data, conversationID);
          if (data.conversationID === conversationID) {
            consumeProducers(
              data.conversationID,
              data.transportId,
              data.producerId,
            );
          }
          break;
        case "consume-response":
          console.log(data, conversationID);
          if (data.conversationID === conversationID) {
            const { id, producerId, kind, rtpParameters } = data;
            createRecvTransportProcess(id, producerId, kind, rtpParameters);
            // consumeResponseHandler(id, producerId, kind, rtpParameters);
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener("room-events-relay", mainListener);

    return () => {
      document.removeEventListener("room-events-relay", mainListener);
    };
  }, [consumeProducers]);

  useEffect(() => {
    if (data) {
      JoinRoomRequest({ conversationID, members, instance: data.instance });
    }
  }, [data, members]);

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
        {Array.from(consumers.values()).map(({ id, consumer }) => (
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
            // endCallProcess();
            mediaStream?.getTracks().map((mp) => {
              mp.stop();
            });
            dispatch({
              type: END_CALL_LIST,
              payload: {
                callID: data.conversationid,
              },
            });
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
