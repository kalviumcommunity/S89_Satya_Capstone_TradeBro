import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import API_ENDPOINTS from '../../config/apiConfig';

const initialState = {
  messages: [],
  sessionId: null,
  isTyping: false,
  loading: false,
  error: null,
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    startSessionStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    startSessionSuccess: (state, action) => {
      state.sessionId = action.payload.sessionId;
      state.loading = false;
      state.error = null;
      
      // Add welcome message
      state.messages = [
        {
          id: 1,
          text: action.payload.message || 'Hello! How can I help you with your trading today?',
          sender: 'bot',
          timestamp: new Date().toISOString(),
        },
      ];
    },
    startSessionFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    sendMessageStart: (state) => {
      state.isTyping = true;
      state.error = null;
    },
    addUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now(),
        text: action.payload,
        sender: 'user',
        timestamp: new Date().toISOString(),
      });
    },
    addBotMessage: (state, action) => {
      state.messages.push({
        id: Date.now(),
        text: action.payload,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      });
      state.isTyping = false;
    },
    sendMessageFailure: (state, action) => {
      state.isTyping = false;
      state.error = action.payload;
    },
    endSessionStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    endSessionSuccess: (state) => {
      state.sessionId = null;
      state.messages = [];
      state.loading = false;
      state.error = null;
    },
    endSessionFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

// Export actions
export const {
  startSessionStart,
  startSessionSuccess,
  startSessionFailure,
  sendMessageStart,
  addUserMessage,
  addBotMessage,
  sendMessageFailure,
  endSessionStart,
  endSessionSuccess,
  endSessionFailure,
  clearMessages,
} = chatbotSlice.actions;

// Async action creators
export const startChatSession = () => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    
    dispatch(startSessionStart());
    
    const response = await axios.post(API_ENDPOINTS.CHATBOT.START, {
      userId: auth.user?.id,
      username: auth.user?.username || 'Guest',
    });
    
    if (response.data && response.data.success) {
      dispatch(startSessionSuccess({
        sessionId: response.data.sessionId,
        message: response.data.message,
      }));
      
      return { success: true, sessionId: response.data.sessionId };
    } else {
      dispatch(startSessionFailure(response.data?.message || 'Failed to start chat session'));
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error('Error starting chat session:', error);
    dispatch(startSessionFailure(error.message));
    
    // Create a fallback session ID
    const fallbackSessionId = `fallback-${Date.now()}`;
    dispatch(startSessionSuccess({
      sessionId: fallbackSessionId,
      message: 'Hello! I\'m operating in offline mode, but I\'ll do my best to help you with your trading questions.',
    }));
    
    return { success: true, sessionId: fallbackSessionId };
  }
};

export const sendMessage = (message) => async (dispatch, getState) => {
  try {
    const { chatbot, auth } = getState();
    
    if (!chatbot.sessionId) {
      // Start a new session if one doesn't exist
      const result = await dispatch(startChatSession());
      if (!result.success) {
        return { success: false, message: 'Failed to start chat session' };
      }
    }
    
    dispatch(sendMessageStart());
    dispatch(addUserMessage(message));
    
    const response = await axios.post(API_ENDPOINTS.CHATBOT.MESSAGE, {
      sessionId: chatbot.sessionId,
      message,
      userId: auth.user?.id,
    });
    
    if (response.data && response.data.success) {
      dispatch(addBotMessage(response.data.message));
      return { success: true, message: response.data.message };
    } else {
      dispatch(sendMessageFailure(response.data?.message || 'Failed to send message'));
      dispatch(addBotMessage('Sorry, I encountered an error. Please try again.'));
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error('Error sending message:', error);
    dispatch(sendMessageFailure(error.message));
    
    // Add fallback response
    dispatch(addBotMessage('Sorry, I\'m having trouble connecting to the server. Please try again later.'));
    
    return { success: false, message: error.message };
  }
};

export const endChatSession = () => async (dispatch, getState) => {
  try {
    const { chatbot } = getState();
    
    if (!chatbot.sessionId) {
      return { success: true };
    }
    
    dispatch(endSessionStart());
    
    const response = await axios.post(API_ENDPOINTS.CHATBOT.END, {
      sessionId: chatbot.sessionId,
    });
    
    if (response.data && response.data.success) {
      dispatch(endSessionSuccess());
      return { success: true };
    } else {
      dispatch(endSessionFailure(response.data?.message || 'Failed to end chat session'));
      return { success: false, message: response.data?.message };
    }
  } catch (error) {
    console.error('Error ending chat session:', error);
    dispatch(endSessionFailure(error.message));
    
    // End session anyway
    dispatch(endSessionSuccess());
    
    return { success: true };
  }
};

export default chatbotSlice.reducer;
