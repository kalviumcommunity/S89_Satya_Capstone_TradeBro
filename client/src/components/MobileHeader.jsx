import React from 'react';
import { motion } from 'framer-motion';
import { FiMenu } from 'react-icons/fi';
import { useSidebar } from '../context/SidebarContext';
import './MobileHeader.css';

const MobileHeader = ({ title, subtitle }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="mobile-header">
      <motion.button 
        className="mobile-menu-btn"
        onClick={toggleSidebar}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiMenu size={24} />
      </motion.button>
      
      <div className="mobile-header-title">
        <h1>{title || 'TradeBro'}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      
      <div className="mobile-header-spacer"></div>
    </div>
  );
};

export default MobileHeader;
