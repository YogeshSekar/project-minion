import { X } from 'lucide-react'

export default function SettingsModal({ isOpen, onClose, theme, setTheme, font, setFont }) {
  if (!isOpen) return null

  const handleThemeChange = (value) => {
    setTheme(value)
    localStorage.setItem('theme', value)

    if (value === 'light') {
      document.documentElement.classList.remove('dark')
    } else if (value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }

  const handleFontChange = (value) => {
    setFont(value)
    localStorage.setItem('font', value)
  }

  const fonts = [
    { id: 'inter', name: 'Inter', family: "'Inter', system-ui, sans-serif" },
    { id: 'plus-jakarta', name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', system-ui, sans-serif" },
    { id: 'manrope', name: 'Manrope', family: "'Manrope', system-ui, sans-serif" },
    { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif" },
  ]

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white w-[500px] rounded-xl shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-todoist-text-primary">
            Settings
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-todoist-text-secondary" />
          </button>
        </div>

        {/* Appearance Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-todoist-text-secondary mb-3">
            Appearance
          </h3>

          <div className="flex gap-3">
            {['light', 'dark', 'system'].map((option) => (
              <button
                key={option}
                onClick={() => handleThemeChange(option)}
                className={`
                  px-4 py-2 rounded-lg border text-sm capitalize
                  transition-colors
                  ${
                    theme === option
                      ? 'bg-todoist-red text-white border-todoist-red'
                      : 'bg-todoist-sidebar-bg text-todoist-text-secondary border-todoist-border'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Font Family Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-todoist-text-secondary mb-3">
            Font Family
          </h3>

          <div className="flex gap-3">
            {fonts.map((f) => (
              <button
                key={f.id}
                onClick={() => handleFontChange(f.id)}
                className={`
                  px-4 py-2 rounded-lg border text-sm
                  transition-colors
                  ${
                    font === f.id
                      ? 'bg-todoist-red text-white border-todoist-red'
                      : 'bg-todoist-sidebar-bg text-todoist-text-secondary border-todoist-border'
                  }
                `}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* About Section */}
        <div className="pt-6 border-t border-todoist-border">
          <h3 className="text-sm font-medium text-todoist-text-secondary mb-3">
            About
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-todoist-text-secondary">Version</span>
              <span className="text-todoist-text-primary font-medium">0.1.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-todoist-text-secondary">Application</span>
              <span className="text-todoist-text-primary font-medium">Project Minion</span>
            </div>
            <div className="text-xs text-todoist-text-secondary mt-3">
              &copy; 2024 Project Minion. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}