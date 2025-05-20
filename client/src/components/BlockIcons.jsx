import React from 'react';
import { 
  FiDatabase, 
  FiServer, 
  FiCode, 
  FiLayers, 
  FiCpu, 
  FiHeart, 
  FiTrendingUp, 
  FiUsers,
  FiMonitor,
  FiActivity,
  FiBarChart2,
  FiGlobe,
  FiBookOpen,
  FiPieChart,
  FiSettings,
  FiShield
} from 'react-icons/fi';

/**
 * Collection of icons for block cards
 */
export const BlockIcons = {
  // Development Icons
  Database: (props) => <FiDatabase {...props} size={32} color="#1976d2" />,
  Server: (props) => <FiServer {...props} size={32} color="#2e7d32" />,
  Code: (props) => <FiCode {...props} size={32} color="#c62828" />,
  Layers: (props) => <FiLayers {...props} size={32} color="#ff8f00" />,
  Cpu: (props) => <FiCpu {...props} size={32} color="#6a1b9a" />,
  
  // Business Icons
  Heart: (props) => <FiHeart {...props} size={32} color="#c2185b" />,
  TrendingUp: (props) => <FiTrendingUp {...props} size={32} color="#00695c" />,
  Users: (props) => <FiUsers {...props} size={32} color="#283593" />,
  
  // Tech Icons
  Monitor: (props) => <FiMonitor {...props} size={32} color="#0277bd" />,
  Activity: (props) => <FiActivity {...props} size={32} color="#ad1457" />,
  BarChart: (props) => <FiBarChart2 {...props} size={32} color="#ef6c00" />,
  Globe: (props) => <FiGlobe {...props} size={32} color="#0288d1" />,
  
  // Education Icons
  BookOpen: (props) => <FiBookOpen {...props} size={32} color="#1565c0" />,
  PieChart: (props) => <FiPieChart {...props} size={32} color="#4527a0" />,
  Settings: (props) => <FiSettings {...props} size={32} color="#00838f" />,
  Shield: (props) => <FiShield {...props} size={32} color="#bf360c" />
};

/**
 * Custom icon component with colorful background
 */
export const CircleIcon = ({ icon: Icon, color = '#1976d2', bgColor = '#e3f2fd' }) => {
  return (
    <div 
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Icon style={{ color }} />
    </div>
  );
};

export default BlockIcons;
