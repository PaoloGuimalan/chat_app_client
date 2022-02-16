import { createStore, combineReducers } from 'redux';
import { setID } from './actions';
import { setConvo } from './conversationAction'
import { setConvoWhole } from './conversationWhole';
import { counterConvo } from './counterConvo';
import { coordsval } from './setcoords';
import { setFeeds } from './setfeeds';
import { myStatus } from './actionstatus';

const combiner = combineReducers({
    convo: setConvo,
    id: setID,
    convoWhole: setConvoWhole,
    counterConvo: counterConvo,
    coordsval: coordsval,
    feeds: setFeeds,
    status: myStatus
})

const store = createStore(combiner);

export default store;