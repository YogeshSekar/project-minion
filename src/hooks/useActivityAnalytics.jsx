import { useCallback, useEffect, useState } from 'react'
import { fetchActivityAnalytics } from '../services/activityService'

export function useActivityAnalytics(startTime, endTime) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!startTime || !endTime) return
    setLoading(true)
    setError(null)
    const response = await fetchActivityAnalytics(startTime, endTime)
    if (response.success) {
      setAnalytics(response.data)
    } else {
      setAnalytics(null)
      setError(response.error || 'Could not load activity analytics')
    }
    setLoading(false)
  }, [startTime, endTime])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { analytics, loading, error, refresh }
}
