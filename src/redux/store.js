import { createStore, combineReducers } from 'redux';
import { setID } from './actions';
import { setConvo } from './conversationAction'

const combiner = combineReducers({
    convo: setConvo,
    id: setID
})

const store = createStore(combiner);

export default store;