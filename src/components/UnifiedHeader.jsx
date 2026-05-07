import React, { useState, useEffect, useRef } from 'react'
import { Minus, Square, X, Search, Settings, Plus, Bell, ChevronDown, Play, Pause, Folder, CheckSquare, FileText } from 'lucide-react'

const UnifiedHeader = ({
  activeItem,
  onNewAction,
  searchQuery,
  setSearchQuery,
  isNewDropdownOpen,
  setIsNewDropdownOpen,
  dropdownTimeout,
  setDropdownTimeout,
  isTimerOpen,
  setIsTimerOpen,
  elapsedTime,
  isTimerRunning,
  trackedTask,
  setTrackedTask,
  showTaskSelector,
  setShowTaskSelector,
  todayTasks,
  startTimer,
  pauseTimer,
  resetTimer,
  setElapsedTime,
  getCurrentDateTime,
  formatTime,
  onSettingsClick
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const headerRef = useRef(null)
  const [showTaskDropdown, setShowTaskDropdown] = useState(false)

  // Custom drag handling - only drag when holding and moving
  const handleMouseDown = (e) => {
    if (e.button === 0 && !e.target.closest('[data-tauri-drag-region="false"]')) { // Left click and not on interactive elements
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = Math.abs(e.clientX - dragStart.x)
      const deltaY = Math.abs(e.clientY - dragStart.y)
      
      // Only start dragging if moved more than 5px (to avoid accidental drags)
      if (deltaX > 5 || deltaY > 5) {
        import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
          getCurrentWindow().startDragging()
        }).catch(console.error)
        setIsDragging(false) // Stop tracking after starting drag
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Window control functions
  const handleMinimize = async () => {
    console.log('Minimize clicked')
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      await window.minimize()
    } catch (error) {
      console.error('Failed to minimize:', error)
    }
  }

  const handleMaximize = async () => {
    console.log('Maximize clicked')
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      await window.toggleMaximize()
    } catch (error) {
      console.error('Failed to maximize:', error)
    }
  }

  const handleClose = async () => {
    console.log('Close clicked')
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      await window.close()
    } catch (error) {
      console.error('Failed to close:', error)
    }
  }

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div 
        ref={headerRef}
        className="flex items-center justify-between h-14 px-3 select-none"
        onMouseDown={handleMouseDown}
      >
        {/* Left - New Button */}
        <div className="flex items-center gap-3" data-tauri-drag-region="false">
          <div 
            className="relative"
            onMouseEnter={() => setIsNewDropdownOpen(true)}
            onMouseLeave={() => setIsNewDropdownOpen(false)}
          >
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full border border-gray-900 hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold">New</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isNewDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Invisible bridge to prevent dropdown closing when moving mouse */}
            {isNewDropdownOpen && (
              <div className="absolute left-0 top-full h-2 w-full" />
            )}

            {isNewDropdownOpen && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-200 z-[99999] py-2 overflow-hidden">
                {activeItem === 'projects' && (
                  <button
                    onClick={() => { onNewAction('project'); setIsNewDropdownOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 flex items-center gap-3 group"
                  >
                    <Folder className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
                    <span className="font-medium">New Project</span>
                  </button>
                )}
                <button
                  onClick={() => { onNewAction('task'); setIsNewDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 flex items-center gap-3 group"
                >
                  <CheckSquare className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
                  <span className="font-medium">New Task</span>
                </button>
                <button
                  onClick={() => { onNewAction('note'); setIsNewDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 flex items-center gap-3 group"
                >
                  <FileText className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
                  <span className="font-medium">New Note</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 flex items-center justify-center max-w-md mx-8" data-tauri-drag-region="false">
          <div className="relative w-full">
            <div className={`
              flex items-center gap-3 rounded-full
              bg-gray-50 border border-gray-200 px-3 py-1.5
              hover:bg-white hover:border-gray-300 transition-all duration-200
              focus-within:bg-white focus-within:border-gray-900 focus-within:shadow-2xl
            `}>
              <Search className="w-4.5 h-4.5 flex-shrink-0 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or type a command"
                className="
                  flex-1 bg-transparent text-sm text-gray-900
                  placeholder-gray-500 focus:outline-none
                "
                data-tauri-drag-region="false"
              />
              <span className="text-xs text-gray-400 font-medium">F</span>
            </div>
          </div>
        </div>

        {/* Right - Actions & Controls */}
        <div className="flex items-center gap-3" data-tauri-drag-region="false">
          {/* Task Timer */}
          <div className="relative" id="timer-dropdown">
            <div
              onClick={() => {
                if (trackedTask) {
                  setIsTimerOpen(!isTimerOpen)
                } else {
                  setIsTimerOpen(!isTimerOpen)
                }
              }}
              className={`${trackedTask ? 'h-auto py-1.5 px-3' : 'h-9 w-9 justify-center'} rounded-2xl flex items-center transition-colors cursor-pointer ${
                isTimerRunning && trackedTask
                  ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  : trackedTask
                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={isTimerRunning ? 'Task Timer' : 'Start Timer'}
            >
              {trackedTask ? (
                <>
                  <span className="text-sm font-medium text-gray-900 px-2 border-r border-gray-300 max-w-[150px] truncate">{trackedTask.title}</span>
                  <span className="text-sm font-medium tabular-nums text-gray-600 px-2 border-r border-gray-300">{formatTime(elapsedTime)}</span>
                  {isTimerRunning ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        pauseTimer()
                      }}
                      className="p-1 rounded-full hover:bg-gray-300 transition-colors ml-1"
                      title="Pause Timer"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startTimer()
                      }}
                      className="p-1 rounded-full hover:bg-gray-300 transition-colors ml-1"
                      title="Resume Timer"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      resetTimer()
                    }}
                    className="p-1 rounded-full hover:bg-gray-300 transition-colors ml-1"
                    title="Stop Timer"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Play className="w-5 h-5" />
              )}
            </div>

            {isTimerOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg border border-gray-200 z-[100] shadow-lg">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Task Timer</h3>
                    <button
                      onClick={() => setIsTimerOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Task Selector */}
                  <div className="mb-3 relative">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Tracking Task</label>
                    <button
                      type="button"
                      onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                      className="w-full flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors overflow-hidden"
                    >
                      <span className="text-sm text-gray-700 truncate whitespace-nowrap">{trackedTask ? trackedTask.title : 'Select a task...'}</span>
                    </button>
                    {showTaskDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-2xl border border-gray-200 z-[100] overflow-hidden shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setTrackedTask(null)
                            setShowTaskDropdown(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 truncate whitespace-nowrap ${
                            !trackedTask ? 'bg-gray-200 text-gray-900' : ''
                          }`}
                        >
                          No task selected
                        </button>
                        {todayTasks.map(task => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => {
                              setTrackedTask(task)
                              setShowTaskDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 truncate whitespace-nowrap ${
                              trackedTask?.id === task.id ? 'bg-gray-200 text-gray-900' : ''
                            }`}
                          >
                            {task.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timer Display */}
                  <div className="text-center mb-3 py-2 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 tabular-nums">
                      {formatTime(elapsedTime)}
                    </div>
                    {trackedTask && (
                      <div className="text-xs text-gray-500 mt-1">
                        {trackedTask.title}
                      </div>
                    )}
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center gap-2">
                    {isTimerRunning ? (
                      <button
                        onClick={() => pauseTimer()}
                        className="flex-1 px-3 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-2xl text-sm font-medium transition-colors"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => startTimer()}
                        className="flex-1 px-3 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-2xl text-sm font-medium transition-colors"
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => {
                        resetTimer()
                        setIsTimerOpen(false)
                      }}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl text-sm font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button className="w-9 h-9 rounded-2xl flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsClick}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Window Controls */}
          <div className="flex items-center ml-2">
            <button
              onClick={handleMinimize}
              className="w-9 h-9 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleMaximize}
              className="w-9 h-9 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnifiedHeader
