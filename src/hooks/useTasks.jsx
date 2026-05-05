import { useState, useEffect, useCallback } from 'react'
import {
  getTasks,
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
  completeTaskOccurrence as completeTaskOccurrenceService
} from '../services/taskService'

function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    const response = await getTasks()
    console.log('[DEBUG] useTasks loadTasks: Response received', response)
    if (response.success) {
      console.log('[DEBUG] useTasks loadTasks: Setting tasks state with', response.data?.length || 0, 'tasks')
      response.data?.forEach((task, i) => {
        console.log(`[DEBUG] useTasks loadTasks: Task[${i}] occurrence_id=${task.occurrence_id}, task_id=${task.task_id}, title="${task.title}", status="${task.status}", occurrence_date="${task.occurrence_date}"`)
      })
      setTasks(response.data || [])
    } else {
      console.log('[DEBUG] useTasks loadTasks: Error', response.error)
      setError(response.error)
    }
    setLoading(false)
  }, [])

  const handleCreateTask = async (payload) => {
    const response = await createTaskService(payload)
    if (response.success) {
      await loadTasks()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleUpdateTask = async (payload) => {
    console.log('[DEBUG] useTasks handleUpdateTask called with payload:', payload)
    const response = await updateTaskService(payload)
    console.log('[DEBUG] useTasks handleUpdateTask response:', response)
    if (response.success) {
      console.log('[DEBUG] useTasks handleUpdateTask: updating local state')
      // Update local state immediately for better UX
      // For occurrence updates, match by occurrence_id
      // For parent task updates, match by task_id
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (payload.occurrence_id) {
            return task.occurrence_id === payload.occurrence_id ? { ...task, ...payload } : task
          } else if (payload.id) {
            return task.task_id === payload.id ? { ...task, ...payload } : task
          }
          return task
        })
      )
      // Then refresh from server to ensure consistency
      console.log('[DEBUG] useTasks handleUpdateTask: calling loadTasks')
      await loadTasks()
    } else {
      console.log('[DEBUG] useTasks handleUpdateTask: error', response.error)
      setError(response.error)
    }
    return response
  }

  const handleDeleteTask = async (id) => {
    console.log('[DEBUG] useTasks handleDeleteTask called with id:', id)
    const response = await deleteTaskService(id)
    console.log('[DEBUG] useTasks handleDeleteTask response:', response)
    if (response.success) {
      console.log('[DEBUG] useTasks handleDeleteTask: calling loadTasks')
      await loadTasks()
    } else {
      console.log('[DEBUG] useTasks handleDeleteTask: error', response.error)
      setError(response.error)
    }
    return response
  }

  const handleCompleteTaskOccurrence = async (occurrenceId, actualMinutes = 0) => {
    const response = await completeTaskOccurrenceService(occurrenceId, actualMinutes)
    if (response.success) {
      await loadTasks()
    } else {
      setError(response.error)
    }
    return response
  }

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    completeTaskOccurrence: handleCompleteTaskOccurrence
  }
}

export default useTasks
