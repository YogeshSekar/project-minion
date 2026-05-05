use std::process::Command;
use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct OutlookMeeting {
    pub subject: Option<String>,
    pub start: Option<String>,
    pub end: Option<String>,
    pub location: Option<String>,
    pub entry_id: Option<String>,
}

#[tauri::command]
pub fn get_outlook_meetings(date: String) -> Result<Vec<OutlookMeeting>, String> {
    let output = Command::new("E:\\work_dsk\\Personal Projects\\OutlookInteropSln\\OutlookInterop\\bin\\Release\\OutlookInterop.exe")
        .arg(&date)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("Failed to execute Outlook helper: {}", e))?;

    if output.status.success() {
        let json = String::from_utf8_lossy(&output.stdout).to_string();
        let meetings: Vec<OutlookMeeting> = serde_json::from_str(&json)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;
        Ok(meetings)
    } else {
        Err(format!(
            "Outlook command failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}
