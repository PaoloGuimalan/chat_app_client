import { SET_AUTHENTICATION } from "../types";
import { authenticationstate } from "./states";

export const setauthentication = (state = authenticationstate, action) => {
    switch(action.type){
        case SET_AUTHENTICATION:
            return action.payload.authentication;
        default:
            return state;
    }
}