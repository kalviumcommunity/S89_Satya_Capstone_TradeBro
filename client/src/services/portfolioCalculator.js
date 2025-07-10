/**
 * Portfolio Calculation Engine
 * Provides consistent calculation algorithms for P&L, returns, and portfolio metrics
 */

class PortfolioCalculator {
  constructor() {
    this.precision = 2; // Decimal places for calculations
  }

  /**
   * Calculate position-level metrics
   */
  calculatePositionMetrics(position, currentPrice) {
    if (!position || position.quantity <= 0) {
      return this.getEmptyPositionMetrics();
    }

    const currentValue = position.quantity * currentPrice;
    const totalInvested = position.totalInvested || (position.quantity * position.avgPrice);
    const unrealizedPnL = currentValue - totalInvested;
    const unrealizedPnLPercentage = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;
    const realizedPnL = position.realizedPnL || 0;
    const totalPnL = unrealizedPnL + realizedPnL;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // Day change calculations
    const dayChange = currentPrice - (position.previousClose || position.avgPrice);
    const dayChangePercentage = position.previousClose ? (dayChange / position.previousClose) * 100 : 0;
    const dayPnL = position.quantity * dayChange;

    return {
      symbol: position.symbol,
      quantity: position.quantity,
      avgPrice: this.round(position.avgPrice),
      currentPrice: this.round(currentPrice),
      currentValue: this.round(currentValue),
      totalInvested: this.round(totalInvested),
      
      // P&L Metrics
      unrealizedPnL: this.round(unrealizedPnL),
      unrealizedPnLPercentage: this.round(unrealizedPnLPercentage),
      realizedPnL: this.round(realizedPnL),
      totalPnL: this.round(totalPnL),
      totalPnLPercentage: this.round(totalPnLPercentage),
      
      // Day Change Metrics
      dayChange: this.round(dayChange),
      dayChangePercentage: this.round(dayChangePercentage),
      dayPnL: this.round(dayPnL),
      
      // Status
      isProfit: totalPnL >= 0,
      isDayGainer: dayChange >= 0,
      
      // Additional metrics
      weightage: 0, // Will be calculated at portfolio level
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate portfolio-level metrics
   */
  calculatePortfolioMetrics(positions, virtualBalance = 0) {
    if (!positions || positions.length === 0) {
      return this.getEmptyPortfolioMetrics(virtualBalance);
    }

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalUnrealizedPnL = 0;
    let totalRealizedPnL = 0;
    let totalDayPnL = 0;
    let profitablePositions = 0;
    let losingPositions = 0;

    // Calculate individual position metrics and aggregate
    const enhancedPositions = positions.map(position => {
      totalInvested += position.totalInvested || 0;
      totalCurrentValue += position.currentValue || 0;
      totalUnrealizedPnL += position.unrealizedPnL || 0;
      totalRealizedPnL += position.realizedPnL || 0;
      totalDayPnL += position.dayPnL || 0;

      if ((position.unrealizedPnL || 0) >= 0) {
        profitablePositions++;
      } else {
        losingPositions++;
      }

      return position;
    });

    // Calculate portfolio-level percentages
    const totalPnL = totalUnrealizedPnL + totalRealizedPnL;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const unrealizedPnLPercentage = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
    const dayPnLPercentage = totalInvested > 0 ? (totalDayPnL / totalInvested) * 100 : 0;

    // Calculate position weightages
    const positionsWithWeightage = enhancedPositions.map(position => ({
      ...position,
      weightage: totalCurrentValue > 0 ? this.round((position.currentValue / totalCurrentValue) * 100) : 0
    }));

    // Portfolio value and allocation
    const totalPortfolioValue = virtualBalance + totalCurrentValue;
    const investedAllocation = totalPortfolioValue > 0 ? (totalCurrentValue / totalPortfolioValue) * 100 : 0;
    const cashAllocation = totalPortfolioValue > 0 ? (virtualBalance / totalPortfolioValue) * 100 : 0;

    // Performance metrics
    const winRate = positions.length > 0 ? (profitablePositions / positions.length) * 100 : 0;
    const avgPositionSize = positions.length > 0 ? totalInvested / positions.length : 0;
    const largestPosition = Math.max(...positions.map(p => p.currentValue || 0), 0);
    const smallestPosition = Math.min(...positions.map(p => p.currentValue || 0).filter(v => v > 0), 0);

    return {
      // Basic metrics
      totalInvested: this.round(totalInvested),
      totalCurrentValue: this.round(totalCurrentValue),
      virtualBalance: this.round(virtualBalance),
      totalPortfolioValue: this.round(totalPortfolioValue),
      
      // P&L metrics
      totalPnL: this.round(totalPnL),
      totalPnLPercentage: this.round(totalPnLPercentage),
      unrealizedPnL: this.round(totalUnrealizedPnL),
      unrealizedPnLPercentage: this.round(unrealizedPnLPercentage),
      realizedPnL: this.round(totalRealizedPnL),
      
      // Day performance
      dayPnL: this.round(totalDayPnL),
      dayPnLPercentage: this.round(dayPnLPercentage),
      
      // Allocation
      investedAllocation: this.round(investedAllocation),
      cashAllocation: this.round(cashAllocation),
      
      // Position analytics
      positionCount: positions.length,
      profitablePositions,
      losingPositions,
      winRate: this.round(winRate),
      avgPositionSize: this.round(avgPositionSize),
      largestPosition: this.round(largestPosition),
      smallestPosition: this.round(smallestPosition),
      
      // Enhanced positions
      positions: positionsWithWeightage,
      
      // Status flags
      isPortfolioProfit: totalPnL >= 0,
      isDayGainer: totalDayPnL >= 0,
      
      // Timestamps
      lastUpdated: new Date(),
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate sector-wise allocation
   */
  calculateSectorAllocation(positions, sectorMapping = {}) {
    const sectorData = {};
    let totalValue = 0;

    positions.forEach(position => {
      const sector = sectorMapping[position.symbol] || 'Others';
      const value = position.currentValue || 0;
      
      if (!sectorData[sector]) {
        sectorData[sector] = {
          sector,
          totalValue: 0,
          totalInvested: 0,
          positions: [],
          pnl: 0,
          pnlPercentage: 0
        };
      }
      
      sectorData[sector].totalValue += value;
      sectorData[sector].totalInvested += position.totalInvested || 0;
      sectorData[sector].positions.push(position);
      sectorData[sector].pnl += position.unrealizedPnL || 0;
      
      totalValue += value;
    });

    // Calculate percentages and sort
    const sectors = Object.values(sectorData).map(sector => ({
      ...sector,
      allocation: totalValue > 0 ? this.round((sector.totalValue / totalValue) * 100) : 0,
      pnlPercentage: sector.totalInvested > 0 ? this.round((sector.pnl / sector.totalInvested) * 100) : 0,
      positionCount: sector.positions.length
    })).sort((a, b) => b.totalValue - a.totalValue);

    return sectors;
  }

  /**
   * Calculate risk metrics
   */
  calculateRiskMetrics(positions, portfolioValue) {
    if (!positions || positions.length === 0) {
      return this.getEmptyRiskMetrics();
    }

    // Concentration risk
    const maxPositionValue = Math.max(...positions.map(p => p.currentValue || 0));
    const concentrationRisk = portfolioValue > 0 ? (maxPositionValue / portfolioValue) * 100 : 0;
    
    // Volatility (simplified - based on day changes)
    const dayChanges = positions.map(p => p.dayChangePercentage || 0);
    const avgDayChange = dayChanges.reduce((sum, change) => sum + change, 0) / dayChanges.length;
    const variance = dayChanges.reduce((sum, change) => sum + Math.pow(change - avgDayChange, 2), 0) / dayChanges.length;
    const volatility = Math.sqrt(variance);

    // Diversification score (simple metric based on position count and concentration)
    const diversificationScore = Math.min(100, (positions.length * 10) - concentrationRisk);

    return {
      concentrationRisk: this.round(concentrationRisk),
      volatility: this.round(volatility),
      diversificationScore: this.round(Math.max(0, diversificationScore)),
      maxPositionWeight: this.round(concentrationRisk),
      riskLevel: this.getRiskLevel(concentrationRisk, volatility),
      lastCalculated: new Date()
    };
  }

  /**
   * Calculate performance attribution
   */
  calculatePerformanceAttribution(positions) {
    const totalPnL = positions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0);
    
    return positions.map(position => ({
      symbol: position.symbol,
      contribution: totalPnL !== 0 ? this.round(((position.unrealizedPnL || 0) / totalPnL) * 100) : 0,
      absoluteContribution: this.round(position.unrealizedPnL || 0),
      weightage: position.weightage || 0
    })).sort((a, b) => b.absoluteContribution - a.absoluteContribution);
  }

  /**
   * Helper methods
   */
  round(value, precision = this.precision) {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  getRiskLevel(concentration, volatility) {
    if (concentration > 50 || volatility > 15) return 'High';
    if (concentration > 30 || volatility > 10) return 'Medium';
    return 'Low';
  }

  getEmptyPositionMetrics() {
    return {
      quantity: 0,
      avgPrice: 0,
      currentPrice: 0,
      currentValue: 0,
      totalInvested: 0,
      unrealizedPnL: 0,
      unrealizedPnLPercentage: 0,
      realizedPnL: 0,
      totalPnL: 0,
      totalPnLPercentage: 0,
      dayChange: 0,
      dayChangePercentage: 0,
      dayPnL: 0,
      isProfit: false,
      isDayGainer: false,
      weightage: 0,
      lastUpdated: new Date()
    };
  }

  getEmptyPortfolioMetrics(virtualBalance = 0) {
    return {
      totalInvested: 0,
      totalCurrentValue: 0,
      virtualBalance: this.round(virtualBalance),
      totalPortfolioValue: this.round(virtualBalance),
      totalPnL: 0,
      totalPnLPercentage: 0,
      unrealizedPnL: 0,
      unrealizedPnLPercentage: 0,
      realizedPnL: 0,
      dayPnL: 0,
      dayPnLPercentage: 0,
      investedAllocation: 0,
      cashAllocation: 100,
      positionCount: 0,
      profitablePositions: 0,
      losingPositions: 0,
      winRate: 0,
      avgPositionSize: 0,
      largestPosition: 0,
      smallestPosition: 0,
      positions: [],
      isPortfolioProfit: false,
      isDayGainer: false,
      lastUpdated: new Date()
    };
  }

  getEmptyRiskMetrics() {
    return {
      concentrationRisk: 0,
      volatility: 0,
      diversificationScore: 100,
      maxPositionWeight: 0,
      riskLevel: 'Low',
      lastCalculated: new Date()
    };
  }
}

// Export singleton instance
export default new PortfolioCalculator();
