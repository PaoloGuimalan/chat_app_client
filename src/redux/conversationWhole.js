import { SET_CONVO_ALL } from './actionTypes'

export const setConvoWhole = (state = [{convoCount: 0}], action) => {
    switch(action.type){
        case SET_CONVO_ALL:
            return action.convoCount;
        default:
            return state;
    }
}

