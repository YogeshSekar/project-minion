import { useState, useEffect } from 'react'
import {
  getMeetings,
  getMeetingsByDate,
  createMeeting as createMeetingService,
  updateMeeting as updateMeetingService,
  deleteMeeting as deleteMeetingService
} from '../services/meetingService'

function useMeetings() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadMeetings = async () => {
    setLoading(true)
    setError(null)
    const response = await getMeetings()
    if (response.success) {
      setMeetings(response.data || [])
    } else {
      setError(response.error)
    }
    setLoading(false)
  }

  const handleGetMeetingsByDate = async (date) => {
    const response = await getMeetingsByDate(date)
    if (response.success) {
      setMeetings(response.data || [])
    } else {
      setError(response.error)
    }
    return response
  }

  const handleCreateMeeting = async (payload) => {
    const response = await createMeetingService(payload)
    if (response.success) {
      await loadMeetings()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleUpdateMeeting = async (payload) => {
    const response = await updateMeetingService(payload)
    if (response.success) {
      await loadMeetings()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleDeleteMeeting = async (id) => {
    const response = await deleteMeetingService(id)
    if (response.success) {
      await loadMeetings()
    } else {
      setError(response.error)
    }
    return response
  }

  useEffect(() => {
    loadMeetings()
  }, [])

  return {
    meetings,
    loading,
    error,
    loadMeetings,
    getMeetingsByDate: handleGetMeetingsByDate,
    createMeeting: handleCreateMeeting,
    updateMeeting: handleUpdateMeeting,
    deleteMeeting: handleDeleteMeeting
  }
}

export default useMeetings
