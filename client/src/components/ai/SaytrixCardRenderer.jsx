import React from 'react';
import {
  StockPriceCard,
  CompanyInfoCard,
  ChartCard,
  AlertCard,
  RecommendationCard,
  WelcomeCard,
  TextCard
} from './SaytrixCards';

const SaytrixCardRenderer = ({ 
  message, 
  onSuggestionClick, 
  onBuyClick, 
  onSellClick,
  onAlertDismiss 
}) => {
  const { cardType, content, stockData, suggestions, confidence } = message;

  // Handle different card types
  switch (cardType) {
    case 'stock-price':
      return (
        <StockPriceCard
          stockData={stockData}
          onBuyClick={onBuyClick}
          onSellClick={onSellClick}
        />
      );

    case 'company-info':
      return (
        <CompanyInfoCard
          companyData={stockData.company}
        />
      );

    case 'chart':
      return (
        <ChartCard
          chartData={stockData.chart}
          symbol={stockData.symbol}
        />
      );

    case 'alert':
      return (
        <AlertCard
          alertData={{
            type: message.alertType || 'info',
            title: message.alertTitle || 'Notification',
            message: content,
            action: message.alertAction
          }}
          onDismiss={onAlertDismiss}
        />
      );

    case 'recommendation':
      return (
        <RecommendationCard
          recommendation={{
            type: message.recommendationType || 'buy',
            symbol: stockData?.symbol || 'N/A',
            targetPrice: stockData?.targetPrice || 'N/A',
            reason: content,
            confidence: confidence,
            metrics: stockData?.metrics
          }}
          onBuyClick={onBuyClick}
          onSellClick={onSellClick}
        />
      );

    case 'welcome':
      return (
        <WelcomeCard
          message={content}
          suggestions={suggestions}
          onSuggestionClick={onSuggestionClick}
        />
      );

    case 'error':
      return (
        <AlertCard
          alertData={{
            type: 'error',
            title: 'Error',
            message: content
          }}
          onDismiss={onAlertDismiss}
        />
      );

    default:
      return (
        <TextCard
          content={content}
          suggestions={suggestions}
          onSuggestionClick={onSuggestionClick}
        />
      );
  }
};

export default SaytrixCardRenderer;
