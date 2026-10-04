/* eslint-disable @typescript-eslint/no-explicit-any */
import { connect } from "socket.io-client";
import envs from "./env_configs";

const API = envs.CHATTERLOOP_API;

let socket: any | null;

const socketMapConnect = async () => {
  if (!socket) {
    // socket.io reads the URL's path as the namespace, not as a route, so the
    // API's gateway prefix (api.chatterloop.app/<prefix>) has to go in `path`
    // instead - otherwise the handshake hits /socket.io at the host root.
    const apiUrl = new URL(API);
    socket = connect(`${apiUrl.origin}/map`, {
      path: `${apiUrl.pathname.replace(/\/$/, "")}/socket.io`,
    });
    return true;
  } else {
    return true;
  }
};

const socketMapInit = async (data: { id: string; userID: string }) => {
  await socket.emit("init", data);
};

const socketSendCoordinatesBroadcast = async (data: any) => {
  if (socket) {
    await socket.emit("coordinatesbroadcast", data);
    return;
  }

  console.log("No active sockets");
};

const endMapSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export {
  socket,
  socketMapInit,
  socketMapConnect,
  socketSendCoordinatesBroadcast,
  endMapSocket,
};
