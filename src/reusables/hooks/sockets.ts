import { connect } from 'socket.io-client';

const API = import.meta.env.VITE_CHATTERLOOP_API;

var socket: any | null;

const socketInit = async () => {
    if(!socket){
        socket = connect(API);
        return true;
    }
    else{
        return true;
    }
}

const socketConversationInit = async (data: any, resolve: any) => {
    await socket.emit("init", data);
    await socket.on('newcaller', (data: any) => {
        resolve(data);
    })
}

const socketCloseCall = async (data: any) => {
    await socket.emit("leavecall", data)
    return true;
}

const socketSendData = async (data: any) => {
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