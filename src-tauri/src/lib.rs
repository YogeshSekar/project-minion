// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use commands::{
    backup_database, create_activity, create_area, create_checklist_item, create_meeting,
    create_note, create_page, create_page_pin, create_page_update, create_project, create_task,
    delete_activity, delete_all_data, delete_area, delete_checklist_item, delete_meeting,
    delete_note, delete_page, delete_page_pin, delete_page_update, delete_project, delete_task,
    get_activities, get_activities_by_reference, get_activity_analytics, get_activity_by_id,
    get_all_areas, get_all_meetings, get_all_notes, get_all_pages, get_all_projects, get_all_tasks,
    get_area, get_areas_by_project, get_checklist_items_by_task, get_meeting,
    get_meeting_by_outlook_id, get_meetings_by_date, get_note, get_notes_by_project, get_page,
    get_page_ids_for_task, get_page_pins, get_page_updates, get_pages_by_area,
    get_pages_by_project, get_pages_for_meeting, get_project, get_running_activity,
    get_task_ids_for_page, link_page_to_meeting, link_task_to_page, set_meeting_project,
    unlink_page_from_meeting, unlink_task_from_page, update_activity, update_area,
    update_checklist_item, update_meeting, update_meeting_url, update_note, update_page,
    update_page_update, update_project, update_task, DbState,
};
use database::init_db;
use outlook::get_outlook_meetings;
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;

mod commands;
mod database;
mod outlook;
mod services;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let app_data_dir = app_handle
                    .path()
                    .app_data_dir()
                    .expect("Failed to get app data dir");
                let pool = init_db(app_data_dir)
                    .await
                    .expect("Failed to initialize database");
                app.manage(DbState { pool });
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            backup_database,
            delete_all_data,
            create_project,
            get_all_projects,
            get_project,
            update_project,
            delete_project,
            create_task,
            get_all_tasks,
            update_task,
            delete_task,
            create_meeting,
            get_all_meetings,
            get_meetings_by_date,
            get_meeting,
            get_meeting_by_outlook_id,
            update_meeting,
            update_meeting_url,
            set_meeting_project,
            get_pages_for_meeting,
            link_page_to_meeting,
            unlink_page_from_meeting,
            delete_meeting,
            create_note,
            get_all_notes,
            get_notes_by_project,
            get_note,
            update_note,
            delete_note,
            create_area,
            get_all_areas,
            get_areas_by_project,
            get_area,
            update_area,
            delete_area,
            create_page,
            get_all_pages,
            get_pages_by_project,
            get_pages_by_area,
            get_page,
            update_page,
            delete_page,
            get_task_ids_for_page,
            get_page_ids_for_task,
            link_task_to_page,
            unlink_task_from_page,
            get_page_updates,
            create_page_update,
            update_page_update,
            delete_page_update,
            get_page_pins,
            create_page_pin,
            delete_page_pin,
            create_activity,
            get_activities,
            get_activity_analytics,
            get_activity_by_id,
            update_activity,
            delete_activity,
            get_activities_by_reference,
            get_running_activity,
            get_outlook_meetings,
            create_checklist_item,
            get_checklist_items_by_task,
            update_checklist_item,
            delete_checklist_item,
            set_autostart,
            get_autostart,
            get_windows_username
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn set_autostart(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    let autostart_manager = app.autolaunch();
    if enabled {
        autostart_manager.enable().map_err(|e| e.to_string())
    } else {
        autostart_manager.disable().map_err(|e| e.to_string())
    }
}

#[tauri::command]
async fn get_autostart(app: tauri::AppHandle) -> Result<bool, String> {
    let autostart_manager = app.autolaunch();
    autostart_manager.is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_windows_username() -> Option<String> {
    let account_name = std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .ok()
        .map(|name| name.trim().to_string())
        .filter(|name| !name.is_empty());

    #[cfg(windows)]
    if let Some(display_name) = windows_user::display_name(account_name.as_deref()) {
        return Some(display_name);
    }

    account_name
}

#[cfg(windows)]
mod windows_user {
    use std::{ffi::c_void, ptr};

    #[repr(C)]
    struct UserInfo10 {
        name: *mut u16,
        comment: *mut u16,
        user_comment: *mut u16,
        full_name: *mut u16,
    }

    #[link(name = "Secur32")]
    unsafe extern "system" {
        fn GetUserNameExW(name_format: u32, buffer: *mut u16, size: *mut u32) -> u8;
    }

    #[link(name = "Netapi32")]
    unsafe extern "system" {
        fn NetUserGetInfo(
            server: *const u16,
            username: *const u16,
            level: u32,
            buffer: *mut *mut u8,
        ) -> u32;
        fn NetApiBufferFree(buffer: *mut c_void) -> u32;
    }

    fn nonempty_name(value: String) -> Option<String> {
        let name = value.trim().to_string();
        (!name.is_empty()).then_some(name)
    }

    fn domain_display_name() -> Option<String> {
        const NAME_DISPLAY: u32 = 3;
        let mut buffer = [0u16; 512];
        let mut size = buffer.len() as u32;
        // The buffer is owned by this function; Windows writes at most `size` UTF-16 units.
        if unsafe { GetUserNameExW(NAME_DISPLAY, buffer.as_mut_ptr(), &mut size) } == 0 {
            return None;
        }
        let end = buffer
            .iter()
            .position(|unit| *unit == 0)
            .unwrap_or(buffer.len());
        nonempty_name(String::from_utf16_lossy(&buffer[..end]))
    }

    fn local_full_name(account_name: &str) -> Option<String> {
        let username: Vec<u16> = account_name
            .encode_utf16()
            .chain(std::iter::once(0))
            .collect();
        let mut buffer: *mut u8 = ptr::null_mut();
        // Level 10 returns USER_INFO_10, whose fourth field is the account full name.
        let status = unsafe { NetUserGetInfo(ptr::null(), username.as_ptr(), 10, &mut buffer) };
        let result = if status == 0 && !buffer.is_null() {
            let info = unsafe { &*(buffer as *const UserInfo10) };
            if info.full_name.is_null() {
                None
            } else {
                let mut length = 0;
                while length < 512 && unsafe { *info.full_name.add(length) } != 0 {
                    length += 1;
                }
                if length == 512 {
                    None
                } else {
                    let value = unsafe { std::slice::from_raw_parts(info.full_name, length) };
                    nonempty_name(String::from_utf16_lossy(value))
                }
            }
        } else {
            None
        };
        if !buffer.is_null() {
            unsafe { NetApiBufferFree(buffer.cast()) };
        }
        result
    }

    pub fn display_name(account_name: Option<&str>) -> Option<String> {
        domain_display_name().or_else(|| account_name.and_then(local_full_name))
    }
}
