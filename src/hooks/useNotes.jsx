import { useState, useEffect } from 'react'
import {
  getNotes,
  createNote as createNoteService,
  updateNote as updateNoteService,
  deleteNote as deleteNoteService
} from '../services/noteService'

function useNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadNotes = async () => {
    setLoading(true)
    setError(null)
    const response = await getNotes()
    if (response.success) {
      setNotes(response.data || [])
    } else {
      setError(response.error)
    }
    setLoading(false)
  }

  const handleCreateNote = async (payload) => {
    const response = await createNoteService(payload)
    if (response.success) {
      await loadNotes()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleUpdateNote = async (payload) => {
    const response = await updateNoteService(payload)
    if (response.success) {
      await loadNotes()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleDeleteNote = async (id) => {
    const response = await deleteNoteService(id)
    if (response.success) {
      await loadNotes()
    } else {
      setError(response.error)
    }
    return response
  }

  useEffect(() => {
    loadNotes()
  }, [])

  return {
    notes,
    loading,
    error,
    loadNotes,
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote
  }
}

export default useNotes
