import { createStore, combineReducers } from 'redux';
import { setID } from './actions';

const store = createStore(setID);

export default store;