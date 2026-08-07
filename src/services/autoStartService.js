import { invoke } from "@tauri-apps/api/core";

/**
 * Enable or disable app autostart on Windows startup.
 * @param {boolean} enabled
 */
export async function setAutoStart(enabled) {
  await invoke("set_autostart", { enabled });
}

/**
 * Returns true if autostart is currently enabled in the registry.
 * @returns {Promise<boolean>}
 */
export async function getAutoStart() {
  return await invoke("get_autostart");
}
