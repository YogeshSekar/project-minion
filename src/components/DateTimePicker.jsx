import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, Sun, Moon, X } from 'lucide-react'

function DateTimePicker({ value, onChange, onClose, position = { top: 0, left: 0 } }) {
  // Safe date parsing helper to avoid timezone issues
  const parseDate = (dateString) => {
    if (!dateString) return null
    
    const parts = String(dateString).split('-')
    if (parts.length !== 3) return null
    
    const [year, month, day] = parts.map(Number)
    return new Date(year, month - 1, day)
  }
  
  const initialParsed = useMemo(() => parseDate(value), [value])
  const [currentDate, setCurrentDate] = useState(initialParsed || new Date())
  const [selectedDate, setSelectedDate] = useState(initialParsed)
  const dropdownRef = useRef(null)


  // Update selectedDate when value prop changes
  useEffect(() => {
    const parsedDate = parseDate(value)
    setSelectedDate(parsedDate)
    // Only update currentDate if we have a valid parsed date
    if (parsedDate) {
      setCurrentDate(parsedDate)
    }
  }, [value])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    
    const days = []
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = useCallback((date) => {
    setSelectedDate(date)
    // Use local date string to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    onChange(dateStr)
  }, [onChange])

  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date) => {
    if (!date || !selectedDate) return false
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear()
  }

  const calendarDays = getDaysInMonth(currentDate)

  // Quick date options
  const getQuickDateOptions = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    return [
      { label: 'Today', date: today, icon: Sun },
      { label: 'Tomorrow', date: tomorrow, icon: Clock },
      { label: 'Next Week', date: nextWeek, icon: Calendar },
      { label: 'Next Month', date: nextMonth, icon: Moon },
      { label: 'Clear', date: null, icon: X, isClear: true }
    ]
  }

  const handleQuickDateSelect = useCallback((date, isClear = false) => {
    if (isClear) {
      onChange('')
      return
    }
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    onChange(`${year}-${month}-${day}`)
  }, [onChange])

  return (
    <div 
      ref={dropdownRef} 
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 z-[75]"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px` 
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick Date Options */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2">
          {getQuickDateOptions().map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.label}
                onClick={() => handleQuickDateSelect(option.date, option.isClear)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  option.isClear 
                    ? 'bg-red-50 hover:bg-red-100 text-red-600' 
                    : 'bg-gray-50 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Calendar Header */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(day => (
          <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => (
          <button
            key={index}
            onClick={() => {
              if (date) {
                handleDateClick(date)
              }
            }}
            disabled={!date}
            className={`
              p-2 text-sm rounded-lg transition-colors
              ${!date ? 'pointer-events-none opacity-0' : ''}
              ${isSelected(date) 
                ? 'bg-gray-900 text-white' 
                : isToday(date)
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }
              ${!date ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            {date ? date.getDate() : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

export default DateTimePicker
