import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { formatCurrency, formatPercentage } from '../utils/orderUtils';

export const useOrderValidation = (stockData, orderType, quantity, price, orderMethod) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [profitLossEstimate, setProfitLossEstimate] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const { availableCash, holdings } = useSelector(state => state.portfolio.data) || {};

  const calculateTradingFees = useMemo(() => {
    const feeRates = {
      market: 0.001,
      limit: 0.0005
    };
    return (grossAmount) => {
      const rate = feeRates[orderMethod?.toLowerCase()] || feeRates.market;
      const fees = grossAmount * rate;
      return Number(Math.max(1, Math.min(100, fees)).toFixed(2));
    };
  }, [orderMethod]);

  const getOrderSummary = useCallback(() => {
    const parsedQuantity = parseFloat(quantity);
    const parsedPrice = orderMethod === 'market' ? (stockData?.price || 0) : parseFloat(price) || 0;

    if (!stockData || isNaN(parsedQuantity) || parsedQuantity <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
      return {
        grossAmount: 0,
        fees: 0,
        netAmount: 0,
        pricePerShare: parsedPrice,
        quantity: parsedQuantity
      };
    }
    const grossAmount = parsedQuantity * parsedPrice;
    const fees = calculateTradingFees(grossAmount);
    const netAmount = orderType === 'buy' ? grossAmount + fees : grossAmount - fees;
    return { grossAmount, fees, netAmount, pricePerShare: parsedPrice, quantity: parsedQuantity };
  }, [stockData, quantity, price, orderMethod, orderType, calculateTradingFees]);

  const validateOrder = useCallback(() => {
    setIsValidating(true);
    const errors = {};
    const parsedQuantity = parseFloat(quantity);
    const { netAmount, grossAmount, pricePerShare } = getOrderSummary();

    if (!stockData) {
      errors.stock = 'Please select a stock';
    }
    if (isNaN(parsedQuantity) || parsedQuantity <= 0 || !Number.isInteger(parsedQuantity)) {
      errors.quantity = 'Quantity must be a whole number greater than 0';
    }
    if (orderMethod === 'limit' && (isNaN(pricePerShare) || pricePerShare <= 0)) {
      errors.price = 'Please enter a valid limit price';
    }

    if (orderType === 'buy') {
      if (netAmount > availableCash) {
        errors.funds = `Insufficient funds. Available: ${formatCurrency(availableCash)}`;
      }
    } else if (orderType === 'sell') {
      const holding = holdings.find(h => h.symbol?.toUpperCase() === stockData?.symbol?.toUpperCase());
      if (!holding || holding.quantity < parsedQuantity) {
        errors.shares = `Insufficient shares. Available: ${holding?.quantity || 0}`;
      }
    }

    if (orderType === 'sell' && !errors.shares) {
      const holding = holdings.find(h => h.symbol?.toUpperCase() === stockData?.symbol?.toUpperCase());
      const avgBuyPrice = holding?.averagePrice || 0;
      const sellValue = parsedQuantity * pricePerShare;
      const buyValue = parsedQuantity * avgBuyPrice;
      const profitLoss = sellValue - buyValue;
      const profitLossPercent = buyValue > 0 ? (profitLoss / buyValue) * 100 : 0;
      setProfitLossEstimate({ amount: profitLoss, percentage: profitLossPercent, isProfit: profitLoss >= 0 });
    } else {
      setProfitLossEstimate(null);
    }
    setValidationErrors(errors);
    setIsValid(Object.keys(errors).length === 0 && !!stockData);
    setIsValidating(false);
  }, [stockData, orderType, quantity, price, orderMethod, availableCash, holdings, getOrderSummary]);

  useEffect(() => {
    const timer = setTimeout(() => validateOrder(), 300);
    return () => clearTimeout(timer);
  }, [validateOrder]);

  return {
    validationErrors,
    profitLossEstimate,
    isValidating,
    isValid,
    getOrderSummary,
    calculateTradingFees
  };
};

export default useOrderValidation;