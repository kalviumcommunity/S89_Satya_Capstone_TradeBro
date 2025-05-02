import React, { createContext, useState, useContext } from 'react';
import Toast from '../components/Toast';
import { v4 as uuidv4 } from 'uuid';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3000, position = 'top-right') => {
    const id = uuidv4();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration, position }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const success = (message, duration, position) => {
    return addToast(message, 'success', duration, position);
  };

  const error = (message, duration, position) => {
    return addToast(message, 'error', duration, position);
  };

  const info = (message, duration, position) => {
    return addToast(message, 'info', duration, position);
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          position={toast.position}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export default ToastContext;
