import sign from 'jwt-encode'
import jwt_decode from 'jwt-decode'
import { SET_ALERTS, SET_NOTIFICATIONS_LIST } from '../../redux/types';

const API = process.env.REACT_APP_CHATTERLOOP_API;
const SECRET = process.env.REACT_APP_JWT_SECRET

const SSENotificationsTRequest = (params, dispatch, currentAlertState) => {
    const payload = {
        token: localStorage.getItem("authtoken"),
        type: "notifications"
    }

    const encodedPayload = sign(payload, SECRET)

    const sseNtfsSource = new EventSource(`${API}/u/sseNotifications/${encodedPayload}`)

    sseNtfsSource.addEventListener('notifications', (e) => {
        const parsedresponse = JSON.parse(e.data)
        if(parsedresponse.auth){
            if(parsedresponse.status){
                const decodedResult = jwt_decode(parsedresponse.result)

                dispatch({ type: SET_NOTIFICATIONS_LIST, payload: {
                    notficationslist: decodedResult.notifications
                } })

                dispatch({ type: SET_ALERTS, payload:{
                    alerts: [
                      ...currentAlertState,
                      {
                        id: currentAlertState.length,
                        type: "info",
                        content: parsedresponse.message
                      }
                    ]
                }})
            }
        }
    })
}

export {
    SSENotificationsTRequest
}