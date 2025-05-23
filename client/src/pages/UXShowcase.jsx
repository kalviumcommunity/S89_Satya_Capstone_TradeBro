import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiInfo, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiX, 
  FiSearch, 
  FiPlus, 
  FiRefreshCw,
  FiArrowUp,
  FiHelpCircle
} from 'react-icons/fi';
import PageLayout from '../components/PageLayout.kalvium';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import Tooltip from '../components/Tooltip';
import SquaresBackground from '../components/SquaresBackground';
import { useNotification } from '../context/NotificationContext';
import '../styles/enhanced-ux.css';
import '../styles/UXShowcase.css';

const UXShowcase = () => {
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { showInfo, showSuccess, showWarning, showError } = useNotification();

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Show notifications
  const handleShowInfo = () => {
    showInfo('This is an information message', 'Information');
  };

  const handleShowSuccess = () => {
    showSuccess('Operation completed successfully', 'Success');
  };

  const handleShowWarning = () => {
    showWarning('This action may have consequences', 'Warning');
  };

  const handleShowError = () => {
    showError('An error occurred', 'Error');
  };

  return (
    <PageLayout title="UX Showcase">
      <div className="ux-showcase">
        <SquaresBackground color="multi" count={15} />
        
        <motion.div
          className="showcase-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>UX Enhancements Showcase</h1>
          <p>Explore the various UX enhancements available in TradeBro</p>
        </motion.div>
        
        <div className="showcase-section">
          <h2>Loading States</h2>
          
          {loading ? (
            <div className="showcase-grid">
              <SkeletonLoader type="card" />
              <SkeletonLoader type="card" />
              <SkeletonLoader type="card" />
            </div>
          ) : (
            <div className="showcase-grid">
              <div className="showcase-card card-hover-effect">
                <h3>Card 1</h3>
                <p>This card has a hover effect</p>
              </div>
              <div className="showcase-card card-hover-effect">
                <h3>Card 2</h3>
                <p>This card has a hover effect</p>
              </div>
              <div className="showcase-card card-hover-effect">
                <h3>Card 3</h3>
                <p>This card has a hover effect</p>
              </div>
            </div>
          )}
          
          <div className="showcase-controls">
            <button className="btn btn-primary" onClick={() => setLoading(!loading)}>
              {loading ? 'Show Content' : 'Show Loading'}
            </button>
          </div>
        </div>
        
        <div className="showcase-section">
          <h2>Skeleton Loaders</h2>
          
          <div className="showcase-grid">
            <div className="showcase-item">
              <h3>Text Skeleton</h3>
              <SkeletonLoader type="text" count={3} />
            </div>
            <div className="showcase-item">
              <h3>Card Skeleton</h3>
              <SkeletonLoader type="card" />
            </div>
            <div className="showcase-item">
              <h3>Profile Skeleton</h3>
              <SkeletonLoader type="profile" />
            </div>
          </div>
        </div>
        
        <div className="showcase-section">
          <h2>Empty States</h2>
          
          <div className="showcase-grid">
            <EmptyState 
              type="search" 
              action={<button className="btn btn-primary">Clear Search</button>}
            />
            <EmptyState 
              type="data" 
              action={<button className="btn btn-primary">Refresh Data</button>}
            />
            <EmptyState 
              type="error" 
              action={<button className="btn btn-primary">Try Again</button>}
            />
          </div>
        </div>
        
        <div className="showcase-section">
          <h2>Tooltips</h2>
          
          <div className="showcase-grid">
            <div className="showcase-item">
              <h3>Basic Tooltip</h3>
              <Tooltip content="This is a basic tooltip">
                <button className="btn btn-primary">Hover Me</button>
              </Tooltip>
            </div>
            <div className="showcase-item">
              <h3>Positioned Tooltip</h3>
              <div className="tooltip-showcase">
                <Tooltip content="Top tooltip" position="top">
                  <button className="btn btn-outline">Top</button>
                </Tooltip>
                <Tooltip content="Right tooltip" position="right">
                  <button className="btn btn-outline">Right</button>
                </Tooltip>
                <Tooltip content="Bottom tooltip" position="bottom">
                  <button className="btn btn-outline">Bottom</button>
                </Tooltip>
                <Tooltip content="Left tooltip" position="left">
                  <button className="btn btn-outline">Left</button>
                </Tooltip>
              </div>
            </div>
            <div className="showcase-item">
              <h3>Typed Tooltips</h3>
              <div className="tooltip-showcase">
                <Tooltip content="Info tooltip" type="info">
                  <button className="btn btn-info">Info</button>
                </Tooltip>
                <Tooltip content="Success tooltip" type="success">
                  <button className="btn btn-success">Success</button>
                </Tooltip>
                <Tooltip content="Warning tooltip" type="warning">
                  <button className="btn btn-warning">Warning</button>
                </Tooltip>
                <Tooltip content="Error tooltip" type="error">
                  <button className="btn btn-error">Error</button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
        
        <div className="showcase-section">
          <h2>Notifications</h2>
          
          <div className="showcase-grid">
            <div className="showcase-item">
              <h3>Popup Notifications</h3>
              <div className="button-group">
                <button className="btn btn-info" onClick={handleShowInfo}>
                  <FiInfo /> Info
                </button>
                <button className="btn btn-success" onClick={handleShowSuccess}>
                  <FiCheckCircle /> Success
                </button>
                <button className="btn btn-warning" onClick={handleShowWarning}>
                  <FiAlertCircle /> Warning
                </button>
                <button className="btn btn-error" onClick={handleShowError}>
                  <FiX /> Error
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="showcase-section">
          <h2>Button Interactions</h2>
          
          <div className="showcase-grid">
            <div className="showcase-item">
              <h3>Hover Effects</h3>
              <div className="button-group">
                <button className="btn btn-primary btn-hover-effect">Hover Effect</button>
                <button className="btn btn-secondary card-hover-effect">Lift Effect</button>
                <button className="btn btn-outline pulse">Pulse Effect</button>
              </div>
            </div>
            <div className="showcase-item">
              <h3>Click Effects</h3>
              <div className="button-group">
                <button className="btn btn-primary btn-press">Press Effect</button>
                <button className="btn btn-secondary shake">Shake Effect</button>
                <button className="btn btn-outline scale-in">Scale Effect</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="showcase-section">
          <h2>Form Interactions</h2>
          
          <div className="showcase-grid">
            <div className="showcase-item">
              <h3>Input Effects</h3>
              <input 
                type="text" 
                className="input-focus-effect" 
                placeholder="Focus me" 
              />
              <div className="form-group">
                <input 
                  type="text" 
                  className="valid" 
                  value="Valid input" 
                  readOnly 
                />
                <div className="form-feedback valid">
                  <FiCheckCircle /> Valid input
                </div>
              </div>
              <div className="form-group">
                <input 
                  type="text" 
                  className="invalid" 
                  value="Invalid input" 
                  readOnly 
                />
                <div className="form-feedback invalid">
                  <FiAlertCircle /> Invalid input
                </div>
              </div>
            </div>
            <div className="showcase-item">
              <h3>Checkbox & Radio</h3>
              <div className="form-group">
                <label className="animated-checkbox">
                  <input type="checkbox" /> Animated checkbox
                </label>
              </div>
              <div className="form-group">
                <label className="animated-radio">
                  <input type="radio" name="radio" /> Animated radio
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="showcase-section">
          <h2>Animations</h2>
          
          <div className="showcase-grid">
            <div className="showcase-item">
              <h3>Entrance Animations</h3>
              <div className="button-group">
                <button className="btn btn-outline" onClick={() => document.getElementById('fade-in').classList.add('fade-in')}>
                  Fade In
                </button>
                <button className="btn btn-outline" onClick={() => document.getElementById('slide-up').classList.add('slide-up')}>
                  Slide Up
                </button>
                <button className="btn btn-outline" onClick={() => document.getElementById('scale-in').classList.add('scale-in')}>
                  Scale In
                </button>
              </div>
              <div className="animation-demo">
                <div id="fade-in" className="animation-box">Fade In</div>
                <div id="slide-up" className="animation-box">Slide Up</div>
                <div id="scale-in" className="animation-box">Scale In</div>
              </div>
            </div>
            <div className="showcase-item">
              <h3>Continuous Animations</h3>
              <div className="animation-demo">
                <div className="animation-box pulse">Pulse</div>
                <div className="animation-box bounce">Bounce</div>
                <div className="animation-box rotate">Rotate</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="showcase-section">
          <h2>Accessibility</h2>
          
          <div className="showcase-grid">
            <div className="showcase-item">
              <h3>Skip to Content</h3>
              <a href="#main" className="skip-to-content">Skip to content</a>
              <p>Tab to see the skip link</p>
            </div>
            <div className="showcase-item">
              <h3>Focus Styles</h3>
              <button className="btn btn-primary">Tab to me</button>
              <a href="#" className="focus-link">Or to me</a>
            </div>
            <div className="showcase-item">
              <h3>ARIA Labels</h3>
              <button aria-label="Help" className="icon-button">
                <FiHelpCircle />
              </button>
              <button aria-label="Search" className="icon-button">
                <FiSearch />
              </button>
              <button aria-label="Add" className="icon-button">
                <FiPlus />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll to top button */}
      <button 
        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <FiArrowUp />
      </button>
    </PageLayout>
  );
};

export default UXShowcase;
