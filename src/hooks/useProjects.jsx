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

  useEffect(() => {
    loadProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    loadProjects,
    createProject: handleCreateProject,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject
  }
}

export default useProjects
