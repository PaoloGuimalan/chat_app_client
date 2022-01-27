import { COUNTER_CONVO } from './actionTypes'

export const counterConvo = (state = 0, action) => {
    switch(action.type){
        case COUNTER_CONVO:
            return action.counterccv;
        default:
            return state;
    }
}

