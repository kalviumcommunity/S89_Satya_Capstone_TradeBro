import React from 'react';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiTrendingUp,
  FiFileText,
  FiMessageSquare,
  FiBarChart2,
  FiDollarSign,
  FiPieChart,
  FiActivity
} from 'react-icons/fi';

const QuickActions = ({ onActionClick }) => {
  const quickActions = [
    {
      id: 'quote',
      icon: FiSearch,
      label: 'Quote',
      command: '/quote ',
      description: 'Get stock quote',
      color: '#3B82F6'
    },
    {
      id: 'chart',
      icon: FiBarChart2,
      label: 'Chart',
      command: '/chart ',
      description: 'View stock chart',
      color: '#10B981'
    },
    {
      id: 'news',
      icon: FiFileText,
      label: 'News',
      command: '/news',
      description: 'Latest market news',
      color: '#F59E0B'
    },
    {
      id: 'ask',
      icon: FiMessageSquare,
      label: 'Ask AI',
      command: 'What is ',
      description: 'Ask anything',
      color: '#8B5CF6'
    }
  ];

  const handleActionClick = (action) => {
    if (action.command.endsWith(' ')) {
      // For commands that need user input, just trigger with the command
      onActionClick(action.command.trim());
    } else {
      // For complete commands, execute directly
      onActionClick(action.command);
    }
  };

  return (
    <div className="quick-actions">
      <div className="actions-grid">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            className="quick-action-btn"
            onClick={() => handleActionClick(action)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{ '--action-color': action.color }}
          >
            <div className="action-icon">
              <action.icon size={16} />
            </div>
            <span className="action-label">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
