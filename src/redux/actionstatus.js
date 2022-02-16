import { SET_MYSTATUS } from './actionTypes';

export const myStatus = (state = "Offline", action) => {
    switch(action.type){
        case SET_MYSTATUS:
            return {mystatus: action.mystatus}
        default:
            return state;
    }
}