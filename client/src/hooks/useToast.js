// useToast.js
import { useToast as useContextToast } from '../context/ToastContext';

/**
 * Custom hook that re-exports the useToast hook from ToastContext
 * This is used to provide a more intuitive import path for components
 */
export const useToast = () => {
  return useContextToast();
};

export default useToast;
