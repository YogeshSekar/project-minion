import React from 'react'
import { ChevronDown } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside'

function Select({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select...',
  className = '',
  disabled = false
}) {
  const { ref, isOpen, setIsOpen } = useClickOutside()

  const handleSelect = (option) => {
    onChange(option)
    setIsOpen(false)
  }

  const selectedLabel = value ? (value.label || value.name || value.title || value) : placeholder

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-left transition-colors ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
        } ${isOpen ? 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500 dark:ring-blue-400' : ''}`}
      >
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
          {selectedLabel}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Options Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 max-h-60 overflow-auto">
          {options.map((option, index) => {
            const optionValue = option.value || option.id || option
            const optionLabel = option.label || option.name || option.title || option
            const isSelected = (value?.value || value?.id || value) === optionValue

            return (
              <div
                key={optionValue || index}
                onClick={() => handleSelect(option)}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {optionLabel}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Select
