import Axios from 'axios'
import { SET_ALERTS, SET_AUTHENTICATION, SET_NOTIFICATIONS_LIST } from '../../redux/types';
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
                alerts: [
                  ...currentAlertState,
                  {
                    id: currentAlertState.length,
                    type: "success",
                    content: "You have been Logged In."
                  }
                ]
            }})
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: [
                  ...currentAlertState,
                  {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
                ]
            }})
            // console.log(response.data)
        }
        setisWaitingRequest(false)
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
                alerts: [
                  ...currentAlertState,
                  {
                    id: currentAlertState.length,
                    type: "success",
                    content: "You have been registered!"
                  }
                ]
            }})
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: [
                  ...currentAlertState,
                  {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
                ]
            }})
        }
        setisWaitingRequest(false)
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
                alerts: [
                  ...currentAlertState,
                  {
                    id: currentAlertState.length,
                    type: "success",
                    content: "Your account is now verified."
                  }
                ]
            }})
            // console.log(response.data)
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: [
                  ...currentAlertState,
                  {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
                ]
            }})
        }
        setisWaitingRequest(false)
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
            // console.log(response.data.result)
        }
        else{
            setsearchresults([])
        }
    }).catch((err) => {
        setisLoading(false)
        setsearchresults([])
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
    })
}

const ContactRequest = (params, dispatch, currentAlertState) => {
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
                alerts: [
                  ...currentAlertState,
                  {
                    id: currentAlertState.length,
                    type: "success",
                    content: response.data.message
                  }
                ]
            }})
        }
        else{
            dispatch({ type: SET_ALERTS, payload:{
                alerts: [
                  ...currentAlertState,
                  {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
                ]
            }})
        }
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

const DeclineContactRequest = (params, dispatch, currentAlertState) => {
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
                alerts: [
                  ...currentAlertState,
                  {
                    id: currentAlertState.length,
                    type: "warning",
                    content: response.data.message
                  }
                ]
            }})
        }
        console.log(currentAlertState)
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
    DeclineContactRequest
}