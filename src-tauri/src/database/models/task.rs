use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Task {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub project_id: Option<i64>,
    pub is_recurring: i32,
    pub recurrence_type: Option<String>,
    pub recurrence_interval: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub project_id: Option<i64>,
    pub is_recurring: Option<i32>,
    pub recurrence_type: Option<String>,
    pub recurrence_interval: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub scheduled_date: Option<String>,
    pub project_id: Option<i64>,
    pub is_recurring: Option<i32>,
    pub recurrence_type: Option<String>,
    pub recurrence_interval: Option<i32>,
}
