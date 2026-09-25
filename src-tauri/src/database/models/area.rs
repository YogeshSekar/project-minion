use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Area {
    pub id: i64,
    pub project_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAreaRequest {
    pub project_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub sort_order: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAreaRequest {
    pub id: i64,
    pub project_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub sort_order: i64,
}
