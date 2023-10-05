import Axios from 'axios'
import { SET_ALERTS, SET_AUTHENTICATION, SET_CONTACTS_LIST, SET_MESSAGES_LIST, SET_NOTIFICATIONS_LIST } from '../../redux/types';
import { authenticationstate } from '../../redux/actions/states';
import sign from 'jwt-encode'
import jwt_decode from 'jwt-decode'

const API = process.env.REACT_APP_CHATTERLOOP_API;
const SECRET = process.env.REACT_APP_JWT_SECRET

const AuthCheck = (params, dispatch) => {
    Axios.get(`${API}/auth/jwtchecker`,{
        headers:{
            "x-access-token": localStorage.getItem('authtoken')
        }
    }).then((response) => {
        if(response.data.status){
            const userData = jwt_decode(response.data.result.usertoken)
            dispatch({ type: SET_AUTHENTICATION, payload: {
                authentication: {
                    auth: true,
                    user: {
                        userID: userData.userID,
                        fullName: {
                            firstName: userData.fullname.firstName,
                            middleName: userData.fullname.middleName,
                            lastName: userData.fullname.lastName
                        },
                        email: userData.email,
                        isActivated: userData.isActivated,
                        isVerified: userData.isVerified
                    }
                }
            } })
        }
        else{
            dispatch({ type: SET_AUTHENTICATION, payload: {
                authentication: {
                    ...authenticationstate,
                    auth: false
                }
            } })
        }
    }).catch((err) => {
        dispatch({ type: SET_AUTHENTICATION, payload: {
            authentication: {
                ...authenticationstate,
                auth: false
            }
        } })
        console.log(err)
    })
}

const LoginRequest = (params, dispatch, currentAlertState, setisWaitingRequest) => {
    const payload = params;
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/auth/login`,{
        token: encodedPayload
    }).then((response) => {
        if(response.data.status){
            localStorage.setItem('authtoken', response.data.result.authtoken)
            const userData = jwt_decode(response.data.result.usertoken)

            dispatch({ type: SET_AUTHENTICATION, payload: {
                authentication: {
                    auth: true,
                    user: {
                        userID: userData.userID,
                        fullName: {
                            firstName: userData.fullname.firstName,
                            middleName: userData.fullname.middleName,
                            lastName: userData.fullname.lastName
                        },
                        email: userData.email,
                        isActivated: userData.isActivated,
                        isVerified: userData.isVerified
                    }
                }
            }})
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "success",
                    content: "You have been Logged In."
                  }
            }})
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
            }})
            // console.log(response.data)
        }
        setisWaitingRequest(false)
    }).catch((err) => {
        dispatch({ type: SET_ALERTS, payload:{
            alerts: {
                id: currentAlertState.length,
                type: "error",
                content: err.message
              }
        }})
        setisWaitingRequest(false)
        // console.log(err)
    })
}

const RegisterRequest = (params, dispatch, currentAlertState, setisWaitingRequest) => {
    const payload = params;
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/auth/register`, {
        token: encodedPayload
    }).then((response) => {
        if(response.data.status){
            localStorage.setItem('authtoken', response.data.result.authtoken)
            const userData = jwt_decode(response.data.result.usertoken)

            dispatch({ type: SET_AUTHENTICATION, payload: {
                authentication: {
                    auth: true,
                    user: {
                        userID: userData.userID,
                        fullName: {
                            firstName: userData.fullname.firstName,
                            middleName: userData.fullname.middleName,
                            lastName: userData.fullname.lastName
                        },
                        email: userData.email,
                        isActivated: userData.isActivated,
                        isVerified: userData.isVerified
                    }
                }
            }})
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "success",
                    content: "You have been registered!"
                  }
            }})
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
            }})
        }
        setisWaitingRequest(false)
    }).catch((err) => {
        dispatch({ type: SET_ALERTS, payload:{
            alerts: {
                id: currentAlertState.length,
                type: "error",
                content: err.message
              }
        }})
        setisWaitingRequest(false)
    })
}

