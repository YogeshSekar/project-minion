use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct TaskChecklistItem {
    pub id: i64,
    pub task_id: i64,
    pub text: String,
    pub is_completed: i32,
    pub sort_order: i32,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskChecklistItemRequest {
    pub task_id: i64,
    pub text: String,
    pub is_completed: Option<i32>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskChecklistItemRequest {
    pub id: i64,
    pub text: Option<String>,
    pub is_completed: Option<i32>,
    pub sort_order: Option<i32>,
}
