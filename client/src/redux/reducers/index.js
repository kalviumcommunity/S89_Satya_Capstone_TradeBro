import { combineReducers } from 'redux';
import authReducer from './authReducer';
import themeReducer from './themeReducer';
import sidebarReducer from './sidebarReducer';
import virtualMoneyReducer from './virtualMoneyReducer';
import toastReducer from './toastReducer';
import stockReducer from './stockReducer';
import notificationReducer from './notificationReducer';
import uiReducer from './uiReducer';
import profileReducer from './profileReducer';
import watchlistReducer from './watchlistReducer';
import transactionReducer from './transactionReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  sidebar: sidebarReducer,
  virtualMoney: virtualMoneyReducer,
  toast: toastReducer,
  stock: stockReducer,
  notification: notificationReducer,
  ui: uiReducer,
  profile: profileReducer,
  watchlist: watchlistReducer,
  transaction: transactionReducer,
});

export default rootReducer;
