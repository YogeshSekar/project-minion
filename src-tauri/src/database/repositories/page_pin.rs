use crate::database::models::page_pin::{CreatePagePinRequest, PagePin};
use sqlx::{Pool, Sqlite};

pub async fn get_page_pins(pool: &Pool<Sqlite>, page_id: i64) -> Result<Vec<PagePin>, sqlx::Error> {
    sqlx::query_as::<_, PagePin>(
        "SELECT * FROM page_pins WHERE page_id = ?1 ORDER BY created_at ASC, id ASC",
    )
    .bind(page_id)
    .fetch_all(pool)
    .await
}

pub async fn create_page_pin(
    pool: &Pool<Sqlite>,
    request: CreatePagePinRequest,
) -> Result<PagePin, sqlx::Error> {
    sqlx::query_as::<_, PagePin>(
        "INSERT INTO page_pins (page_id, kind, text, linked_page_id) VALUES (?1, ?2, ?3, ?4) RETURNING *"
    )
    .bind(request.page_id)
    .bind(request.kind)
    .bind(request.text)
    .bind(request.linked_page_id)
    .fetch_one(pool)
    .await
}

pub async fn delete_page_pin(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query_scalar::<_, i64>("DELETE FROM page_pins WHERE id = ?1 RETURNING id")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(())
}