const LogoutRequest = (params, dispatch) => {
    localStorage.removeItem('authtoken')
    dispatch({ type: SET_AUTHENTICATION, payload: {
        authentication:{
            ...authenticationstate,
            auth: false
        }
    }})
}

const VerifyCodeRequest = (params, dispatch, currentState, currentAlertState, setisWaitingRequest) => {
    const payload = params;
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/auth/emailverify`,{
        token: encodedPayload
    },{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            dispatch({ type: SET_AUTHENTICATION, payload: {
                authentication: {
                    auth: true,
                    user:{
                        ...currentState.user,
                        isVerified: true
                    }
                }
            }})
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "success",
                    content: "Your account is now verified."
                  }
            }})
            // console.log(response.data)
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
            }})
        }
        setisWaitingRequest(false)
    }).catch((err) => {
        dispatch({ type: SET_ALERTS, payload:{
            alerts: {
                id: currentAlertState.length,
                type: "error",
                content: err.message
              }
        }})
        setisWaitingRequest(false)
        // console.log(err)
    })
}

const SearchRequest = (params, dispatch, setisLoading, currentAlertState, setsearchresults, authentication) => {
    var searchdata = params.searchdata;

    Axios.get(`${API}/u/search/${searchdata}`, {
        headers:{
            "x-access-token": localStorage.getItem('authtoken')
        }
    }).then((response) => {
        setisLoading(false)
        if(response.data.status){
            var decodedResult = jwt_decode(response.data.result)
            var searchres = decodedResult.searchresults.filter((flt, i) => flt.userID != authentication.user.userID)
            setsearchresults(searchres)
            // console.log(decodedResult)
        }
        else{
            setsearchresults([])
        }
    }).catch((err) => {
        setisLoading(false)
        setsearchresults([])
        dispatch({ type: SET_ALERTS, payload:{
            alerts: {
                id: currentAlertState.length,
                type: "error",
                content: err.message
              }
        }})
    })
}

const ContactRequest = (params, dispatch, currentAlertState, setisDisabledByRequest) => {
    const payload = params;
    const encodedPayload = sign(payload, SECRET)
    Axios.post(`${API}/u/requestContact`, {
        token: encodedPayload
    }, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "success",
                    content: response.data.message
                  }
            }})
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
            }})
        }
        setisDisabledByRequest(false)
    }).catch((err) => {
        dispatch({ type: SET_ALERTS, payload:{
            alerts: [
              ...currentAlertState,
              {
                id: currentAlertState.length,
                type: "error",
                content: err.message
              }
            ]
        }})
        setisDisabledByRequest(false)
    })
}

const NotificationInitRequest = (params, dispatch, setisLoading) => {
    Axios.get(`${API}/u/getNotifications`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            var decodedResult = jwt_decode(response.data.result)

            dispatch({ type: SET_NOTIFICATIONS_LIST, payload: {
                notficationslist: decodedResult.notifications
            } })
        }
        setisLoading(false)
    }).catch((err) => {
        setisLoading(false)
        console.log(err)
    })
}

const DeclineContactRequest = (params, dispatch, currentAlertState, setisDisabledByRequest) => {
    const payload = params
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/u/declineContactRequest`, {
        token: encodedPayload
    }, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            // dispatch({ type: SET_ALERTS, payload:{
            //     alerts: [
            //       ...currentAlertState,
            //       {
            //         id: currentAlertState.length,
            //         type: "success",
            //         content: response.data.message
            //       }
            //     ]
            // }})
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                }
            }})
        }
        // setisDisabledByRequest(false)
    }).catch((err) => {
        dispatch({ type: SET_ALERTS, payload:{
            alerts: {
                id: currentAlertState.length,
                type: "error",
                content: err.message
              }
        }})
        setisDisabledByRequest(false)
    })
}

