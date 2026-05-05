import { useState, useEffect, useCallback } from 'react'
import {
  getHabits,
  createHabit as createHabitService,
  updateHabit as updateHabitService,
  deleteHabit as deleteHabitService,
  toggleHabitCompletion as toggleHabitCompletionService,
  getHabitLogs as getHabitLogsService,
  calculateWeeklyProgress,
  calculateMonthlyProgress,
  isCompletedToday
} from '../services/habitService'

function useHabits() {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadHabits = useCallback(async () => {
    setLoading(true)
    setError(null)
    const response = await getHabits()
    if (response.success) {
      // Enrich habits with progress data
      const enrichedHabits = await Promise.all(
        (response.data || []).map(async (habit) => {
          const logsResponse = await getHabitLogsService(habit.id)
          if (logsResponse.success && logsResponse.data) {
            const logs = logsResponse.data
            return {
              ...habit,
              weeklyProgress: calculateWeeklyProgress(logs),
              monthlyProgress: calculateMonthlyProgress(logs),
              completedToday: isCompletedToday(habit, logs)
            }
          }
          return {
            ...habit,
            weeklyProgress: [false, false, false, false, false, false, false],
            monthlyProgress: Array(30).fill(false),
            completedToday: false
          }
        })
      )
      setHabits(enrichedHabits)
    } else {
      setError(response.error)
    }
    setLoading(false)
  }, [])

  const handleCreateHabit = async (payload) => {
    const response = await createHabitService(payload)
    if (response.success) {
      await loadHabits()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleUpdateHabit = async (payload) => {
    const response = await updateHabitService(payload)
    if (response.success) {
      setHabits(prevHabits =>
        prevHabits.map(habit =>
          habit.id === payload.id ? { ...habit, ...payload } : habit
        )
      )
      await loadHabits()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleDeleteHabit = async (id) => {
    const response = await deleteHabitService(id)
    if (response.success) {
      await loadHabits()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleToggleHabitCompletion = async (habitId, date) => {
    const response = await toggleHabitCompletionService(habitId, date)
    if (response.success) {
      // Update local state immediately
      setHabits(prevHabits =>
        prevHabits.map(habit => {
          if (habit.id === habitId) {
            const today = new Date().toISOString().split('T')[0]
            const isToday = date === today
            
            if (isToday) {
              const newCompletedToday = !habit.completedToday
              const newStreak = newCompletedToday ? habit.streak + 1 : 0
              const newBestStreak = Math.max(newStreak, habit.bestStreak)
              
              return {
                ...habit,
                completedToday: newCompletedToday,
                streak: newStreak,
                bestStreak: newBestStreak
              }
            }
          }
          return habit
        })
      )
      // Refresh from server
      await loadHabits()
    } else {
      setError(response.error)
    }
    return response
  }

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  return {
    habits,
    loading,
    error,
    loadHabits,
    createHabit: handleCreateHabit,
    updateHabit: handleUpdateHabit,
    deleteHabit: handleDeleteHabit,
    toggleHabitCompletion: handleToggleHabitCompletion
  }
}

export default useHabits
