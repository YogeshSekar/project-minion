import { invoke } from '@tauri-apps/api/core'

const call = async (command, args) => {
  try {
    return await invoke(command, args)
  } catch (error) {
    return { success: false, data: null, error: String(error) }
  }
}

export const getPagePins = pageId => call('get_page_pins', { pageId })
export const createPagePin = request => call('create_page_pin', { request })
export const deletePagePin = id => call('delete_page_pin', { id })
