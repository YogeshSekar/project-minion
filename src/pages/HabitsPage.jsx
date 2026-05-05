import { useState } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, Target, Clock, TrendingUp, Award, Pencil } from 'lucide-react'
import useHabits from '../hooks/useHabits'

function HabitsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedHabit, setSelectedHabit] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // Inline editing state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState('')

  // Use real data from hook
  const {
    habits,
    loading,
    error,
    toggleHabitCompletion: toggleHabitCompletionApi,
    deleteHabit: deleteHabitApi,
    createHabit,
    updateHabit
  } = useHabits()

  // Helper functions
  const getWeekDates = () => {
    const dates = []
    const startOfWeek = new Date(selectedDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const getISOWeekNumber = (date) => {
    const tempDate = new Date(date.valueOf())
    tempDate.setHours(0, 0, 0, 0)
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7))
    const week1 = new Date(tempDate.getFullYear(), 0, 4)
    const weekNumber = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
    return weekNumber
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (direction === 'today') {
      setSelectedDate(new Date())
      return
    }
    setSelectedDate(newDate)
  }

  const handleToggleHabitCompletion = async (habitId, date) => {
    const dateString = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    await toggleHabitCompletionApi(habitId, dateString)
  }

  const getWeekCompletionRate = (habit) => {
    const progress = habit.weeklyProgress || []
    const completed = progress.filter(Boolean).length
    return Math.round((completed / 7) * 100)
  }

  const getMonthCompletionRate = (habit) => {
    const progress = habit.monthlyProgress || []
    const completed = progress.filter(Boolean).length
    return Math.round((completed / 30) * 100)
  }

  const handleDeleteHabit = async (habitId) => {
    const response = await deleteHabitApi(habitId)
    if (response.success) {
      setSelectedHabit(null)
    }
  }

  const handleCreateHabit = async () => {
    const response = await createHabit({
      name: 'New Habit',
      category: 'General',
      color: 'blue',
      icon: '📝',
      target: 30,
      description: '',
      time_preference: 'Any time'
    })
    if (response.success && response.data) {
      setSelectedHabit(response.data)
      // Auto-start editing the name
      setIsEditingName(true)
      setEditingName('New Habit')
    }
  }

  const handleStartEditing = () => {
    if (selectedHabit) {
      setIsEditingName(true)
      setEditingName(selectedHabit.name)
    }
  }

  const handleSaveName = async () => {
    if (selectedHabit && editingName.trim() !== selectedHabit.name) {
      const response = await updateHabit({
        id: selectedHabit.id,
        name: editingName.trim(),
        category: selectedHabit.category,
        color: selectedHabit.color,
        icon: selectedHabit.icon,
        target: selectedHabit.target,
        description: selectedHabit.description,
        time_preference: selectedHabit.time_preference
      })
      if (!response.success) {
        console.error('Error updating habit name:', response.error)
      }
    }
    setIsEditingName(false)
    setEditingName('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
      setEditingName('')
    }
  }

  const getHabitColorClasses = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-700 border-green-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      red: 'bg-red-100 text-red-700 border-red-300',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300'
    }
    return colors[color] || colors.blue
  }

  const getDayColor = (completed, isSelected) => {
    if (completed) return 'bg-gray-900 border-gray-900 text-white'
    if (isSelected) return 'bg-gray-200 border-gray-400'
    return 'bg-white border-gray-300 hover:border-gray-400'
  }

  if (loading) {
    return (
      <div className="h-full bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-gray-500">Loading habits...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  const weekDates = getWeekDates()

  return (
    <div className="h-full bg-gray-50 flex gap-4 p-4 overflow-hidden">
      {/* Left: Habits List */}
      <div className="w-96 flex flex-col overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Habits List Container */}
          <div className="w-full h-full flex flex-col">
            <div className="w-full h-full rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col">
              {/* Header with Week Navigation */}
              <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900 min-w-[80px] text-center">
                    Week {getISOWeekNumber(selectedDate)}
                  </span>
                  <button
                    onClick={() => navigateDate('next')}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                {!isToday(selectedDate) && (
                  <button
                    onClick={() => navigateDate('today')}
                    className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    This Week
                  </button>
                )}
              </div>

              {/* New Habit Button */}
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={handleCreateHabit}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Habit</span>
                </button>
              </div>

              {/* Habits List */}
              <div className="flex-1 overflow-auto p-4">
                {habits.length > 0 ? (
                  <div className="space-y-3">
                    {habits.map((habit) => (
                      <div
                        key={habit.id}
                        onClick={() => setSelectedHabit(habit)}
                        className={`
                          bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer
                          ${selectedHabit?.id === habit.id 
                            ? 'border-gray-900 bg-gray-100' 
                            : 'hover:border-gray-300'
                          }
                        `}
                      >
                        {/* Habit Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate flex-1">{habit.name}</h4>
                          <span className={`text-xs px-2 py-0.5 font-medium rounded-full border ${getHabitColorClasses(habit.color)}`}>
                            {habit.category}
                          </span>
                        </div>

                        {/* Weekly Progress */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {weekDates.map((date, dayIndex) => {
                              const completed = habit.weeklyProgress?.[dayIndex] || false
                              const isToday = new Date().toDateString() === date.toDateString()
                              return (
                                <button
                                  key={dayIndex}
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    await handleToggleHabitCompletion(habit.id, date)
                                  }}
                                  className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all
                                    ${getDayColor(completed, isToday)}
                                    ${!completed && 'hover:border-gray-500'}
                                  `}
                                  title={date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                >
                                  {completed && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900">{habit.streak || 0}</span>
                            <span className="text-xs text-gray-500 ml-1">day streak</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="mb-4">
                      <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">No habits yet</p>
                    <p className="text-xs text-gray-400 mt-1">Create your first habit to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Habit Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
          {selectedHabit ? (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex-none px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditingName ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSaveName}
                        className="w-full text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-gray-900 focus:outline-none px-0 py-1"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-900">{selectedHabit.name}</h2>
                        <button
                          onClick={handleStartEditing}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="Edit name"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getHabitColorClasses(selectedHabit.color)}`}>
                        {selectedHabit.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created {new Date(selectedHabit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteHabit(selectedHabit.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete habit"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                {selectedHabit.description && (
                  <p className="mt-3 text-sm text-gray-600">{selectedHabit.description}</p>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="flex-1 overflow-auto px-4 pb-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Left Column */}
                  <div className="h-full flex flex-col gap-3">
                    {/* Streak Stats */}
                    <div className="grid grid-cols-2 gap-2 flex-[2]">
                      <div className="p-2 px-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Award className="w-3 h-3 text-orange-500" />
                          <span className="text-sm font-medium text-gray-700">Current Streak</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{selectedHabit.streak || 0}</p>
                        <p className="text-sm text-gray-500">days</p>
                      </div>
                      <div className="p-2 px-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-1 mb-0.5">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-sm font-medium text-gray-700">Best Streak</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{selectedHabit.bestStreak || 0}</p>
                        <p className="text-sm text-gray-500">days</p>
                      </div>
                    </div>

                    {/* Completion Rates */}
                    <div className="flex-[1.8] p-3 bg-gray-50 rounded-xl flex flex-col">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Completion Rates</h4>
                      <div className="flex items-center justify-around">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                              fill="none"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="#111827"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              strokeDashoffset={`${2 * Math.PI * 20 * (1 - getWeekCompletionRate(selectedHabit) / 100)}`}
                              strokeLinecap=""
                            />
                          </svg>
                          <span className="text-xs font-medium text-gray-900 mt-1">{getWeekCompletionRate(selectedHabit)}%</span>
                          <span className="text-xs text-gray-500">This Week</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                              fill="none"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="#374151"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              strokeDashoffset={`${2 * Math.PI * 20 * (1 - getMonthCompletionRate(selectedHabit) / 100)}`}
                              strokeLinecap=""
                            />
                          </svg>
                          <span className="text-xs font-medium text-gray-900 mt-1">{getMonthCompletionRate(selectedHabit)}%</span>
                          <span className="text-xs text-gray-500">This Month</span>
                        </div>
                      </div>
                    </div>

                    {/* Daily Target */}
                    <div className="flex-[1] p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">Daily Target</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{selectedHabit.target} min</p>
                    </div>
                  </div>

                  {/* Right Column - Calendar */}
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3 py-2">
                      <button
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                        className="p-0.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <h4 className="text-sm font-medium text-gray-700">
                        {calendarMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </h4>
                      <button
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                        className="p-0.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs font-medium text-gray-500 py-0.5">
                          {day}
                        </div>
                      ))}
                      {(() => {
                        const today = new Date()
                        const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
                        const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()
                        const calendarDays = []
                        
                        for (let i = 0; i < firstDayOfMonth; i++) {
                          calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />)
                        }
                        
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
                          const dateStr = date.toISOString().split('T')[0]
                          const isCurrentMonth = calendarMonth.getMonth() === today.getMonth() && calendarMonth.getFullYear() === today.getFullYear()
                          const completed = isCurrentMonth ? (selectedHabit.monthlyProgress?.[day - 1] || false) : false
                          const isToday = isCurrentMonth && day === today.getDate()
                          calendarDays.push(
                            <div
                              key={day}
                              className={`
                                aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-all
                                ${completed 
                                  ? 'bg-gray-900 text-white' 
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }
                                ${isToday && !completed ? 'ring-1 ring-gray-400' : ''}
                                ${!isCurrentMonth ? 'opacity-50' : ''}
                              `}
                              title={`${day}${completed ? ' - Completed' : ''}`}
                              onClick={async () => {
                                if (isCurrentMonth) {
                                  await handleToggleHabitCompletion(selectedHabit.id, date)
                                }
                              }}
                            >
                              {day}
                            </div>
                          )
                        }
                        return calendarDays
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="mb-4">
                  <svg className="w-20 h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-700 mb-1">No habit selected</p>
                <p className="text-sm text-gray-400">Click on a habit to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HabitsPage
