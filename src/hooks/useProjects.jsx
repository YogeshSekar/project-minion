import { useState, useEffect } from 'react'
import {
  getProjects,
  createProject as createProjectService,
  updateProject as updateProjectService,
  deleteProject as deleteProjectService
} from '../services/projectService'

function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    const response = await getProjects()
    if (response.success) {
      setProjects(response.data || [])
    } else {
      setError(response.error)
    }
    setLoading(false)
  }

  const handleCreateProject = async (payload) => {
    const response = await createProjectService(payload)
    if (response.success) {
      await loadProjects()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleUpdateProject = async (payload) => {
    const response = await updateProjectService(payload)
    if (response.success) {
      await loadProjects()
    } else {
      setError(response.error)
    }
    return response
  }

  const handleDeleteProject = async (id) => {
    const response = await deleteProjectService(id)
    if (response.success) {
      await loadProjects()
    } else {
      setError(response.error)
    }
    return response
  }

  const upsertProject = project => {
    if (!project?.id) return
    setProjects(current => {
      const exists = current.some(item => String(item.id) === String(project.id))
      return exists
        ? current.map(item => String(item.id) === String(project.id) ? project : item)
        : [project, ...current]
    })
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    const syncProject = event => {
      const project = event.detail
      if (!project?.id) return
      setProjects(current => current.some(item => String(item.id) === String(project.id))
        ? current.map(item => String(item.id) === String(project.id) ? project : item)
        : [project, ...current])
    }
    window.addEventListener('projects-change', syncProject)
    return () => window.removeEventListener('projects-change', syncProject)
  }, [])

  return {
    projects,
    loading,
    error,
    loadProjects,
    upsertProject,
    createProject: handleCreateProject,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject
  }
}

export default useProjects
