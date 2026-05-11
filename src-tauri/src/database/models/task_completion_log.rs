use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TaskCompletionLog {
    pub id: i64,
    pub task_id: i64,
    pub occurrence_date: String,
    pub completed_at: String,
    pub actual_minutes: Option<i32>,
    pub notes: Option<String>,
    pub is_undone: i32,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskCompletionLogRequest {
    pub task_id: i64,
    pub occurrence_date: String,
    pub completed_at: String,
    pub actual_minutes: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskCompletionLogRequest {
    pub id: i64,
    pub task_id: i64,
    pub occurrence_date: String,
    pub completed_at: String,
    pub actual_minutes: Option<i32>,
    pub notes: Option<String>,
    pub is_undone: Option<i32>,
}
