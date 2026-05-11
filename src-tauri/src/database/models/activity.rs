use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Activity {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub activity_type: String,
    pub reference_type: Option<String>,
    pub reference_id: Option<i64>,
    pub session_group_id: Option<String>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_minutes: Option<i64>,
    pub status: String,
    pub source: String,
    pub is_auto_tracked: i64,
    pub is_locked: i64,
    pub project_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateActivityRequest {
    pub title: String,
    pub description: Option<String>,
    pub activity_type: String,
    pub reference_type: Option<String>,
    pub reference_id: Option<i64>,
    pub session_group_id: Option<String>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_minutes: Option<i64>,
    pub status: Option<String>,
    pub source: Option<String>,
    pub is_auto_tracked: Option<i64>,
    pub is_locked: Option<i64>,
    pub project_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateActivityRequest {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub activity_type: String,
    pub reference_type: Option<String>,
    pub reference_id: Option<i64>,
    pub session_group_id: Option<String>,
    pub start_time: String,
    pub end_time: String,
    pub duration_minutes: i64,
    pub status: String,
    pub source: String,
    pub is_auto_tracked: Option<i64>,
    pub is_locked: Option<i64>,
    pub project_id: i64,
}
