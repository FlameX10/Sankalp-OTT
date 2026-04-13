import { combineReducers } from '@reduxjs/toolkit';

import authReducer from '../slices/authSlice';
import reelsReducer from '../slices/reelsSlice';
import reelPlayerReducer from '../slices/reelPlayerSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  reels: reelsReducer,
  reelPlayer: reelPlayerReducer,
});

export default rootReducer;
