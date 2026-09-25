import {
  createActivity,
  updateActivity,
  deleteActivity,
  getRunningActivity,
  getActivityAnalytics
} from './api'

function generateSessionGroupId() {
  return `session_${Date.now()}`
}

function calculateDurationSeconds(startTime, endTime) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error('Activity end time must be after its start time')
  }
  return Math.max(0, Math.round((end - start) / 1000))
}

const durationMinutes = seconds => Math.round(seconds / 60)

function normalizeReference(payload) {
  if (payload.reference_type) return { reference_type: payload.reference_type, reference_id: payload.reference_id || null }
  if (payload.project_id) return { reference_type: 'project', reference_id: payload.project_id }
  return { reference_type: 'general', reference_id: null }
}

export async function startActivity(payload) {
  try {
    const reference = normalizeReference(payload)
    const runningResponse = await getRunningActivity()
    
    if (runningResponse.success && runningResponse.data) {
      await stopCurrentActivity(runningResponse.data)
    }
    
    const activityRequest = {
      title: payload.title,
      description: payload.description || null,
      activity_type: payload.activity_type,
      ...reference,
      session_group_id: generateSessionGroupId(),
      start_time: new Date().toISOString(),
      end_time: null,
      duration_minutes: null,
      duration_seconds: null,
      status: 'running',
      source: payload.source || 'manual',
      is_auto_tracked: payload.is_auto_tracked || 0,
      is_locked: 0,
      project_id: payload.project_id || null
    }
    
    const response = await createActivity(activityRequest)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function stopCurrentActivity(existingRunningActivity = null) {
  try {
    let activity = existingRunningActivity
    
    if (!activity) {
      const runningResponse = await getRunningActivity()
      
      if (!runningResponse.success || !runningResponse.data) {
        return { success: true, data: null, error: null }
      }
      
      activity = runningResponse.data
    }
    
    const endTime = new Date().toISOString()
    const seconds = calculateDurationSeconds(activity.start_time, endTime)
    
    const updateRequest = {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      activity_type: activity.activity_type,
      reference_type: activity.reference_type,
      reference_id: activity.reference_id,
      session_group_id: activity.session_group_id,
      start_time: activity.start_time,
      end_time: endTime,
      duration_minutes: durationMinutes(seconds),
      duration_seconds: seconds,
      status: 'completed',
      source: activity.source,
      is_auto_tracked: activity.is_auto_tracked,
      is_locked: 1,
      project_id: activity.project_id
    }
    
    const response = await updateActivity(updateRequest)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function switchActivity(payload) {
  try {
    await stopCurrentActivity()
    const response = await startActivity(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function createManualCompletedActivity(payload) {
  try {
    const seconds = calculateDurationSeconds(payload.start_time, payload.end_time)
    const reference = normalizeReference(payload)
    
    const activityRequest = {
      title: payload.title,
      description: payload.description || null,
      activity_type: payload.activity_type,
      ...reference,
      session_group_id: generateSessionGroupId(),
      start_time: payload.start_time,
      end_time: payload.end_time,
      duration_minutes: durationMinutes(seconds),
      duration_seconds: seconds,
      status: 'completed',
      source: payload.source || 'manual',
      is_auto_tracked: payload.is_auto_tracked || 0,
      is_locked: 1,
      project_id: payload.project_id || null
    }
    
    const response = await createActivity(activityRequest)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function updateExistingActivity(payload) {
  try {
    const activityRequest = {
      id: payload.id,
      title: payload.title,
      description: payload.description || null,
      activity_type: payload.activity_type,
      reference_type: payload.reference_type || null,
      reference_id: payload.reference_id || null,
      session_group_id: payload.session_group_id,
      start_time: payload.start_time,
      end_time: payload.end_time,
      duration_minutes: payload.duration_minutes,
      duration_seconds: payload.duration_seconds,
      status: payload.status,
      source: payload.source,
      is_auto_tracked: payload.is_auto_tracked,
      is_locked: payload.is_locked,
      project_id: payload.project_id || null
    }

    const response = await updateActivity(activityRequest)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function deleteExistingActivity(id) {
  try {
    const response = await deleteActivity(id)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function fetchActivityAnalytics(startTime, endTime) {
  try {
    return await getActivityAnalytics(startTime, endTime)
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}
