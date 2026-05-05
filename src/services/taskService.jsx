import {
  getAllTaskViews,
  getTaskViewsByProject,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  updateTaskOccurrence as updateTaskOccurrenceApi,
  deleteTaskOccurrence as deleteTaskOccurrenceApi,
  completeTaskOccurrence as completeTaskOccurrenceApi
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
    const response = await getAllTaskViews()
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
    // If payload has occurrence_id, update the occurrence (status, actual_minutes)
    // Otherwise update the parent task definition
    if (payload.occurrence_id) {
      console.log('[DEBUG] taskService updating occurrence')
      const occurrenceRequest = {
        id: payload.occurrence_id,
        task_id: payload.task_id,
        occurrence_date: payload.occurrence_date || '',
        due_date: payload.due_date || null,
        status: payload.status,
        actual_minutes: payload.actual_minutes || 0,
        started_at: payload.started_at || null,
        completed_at: payload.completed_at || null,
        reminder_generated: payload.reminder_generated || 0
      }
      console.log('[DEBUG] taskService occurrence request:', occurrenceRequest)
      const response = await updateTaskOccurrenceApi(occurrenceRequest)
      console.log('[DEBUG] taskService occurrence response:', response)
      return response
    } else {
      console.log('[DEBUG] taskService updating parent task')
      const response = await updateTaskApi(payload)
      console.log('[DEBUG] taskService parent task response:', response)
      return response
    }
  } catch (error) {
    console.log('[DEBUG] taskService updateTask error:', error)
    return { success: false, data: null, error: error.toString() }
  }
}

export async function deleteTask(id) {
  try {
    console.log('[DEBUG] taskService deleteTask called with id:', id)
    // If id is an occurrence_id, delete the occurrence
    // Otherwise delete the parent task (and all occurrences)
    // For now, we'll assume it's an occurrence_id since that's what the frontend passes
    const response = await deleteTaskOccurrenceApi(id)
    console.log('[DEBUG] taskService deleteTask response:', response)
    return response
  } catch (error) {
    console.log('[DEBUG] taskService deleteTask error:', error)
    return { success: false, data: null, error: error.toString() }
  }
}

export async function completeTaskOccurrence(occurrenceId, actualMinutes = 0) {
  try {
    const response = await completeTaskOccurrenceApi(occurrenceId, actualMinutes)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function getTasksByProject(projectId) {
  try {
    const response = await getTaskViewsByProject(projectId)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function getTasksDueToday() {
  try {
    const response = await getAllTaskViews()
    if (response.success && response.data) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayTasks = response.data.filter(task => {
        if (!task.occurrence_date) return false
        const occurrenceDate = new Date(task.occurrence_date)
        occurrenceDate.setHours(0, 0, 0, 0)
        return occurrenceDate.getTime() === today.getTime()
      })
      
      return { success: true, data: todayTasks, error: null }
    }
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}
