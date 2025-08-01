import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiDollarSign,
  FiPercent,
  FiTarget,
  FiPieChart,
  FiBarChart2,
  FiStar,
  FiZap
} from 'react-icons/fi';

/**
 * Smart Quantity Suggestions Component
 * Provides intelligent quantity recommendations based on various factors
 */
const SmartQuantitySuggestions = ({
  stockData,
  orderType,
  portfolioData,
  currentPrice,
  onQuantitySelect,
  selectedQuantity,
  className = ''
}) => {
  // Generate smart suggestions based on multiple factors
  const suggestions = useMemo(() => {
    if (!stockData || !currentPrice) return [];

    const suggestions = [];

    if (orderType === 'buy') {
      // Buy order suggestions
      const availableCash = portfolioData.availableCash;

      // 1. Round number suggestions (popular trading quantities)
      const roundNumbers = [1, 5, 10, 25, 50, 100, 200, 500];
      roundNumbers.forEach(qty => {
        const amount = qty * currentPrice;
        if (amount <= availableCash && amount >= 500) { // Minimum ₹500 investment
          suggestions.push({
            type: 'round',
            quantity: qty,
            amount,
            label: `${qty} shares`,
            description: 'Round number',
            icon: FiTarget,
            priority: 2
          });
        }
      });

      // 2. Fixed amount suggestions (popular investment amounts)
      const fixedAmounts = [1000, 2500, 5000, 10000, 25000, 50000];
      fixedAmounts.forEach(amount => {
        if (amount <= availableCash) {
          const qty = Math.floor(amount / currentPrice);
          if (qty > 0) {
            suggestions.push({
              type: 'amount',
              quantity: qty,
              amount: qty * currentPrice,
              label: `₹${amount.toLocaleString('en-IN')}`,
              description: `${qty} shares`,
              icon: FiDollarSign,
              priority: 3
            });
          }
        }
      });

      // 3. Percentage-based suggestions
      const percentages = [10, 25, 50, 75, 100];
      percentages.forEach(percent => {
        const amount = (availableCash * percent) / 100;
        const qty = Math.floor(amount / currentPrice);
        if (qty > 0 && amount >= 500) {
          suggestions.push({
            type: 'percentage',
            quantity: qty,
            amount: qty * currentPrice,
            label: `${percent}%`,
            description: `${qty} shares of available cash`,
            icon: FiPercent,
            priority: percent === 25 || percent === 50 ? 1 : 2
          });
        }
      });

      // 4. Portfolio diversification suggestions
      const totalPortfolioValue = portfolioData.totalValue || 0;
      if (totalPortfolioValue > 0) {
        const diversificationPercentages = [2, 5, 10];
        diversificationPercentages.forEach(percent => {
          const targetAmount = (totalPortfolioValue * percent) / 100;
          const qty = Math.floor(targetAmount / currentPrice);
          if (qty > 0 && targetAmount <= availableCash) {
            suggestions.push({
              type: 'diversification',
              quantity: qty,
              amount: qty * currentPrice,
              label: `${percent}% of portfolio`,
              description: `${qty} shares for diversification`,
              icon: FiPieChart,
              priority: 1
            });
          }
        });
      }

    } else {
      // Sell order suggestions
      const holding = portfolioData.holdings.find(h => h.symbol === stockData.symbol);
      if (!holding || holding.quantity === 0) return [];

      const maxQuantity = holding.quantity;
      const averagePrice = holding.averagePrice || holding.averageBuyPrice || 0;

      // 1. Profit-taking suggestions
      const profitPercentages = [25, 50, 75, 100];
      profitPercentages.forEach(percent => {
        const qty = Math.floor((maxQuantity * percent) / 100);
        if (qty > 0) {
          const sellValue = qty * currentPrice;
          const costBasis = qty * averagePrice;
          const profit = sellValue - costBasis;
          const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;

          suggestions.push({
            type: 'profit',
            quantity: qty,
            amount: sellValue,
            label: `${percent}% of holding`,
            description: `${qty} shares • ${profit >= 0 ? 'Profit' : 'Loss'}: ₹${Math.abs(profit).toLocaleString('en-IN')}`,
            icon: profit >= 0 ? FiTrendingUp : FiBarChart2,
            priority: profit >= 0 ? 1 : 3,
            profitLoss: profit,
            profitPercent
          });
        }
      });

      // 2. Round number suggestions
      const roundNumbers = [1, 5, 10, 25, 50, 100];
      roundNumbers.forEach(qty => {
        if (qty <= maxQuantity) {
          const sellValue = qty * currentPrice;
          const costBasis = qty * averagePrice;
          const profit = sellValue - costBasis;

          suggestions.push({
            type: 'round',
            quantity: qty,
            amount: sellValue,
            label: `${qty} shares`,
            description: `${profit >= 0 ? 'Profit' : 'Loss'}: ₹${Math.abs(profit).toLocaleString('en-IN')}`,
            icon: FiTarget,
            priority: 2,
            profitLoss: profit
          });
        }
      });

      // 3. Break-even suggestion
      if (averagePrice > 0 && currentPrice !== averagePrice) {
        const breakEvenQty = Math.min(maxQuantity, Math.floor(maxQuantity / 2));
        if (breakEvenQty > 0) {
          suggestions.push({
            type: 'breakeven',
            quantity: breakEvenQty,
            amount: breakEvenQty * currentPrice,
            label: 'Break-even',
            description: `${breakEvenQty} shares at current price`,
            icon: FiZap,
            priority: currentPrice >= averagePrice ? 1 : 3
          });
        }
      }
    }

    // Remove duplicates and sort by priority and quantity
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.quantity === suggestion.quantity)
      )
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.quantity - b.quantity;
      })
      .slice(0, 8); // Limit to 8 suggestions

    return uniqueSuggestions;
  }, [stockData, orderType, portfolioData, currentPrice]);

  if (suggestions.length === 0) return null;

  // Group suggestions by type for better organization
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const type = suggestion.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(suggestion);
    return groups;
  }, {});

  const getSuggestionColor = (suggestion) => {
    switch (suggestion.type) {
      case 'percentage':
      case 'diversification':
        return '#8B5CF6'; // Purple
      case 'amount':
        return '#10B981'; // Green
      case 'profit':
        return suggestion.profitLoss >= 0 ? '#10B981' : '#EF4444';
      case 'round':
        return '#3B82F6'; // Blue
      case 'breakeven':
        return '#F59E0B'; // Orange
      default:
        return '#6B7280'; // Gray
    }
  };

  return (
    <div className={`smart-quantity-suggestions ${className}`}>
      <div className="suggestions-header">
        <FiStar className="suggestions-icon" />
        <span className="suggestions-title">Smart Suggestions</span>
      </div>

      <div className="suggestions-grid">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          const isSelected = selectedQuantity === suggestion.quantity;
          const color = getSuggestionColor(suggestion);

          return (
            <motion.button
              key={`${suggestion.type}-${suggestion.quantity}`}
              className={`suggestion-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onQuantitySelect(suggestion.quantity)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ '--suggestion-color': color }}
            >
              <div className="suggestion-header">
                <Icon className="suggestion-icon" size={16} />
                <span className="suggestion-label">{suggestion.label}</span>
              </div>
              
              <div className="suggestion-details">
                <div className="suggestion-description">{suggestion.description}</div>
                <div className="suggestion-amount">
                  ₹{suggestion.amount.toLocaleString('en-IN')}
                </div>
              </div>

              {suggestion.profitLoss !== undefined && (
                <div className={`profit-indicator ${suggestion.profitLoss >= 0 ? 'profit' : 'loss'}`}>
                  {suggestion.profitLoss >= 0 ? '+' : ''}₹{Math.abs(suggestion.profitLoss).toLocaleString('en-IN')}
                  {suggestion.profitPercent !== undefined && (
                    <span className="profit-percent">
                      ({suggestion.profitPercent >= 0 ? '+' : ''}{suggestion.profitPercent.toFixed(1)}%)
                    </span>
                  )}
                </div>
              )}

              {suggestion.priority === 1 && (
                <div className="priority-badge">
                  <FiStar size={10} />
                  Recommended
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="suggestions-footer">
        <span className="suggestions-note">
          Suggestions based on your portfolio and market conditions
        </span>
      </div>
    </div>
  );
};

export default SmartQuantitySuggestions;
