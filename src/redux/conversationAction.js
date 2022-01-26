import { SET_CONVO } from './actionTypes'

export const setConvo = (state = "", action) => {
    switch(action.type){
        case SET_CONVO:
            return action.convo;
        default:
            return state;
    }
}

