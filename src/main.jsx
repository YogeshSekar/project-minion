import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { DEFAULT_ACCENT, isValidAccent } from './config/accentThemes'
import './App.css'

// Apply appearance preferences immediately before React renders
const savedTheme = localStorage.getItem('theme') || 'system'
const savedAccent = localStorage.getItem('accent')

const applyInitialTheme = () => {
  if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark')
  } else if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark)
  }
}

const applyInitialAccent = () => {
  document.documentElement.dataset.accent = isValidAccent(savedAccent)
    ? savedAccent
    : DEFAULT_ACCENT
}

applyInitialTheme()
applyInitialAccent()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
