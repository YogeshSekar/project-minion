import { useState, useEffect } from 'react'
import { getActivities, getRunningActivity } from '../services/api'
import {
  startActivity,
  stopCurrentActivity,
  switchActivity,
  createManualCompletedActivity,
  updateExistingActivity,
  deleteExistingActivity
} from '../services/activityService'

function useActivityTracker() {
  const [activities, setActivities] = useState([])
  const [runningActivity, setRunningActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadActivities = async () => {
    const response = await getActivities()
    if (response.success) {
      setActivities(response.data || [])
    } else {
      setError(response.error)
    }
  }

  const loadRunningActivity = async () => {
    const response = await getRunningActivity()
    if (response.success) {
      setRunningActivity(response.data || null)
    } else {
      setError(response.error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    await loadActivities()
    await loadRunningActivity()
    setLoading(false)
  }

  const handleStartActivity = async (payload) => {
    const response = await startActivity(payload)
    if (response.success) {
      await loadData()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleStopActivity = async () => {
    const response = await stopCurrentActivity()
    if (response.success) {
      await loadData()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleSwitchActivity = async (payload) => {
    const response = await switchActivity(payload)
    if (response.success) {
      await loadData()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleCreateManualActivity = async (payload) => {
    const response = await createManualCompletedActivity(payload)
    if (response.success) {
      await loadData()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleUpdateActivity = async (payload) => {
    const response = await updateExistingActivity(payload)
    if (response.success) {
      await loadData()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleDeleteActivity = async (id) => {
    const response = await deleteExistingActivity(id)
    if (response.success) {
      await loadData()
    } else {
      setError(response.error)
    }
    return response
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    activities,
    runningActivity,
    loading,
    error,
    loadData,
    handleStartActivity,
    handleStopActivity,
    handleSwitchActivity,
    handleCreateManualActivity,
    handleUpdateActivity,
    handleDeleteActivity
  }
}

export default useActivityTracker
