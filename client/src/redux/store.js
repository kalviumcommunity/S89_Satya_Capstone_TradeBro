import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers';

// Use the simplest configuration possible to avoid middleware conflicts
const store = configureStore({
  reducer: rootReducer,
  // Explicitly disable duplicate middleware check
  duplicateMiddlewareCheck: false,
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
