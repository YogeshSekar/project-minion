import {
  getAllProjects,
  createProject as createProjectApi,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi
} from './api'

export async function getProjects(retryCount = 0) {
  try {
    const response = await getAllProjects()
    return response
  } catch (error) {
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return getProjects(retryCount + 1)
    }
    return { success: false, data: null, error: error.toString() }
  }
}

export async function createProject(payload) {
  try {
    const response = await createProjectApi(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function updateProject(payload) {
  try {
    const response = await updateProjectApi(payload)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function deleteProject(id) {
  try {
    const response = await deleteProjectApi(id)
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}

export async function getProjectById(projectId) {
  try {
    const response = await getProjects()
    if (response.success && response.data) {
      const project = response.data.find(p => p.id === projectId)
      if (project) {
        return { success: true, data: project, error: null }
      }
      return { success: false, data: null, error: 'Project not found' }
    }
    return response
  } catch (error) {
    return { success: false, data: null, error: error.toString() }
  }
}
