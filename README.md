# TradeBro - Virtual Stock Trading Platform

## Project Overview

**TradeBro** is a virtual stock market simulator that enables users to gain real-world trading experience without investing real money. It provides a risk-free, educational platform where users can trade using virtual funds, analyze real-time data, track their portfolios, and learn investment strategies in an interactive way.

## Features

- **Virtual Trading**: Practice trading with virtual money
- **Portfolio Management**: Track your holdings and performance
- **Real-time Data**: Access live market data for informed decisions
- **Trading Assistant**: Get AI-powered trading advice
- **Daily Rewards**: Earn virtual coins by logging in daily

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Recharts
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **APIs**: Financial Modeling Prep API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB connection

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/tradebro.git
   cd tradebro
   ```

2. Install dependencies for both client and server
   ```
   cd client
   npm install
   cd ../server
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SESSION_SECRET=your_session_secret
   FMP_API_KEY=your_financial_modeling_prep_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the application

   Start the server:
   ```
   cd server
   npm start
   ```

   Start the client (in a new terminal):
   ```
   cd client
   npm run dev
   ```

5. Access the application
   - Backend: http://localhost:5000
   - Frontend: http://localhost:5173

## Virtual Money System

TradeBro includes a virtual money system that allows users to:

- Start with ₹10,000 virtual Indian Rupees
- Earn ₹1 daily by logging in (can only be claimed once every 24 hours)
- Buy and sell stocks with virtual money
- Track transaction history and portfolio performance in Indian Rupees (₹)

## Deployment Notes

### Files Excluded from Version Control
The following files and directories are excluded from version control via .gitignore:

- `node_modules/` directories (both client and server)
- Environment files (`.env`)
- Testing directories and files
- Log files
- Build artifacts and distribution files
- Batch files (`.bat`)

### Before Pushing to GitHub
1. Ensure you have a proper `.env` file locally (not included in the repository)
2. Make sure all dependencies are properly listed in package.json files
3. Test the application locally to verify everything works
4. Remove any sensitive information from the codebase

### Setting Up After Cloning
After cloning the repository, you'll need to:
1. Create the `.env` file with the required environment variables
2. Install dependencies using `npm install` in both client and server directories
3. Start the application as described in the Installation section

## Created by: Satya
