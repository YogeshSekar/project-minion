import {
  createPage as createPageApi,
  deletePage as deletePageApi,
  getAllPages,
  getPage as getPageApi,
  getPagesByArea as getPagesByAreaApi,
  getPagesByProject as getPagesByProjectApi,
  updatePage as updatePageApi
} from './api'

const failure = error => ({ success: false, data: null, error: error?.toString?.() || 'Unknown error' })

export async function getPages(retryCount = 0) {
  try {
    return await getAllPages()
  } catch (error) {
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return getPages(retryCount + 1)
    }
    return failure(error)
  }
}

export async function getPagesByProject(projectId) {
  try {
    return await getPagesByProjectApi(projectId)
  } catch (error) {
    return failure(error)
  }
}

export async function getPagesByArea(areaId) {
  try {
    return await getPagesByAreaApi(areaId)
  } catch (error) {
    return failure(error)
  }
}

export async function getPage(id) {
  try {
    return await getPageApi(id)
  } catch (error) {
    return failure(error)
  }
}

export async function createPage(payload) {
  try {
    return await createPageApi(payload)
  } catch (error) {
    return failure(error)
  }
}

export async function updatePage(payload) {
  try {
    return await updatePageApi(payload)
  } catch (error) {
    return failure(error)
  }
}

export async function deletePage(id) {
  try {
    return await deletePageApi(id)
  } catch (error) {
    return failure(error)
  }
}
