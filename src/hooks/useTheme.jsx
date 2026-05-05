import { useState, useEffect } from 'react'

function useTheme() {
  // Theme state with localStorage persistence
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('theme') || 'system'
    return savedTheme
  })

  // Font state with localStorage persistence
  const [font, setFontState] = useState(() => {
    const savedFont = localStorage.getItem('font') || 'manrope'
    return savedFont
  })

  // Wrapper to save theme to localStorage
  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Wrapper to save font to localStorage
  const setFont = (newFont) => {
    setFontState(newFont)
    localStorage.setItem('font', newFont)
  }

  // Theme effect - applies theme classes to root element
  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (selectedTheme) => {
      if (selectedTheme === 'light') {
        root.classList.remove('dark')
        root.classList.add('light')
      } else if (selectedTheme === 'dark') {
        root.classList.remove('light')
        root.classList.add('dark')
      } else {
        // System theme - detect from media query
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        if (mediaQuery.matches) {
          root.classList.remove('light')
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
          root.classList.add('light')
        }
      }
    }

    applyTheme(theme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e) => {
      if (theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', listener)

    return () => {
      mediaQuery.removeEventListener('change', listener)
    }
  }, [theme])

  // Font effect - applies font to body element
  useEffect(() => {
    const fonts = {
      'inter': "'Inter', system-ui, sans-serif",
      'plus-jakarta': "'Plus Jakarta Sans', system-ui, sans-serif",
      'manrope': "'Manrope', system-ui, sans-serif",
      'poppins': "'Poppins', sans-serif"
    }
    document.body.style.fontFamily = fonts[font] || fonts['manrope']
  }, [font])

  return {
    theme,
    setTheme,
    font,
    setFont
  }
}

export default useTheme
