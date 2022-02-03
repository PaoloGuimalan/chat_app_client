import { SET_FEEDS } from "./actionTypes"; 

export const setFeeds = (state = [], action) => {
    switch(action.type){
        case SET_FEEDS:
            return action.feeds;
        default:
            return state;
    }
}