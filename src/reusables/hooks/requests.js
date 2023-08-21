import Axios from 'axios'
import { SET_AUTHENTICATION } from '../../redux/types';
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

const LoginRequest = (params, dispatch) => {
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
        }
        else{
            console.log(response.data)
        }
    }).catch((err) => {
        console.log(err)
    })
}

const RegisterRequest = (params, dispatch) => {
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
        }
    })
}

export {
    AuthCheck,
    LoginRequest,
    RegisterRequest
}