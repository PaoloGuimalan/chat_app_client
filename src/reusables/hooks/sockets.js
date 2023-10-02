import io from 'socket.io-client';

const API = process.env.REACT_APP_CHATTERLOOP_API;

var socket;

const socketInit = async () => {
    if(!socket){
        socket = await io.connect(API);
        return true;
    }
    else{
        return true;
    }
}

const socketConversationInit = (data) => {
    socket.emit("init", data)
}

const socketCloseCall = async (data) => {
    await socket.emit("leavecall", data)
    return true;
}

const socketSendData = (data) => {
    if(socket){
        socket.emit("data", data)
    }
}

const endSocket = () => {
    if(socket){
        socket.close();
        socket = null;
    }
}

export {
    socketInit,
    socketConversationInit,
    socketSendData,
    socketCloseCall,
    endSocket
}