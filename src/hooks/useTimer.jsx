import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { startActivity, stopCurrentActivity } from '../services/activityService'
import { getRunningActivity } from '../services/api'
import { sendFocusMilestoneNotification } from '../services/notificationService'

function useTimer() {
  const [elapsedTime, setElapsedTime] = useState(0) // elapsed time in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [trackedTask, setTrackedTask] = useState(null)
  const [runningActivity, setRunningActivity] = useState(null)
  const activityStartTimeRef = useRef(null)
  const focusMilestoneNotifiedRef = useRef(null)
  
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

  useEffect(() => {
    if (!isTimerRunning || elapsedTime < 25 * 60 || runningActivity?.reference_type !== 'task') return
    const taskKey = String(runningActivity.reference_id ?? trackedTask?.id ?? '')
    if (!taskKey || focusMilestoneNotifiedRef.current === taskKey) return
    focusMilestoneNotifiedRef.current = taskKey
    sendFocusMilestoneNotification(trackedTask?.title || runningActivity.title).catch(error => {
      console.error('Could not send focus milestone notification:', error)
    })
  }, [elapsedTime, isTimerRunning, runningActivity, trackedTask])

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
        
        const startTime = new Date(activity.start_time)
        const elapsedSeconds = Math.max(0, Math.floor((new Date() - startTime) / 1000))
        setIsTimerRunning(true)
        setElapsedTime(elapsedSeconds)
        activityStartTimeRef.current = startTime

        // Resolve the task when possible; otherwise still represent the activity in the header.
        if (activity.reference_type === 'task' && activity.reference_id) {
          // Load task details
          const tasksResponse = await invoke('get_all_tasks')
          if (tasksResponse.success) {
            const task = tasksResponse.data.find(t => t.id === activity.reference_id)
            if (task) {
              setTrackedTask(task)
            } else {
              setTrackedTask({ id: null, title: activity.title, project_id: activity.project_id })
            }
          }
        } else {
          setTrackedTask({ id: null, title: activity.title, project_id: activity.project_id })
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
    const targetTask = task || trackedTask
    if (!targetTask) return { success: false, error: 'Select a task before starting the timer' }
    if (runningActivity && isTimerRunning && runningActivity.reference_type === 'task' && runningActivity.reference_id === targetTask.id) {
      return { success: true, data: runningActivity }
    }

    try {
      const isResumingTask = !runningActivity && trackedTask?.id === targetTask.id
      if (!isResumingTask) focusMilestoneNotifiedRef.current = null
      const response = await startActivity({
            title: targetTask.title,
            activity_type: 'focus_session',
            source: 'manual',
            reference_type: 'task',
            reference_id: targetTask.id,
            project_id: targetTask.project_id
          })
          if (response.success) {
            setRunningActivity(response.data)
            setTrackedTask(targetTask)
            setIsTimerRunning(true)
            if (!isResumingTask) setElapsedTime(0)
            activityStartTimeRef.current = new Date(response.data.start_time)
          }
      return response
    } catch (error) {
      console.error('Error starting activity:', error)
      return { success: false, error: error.toString() }
    }
  }

  const pauseTimer = async () => {
    if (!runningActivity) return { success: true }
    try {
      const response = await stopCurrentActivity(runningActivity)
      if (response.success) {
        setIsTimerRunning(false)
        setRunningActivity(null)
        activityStartTimeRef.current = null
      }
      return response
    } catch (error) {
      console.error('Error pausing activity:', error)
      return { success: false, error: error.toString() }
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
    focusMilestoneNotifiedRef.current = null
    activityStartTimeRef.current = null
  }

  const syncActivityStarted = (activity, task) => {
    if (String(trackedTask?.id ?? '') !== String(task?.id ?? activity.reference_id ?? '')) focusMilestoneNotifiedRef.current = null
    setRunningActivity(activity)
    setTrackedTask(task || { id: null, title: activity.title, project_id: activity.project_id })
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
    if (trackedTask?.id == null) setTrackedTask(null)
    focusMilestoneNotifiedRef.current = null
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
