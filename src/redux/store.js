import { createStore, combineReducers } from 'redux';
import { setID } from './actions';
import { setConvo } from './conversationAction'
import { setConvoWhole } from './conversationWhole';
import { counterConvo } from './counterConvo';

const combiner = combineReducers({
    convo: setConvo,
    id: setID,
    convoWhole: setConvoWhole,
    counterConvo: counterConvo
})

const store = createStore(combiner);

export default store;