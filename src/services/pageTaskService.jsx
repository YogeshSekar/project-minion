import { invoke } from '@tauri-apps/api/core'

const call = async (command, args) => {
  try {
    return await invoke(command, args)
  } catch (error) {
    return { success: false, data: null, error: String(error) }
  }
}

export const getTaskIdsForPage = pageId => call('get_task_ids_for_page', { pageId })
export const getPageIdsForTask = taskId => call('get_page_ids_for_task', { taskId })
export const linkTaskToPage = (pageId, taskId) => call('link_task_to_page', { pageId, taskId })
export const unlinkTaskFromPage = (pageId, taskId) => call('unlink_task_from_page', { pageId, taskId })
