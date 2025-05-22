import React from "react";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import TradingDashboard from "../components/dashboard/TradingDashboard";
import PageLayout from "../components/PageLayout";

const ModernTradingDashboardDemo = () => {
  const navigate = useNavigate();

  // Sample stock data
  const stockData = {
    name: "Affimed N.V.",
    symbol: "AFMD",
    price: 0.26,
    change: 0.18,
    changePercent: 224.62,
    open: 0.08,
    high: 0.28,
    low: 0.08,
    volume: 385000,
    marketCap: "39.2M",
    pe: "N/A",
    dividend: "0.00",
    yield: "0.00%"
  };

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
          <h1>Modern Trading Dashboard</h1>
        </motion.div>

        <TradingDashboard stockData={stockData} />
      </div>
    </PageLayout>
  );
};

export default ModernTradingDashboardDemo;
