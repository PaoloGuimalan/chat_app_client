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

const socketConversationInit = async (data, resolve) => {
    await socket.emit("init", data);
    await socket.on('newcaller', (data) => {
        resolve(data);
    })
}

const socketCloseCall = async (data) => {
    await socket.emit("leavecall", data)
    return true;
}

const socketSendData = async (data) => {
    if(await socket){
        // console.log(data)
        await socket.emit("data", data)
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