import { useState, useEffect, useCallback } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useSelector } from 'react-redux';

/**
 * Custom hook for order validation and business logic
 * Provides real-time validation, profit/loss calculations, and debounced checks
 */
export const useOrderValidation = (stockData, orderType, quantity, price, orderMethod) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [profitLossEstimate, setProfitLossEstimate] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const { portfolioData } = usePortfolio();
  const { user } = useSelector(state => state.auth);

  // Debounced validation function
  const validateOrder = useCallback(async () => {
    if (!stockData) {
      setValidationErrors({ stock: 'Please select a stock' });
      setIsValid(false);
      return false;
    }

    setIsValidating(true);
    const errors = {};

    try {
      // Basic input validation
      if (!quantity || quantity <= 0) {
        errors.quantity = 'Quantity must be greater than 0';
      }

      if (orderMethod === 'limit' && (!price || parseFloat(price) <= 0)) {
        errors.price = 'Please enter a valid limit price';
      }

      // Calculate order details
      const currentPrice = orderMethod === 'market' ? stockData.price : parseFloat(price) || 0;
      const totalCost = quantity * currentPrice;
      const fees = calculateTradingFees(totalCost);
      const netAmount = orderType === 'buy' ? totalCost + fees : totalCost - fees;

      // Order type specific validation
      if (orderType === 'buy') {
        await validateBuyOrder(errors, totalCost, netAmount, stockData);
      } else {
        await validateSellOrder(errors, quantity, currentPrice, stockData);
      }

      // Price validation for limit orders
      if (orderMethod === 'limit' && currentPrice > 0) {
        validateLimitPrice(errors, currentPrice, stockData.price, orderType);
      }

      setValidationErrors(errors);
      setIsValid(Object.keys(errors).length === 0);
      
      return Object.keys(errors).length === 0;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationErrors({ general: 'Validation failed. Please try again.' });
      setIsValid(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [stockData, orderType, quantity, price, orderMethod, portfolioData]);

  // Validate buy orders
  const validateBuyOrder = async (errors, totalCost, netAmount, stock) => {
    // Check available funds
    if (netAmount > portfolioData.availableCash) {
      errors.funds = `Insufficient funds. Available: ₹${portfolioData.availableCash.toLocaleString('en-IN')}, Required: ₹${netAmount.toLocaleString('en-IN')}`;
    }

    // Check minimum order value (₹500)
    if (totalCost < 500) {
      errors.minOrder = 'Minimum order value is ₹500';
    }

    // Check maximum order value (₹1,00,000 for demo)
    if (totalCost > 100000) {
      errors.maxOrder = 'Maximum order value is ₹1,00,000';
    }

    // Validate stock availability (mock check)
    if (stock.volume && stock.volume < quantity) {
      errors.availability = 'Requested quantity exceeds available volume';
    }
  };

  // Validate sell orders
  const validateSellOrder = async (errors, sellQuantity, currentPrice, stock) => {
    // Check holdings
    const holding = portfolioData.holdings.find(h => h.symbol === stock.symbol);
    
    if (!holding) {
      errors.shares = 'You do not own any shares of this stock';
      return;
    }

    if (holding.quantity < sellQuantity) {
      errors.shares = `Insufficient shares. Available: ${holding.quantity}, Requested: ${sellQuantity}`;
      return;
    }

    // Calculate profit/loss estimate
    const sellValue = sellQuantity * currentPrice;
    const avgBuyPrice = holding.averagePrice || holding.averageBuyPrice;
    const buyValue = sellQuantity * avgBuyPrice;
    const profitLoss = sellValue - buyValue;
    const profitLossPercent = buyValue > 0 ? ((profitLoss / buyValue) * 100) : 0;

    setProfitLossEstimate({
      amount: profitLoss,
      percentage: profitLossPercent,
      isProfit: profitLoss >= 0,
      sellValue,
      buyValue,
      avgBuyPrice
    });

    // Check minimum sell value
    if (sellValue < 100) {
      errors.minSell = 'Minimum sell value is ₹100';
    }
  };

  // Validate limit price
  const validateLimitPrice = (errors, limitPrice, marketPrice, orderType) => {
    const priceDifference = Math.abs(limitPrice - marketPrice);
    const percentDifference = (priceDifference / marketPrice) * 100;

    // Check for unrealistic limit prices (more than 20% away from market price)
    if (percentDifference > 20) {
      errors.priceRange = `Limit price is ${percentDifference.toFixed(1)}% away from market price. Consider adjusting.`;
    }

    // For buy orders, warn if limit price is much higher than market
    if (orderType === 'buy' && limitPrice > marketPrice * 1.1) {
      errors.buyPriceHigh = 'Limit price is significantly higher than market price';
    }

    // For sell orders, warn if limit price is much lower than market
    if (orderType === 'sell' && limitPrice < marketPrice * 0.9) {
      errors.sellPriceLow = 'Limit price is significantly lower than market price';
    }
  };

  // Calculate trading fees
  const calculateTradingFees = (grossAmount) => {
    const brokerage = grossAmount * 0.0003; // 0.03%
    const stt = grossAmount * 0.001; // 0.1%
    const exchangeCharges = grossAmount * 0.0000345; // 0.00345%
    const gst = (brokerage + exchangeCharges) * 0.18; // 18% GST
    const sebiCharges = grossAmount * 0.000001; // 0.0001%
    const stampDuty = grossAmount * 0.00003; // 0.003%

    return {
      brokerage,
      stt,
      exchangeCharges,
      gst,
      sebiCharges,
      stampDuty,
      total: brokerage + stt + exchangeCharges + gst + sebiCharges + stampDuty
    };
  };

  // Calculate order summary
  const getOrderSummary = useCallback(() => {
    if (!stockData || !quantity) {
      return {
        grossAmount: 0,
        fees: { total: 0 },
        netAmount: 0,
        pricePerShare: 0
      };
    }

    const pricePerShare = orderMethod === 'market' ? stockData.price : parseFloat(price) || 0;
    const grossAmount = quantity * pricePerShare;
    const fees = calculateTradingFees(grossAmount);
    const netAmount = orderType === 'buy' ? grossAmount + fees.total : grossAmount - fees.total;

    return {
      grossAmount,
      fees,
      netAmount,
      pricePerShare,
      quantity
    };
  }, [stockData, quantity, price, orderMethod, orderType]);

  // Debounced validation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      validateOrder();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [validateOrder]);

  // Reset validation when stock changes
  useEffect(() => {
    if (stockData) {
      setValidationErrors({});
      setProfitLossEstimate(null);
      setIsValid(false);
    }
  }, [stockData?.symbol]);

  return {
    validationErrors,
    profitLossEstimate,
    isValidating,
    isValid,
    validateOrder,
    getOrderSummary,
    calculateTradingFees
  };
};

// Utility function for formatting currency
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Utility function for formatting percentage
export const formatPercentage = (value, decimals = 2) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

// Utility function for order type validation
export const validateOrderType = (orderType, stockData, portfolioData) => {
  if (orderType === 'sell') {
    const holding = portfolioData.holdings.find(h => h.symbol === stockData?.symbol);
    return holding && holding.quantity > 0;
  }
  return true;
};

export default useOrderValidation;
