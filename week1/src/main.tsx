import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './components/Toast'

const el = document.getElementById('root')
if (!el) throw new Error('Root element #root not found')
createRoot(el).render(
  <React.StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ToastProvider>
  </React.StrictMode>
)
