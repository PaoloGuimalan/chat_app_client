import Axios from 'axios'
import { SET_ACTIVE_USERS_LIST, SET_ALERTS, SET_AUTHENTICATION, SET_CONTACTS_LIST, SET_MESSAGES_LIST, SET_NOTIFICATIONS_LIST } from '../../redux/types';
import { authenticationstate } from '../../redux/actions/states';
import sign from 'jwt-encode'
import jwt_decode from 'jwt-decode'
import { Dispatch } from 'react';

const API = import.meta.env.VITE_CHATTERLOOP_API;
const SECRET = import.meta.env.VITE_JWT_SECRET;

const AuthCheck = (dispatch: any) => {
    Axios.get(`${API}/auth/jwtchecker`,{
        headers:{
            "x-access-token": localStorage.getItem('authtoken')
        }
    }).then((response) => {
        if(response.data.status){
            const userData: any = jwt_decode(response.data.result.usertoken)
            // console.log(userData)
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
                        isVerified: userData.isVerified,
                        profile: userData.profile,
                        coverphoto: userData.coverphoto || ""
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

const LoginRequest = (params: any, dispatch: Dispatch<any>, currentAlertState: any, setisWaitingRequest: any) => {
    const payload = params;
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/auth/login`,{
        token: encodedPayload
    }).then((response) => {
        if(response.data.status){
            localStorage.setItem('authtoken', response.data.result.authtoken)
            const userData: any = jwt_decode(response.data.result.usertoken)

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
                        isVerified: userData.isVerified,
                        profile: userData.profile,
                        coverphoto: userData.coverphoto || ""
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

const RegisterRequest = (params: any, dispatch: Dispatch<any>, currentAlertState: any, setisWaitingRequest: any) => {
    const payload = params;
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/auth/register`, {
        token: encodedPayload
    }).then((response) => {
        if(response.data.status){
            localStorage.setItem('authtoken', response.data.result.authtoken)
            const userData: any = jwt_decode(response.data.result.usertoken)

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

const LogoutRequest = (dispatch: Dispatch<any>) => {
    localStorage.removeItem('authtoken')
    dispatch({ type: SET_AUTHENTICATION, payload: {
        authentication:{
            ...authenticationstate,
            auth: false
        }
    }})
}

const VerifyCodeRequest = (params: any, dispatch: Dispatch<any>, currentState: any, currentAlertState: any, setisWaitingRequest: any) => {
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

const SearchRequest = (params: any, dispatch: Dispatch<any>, setisLoading: any, currentAlertState: any, setsearchresults: any, authentication: any) => {
    var searchdata = params.searchdata;

    Axios.get(`${API}/u/search/${searchdata}`, {
        headers:{
            "x-access-token": localStorage.getItem('authtoken')
        }
    }).then((response) => {
        setisLoading(false)
        if(response.data.status){
            var decodedResult: any = jwt_decode(response.data.result)
            var searchres = decodedResult.searchresults.filter((flt: any) => flt.userID != authentication.user.userID)
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

const ContactRequest = (params: any, dispatch: Dispatch<any>, currentAlertState: any, setisDisabledByRequest: any) => {
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

const NotificationInitRequest = (dispatch: Dispatch<any>, setisLoading: any) => {
    Axios.get(`${API}/u/getNotifications`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            var decodedResult: any = jwt_decode(response.data.result)

            dispatch({ type: SET_NOTIFICATIONS_LIST, payload: {
                notficationslist: {
                    list: decodedResult.notifications,
                    totalunread: decodedResult.totalunread
                }
            } })
        }
        setisLoading(false)
    }).catch((err) => {
        setisLoading(false)
        console.log(err)
    })
}

const ReadNotificationsRequest = () => {
    Axios.post(`${API}/u/readnotifications`,{}, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            // OK
        }
    }).catch((err) => {
        console.log(err)
    })
}

const DeclineContactRequest = (params: any, dispatch: Dispatch<any>, currentAlertState: any, setisDisabledByRequest: any) => {
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

const AcceptContactRequest = (params: any, dispatch: Dispatch<any>, currentAlertState: any, setisDisabledByRequest: any) => {
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

const ContactsListInitRequest = (dispatch: Dispatch<any>, setisLoading: any) => {
    Axios.get(`${API}/u/getContacts`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult: any = jwt_decode(response.data.result)

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

const ContactsListReusableRequest = (dispatch: any, setisLoading: any) => {
    Axios.get(`${API}/u/getContacts`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult: any = jwt_decode(response.data.result);

            dispatch(decodedResult.contacts);
            setisLoading(false)

            // console.log(decodedResult.contacts)
        }
        else{

        }
    }).catch((err) => {
        console.log(err)
    })
}

const SendMessageRequest = (params: any) => {
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

const SendFilesRequest = (params: any) => {
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

const InitConversationListRequest = (dispatch: Dispatch<any>, setisLoading: any) => {
    Axios.get(`${API}/u/initConversationList`,{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult: any = jwt_decode(response.data.result)

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

const SeenMessageRequest = async (params: any) => {
    const payload = params;
    const range = params.range;
    const encodedParams = sign(payload, SECRET)

    return await Axios.post(`${API}/u/seenNewMessages`, {
        token: encodedParams
    },{
        headers:{
            "x-access-token": localStorage.getItem("authtoken"),
            "range": range || 20
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

const InitConversationRequest = (params: any, dispatch: Dispatch<any>, settotalMessages: any, setisLoading: any, scrollBottom: any) => {
    const conversationID = params.conversationID;
    const range = params.range;
    // const receivers = params.receivers

    Axios.get(`${API}/u/initConversation/${conversationID}`,{
        headers:{
            "x-access-token": localStorage.getItem("authtoken"),
            "range": range || 20
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult: any = jwt_decode(response.data.result)
            setisLoading(false)
            dispatch(decodedResult.messages.reverse())
            settotalMessages(decodedResult.total);
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

const CreateGroupChatRequest = (params: any, setisCreateGCToggle: any) => {
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

const CreateServerRequest = (params: any, setisCreateGCToggle: any) => {
    const payload = params
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/u/createserver`, {
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

const CallRequest = async (params: any) => {
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

const ActiveContactsRequest = (dispatch: Dispatch<any>) => {
    Axios.get(`${API}/u/activecontacts`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            dispatch({
                type: SET_ACTIVE_USERS_LIST,
                payload: {
                    activeuserslist: response.data.result
                }
            })
        }
    }).catch((err) => {
        console.log(err);
    })
}

const RejectCallRequest = (params: any) => {
    const payload = params
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/u/rejectcall`, {
        token: encodedPayload
    },{
        headers: {
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((_) => {
        //action when needed if success
    }).catch((err) => {
        console.log(err)
    })
}

const EndCallRequest = (params: any) => {
    const payload = params
    const encodedPayload = sign(payload, SECRET)

    Axios.post(`${API}/u/endcall`, {
        token: encodedPayload
    },{
        headers: {
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((_) => {
        //action when needed if success
    }).catch((err) => {
        console.log(err)
    })
}

const GetProfileInfo = async (params: any) => {
    const userID = params.userID;

    return await Axios.get(`${API}/p/userinfo/${userID}`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response: any) => {
        return response;
    }).catch((err) => {
        throw new Error(err);
    })
}

const CreatePostRequest = async (payload: any) => {
    const rawpayload = payload;
    const encodedPayload = sign(rawpayload, SECRET);

    return await Axios.post(`${API}/posts/createpost`, {
        token: encodedPayload
    }, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        return response;
    }).catch((err) => {
        throw new Error(err);
    })
}

const GetPostRequest = async (params: any) => {
    const userID = params.userID;
    const range = params.range;

    return await Axios.get(`${API}/posts/userposts/${userID}`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken"),
            "range": range || 20
        }
    }).then((response) => {
        return response;
    }).catch((err) => {
        throw new Error(err);
    })
}

const DeleteMessageRequest = async (params: any) => {
    const encodedParams = sign(params, SECRET);

    return await Axios.post(`${API}/m/deletemessage`, {
        token: encodedParams
    },{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        return response;
    }).catch((err) => {
        throw new Error(err);
    })
}

const ReactToMessageRequest = async (params: any) => {
    const encodedParams = sign(params, SECRET);

    return await Axios.post(`${API}/m/addreaction`, {
        token: encodedParams
    },{
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        return response;
    }).catch((err) => {
        throw new Error(err);
    })
}

const ConversationInfoRequest = async (params: any) => {
    const conversationID = params.conversationID;
    const type = params.type;

    return await Axios.get(`${API}/m/conversationinfo/${conversationID}/${type}`, {
        headers: {
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult: any = jwt_decode(response.data.result)
            return decodedResult?.data;
        }
        else{
            return false;
        }
    }).catch((err) => {
        throw new Error(err);
    })
}

const IsTypingBroadcastRequest = (payload: any) => {
    const encodedPayload = sign(payload, SECRET);

    Axios.post(`${API}/m/istypingbroadcast`, {
        token: encodedPayload
    }, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            // OK
        }
    }).catch((err) => {
        console.log(err)
    })
}

const AddNewMemberRequest = async (payload: any) => {
    const encodedPayload = sign(payload, SECRET);

    return await Axios.post(`${API}/m/addnewmember`, {
        token: encodedPayload
    }, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        return response;
    }).catch((err) => {
        console.log(err);
        throw new Error(err);
    })
}

const InitServerListRequest = async () => {
    return await Axios.get(`${API}/s/initserverlist`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult: any = jwt_decode(response.data.result);
            return decodedResult.data;
        }
        else{
            return false;
        }
    }).catch((err) => {
        console.log(err);
        throw new Error(err);
    })
}

const InitServerConversationRequest = async (params: any) => {
    const conversationID = params.conversationID;

    return await Axios.get(`${API}/s/initserversetup/${conversationID}`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult: any = jwt_decode(response.data.result);
            return decodedResult.conversationslist;
        }
        else{
            return false;
        }
    }).catch((err) => {
        console.log(err);
        throw new Error(err);
    })
}

const InitServerChannelsRequest = async (params: any) => {
    const serverID = params.serverID;

    return await Axios.get(`${API}/s/initserverchannels/${serverID}`, {
        headers:{
            "x-access-token": localStorage.getItem("authtoken")
        }
    }).then((response) => {
        if(response.data.status){
            const decodedResult: any = jwt_decode(response.data.result);
            return decodedResult.data;
        }
        else{
            return false;
        }
    }).catch((err) => {
        console.log(err);
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
    ReadNotificationsRequest,
    DeclineContactRequest,
    AcceptContactRequest,
    ContactsListInitRequest,
    SendMessageRequest,
    SendFilesRequest,
    InitConversationRequest,
    InitConversationListRequest,
    ContactsListReusableRequest,
    CreateGroupChatRequest,
    CreateServerRequest,
    SeenMessageRequest,
    CallRequest,
    ActiveContactsRequest,
    RejectCallRequest,
    EndCallRequest,
    GetProfileInfo,
    CreatePostRequest,
    GetPostRequest,
    DeleteMessageRequest,
    ReactToMessageRequest,
    ConversationInfoRequest,
    IsTypingBroadcastRequest,
    AddNewMemberRequest,
    InitServerListRequest,
    InitServerConversationRequest,
    InitServerChannelsRequest
}