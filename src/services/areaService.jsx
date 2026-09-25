import {
  createArea as createAreaApi,
  deleteArea as deleteAreaApi,
  getAllAreas,
  getArea as getAreaApi,
  getAreasByProject as getAreasByProjectApi,
  updateArea as updateAreaApi
} from './api'

const failure = error => ({ success: false, data: null, error: error?.toString?.() || 'Unknown error' })

export async function getAreas(retryCount = 0) {
  try {
    return await getAllAreas()
  } catch (error) {
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return getAreas(retryCount + 1)
    }
    return failure(error)
  }
}

export async function getAreasByProject(projectId) {
  try {
    return await getAreasByProjectApi(projectId)
  } catch (error) {
    return failure(error)
  }
}

export async function getArea(id) {
  try {
    return await getAreaApi(id)
  } catch (error) {
    return failure(error)
  }
}

export async function createArea(payload) {
  try {
    return await createAreaApi(payload)
  } catch (error) {
    return failure(error)
  }
}

export async function updateArea(payload) {
  try {
    return await updateAreaApi(payload)
  } catch (error) {
    return failure(error)
  }
}

export async function deleteArea(id) {
  try {
    return await deleteAreaApi(id)
  } catch (error) {
    return failure(error)
  }
}
