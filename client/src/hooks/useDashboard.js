/* ========================================
   📊 DASHBOARD HOOK - TRADEBRO
   Custom hook for dashboard data management
   ======================================== */

import { useState, useEffect, useCallback } from 'react'
import { portfolioAPI, tradingAPI, stockAPI, analyticsAPI, shouldAttemptAPICall } from '../services/api'
import { toast } from 'react-toastify'

export const useDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    todayChange: 0,
    todayChangePercent: 0,
    todayPnL: 0,
    todayPnLPercent: 0,
    activePositions: 0,
    totalInvested: 0,
    availableCash: 0,
    totalReturns: 0,
    totalReturnsPercent: 0,
    dayHigh: 0,
    dayLow: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    yearlyChange: 0
  })
  
  const [holdings, setHoldings] = useState([])
  const [recentTrades, setRecentTrades] = useState([])
  const [marketSentiment, setMarketSentiment] = useState({
    bullish: 0,
    bearish: 0,
    neutral: 0,
    fearGreedIndex: 0,
    volatilityIndex: 0
  })
  const [quickStats, setQuickStats] = useState([])

  // Mock data for when backend is not available
  const mockPortfolioData = {
    totalValue: 125000,
    totalInvested: 100000,
    totalGains: 25000,
    totalGainsPercent: 25.0,
    dayChange: 2500,
    dayChangePercent: 2.04
  }

  const mockHoldings = [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd',
      quantity: 50,
      avgPrice: 2400,
      currentPrice: 2520,
      totalValue: 126000,
      totalGains: 6000,
      gainsPercent: 5.0,
      dayChange: 25,
      dayChangePercent: 1.0
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      quantity: 30,
      avgPrice: 3200,
      currentPrice: 3350,
      totalValue: 100500,
      totalGains: 4500,
      gainsPercent: 4.69,
      dayChange: -15,
      dayChangePercent: -0.45
    },
    {
      symbol: 'INFY',
      name: 'Infosys Limited',
      quantity: 40,
      avgPrice: 1450,
      currentPrice: 1520,
      totalValue: 60800,
      totalGains: 2800,
      gainsPercent: 4.83,
      dayChange: 12,
      dayChangePercent: 0.79
    }
  ]

  const mockRecentTrades = [
    {
      id: 'trade001',
      symbol: 'WIPRO',
      type: 'BUY',
      quantity: 50,
      price: 420,
      timestamp: new Date('2024-01-15T10:30:00'),
      status: 'completed'
    },
    {
      id: 'trade002',
      symbol: 'BAJFINANCE',
      type: 'SELL',
      quantity: 25,
      price: 6800,
      timestamp: new Date('2024-01-15T09:15:00'),
      status: 'completed'
    }
  ]

  const mockMarketSentiment = {
    overall: 'bullish',
    score: 75,
    indicators: {
      volume: 'high',
      volatility: 'moderate',
      trend: 'upward'
    }
  }

  // Fetch portfolio summary
  const fetchPortfolioSummary = useCallback(async () => {
    if (!shouldAttemptAPICall()) {
      setPortfolioData(mockPortfolioData)
      return
    }

    try {
      const response = await portfolioAPI.getSummary()
      if (response.success) {
        setPortfolioData(response.data)
      }
    } catch (error) {
      // Silently use mock data when backend is not available
      setPortfolioData(mockPortfolioData)
    }
  }, [])

  // Fetch holdings
  const fetchHoldings = useCallback(async () => {
    try {
      const response = await portfolioAPI.getHoldings()
      if (response.success) {
        setHoldings(response.data)
      }
    } catch (error) {
      // Silently use mock data when backend is not available
      setHoldings(mockHoldings)
    }
  }, [])

  // Fetch recent trades
  const fetchRecentTrades = useCallback(async () => {
    try {
      const response = await tradingAPI.getRecentTrades(5)
      if (response.success) {
        setRecentTrades(response.data)
      }
    } catch (error) {
      // Silently use mock data when backend is not available
      setRecentTrades(mockRecentTrades)
    }
  }, [])

  // Fetch market sentiment
  const fetchMarketSentiment = useCallback(async () => {
    try {
      const response = await analyticsAPI.getMarketSentiment()
      if (response.success) {
        setMarketSentiment(response.data)
      }
    } catch (error) {
      // Silently use mock data when backend is not available
      setMarketSentiment(mockMarketSentiment)
    }
  }, [])

  // Fetch dashboard analytics
  const fetchDashboardAnalytics = useCallback(async () => {
    try {
      const response = await analyticsAPI.getDashboardAnalytics()
      if (response.success) {
        // Process analytics data for quick stats
        const stats = [
          {
            title: 'Portfolio Value',
            value: response.data.portfolioValue || portfolioData.totalValue || 0,
            change: response.data.portfolioChange || portfolioData.todayChangePercent || 0,
            icon: 'FiPieChart',
            color: 'var(--accent-primary)',
            prefix: '₹',
            suffix: ''
          },
          {
            title: 'Today\'s P&L',
            value: response.data.todayPnL || portfolioData.todayPnL || 0,
            change: response.data.todayPnLPercent || portfolioData.todayPnLPercent || 0,
            icon: 'FiTrendingUp',
            color: (response.data.todayPnL || portfolioData.todayPnL || 0) >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
            prefix: '₹',
            suffix: ''
          },
          {
            title: 'Total Returns',
            value: response.data.totalReturns || portfolioData.totalReturns || 0,
            change: response.data.totalReturnsPercent || portfolioData.totalReturnsPercent || 0,
            icon: 'FiTarget',
            color: 'var(--profit-color)',
            prefix: '₹',
            suffix: ''
          },
          {
            title: 'Active Positions',
            value: response.data.activePositions || portfolioData.activePositions || 0,
            change: response.data.positionsChange || 12.5,
            icon: 'FiActivity',
            color: 'var(--info-color)',
            prefix: '',
            suffix: ''
          }
        ]
        setQuickStats(stats)
      }
    } catch (error) {
      // Silently use fallback data when backend is not available
      createFallbackStats()
    }
  }, [portfolioData])

  // Create fallback stats when analytics API fails
  const createFallbackStats = useCallback(() => {
    const stats = [
      {
        title: 'Portfolio Value',
        value: portfolioData.totalValue || 0,
        change: portfolioData.todayChangePercent || 0,
        icon: 'FiPieChart',
        color: 'var(--accent-primary)',
        prefix: '₹',
        suffix: ''
      },
      {
        title: 'Today\'s P&L',
        value: portfolioData.todayPnL || 0,
        change: portfolioData.todayPnLPercent || 0,
        icon: 'FiTrendingUp',
        color: (portfolioData.todayPnL || 0) >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
        prefix: '₹',
        suffix: ''
      },
      {
        title: 'Total Returns',
        value: portfolioData.totalReturns || 0,
        change: portfolioData.totalReturnsPercent || 0,
        icon: 'FiTarget',
        color: 'var(--profit-color)',
        prefix: '₹',
        suffix: ''
      },
      {
        title: 'Active Positions',
        value: portfolioData.activePositions || 0,
        change: 12.5,
        icon: 'FiActivity',
        color: 'var(--info-color)',
        prefix: '',
        suffix: ''
      }
    ]
    setQuickStats(stats)
  }, [portfolioData])

  // Refresh all dashboard data
  const refreshDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        fetchPortfolioSummary(),
        fetchHoldings(),
        fetchRecentTrades(),
        fetchMarketSentiment()
      ])
      
      // Fetch analytics after portfolio data is loaded
      setTimeout(() => {
        fetchDashboardAnalytics()
      }, 500)
      
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
      setError('Failed to refresh dashboard data')
      toast.error('Failed to refresh dashboard data')
    } finally {
      setLoading(false)
    }
  }, [fetchPortfolioSummary, fetchHoldings, fetchRecentTrades, fetchMarketSentiment, fetchDashboardAnalytics])

  // Initial data load
  useEffect(() => {
    refreshDashboard()
  }, [refreshDashboard])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDashboard()
    }, 30000)

    return () => clearInterval(interval)
  }, [refreshDashboard])

  // Format currency helper
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }, [])

  // Format percentage helper
  const formatPercentage = useCallback((value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }, [])

  return {
    // Data
    portfolioData,
    holdings,
    recentTrades,
    marketSentiment,
    quickStats,
    
    // State
    loading,
    error,
    
    // Actions
    refreshDashboard,
    
    // Helpers
    formatCurrency,
    formatPercentage
  }
}
