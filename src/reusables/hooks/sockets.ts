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

const socketConversationInit = async (data: any, resolve: any, peerservicecallback: any, answerservicecallback: any, pushnegotiationcallback: any, pushfinishnegotiationcallback: any) => {
    await socket.emit("init", data);
    await socket.on('newcaller', (data: any) => {
        resolve(data);
    })
    await socket.on('connect_peer_service', (data: any) => {
        peerservicecallback(data);
    })
    await socket.on('answer_peer_service', (data: any) => {
        answerservicecallback(data)
    })
    await socket.on('push_negotiation_data', (data: any) => {
        pushnegotiationcallback(data)
    })
    await socket.on('push_finish_negotiation_data', (data: any) => {
        pushfinishnegotiationcallback(data)
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

const socketSendAnswerData = async (data: any) => {
    if(await socket){
        // console.log(data)
        await socket.emit("answer_data", data)
    }
}

const socketSendNegotiationData = async (data: any) => {
    if(await socket){
        // console.log(data)
        await socket.emit("answer_negotiation_data", data)
    }
}

const socketFinishNegotiationData = async (data: any) => {
    if(await socket){
        // console.log(data)
        await socket.emit("finish_negotiation_data", data)
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
    socketSendAnswerData,
    socketSendNegotiationData,
    socketFinishNegotiationData,
    socketCloseCall,
    endSocket
}