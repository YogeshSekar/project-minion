import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

// Apply theme immediately before React renders
const savedTheme = localStorage.getItem('theme') || 'system'
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

applyInitialTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
