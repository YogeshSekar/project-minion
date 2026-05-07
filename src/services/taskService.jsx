import {
  getAllTasks,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi
} from './api'

async function withRetry(operation, maxRetries = 2, delay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      return result
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, data: null, error: error.toString() }
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

export async function getTasks(retryCount = 0) {
  try {
    const response = await getAllTasks()
    return response
  } catch (error) {
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return getTasks(retryCount + 1)
    }
    return { success: false, data: null, error: error.toString() }
  }
}

export async function createTask(payload) {
  try {
    const response = await createTaskApi(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function updateTask(payload) {
  try {
    console.log('[DEBUG] taskService updateTask called with payload:', payload)
    // TODO: Occurrence routing removed during frontend simplification
    // Now using single-task CRUD architecture
    console.log('[DEBUG] taskService updating task')
    const response = await updateTaskApi(payload)
    console.log('[DEBUG] taskService response:', response)
    return response
  } catch (error) {
    console.log('[DEBUG] taskService updateTask error:', error)
    return { success: false, data: null, error: error.toString() }
  }
}

export async function deleteTask(id) {
  try {
    console.log('[DEBUG] taskService deleteTask called with id:', id)
    // TODO: Occurrence logic removed during frontend simplification
    // Now using single-task CRUD architecture
    const response = await deleteTaskApi(id)
    console.log('[DEBUG] taskService deleteTask response:', response)
    return response
  } catch (error) {
    console.log('[DEBUG] taskService deleteTask error:', error)
    return { success: false, data: null, error: error.toString() }
  }
}

// TODO: completeTaskOccurrence function removed during final cleanup
// No longer using occurrence-based architecture

export async function getTasksByProject(projectId) {
  try {
    // TODO: TaskView logic removed during final cleanup
    // Now using Task struct directly
    const response = await getAllTasks()
    if (response.success && response.data) {
      const projectTasks = response.data.filter(task => task.project_id === projectId)
      return { success: true, data: projectTasks, error: null }
    }
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function getTasksDueToday() {
  try {
    const response = await getAllTasks()
    if (response.success && response.data) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayTasks = response.data.filter(task => {
        if (!task.scheduled_date) return false
        const scheduledDate = new Date(task.scheduled_date)
        scheduledDate.setHours(0, 0, 0, 0)
        return scheduledDate.getTime() === today.getTime()
      })
      
      return { success: true, data: todayTasks, error: null }
    }
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}
