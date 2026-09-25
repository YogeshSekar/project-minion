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
    pub duration_seconds: Option<i64>,
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
    pub duration_seconds: Option<i64>,
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
    pub end_time: Option<String>,
    pub duration_minutes: Option<i64>,
    pub duration_seconds: Option<i64>,
    pub status: String,
    pub source: String,
    pub is_auto_tracked: Option<i64>,
    pub is_locked: Option<i64>,
    pub project_id: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivityAnalytics {
    pub start_time: String,
    pub end_time: String,
    pub total_seconds: i64,
    pub focus_seconds: i64,
    pub meeting_seconds: i64,
    pub other_seconds: i64,
    pub session_count: i64,
    pub active_days: i64,
    pub daily: Vec<ActivityTimeBucket>,
    pub projects: Vec<ActivityDimensionTotal>,
    pub tasks: Vec<ActivityDimensionTotal>,
    pub meetings: Vec<ActivityDimensionTotal>,
    pub activity_types: Vec<ActivityDimensionTotal>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ActivityTimeBucket {
    pub key: String,
    pub label: String,
    pub total_seconds: i64,
    pub focus_seconds: i64,
    pub meeting_seconds: i64,
    pub other_seconds: i64,
    pub session_count: i64,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ActivityDimensionTotal {
    pub id: Option<i64>,
    pub key: String,
    pub label: String,
    pub total_seconds: i64,
    pub session_count: i64,
}
