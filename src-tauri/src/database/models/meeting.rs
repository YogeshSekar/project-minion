use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Meeting {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
    pub location: Option<String>,
    pub attendees: Option<String>,
    pub outlook_id: Option<String>,
    pub meeting_url: Option<String>,
    pub meeting_type: Option<String>,
    pub project_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateMeetingRequest {
    pub title: String,
    pub description: Option<String>,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
    pub location: Option<String>,
    pub attendees: Option<String>,
    pub outlook_id: Option<String>,
    pub meeting_url: Option<String>,
    pub meeting_type: Option<String>,
    pub project_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateMeetingRequest {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub date: String,
    pub start_time: String,
    pub end_time: String,
    pub location: Option<String>,
    pub attendees: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateMeetingUrlRequest {
    pub outlook_id: String,
    pub meeting_url: Option<String>,
    pub project_id: Option<i64>,
}
