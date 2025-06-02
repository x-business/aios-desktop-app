import './index.css'
import App from './App'
import { createRoot } from 'react-dom/client'
import { StreamProvider } from './providers/Stream'
import { ThreadProvider } from './providers/Thread'
import { WebSocketProvider } from './providers/WebSocketProvider'
import { Toaster } from '@/components/ui/sonner'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6'
import { HashRouter } from 'react-router-dom'
import { ThemeProvider } from './providers/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <NuqsAdapter>
      <ThemeProvider>
        <WebSocketProvider>
          <ThreadProvider>
            <StreamProvider>
              <App />
            </StreamProvider>
          </ThreadProvider>
        </WebSocketProvider>
        <Toaster />
      </ThemeProvider>
    </NuqsAdapter>
  </HashRouter>
)
