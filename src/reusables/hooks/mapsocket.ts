/* eslint-disable @typescript-eslint/no-explicit-any */
import { connect } from "socket.io-client";
import envs from "./env_configs";

const API = envs.CHATTERLOOP_API;

let socket: any | null;

const socketMapConnect = async () => {
  if (!socket) {
    socket = connect(`${API}/map`);
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
