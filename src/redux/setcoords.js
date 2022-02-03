import { SET_COORDS } from './actionTypes'

export const coordsval = (state = [], action) => {
    switch(action.type){
        case SET_COORDS:
            return action.coords;
        default:
            return state;
    }
}

