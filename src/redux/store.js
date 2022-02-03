import { createStore, combineReducers } from 'redux';
import { setID } from './actions';
import { setConvo } from './conversationAction'
import { setConvoWhole } from './conversationWhole';
import { counterConvo } from './counterConvo';
import { coordsval } from './setcoords';
import { setFeeds } from './setfeeds';

const combiner = combineReducers({
    convo: setConvo,
    id: setID,
    convoWhole: setConvoWhole,
    counterConvo: counterConvo,
    coordsval: coordsval,
    feeds: setFeeds
})

const store = createStore(combiner);

export default store;