import React from "react";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ModernStockDashboard from "../components/ModernStockDashboard";
import PageLayout from "../components/PageLayout";

const ModernStockDashboardDemo = () => {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="demo-container">
        <motion.div
          className="demo-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            className="back-button"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft /> Back
          </button>
          <h1>Modern Stock Dashboard Demo</h1>
        </motion.div>

        <ModernStockDashboard />
      </div>

      <style jsx="true">{`
        .demo-container {
          padding: 0;
          max-width: 100%;
        }
        
        .demo-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 2rem;
          background-color: var(--bg-color, #121722);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .demo-header h1 {
          font-size: 1.5rem;
          margin: 0;
          color: var(--text-primary, #f0f4f8);
        }
        
        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--text-primary, #f0f4f8);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .back-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: translateX(-3px);
        }
      `}</style>
    </PageLayout>
  );
};

export default ModernStockDashboardDemo;
