# 📈 TradeBro - Stock Trading Simulator Client

A professional, modern React.js frontend for the TradeBro stock trading simulator platform. Built with clean, custom CSS and following "El-Classico" design principles for a premium fintech experience.

## ✨ Features

### 🎨 **Professional UI/UX**
- **El-Classico Design**: Clean, professional aesthetic matching premium fintech platforms
- **Fully Responsive**: Optimized for mobile, tablet, and desktop devices
- **Custom CSS**: No external UI frameworks - pure, maintainable CSS
- **Dark/Light Mode**: Built-in theme switching capability
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions

### 📱 **Pages & Components**
- **🏠 Landing Page**: Hero section, features, benefits, and call-to-action
- **🔐 Authentication**: Professional login/signup forms with validation
- **📊 Dashboard**: Portfolio overview, charts, recent trades, market movers
- **💼 Portfolio**: Holdings management with P&L tracking
- **📈 Trading**: Buy/sell interface with stock search and order management
- **👤 Profile**: User settings and profile management
- **🤖 Saytrix AI**: ChatGPT-style AI assistant interface
- **🔍 404 Page**: Professional not found page with navigation

### 🛠️ **Technical Features**
- **React 18**: Latest React with hooks and modern patterns
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing with protected routes
- **Context API**: State management for auth and theme
- **Framer Motion**: Smooth animations and transitions
- **React Toastify**: Professional toast notifications
- **Recharts**: Beautiful, responsive charts
- **React Icons**: Comprehensive icon library

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd S89_Satya_Capstone_TradeBro/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production
```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/           # Reusable components
│   ├── common/          # Common components (Modal, Button, etc.)
│   └── layout/          # Layout components (Navbar, etc.)
├── contexts/            # React contexts (Auth, Theme)
├── pages/               # Page components
├── styles/              # CSS files
│   ├── index.css        # Global styles and design system
│   └── App.css          # Application-specific styles
└── main.jsx             # Application entry point
```

## 🎨 Design System

### Color Palette
- **Primary**: #2563EB (Blue)
- **Success**: #10B981 (Green)
- **Error**: #EF4444 (Red)
- **Warning**: #F59E0B (Amber)
- **Background**: #F9FAFB (Light) / #0F172A (Dark)

### Typography
- **Primary Font**: Inter
- **Secondary Font**: Poppins
- **Sizes**: 0.75rem - 3.5rem with consistent scale

### Spacing
- **System**: 0.25rem - 3rem with 8px base unit
- **Consistent**: All components use design tokens

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: > 768px

## 🎯 Key Components

### Authentication
- Form validation with real-time feedback
- Google OAuth integration ready
- Professional error handling

### Dashboard
- Portfolio overview cards
- Interactive charts with Recharts
- Recent trades and market data
- Responsive grid layouts

### Trading Interface
- Stock search with autocomplete
- Buy/sell toggle interface
- Order summary calculations
- Professional form validation

### AI Assistant (Saytrix)
- ChatGPT-style interface
- Voice input capability (ready for integration)
- Typing indicators and animations
- Message history management

## 🔒 Security Features

- Protected routes for authenticated users
- Context-based authentication state
- Secure token handling (ready for backend integration)
- Input validation and sanitization

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📈 Performance

- Lazy loading ready
- Optimized bundle size
- Efficient re-renders with React best practices
- CSS optimizations for smooth animations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the TradeBro stock trading simulator platform.

## 🔗 Integration Notes

This frontend is designed to integrate with a Node.js/Express backend. Key integration points:

- **API Endpoints**: Ready for REST API integration
- **Authentication**: JWT token handling implemented
- **Real-time Data**: WebSocket ready for live market data
- **File Uploads**: Profile image upload ready

## 🎉 Deployment Ready

The application is production-ready with:
- Optimized build process
- Environment variable support
- Error boundaries for graceful error handling
- SEO-friendly structure
- Accessibility compliance (WCAG 2.1)

---

**Built with ❤️ for professional stock trading simulation**
