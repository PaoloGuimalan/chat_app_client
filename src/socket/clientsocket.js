// console.log("Hello!");
const io = require("socket.io-client");
const socket = io.connect("https://chatappsocket187.herokuapp.com/", {
    withCredentials: true,
    extraHeaders: {
      "my-custom-header": "abcd"
    },
    'sync disconnect on unload': true, transports : ['websocket'] });

socket.on("connect", () => {
    console.log("Connected!");
    socket.emit("connected");
    socket.emit("disconnect")
})