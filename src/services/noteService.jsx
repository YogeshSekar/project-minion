import {
  getAllNotes,
  createNote as createNoteApi,
  updateNote as updateNoteApi,
  deleteNote as deleteNoteApi
} from './api'

export async function getNotes(retryCount = 0) {
  try {
    const response = await getAllNotes()
    return response
  } catch (error) {
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return getNotes(retryCount + 1)
    }
    return { success: false, data: null, error: error.toString() }
  }
}

export async function createNote(payload) {
  try {
    const response = await createNoteApi(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function updateNote(payload) {
  try {
    const response = await updateNoteApi(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function deleteNote(id) {
  try {
    const response = await deleteNoteApi(id)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function getNotesByProject(projectId) {
  try {
    const response = await getNotes()
    if (response.success && response.data) {
      const projectNotes = response.data.filter(note => note.project_id === projectId)
      return { success: true, data: projectNotes, error: null }
    }
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}
