import { SET_EMAIL, SET_ID, SET_LOGGED, SET_PASSWORD } from "./actionTypes";

export const setID = (state = "", action) => {
    switch(action.type){
        case SET_ID:
            return {userID: action.userID}
        case SET_LOGGED:
            return {logged: action.logged}
        case SET_EMAIL:
            return {email: action.email}
        case SET_PASSWORD:
            return {password: action.password}
        default:
            return state;
    }
}

