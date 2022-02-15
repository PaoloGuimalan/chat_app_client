

const socketter = (userID) => {
  // console.log("Hello!");
const io = require("socket.io-client");
const socket = io.connect("https://chatappsocket187.herokuapp.com/", {
    withCredentials: true,
    extraHeaders: {
      "my-custom-header": "abcd"
    },
    'sync disconnect on unload': true, transports : ['websocket'] });

// const socket = io.connect("https://chatappsocket187.herokuapp.com/");
  socket.on("connect", () => {
    console.log("Connected!");
    socket.emit("connected", userID);
    // socket.on("return-status", (status) => {
    //   console.log(status);
    // })
    socket.emit("disconnect");
    // socket.disconnect();
})
console.log(userID);
}

export default socketter;