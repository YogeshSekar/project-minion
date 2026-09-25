use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Page {
    pub id: i64,
    pub project_id: Option<i64>,
    pub area_id: Option<i64>,
    pub title: String,
    pub content: String,
    pub page_type: String,
    pub status: String,
    pub sort_order: i64,
    pub meeting_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub archived_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePageRequest {
    pub project_id: Option<i64>,
    pub area_id: Option<i64>,
    pub title: String,
    pub content: Option<String>,
    pub page_type: Option<String>,
    pub status: Option<String>,
    pub sort_order: Option<i64>,
    pub meeting_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePageRequest {
    pub id: i64,
    pub project_id: Option<i64>,
    pub area_id: Option<i64>,
    pub title: String,
    pub content: String,
    pub page_type: String,
    pub status: String,
    pub sort_order: i64,
    pub meeting_id: Option<String>,
}
