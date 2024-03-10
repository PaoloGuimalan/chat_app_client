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

const socketConversationInit = async (data: any, initcaller: any, resolve: any, newcaller: any, answerreponse: any, addnewicecandidate: any) => {
    await socket.emit("init", data);
    await socket.on('caller_connected', (data: any) => {
        initcaller(data);
    })
    await socket.on('newOfferAwaiting', (data: any) => {
        resolve(data);
    })
    await socket.on('newCaller', (data: any) => {
        newcaller(data);
    })
    await socket.on('answerResponse', (data: any) => {
        answerreponse(data);
    })
    await socket.on('receivedIceCandidateFromServer', (data: any) => {
        addnewicecandidate(data);
    })
}

const socketCloseCall = async (data: any) => {
    await socket.emit("leavecall", data)
    return true;
}

const socketSendNewOffer = async (data: any) => {
    await socket.emit("newOffer", data)
    return true;
}

const socketEmitNewAnswer = async (data: any) => {
    if(await socket){
        return await socket.emitWithAck('newAnswer', data);
    }
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

const socketSendIceCandidate = async (data: any) => {
    // console.log("SOCKET CHECKER", socket)
    if(await socket){
        await socket.emit("sendIceCandidateToSignalingServer", data);
    }
}

const endSocket = () => {
    if(socket){
        socket.close();
        socket = null;
    }
}

export {
    socket,
    socketInit,
    socketConversationInit,
    socketSendNewOffer,
    socketSendData,
    socketSendAnswerData,
    socketSendNegotiationData,
    socketFinishNegotiationData,
    socketSendIceCandidate,
    socketEmitNewAnswer,
    socketCloseCall,
    endSocket
}