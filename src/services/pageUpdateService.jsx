import { invoke } from '@tauri-apps/api/core'

const call = async (command, args) => {
  try {
    return await invoke(command, args)
  } catch (error) {
    return { success: false, data: null, error: String(error) }
  }
}

export const getPageUpdates = pageId => call('get_page_updates', { pageId })
export const createPageUpdate = request => call('create_page_update', { request })
export const updatePageUpdate = request => call('update_page_update', { request })
export const deletePageUpdate = id => call('delete_page_update', { id })