const AcceptContactRequest = (params, dispatch, currentAlertState, setisDisabledByRequest) => {
    const payload = params
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/u/acceptContactRequest`, {
        token: encodedPayload
    }, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            // dispatch({ type: SET_ALERTS, payload:{
            //     alerts: [
            //       ...currentAlertState,
            //       {
            //         id: currentAlertState.length,
            //         type: "success",
            //         content: response.data.message
            //       }
            //     ]
            // }})
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
            }})
        }
        // setisDisabledByRequest(false)
    }).catch((err) => {
        dispatch({ type: SET_ALERTS, payload:{
            alerts: {
                id: currentAlertState.length,
                type: "error",
                content: err.message
              }
        }})
        setisDisabledByRequest(false)
    })
}

const ContactsListInitRequest = (params, dispatch, setisLoading) => {
    Axios.get(`${API}/u/getContacts`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult = jwt_decode(response.data.result)

            dispatch({ type: SET_CONTACTS_LIST, payload: {
                contactslist: decodedResult.contacts
            } })

            // console.log(decodedResult.contacts)
        }
        else{

        }
        setisLoading(false)
    }).catch((err) => {
        console.log(err)
    })
}

const SendMessageRequest = (params, dispatch, setmessageValue) => {
    const payload = params
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/u/sendMessage`, {
        token: encodedPayload
    },{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            // console.log(response.data)
        }
        else{
            // console.log(response.data.message)
        }
        // setmessageValue("")
    }).catch((err) => {
        console.log(err)
    })
}

const SendFilesRequest = (params, files) => {
    const payload = params
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/u/sendFiles`, {
        token: encodedPayload
    }, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            // console.log(response.data)
        }
        else{
            // console.log(response.data.message)
        }
        // setmessageValue("")
    }).catch((err) => {
        console.log(err)
    })
}

const InitConversationListRequest = (params, dispatch, setisLoading) => {
    Axios.get(`${API}/u/initConversationList`,{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult = jwt_decode(response.data.result)

            // console.log(decodedResult.conversationslist)
            dispatch({
                type: SET_MESSAGES_LIST,
                payload: {
                    messageslist: decodedResult.conversationslist
                }
            })
            setisLoading(false)
        }
    }).catch((err) => {
        console.log(err)
    })
}

const SeenMessageRequest = async (params) => {
    const payload = params
    const encodedParams = sign(payload, SECRET)

    return await Axios.post(`${API}/u/seenNewMessages`, {
        token: encodedParams
    },{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            return 1;
        }
        else{
            return 0;
        }
    }).catch((err) => {
        console.log(err)
        throw new Error(err)
    })
}

const InitConversationRequest = (params, dispatch, setisLoading, scrollBottom) => {
    const conversationID = params.conversationID
    const receivers = params.receivers

    Axios.get(`${API}/u/initConversation/${conversationID}`,{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult = jwt_decode(response.data.result)
            setisLoading(false)
            dispatch(decodedResult.messages)
            scrollBottom()
            
            // setTimeout(() => {
            //     dispatch(decodedResult.messages)
            //     scrollBottom()
            // },100)
        }
    }).catch((err) => {
        console.log(err)
    })

    // SeenMessageRequest(conversationID, receivers).then(() => {
        
    // }).catch((err) => {
    //     console.log(err)
    // })
}

const CreateGroupChatRequest = (params, dispatch, setisCreateGCToggle) => {
    const payload = params
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/u/createContactGroupChat`, {
        token: encodedPayload
    },{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            setisCreateGCToggle(false)
        }
    }).catch((err) => {
        console.log(err)
    })
}

const CallRequest = async (params) => {
    const payload = params
    const encodedPayload = sign(payload, SECRET)

    return await Axios.post(`${API}/u/call`, {
        token: encodedPayload
    },{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            //action if needed
            return true;
        }
        else{
            return false;
        }
    }).catch((err) => {
        console.log(err)
        throw new Error(err);
    })
}

export {
    AuthCheck,
    LoginRequest,
    RegisterRequest,
    LogoutRequest,
    VerifyCodeRequest,
    SearchRequest,
    ContactRequest,
    NotificationInitRequest,
    DeclineContactRequest,
    AcceptContactRequest,
    ContactsListInitRequest,
    SendMessageRequest,
    SendFilesRequest,
    InitConversationRequest,
    InitConversationListRequest,
    CreateGroupChatRequest,
    SeenMessageRequest,
    CallRequest
}