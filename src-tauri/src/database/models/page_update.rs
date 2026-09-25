use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PageUpdate {
    pub id: i64,
    pub page_id: i64,
    pub update_date: String,
    pub content: String,
    pub status_snapshot: Option<String>,
    pub progress_snapshot: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePageUpdateRequest {
    pub page_id: i64,
    pub update_date: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePageUpdateRequest {
    pub id: i64,
    pub content: String,
}
