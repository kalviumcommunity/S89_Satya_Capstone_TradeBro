/**
 * Drag Confirm Hook
 * Manages drag-to-confirm modal state and order processing
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import tradingService from '../services/tradingService';

const useDragConfirm = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Open confirmation modal
  const openConfirmation = useCallback((data) => {
    setOrderData(data);
    setIsModalOpen(true);
  }, []);

  // Close confirmation modal
  const closeConfirmation = useCallback(() => {
    if (loading) return; // Prevent closing during processing
    
    setIsModalOpen(false);
    setTimeout(() => {
      setOrderData(null);
      setLoading(false);
    }, 300);
  }, [loading]);

  // Process the confirmed order
  const processOrder = useCallback(async (data) => {
    setLoading(true);
    
    try {
      let result;
      
      if (data.action === 'BUY') {
        result = await tradingService.buyStock(
          data.symbol,
          data.quantity,
          data.price,
          data.orderType || 'market'
        );
      } else if (data.action === 'SELL') {
        result = await tradingService.sellStock(
          data.symbol,
          data.quantity,
          data.price,
          data.orderType || 'market'
        );
      }

      if (result.success) {
        toast.success(
          `${data.action} order executed successfully! ${data.quantity} shares of ${data.symbol}`,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );

        // Close modal after success
        setTimeout(() => {
          closeConfirmation();
        }, 1500);

        return result;
      } else {
        throw new Error(result.message || 'Order execution failed');
      }
    } catch (error) {
      console.error('Order processing error:', error);
      
      toast.error(
        error.message || `Failed to execute ${data.action.toLowerCase()} order`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      // Reset loading state but keep modal open for retry
      setLoading(false);
      
      return { success: false, error: error.message };
    }
  }, [closeConfirmation]);

  // Quick buy function
  const confirmBuy = useCallback((symbol, quantity, price, additionalData = {}) => {
    openConfirmation({
      action: 'BUY',
      symbol,
      quantity,
      price,
      ...additionalData
    });
  }, [openConfirmation]);

  // Quick sell function
  const confirmSell = useCallback((symbol, quantity, price, additionalData = {}) => {
    openConfirmation({
      action: 'SELL',
      symbol,
      quantity,
      price,
      ...additionalData
    });
  }, [openConfirmation]);

  return {
    // Modal state
    isModalOpen,
    orderData,
    loading,
    
    // Modal controls
    openConfirmation,
    closeConfirmation,
    processOrder,
    
    // Quick actions
    confirmBuy,
    confirmSell
  };
};

export default useDragConfirm;
