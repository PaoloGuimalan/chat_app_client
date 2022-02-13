// console.log("Hello!");
const io = require("socket.io-client");
// const socket = io.connect("localhost:3002/", {
//     withCredentials: true,
//     extraHeaders: {
//       "my-custom-header": "abcd"
//     },
//     'sync disconnect on unload': true, transports : ['websocket'] });

const socket = io.connect("https://chatappsocket187.herokuapp.com/");

socket.on("connect", () => {
    console.log("Connected!");
    socket.emit("connected");
    socket.emit("disconnect");
    // socket.disconnect();
})