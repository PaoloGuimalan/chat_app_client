import sign from 'jwt-encode'
import jwt_decode from 'jwt-decode'
import { SET_ALERTS, SET_CONTACTS_LIST, SET_MESSAGES_LIST, SET_NOTIFICATIONS_LIST } from '../../redux/types';
import message_ringtone from '../../assets/sounds/message_alert.mp3'
import notification_ringtone from '../../assets/sounds/notification_alert.mp3'
import seen_rightone from '../../assets/sounds/seen_alert.mp3'
import alert_incoming_call from '../../assets/sounds/alert_call_tune.mp3'

const API = process.env.REACT_APP_CHATTERLOOP_API;
const SECRET = process.env.REACT_APP_JWT_SECRET

var sseNtfsSource = null

const SSENotificationsTRequest = (params, dispatch, currentAlertState, authentication) => {
    const payload = {
        token: localStorage.getItem("authtoken"),
        type: "notifications"
    }

    const encodedPayload = sign(payload, SECRET)

    sseNtfsSource = new EventSource(`${API}/u/sseNotifications/${encodedPayload}`)
    
    sseNtfsSource.addEventListener('notifications', (e) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult = jwt_decode(parsedresponse.result)

                //play ringtone
                let audioMessage = new Audio(notification_ringtone);
                audioMessage.play();

                dispatch({ type: SET_NOTIFICATIONS_LIST, payload: {
                    notficationslist: decodedResult.notifications
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

    sseNtfsSource.addEventListener('incomingcall', (e) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult = jwt_decode(parsedresponse.result)

                //play ringtone
                let audioMessage = new Audio(alert_incoming_call);
                audioMessage.play();

                var audioInterval = setInterval(() => {
                    audioMessage.currentTime = 0;
                    audioMessage.play()
                },21000)

                setTimeout(() => {
                    audioMessage.pause();
                    audioMessage.currentTime = 0;

                    clearInterval(audioInterval)
                },60000)

                dispatch({ type: SET_ALERTS, payload:{
                    alerts: {
                        id: currentAlertState.length,
                        type: "incomingcall",
                        content: parsedresponse.message,
                        callmetadata: decodedResult.callmetadata
                      }
                }})
            }
        }
    })

    sseNtfsSource.addEventListener('contactslist', (e) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult = jwt_decode(parsedresponse.result)

                //play ringtone

                dispatch({ type: SET_CONTACTS_LIST, payload: {
                    contactslist: decodedResult.contacts
                } })
            }
        }
    })

    sseNtfsSource.addEventListener('messages_list', (e) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult = jwt_decode(parsedresponse.result)

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
                    }
                }
                
                dispatch({ type: SET_MESSAGES_LIST, payload: {
                    messageslist: decodedResult.conversationslist
                } })
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