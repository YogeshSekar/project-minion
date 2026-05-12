import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ChevronLeft, ChevronRight, CheckCircle, Video, Clock } from 'lucide-react'

function HorizontalTimeline({ selectedDate, tasks, onTaskClick }) {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartScroll, setDragStartScroll] = useState(0)
  const timelineRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const hasAutoScrolled = useRef(false)
  const hoverTimeoutRef = useRef(null)

  // Load meetings for the selected date
  useEffect(() => {
    loadMeetings()
    // Reset auto-scroll when date changes
    hasAutoScrolled.current = false
  }, [selectedDate])

  const loadMeetings = async () => {
    try {
      setLoading(true)
      const dateStr = selectedDate.toISOString().split('T')[0]
      const meetingsResponse = await invoke('get_outlook_meetings', { date: dateStr })
      setMeetings(meetingsResponse || [])
    } catch (error) {
      console.error('Error loading meetings:', error)
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate task duration
  const getTaskDuration = (task) => {
    if (task.status === 'completed' && task.time_spent) {
      return task.time_spent
    }
    if (task.status === 'in_progress' && task.start_time) {
      const startTime = new Date(task.start_time)
      const currentTime = new Date()
      const runningMinutes = Math.floor((currentTime - startTime) / 60000)
      return runningMinutes
    }
    if (task.priority === 'high') return 60
    if (task.priority === 'medium') return 45
    return 30
  }

  // Generate timeline data
  const generateTimelineData = () => {
    const timeline = []
    
    console.log('[DEBUG] HorizontalTimeline generateTimelineData called')
    console.log('[DEBUG] Total tasks received:', tasks.length)
    console.log('[DEBUG] Selected date:', selectedDate.toDateString())
    console.log('[DEBUG] Tasks with scheduled_date:', tasks.filter(t => t.scheduled_date).length)

    tasks.forEach(task => {
      // Show tasks if they have a scheduled_date matching the selected date
      // OR if they don't have a scheduled_date (show them for today)
      let shouldShow = false
      
      if (task.scheduled_date) {
        const taskDate = new Date(task.scheduled_date)
        const selectedDateOnly = new Date(selectedDate)
        selectedDateOnly.setHours(0, 0, 0, 0)
        taskDate.setHours(0, 0, 0, 0)
        shouldShow = taskDate.getTime() === selectedDateOnly.getTime()
      } else {
        // Tasks without scheduled_date show up for today
        const today = new Date()
        const selectedDateOnly = new Date(selectedDate)
        selectedDateOnly.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        shouldShow = today.getTime() === selectedDateOnly.getTime()
      }

      if (shouldShow) {
        let estimatedTime = '9:00 AM'
        if (task.priority === 'high') estimatedTime = '10:00 AM'
        else if (task.priority === 'medium') estimatedTime = '2:00 PM'
        else estimatedTime = '3:00 PM'

        timeline.push({
          id: `task-${task.id}`,
          type: 'task',
          time: estimatedTime,
          title: task.title.length > 50 ? task.title.substring(0, 50) + '...' : task.title,
          priority: task.priority,
          status: task.status,
          duration: getTaskDuration(task)
        })
      }
    })
    
    meetings.forEach(meeting => {
      const meetingTitle = meeting.subject || meeting.title || 'No Title'
      const limitedTitle = meetingTitle.length > 50 ? meetingTitle.substring(0, 50) + '...' : meetingTitle
      
      let duration = 30
      if (meeting.end && meeting.start) {
        try {
          const startTime = new Date(meeting.start)
          const endTime = new Date(meeting.end)
          duration = Math.round((endTime - startTime) / 60000)
        } catch (error) {
          duration = 30
        }
      }
      
      let meetingTime = '9:00 AM'
      if (meeting.start) {
        try {
          meetingTime = new Date(meeting.start).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        } catch (error) {
          meetingTime = '9:00 AM'
        }
      }
      
      timeline.push({
        id: meeting.entry_id || meeting.id || 'meeting-' + Math.random(),
        type: 'meeting',
        time: meetingTime,
        title: limitedTitle,
        duration: duration
      })
    })
    
    console.log('[DEBUG] Final timeline data:', timeline)
    console.log('[DEBUG] Timeline tasks count:', timeline.filter(item => item.type === 'task').length)
    
    return timeline.sort((a, b) => {
      const timeA = new Date(`2024-01-01 ${a.time}`)
      const timeB = new Date(`2024-01-01 ${b.time}`)
      return timeA - timeB
    })
  }

  // Convert time string to minutes from 6 AM (start of timeline)
  const getTimeInMinutes = (timeStr) => {
    const timeParts = timeStr.split(':')
    const hour = parseInt(timeParts[0])
    const minutes = parseInt(timeParts[1]) || 0
    const period = timeStr.includes('AM') ? 'AM' : 'PM'
    
    let hour24 = hour
    if (period === 'PM' && hour !== 12) hour24 = hour + 12
    if (period === 'AM' && hour === 12) hour24 = 0
    
    // Minutes from midnight (start of timeline at 00:00)
    return (hour24 - 0) * 60 + minutes
  }

  const timelineData = generateTimelineData()
  const startHour = 0
  const endHour = 24
  const totalHours = endHour - startHour
  const visibleHours = 8 // show 8 hours at a time
  const [hourWidth, setHourWidth] = useState(80) // pixels per hour, will be calculated dynamically
  const totalWidth = totalHours * hourWidth

  // Calculate hourWidth based on container width
  useEffect(() => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth
      setHourWidth(containerWidth / visibleHours)
    }
  }, [visibleHours])

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        const containerWidth = scrollContainerRef.current.clientWidth
        setHourWidth(containerWidth / visibleHours)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [visibleHours])

  // Get current time position
  const getCurrentTimePosition = () => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const minutes = getTimeInMinutes(timeStr)
    return (minutes / 60) * hourWidth
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Auto-scroll to current time - align with 8-hour window start
  useEffect(() => {
    if (!hasAutoScrolled.current && isToday && scrollContainerRef.current && hourWidth > 80) {
      const currentTimePosition = getCurrentTimePosition()
      const containerWidth = scrollContainerRef.current.clientWidth
      // Calculate which 8-hour window contains the current time
      const visibleWindowStart = Math.floor(currentTimePosition / containerWidth) * containerWidth
      scrollContainerRef.current.scrollLeft = visibleWindowStart
      setScrollPosition(visibleWindowStart)
      hasAutoScrolled.current = true
    }
  }, [hourWidth, isToday])

  // Drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartScroll(scrollContainerRef.current.scrollLeft)
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragStartX
    const newScroll = dragStartScroll - deltaX
    scrollContainerRef.current.scrollLeft = newScroll
    setScrollPosition(newScroll)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // Scroll handlers for arrow buttons - scroll by 8 hours (one window)
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth
      const newScroll = Math.max(0, scrollContainerRef.current.scrollLeft - containerWidth)
      scrollContainerRef.current.scrollLeft = newScroll
      setScrollPosition(newScroll)
    }
  }

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth
      const newScroll = Math.min(totalWidth - containerWidth, scrollContainerRef.current.scrollLeft + containerWidth)
      scrollContainerRef.current.scrollLeft = newScroll
      setScrollPosition(newScroll)
    }
  }

  // Scroll to current time
  const handleScrollToNow = () => {
    if (scrollContainerRef.current && isToday) {
      const currentTimePosition = getCurrentTimePosition()
      const containerWidth = scrollContainerRef.current.clientWidth
      // Calculate which 8-hour window contains the current time
      const visibleWindowStart = Math.floor(currentTimePosition / containerWidth) * containerWidth
      scrollContainerRef.current.scrollLeft = visibleWindowStart
      setScrollPosition(visibleWindowStart)
    }
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        {/* Left: Navigation Arrows + Now Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handleScrollLeft}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Previous 8 hours"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900 stroke-[2.5]" />
            </button>
            <button
              onClick={handleScrollRight}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Next 8 hours"
            >
              <ChevronRight className="w-5 h-5 text-gray-900 stroke-[2.5]" />
            </button>
          </div>
          {isToday && (
            <button
              onClick={handleScrollToNow}
              className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
            >
              Now
            </button>
          )}
        </div>
        {/* Right: Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {tasks.filter(t => t.status === 'completed').length} completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {meetings.length} meetings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {timelineData.reduce((total, item) => total + (item.duration || 30), 0)}m total
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div
        className="overflow-x-auto cursor-grab active:cursor-grabbing no-scrollbar rounded-2xl"
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Time labels row */}
        <div className="flex border-b border-gray-200" style={{ width: `${totalWidth}px` }}>
          {Array.from({ length: totalHours }, (_, i) => {
            const hour = startHour + i
            const timeLabel = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`
            return (
              <div
                key={hour}
                className="text-xs text-gray-500 px-1 py-1 border-l border-gray-200"
                style={{ width: `${hourWidth}px`, flexShrink: 0 }}
              >
                {timeLabel}
              </div>
            )
          })}
        </div>
        <div className="relative" style={{ width: `${totalWidth}px`, height: '80px' }} ref={timelineRef}>
          {/* Grid separators */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: totalHours }, (_, i) => (
              <div
                key={i}
                className="border-l border-gray-200 h-full"
                style={{ width: `${hourWidth}px`, flexShrink: 0 }}
              />
            ))}
          </div>

          {/* Current time indicator */}
          {isToday && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 shadow-lg"
              style={{ left: `${getCurrentTimePosition()}px` }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-md animate-pulse" />
            </div>
          )}

          {/* Timeline items with overlapping */}
          {(() => {
            // Group items by their start time to detect overlaps
            const timeGroups = {}
            timelineData.forEach((item) => {
              const timeKey = item.time
              if (!timeGroups[timeKey]) timeGroups[timeKey] = []
              timeGroups[timeKey].push(item)
            })

            // Create overlap info for each item
            const itemOverlapInfo = {}
            Object.keys(timeGroups).forEach((timeKey) => {
              const items = timeGroups[timeKey]
              items.forEach((item, index) => {
                itemOverlapInfo[item.id] = {
                  overlapIndex: index,
                  totalAtSameTime: items.length
                }
              })
            })

            return timelineData.map((item) => {
              const left = (getTimeInMinutes(item.time) / 60) * hourWidth
              const width = (item.duration / 60) * hourWidth
              const overlapInfo = itemOverlapInfo[item.id]
              const verticalOffset = overlapInfo.overlapIndex * 14 // 14px offset for each overlapping item

              return (
                <div
                  key={item.id}
                  className={`
                    absolute h-10 rounded-lg hover:shadow-xl transition-all cursor-pointer border-2 flex items-center px-2 text-xs font-medium shadow-md
                    ${item.type === 'meeting'
                      ? 'bg-gray-100 hover:bg-gray-200 border-gray-800 text-gray-900'
                      : item.status === 'completed'
                      ? item.priority === 'high'
                        ? 'bg-red-50 hover:bg-red-100 opacity-60 border-red-400 text-red-900'
                        : item.priority === 'medium'
                        ? 'bg-yellow-50 hover:bg-yellow-100 opacity-60 border-yellow-400 text-yellow-900'
                        : 'bg-green-50 hover:bg-green-100 opacity-60 border-green-400 text-green-900'
                      : item.priority === 'high'
                      ? 'bg-red-50 hover:bg-red-100 border-red-500 text-red-900'
                      : item.priority === 'medium'
                      ? 'bg-yellow-50 hover:bg-yellow-100 border-yellow-500 text-yellow-900'
                      : 'bg-green-50 hover:bg-green-100 border-green-500 text-green-900'
                    }
                  `}
                  style={{
                    left: `${left}px`,
                    width: `${Math.max(width, 40)}px`,
                    top: `${10 + verticalOffset}px`,
                    zIndex: 10 + overlapInfo.overlapIndex
                  }}
                  onClick={() => {
                    if (item.type === 'task' && onTaskClick) {
                      const taskId = item.id.replace('task-', '')
                      const task = tasks.find(t => String(t.id) === taskId)
                      if (task) onTaskClick(task)
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current)
                    }
                    setHoveredItem(item)
                    const rect = e.currentTarget.getBoundingClientRect()
                    setHoverPosition({ x: rect.left + rect.width / 2, y: rect.top })
                  }}
                  onMouseLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => {
                      setHoveredItem(null)
                    }, 100)
                  }}
                >
                </div>
              )
            })
          })()}
        </div>
      </div>

      {/* Fixed hover card - rendered outside container */}
      {hoveredItem && (
        <div
          className="fixed p-4 bg-white rounded-2xl shadow-xl border border-gray-200 w-96 z-[99999]"
          style={{
            left: `${hoverPosition.x - 192}px`,
            top: `${hoverPosition.y - 200}px`
          }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current)
            }
          }}
          onMouseLeave={() => {
            hoverTimeoutRef.current = setTimeout(() => {
              setHoveredItem(null)
            }, 100)
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            {hoveredItem.type === 'meeting' && (
              <Video className="w-4 h-4 text-gray-600" />
            )}
            {hoveredItem.type === 'task' && (
              <div className={`w-2 h-2 rounded-full ${hoveredItem.priority === 'high' ? 'bg-red-500' : hoveredItem.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
            )}
            <h3 className="font-semibold text-gray-900 text-sm">{hoveredItem.title}</h3>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-600">{hoveredItem.time} • {hoveredItem.duration}m</span>
          </div>
          {hoveredItem.type === 'task' && (
            <div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                hoveredItem.priority === 'high' 
                  ? 'bg-red-50 text-red-600 border-red-200' 
                  : hoveredItem.priority === 'medium' 
                  ? 'bg-yellow-50 text-yellow-600 border-yellow-200' 
                  : 'bg-green-50 text-green-600 border-green-200'
              }`}>
                {hoveredItem.priority.charAt(0).toUpperCase() + hoveredItem.priority.slice(1)} Priority
              </span>
            </div>
          )}
          {hoveredItem.type === 'meeting' && (
            <div>
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                Meeting
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HorizontalTimeline
