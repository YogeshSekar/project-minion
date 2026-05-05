import {
  getAllMeetings,
  createMeeting as createMeetingApi,
  updateMeeting as updateMeetingApi,
  deleteMeeting as deleteMeetingApi,
  getOutlookMeetings
} from './api'

export async function getMeetings(retryCount = 0) {
  try {
    const response = await getAllMeetings()
    return response
  } catch (error) {
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return getMeetings(retryCount + 1)
    }
    return { success: false, data: null, error: error.toString() }
  }
}

export async function getMeetingsByDate(date) {
  try {
    const response = await getOutlookMeetings(date)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function createMeeting(payload) {
  try {
    const response = await createMeetingApi(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function updateMeeting(payload) {
  try {
    const response = await updateMeetingApi(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function deleteMeeting(id) {
  try {
    const response = await deleteMeetingApi(id)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}
