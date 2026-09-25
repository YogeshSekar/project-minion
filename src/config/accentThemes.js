export const DEFAULT_ACCENT = 'indigo'

export const ACCENT_THEMES = [
  { id: 'indigo', label: 'Indigo', preview: '#4f46e5' },
  { id: 'purple', label: 'Purple', preview: '#9333ea' },
  { id: 'blue', label: 'Blue', preview: '#2563eb' },
  { id: 'teal', label: 'Teal', preview: '#0d9488' },
  { id: 'green', label: 'Green', preview: '#16a34a' },
  { id: 'orange', label: 'Orange', preview: '#ea580c' },
  { id: 'rose', label: 'Rose', preview: '#e11d48' },
]

export const isValidAccent = value =>
  ACCENT_THEMES.some(theme => theme.id === value)
