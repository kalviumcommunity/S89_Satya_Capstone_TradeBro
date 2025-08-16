# Saytrix Chatbot Setup Guide

## Quick Start

1. **Run the startup script:**
   ```bash
   # Double-click the start-tradebro.bat file
   # OR run from command line:
   start-tradebro.bat
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5001
   - Saytrix Chat: Navigate to `/saytrix` page

## Environment Setup

1. **Copy environment file:**
   ```bash
   cd server
   copy .env.example .env
   ```

2. **Configure your .env file:**
   - Add your MongoDB connection string
   - Add your API keys (FMP, Gemini)
   - Update other configuration as needed

## Features Working

✅ **Voice Input/Output** - Click microphone to speak
✅ **Text Chat** - Type messages in the input field
✅ **Real Stock Data** - Live prices from FMP API with 4 backup keys
✅ **Market Movers** - Real-time top gainers and losers
✅ **Stock News** - Latest market and company-specific news
✅ **Multi-API Fallback** - Automatic failover between API keys
✅ **Indian Stocks** - Optimized for NSE/BSE stocks
✅ **Suggestions** - Smart contextual suggestions

## Sample Queries

Try these with Saytrix (now with real data!):

- "Tell me about Reliance stock" - Real stock price & data
- "Show me top gainers today" - Live market movers
- "What's the NIFTY performance?" - Current index data
- "Compare TCS vs Infosys" - Side-by-side analysis
- "Latest market news" - Fresh news articles
- "What is PE ratio?" - Educational content
- "HDFC Bank price" - Quick price lookup
- "Top losers today" - Market decliners

## Troubleshooting

**If backend fails to connect:**
- Saytrix automatically falls back to offline mode
- Demo data will be shown for stock queries
- All UI features remain functional

**Voice not working:**
- Ensure microphone permissions are granted
- Try refreshing the page
- Check browser compatibility (Chrome recommended)

**No responses:**
- Check if both servers are running
- Verify environment variables are set
- Check browser console for errors

## Architecture

- **Frontend:** React + Vite (Port 5173)
- **Backend:** Node.js + Express (Port 5001)
- **AI:** Google Gemini Pro + Enhanced Services
- **Database:** MongoDB (Optional for chat history)
- **Voice:** Web Speech API (Browser native)

## Development Mode

The chatbot works in both online and offline modes:

1. **Online Mode:** Full AI responses with real stock data
2. **Offline Mode:** Fallback responses with demo data

Both modes provide a complete user experience for demonstration purposes.