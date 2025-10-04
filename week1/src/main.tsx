import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const el = document.getElementById('root')
if (!el) throw new Error('Root element #root not found')
createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
