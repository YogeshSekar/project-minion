use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub start_date: String,
    pub deadline: String,
    pub priority: String,
    pub progress: i64,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub title: String,
    pub description: Option<String>,
    pub start_date: String,
    pub deadline: String,
    pub priority: String,
    pub progress: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProjectRequest {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub start_date: String,
    pub deadline: String,
    pub priority: String,
    pub progress: i64,
    pub status: String,
}
