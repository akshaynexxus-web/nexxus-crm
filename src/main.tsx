import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import { toDisplayMessage } from './utils/message'

function showStartupError(error: unknown) {
  const root = document.getElementById('root')
  if (!root) return

  const message = toDisplayMessage(error, 'Unknown startup error')
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;">
      <div style="max-width:560px;border:1px solid #e2e8f0;border-radius:8px;background:white;padding:24px;box-shadow:0 10px 30px rgba(15,23,42,.08);">
        <h1 style="margin:0 0 8px;font-size:20px;">Nexxus CRM could not start</h1>
        <p style="margin:0 0 16px;color:#475569;font-size:14px;">${message}</p>
        <button onclick="localStorage.clear(); location.href='/login';" style="border:0;border-radius:6px;background:#0f172a;color:white;padding:10px 14px;cursor:pointer;">Clear login and reload</button>
      </div>
    </div>
  `
}

window.addEventListener('error', (event) => {
  showStartupError(event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  showStartupError(event.reason)
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

try {
  const root = document.getElementById('root')
  if (!root) {
    throw new Error('Missing app root element.')
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  )
} catch (error) {
  showStartupError(error)
}
