import Axios from 'axios'
import { SET_ALERTS, SET_AUTHENTICATION } from '../../redux/types';
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

export {
    AuthCheck,
    LoginRequest,
    RegisterRequest,
    LogoutRequest,
    VerifyCodeRequest
}