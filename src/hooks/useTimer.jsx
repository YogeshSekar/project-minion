import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { startActivity, stopCurrentActivity } from '../services/activityService'
import { getRunningActivity } from '../services/api'

function useTimer() {
  const [elapsedTime, setElapsedTime] = useState(0) // elapsed time in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [trackedTask, setTrackedTask] = useState(null)
  const [runningActivity, setRunningActivity] = useState(null)
  const activityStartTimeRef = useRef(null)
  
  // UI states
  const [isTimerOpen, setIsTimerOpen] = useState(false)
  const [showTaskSelector, setShowTaskSelector] = useState(false)

  // Task tracking timer effect - increments elapsed time every second
  useEffect(() => {
    let interval = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(time => time + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Load running activity on mount and sync with timer
  useEffect(() => {
    loadRunningActivity()
  }, [])

  const loadRunningActivity = async () => {
    try {
      const response = await getRunningActivity()
      if (response.success && response.data) {
        const activity = response.data
        setRunningActivity(activity)
        
        // If there's a running activity linked to a task, sync the timer
        if (activity.reference_type === 'task' && activity.reference_id) {
          // Load task details
          const tasksResponse = await invoke('get_all_task_views')
          if (tasksResponse.success) {
            const task = tasksResponse.data.find(t => t.task_id === activity.reference_id)
            if (task) {
              setTrackedTask(task)
              setIsTimerRunning(true)
              // Calculate elapsed time from activity start_time
              const startTime = new Date(activity.start_time)
              const now = new Date()
              const elapsedSeconds = Math.floor((now - startTime) / 1000)
              setElapsedTime(elapsedSeconds)
              activityStartTimeRef.current = startTime
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading running activity:', error)
    }
  }

  // Format elapsed time for display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = async (task = null) => {
    setIsTimerRunning(true)
    
    // If a task is provided, track it
    if (task) {
      setTrackedTask(task)
      
      // Start activity tracking if no running activity
      if (!runningActivity) {
        try {
          const response = await startActivity({
            title: task.title,
            activity_type: 'focus_session',
            source: 'manual',
            reference_type: 'task',
            reference_id: task.task_id,
            project_id: task.project_id
          })
          if (response.success) {
            setRunningActivity(response.data)
            activityStartTimeRef.current = new Date()
          }
        } catch (error) {
          console.error('Error starting activity:', error)
        }
      }
    }
  }

  const pauseTimer = async () => {
    setIsTimerRunning(false)
    
    // Stop the running activity
    if (runningActivity) {
      try {
        const response = await stopCurrentActivity()
        if (response.success) {
          setRunningActivity(null)
          activityStartTimeRef.current = null
        }
      } catch (error) {
        console.error('Error stopping activity:', error)
      }
    }
  }

  const resetTimer = async () => {
    setIsTimerRunning(false)
    
    // Stop the running activity if any
    if (runningActivity) {
      try {
        await stopCurrentActivity()
      } catch (error) {
        console.error('Error stopping activity on reset:', error)
      }
    }
    
    setElapsedTime(0)
    setTrackedTask(null)
    setRunningActivity(null)
    activityStartTimeRef.current = null
  }

  const syncActivityStarted = (activity, task) => {
    setRunningActivity(activity)
    setTrackedTask(task)
    setIsTimerRunning(true)
    
    // Calculate elapsed time from activity start_time
    const startTime = new Date(activity.start_time)
    const now = new Date()
    const elapsedSeconds = Math.floor((now - startTime) / 1000)
    setElapsedTime(elapsedSeconds)
    activityStartTimeRef.current = startTime
  }

  const syncActivityStopped = () => {
    setRunningActivity(null)
    setIsTimerRunning(false)
    setElapsedTime(0)
    activityStartTimeRef.current = null
  }

  return {
    elapsedTime,
    isTimerRunning,
    trackedTask,
    setTrackedTask,
    runningActivity,
    isTimerOpen,
    setIsTimerOpen,
    showTaskSelector,
    setShowTaskSelector,
    startTimer,
    pauseTimer,
    resetTimer,
    formatTime,
    syncActivityStarted,
    syncActivityStopped
  }
}

export default useTimer
