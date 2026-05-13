import { useState, useEffect, useCallback } from 'react'
import {
  getTasks,
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService
} from '../services/taskService'

function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    const response = await getTasks()
    if (response.success) {
      setTasks(response.data || [])
    } else {
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
    const response = await updateTaskService(payload)
    if (response.success) {
      // Update local state immediately for better UX
      // Match tasks by id field from backend
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (payload.id) {
            return task.id === payload.id ? { ...task, ...payload } : task
          }
          return task
        })
      )
      // Then refresh from server to ensure consistency
      await loadTasks()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleDeleteTask = async (id) => {
    const response = await deleteTaskService(id)
    if (response.success) {
      await loadTasks()
    } else {
      setError(response.error)
    }
    return response
  }

  // TODO: handleCompleteTaskOccurrence function removed during final cleanup
// No longer using occurrence-based architecture

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
    // TODO: completeTaskOccurrence removed during final cleanup
    // No longer using occurrence-based architecture
  }
}

export default useTasks
