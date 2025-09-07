import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import reducers
import authReducer from './slices/authSlice';
import portfolioReducer from './slices/portfolioSlice';
import tradingReducer from './slices/tradingSlice';
import watchlistReducer from './slices/watchlistSlice';
import ordersReducer from './slices/ordersSlice';
import newsReducer from './slices/newsSlice';
import uiReducer from './slices/uiSlice';
import stocksReducer from './slices/stocksSlice';

// Persist configuration
const persistConfig = {
  key: 'tradebro',
  storage,
  whitelist: ['auth', 'portfolio', 'trading', 'watchlist', 'orders'], // Only persist these slices
  blacklist: ['ui', 'news', 'stocks'] // Don't persist UI state, news, and stocks (should be fresh)
};

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  portfolio: portfolioReducer,
  trading: tradingReducer,
  watchlist: watchlistReducer,
  orders: ordersReducer,
  news: newsReducer,
  ui: uiReducer,
  stocks: stocksReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with Redux Toolkit
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript (if needed)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

export default store;
