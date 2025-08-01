import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App.jsx'

// Redux Store
import { store, persistor } from './store'

// Contexts
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { SidebarProvider } from './contexts/SidebarContext'
import { VoiceProvider } from './contexts/VoiceContext'
import { VirtualMoneyProvider } from './contexts/VirtualMoneyContext'
import { PortfolioProvider } from './contexts/PortfolioContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Styles
import './styles/globals.css'
import './styles/el-classico-theme.css'
import './styles/universal-components.css'
import './styles/premium-components.css'
import './styles/responsive.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <PortfolioProvider>
                  <SidebarProvider>
                    <VoiceProvider>
                      <VirtualMoneyProvider>
                        <App />
                      </VirtualMoneyProvider>
                    </VoiceProvider>
                  </SidebarProvider>
                </PortfolioProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>,
)
