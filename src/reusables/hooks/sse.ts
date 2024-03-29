import sign from 'jwt-encode'
import jwt_decode from 'jwt-decode'
import { SET_ALERTS, SET_CONTACTS_LIST, SET_IS_TYPING_LIST, SET_MESSAGES_LIST, SET_NOTIFICATIONS_LIST, SET_PENDING_CALL_ALERTS, SET_REJECTED_CALL_LIST, UPDATE_ACTIVE_USERS_LIST } from '../../redux/types';
import message_ringtone from '../../assets/sounds/message_alert.mp3'
import notification_ringtone from '../../assets/sounds/notification_alert.mp3'
import seen_rightone from '../../assets/sounds/seen_alert.mp3'
import chatterloop_icon from '../../assets/imgs/chatterloop.png'
import { Dispatch } from 'react';

const API = import.meta.env.VITE_CHATTERLOOP_API;
const SECRET = import.meta.env.VITE_JWT_SECRET;

var sseNtfsSource: any = null

const SSENotificationsTRequest = (dispatch: Dispatch<any>, currentAlertState: any, authentication: any) => {
    const payload = {
        token: localStorage.getItem("authtoken"),
        type: "notifications"
    }

    const encodedPayload = sign(payload, SECRET)

    sseNtfsSource = new EventSource(`${API}/u/sseNotifications/${encodedPayload}`)
    
    sseNtfsSource.addEventListener('notifications', (e: any) => {
        const parsedresponse = JSON.parse(e.data)
        // console.log(parsedresponse)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult: any = jwt_decode(parsedresponse.result)
                // console.log(decodedResult)
                //play ringtone
                let audioMessage = new Audio(notification_ringtone);
                audioMessage.play();

                dispatch({ type: SET_NOTIFICATIONS_LIST, payload: {
                    notficationslist: {
                        list: decodedResult.notifications,
                        totalunread: decodedResult.totalunread
                    }
                } })

                dispatch({ type: SET_ALERTS, payload:{
                    alerts: {
                        id: currentAlertState.length,
                        type: "info",
                        content: parsedresponse.message
                      }
                }})
            }
        }
    })

    sseNtfsSource.addEventListener('notifications_reload', (e: any) => {
        const parsedresponse = JSON.parse(e.data)
        // console.log(parsedresponse)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult: any = jwt_decode(parsedresponse.result)

                dispatch({ type: SET_NOTIFICATIONS_LIST, payload: {
                    notficationslist: {
                        list: decodedResult.notifications,
                        totalunread: decodedResult.totalunread
                    }
                } })
            }
        }
    });

    sseNtfsSource.addEventListener('istyping_broadcast', (e: any) => {
        const parsedresponse = JSON.parse(e.data)
        // console.log(parsedresponse)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult: any = jwt_decode(parsedresponse.result)

                dispatch({
                    type: SET_IS_TYPING_LIST,
                    payload: {
                        istyping: decodedResult.istyping
                    }
                })

                // console.log(decodedResult.istyping);
            }
        }
    });

    sseNtfsSource.addEventListener('incomingcall', (e: any) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult: any = jwt_decode(parsedresponse.result)
                var randomID =  Math.random() * (2000 - 1 + 1) + 1
                //play ringtone

                dispatch({ type: SET_ALERTS, payload:{
                    alerts: {
                        id: randomID,
                        type: "incomingcall",
                        content: parsedresponse.message,
                        callmetadata: decodedResult.callmetadata
                      }
                }})

                dispatch({
                    type: SET_PENDING_CALL_ALERTS,
                    payload: {
                        pendingcallalerts: {
                            callID: decodedResult.callmetadata.conversationID
                        }
                    }
                })
            }
        }
    })

    sseNtfsSource.addEventListener('callreject', (e: any) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult: any = jwt_decode(parsedresponse.result)
                const conversationID: any = decodedResult.rejectdata.conversationID;

                // console.log("ERR REJ END", decodedResult);

                dispatch({
                    type: SET_REJECTED_CALL_LIST,
                    payload: {
                      callID: conversationID
                    }
                })
            }
        }
    })

    sseNtfsSource.addEventListener('contactslist', (e: any) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult: any = jwt_decode(parsedresponse.result)

                //play ringtone

                dispatch({ type: SET_CONTACTS_LIST, payload: {
                    contactslist: decodedResult.contacts
                } })
            }
        }
    })

    sseNtfsSource.addEventListener('messages_list', (e: any) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult: any = jwt_decode(parsedresponse.result)

                dispatch({ type: SET_MESSAGES_LIST, payload: {
                    messageslist: decodedResult.conversationslist
                } })

                if(authentication.user.userID != parsedresponse.message){
                    if(parsedresponse.onseen){
                        //play ringtone
                        let audioMessage = new Audio(seen_rightone);
                        audioMessage.play();
                    }
                    else{
                        //play ringtone
                        let audioMessage = new Audio(message_ringtone);
                        audioMessage.play();

                        var conversationType = decodedResult.conversationslist[0].conversationType == "group"?
                        ` from ${decodedResult.conversationslist[0].groupdetails.groupName}` : '';

                        var NativeNotificationAlert = {
                            userID: decodedResult.conversationslist[0].sender,
                            from: decodedResult.conversationslist[0].users[0].userID == decodedResult.conversationslist[0].sender?
                            `${decodedResult.conversationslist[0].users[0].fullname.firstName} ${
                                decodedResult.conversationslist[0].users[0].fullname.middleName == "N/A"?
                                "" : `${decodedResult.conversationslist[0].users[0].fullname.middleName} `
                            }${decodedResult.conversationslist[0].users[0].fullname.lastName}${conversationType}` : 
                            `${decodedResult.conversationslist[0].users[1].fullname.firstName} ${
                                decodedResult.conversationslist[0].users[1].fullname.middleName == "N/A"?
                                "" : `${decodedResult.conversationslist[0].users[1].fullname.middleName} `
                            }${decodedResult.conversationslist[0].users[1].fullname.lastName}${conversationType}`,
                            content: decodedResult.conversationslist[0].content
                        };

                        try{
                            if(!document.hasFocus()){
                                if(Notification.permission === "granted"){
                                    new Notification(`${NativeNotificationAlert.from}`, {
                                        body: NativeNotificationAlert.content,
                                        icon: chatterloop_icon
                                    });
                                }
                            }
                        }
                        catch(ex){
                            dispatch({ type: SET_ALERTS, payload:{
                                alerts: {
                                    id: currentAlertState.length,
                                    type: "info",
                                    content: "Notification permission is only available for Windows and Android"
                                  }
                            }})
                        }

                        // if(Notification.permission === "granted"){
                        //     navigator.serviceWorker.ready.then((reg) => {
                        //         reg.showNotification(`${NativeNotificationAlert.from}`, {
                        //             body: NativeNotificationAlert.content,
                        //             icon: chatterloop_icon
                        //         })
                        //     })
                        // }
                    }
                }
            }
        }
    })

    sseNtfsSource.addEventListener('active_users', (e: any) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult: any = jwt_decode(parsedresponse.result)

                // console.log(decodedResult.user);
                dispatch({
                    type: UPDATE_ACTIVE_USERS_LIST,
                    payload: {
                        updatedUser: decodedResult.user
                    }
                })
            }
        }
    })
}

const CloseSSENotifications = () => {
    if(sseNtfsSource){
        sseNtfsSource.close()
    }
}

export {
    SSENotificationsTRequest,
    CloseSSENotifications
}