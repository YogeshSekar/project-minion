use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct PagePin {
    pub id: i64,
    pub page_id: i64,
    pub kind: String,
    pub text: String,
    pub linked_page_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePagePinRequest {
    pub page_id: i64,
    pub kind: String,
    pub text: String,
    pub linked_page_id: Option<i64>,
}
