use crate::database::models::page::{CreatePageRequest, Page, UpdatePageRequest};
use sqlx::{Pool, Sqlite};

async fn resolve_project_id(
    pool: &Pool<Sqlite>,
    project_id: Option<i64>,
    area_id: Option<i64>,
) -> Result<Option<i64>, sqlx::Error> {
    let Some(area_id) = area_id else {
        return Ok(project_id);
    };
    let area_project_id =
        sqlx::query_scalar::<_, i64>("SELECT project_id FROM areas WHERE id = ?1")
            .bind(area_id)
            .fetch_optional(pool)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

    if let Some(project_id) = project_id {
        if project_id != area_project_id {
            return Err(sqlx::Error::Protocol(
                "The selected area does not belong to the selected project".to_string(),
            ));
        }
    }
    Ok(Some(area_project_id))
}

pub async fn create_page(pool: &Pool<Sqlite>, req: CreatePageRequest) -> Result<Page, sqlx::Error> {
    let project_id = resolve_project_id(pool, req.project_id, req.area_id).await?;
    sqlx::query_as::<_, Page>(
        r#"
        INSERT INTO pages
            (project_id, area_id, title, content, page_type, status, sort_order, meeting_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        RETURNING *
        "#,
    )
    .bind(project_id)
    .bind(req.area_id)
    .bind(req.title.trim())
    .bind(req.content.unwrap_or_default())
    .bind(req.page_type.unwrap_or_else(|| "general".to_string()))
    .bind(req.status.unwrap_or_else(|| "active".to_string()))
    .bind(req.sort_order.unwrap_or(0))
    .bind(req.meeting_id)
    .fetch_one(pool)
    .await
}

pub async fn get_all_pages(pool: &Pool<Sqlite>) -> Result<Vec<Page>, sqlx::Error> {
    sqlx::query_as::<_, Page>("SELECT * FROM pages ORDER BY sort_order, updated_at DESC")
        .fetch_all(pool)
        .await
}

pub async fn get_pages_by_project(
    pool: &Pool<Sqlite>,
    project_id: i64,
) -> Result<Vec<Page>, sqlx::Error> {
    sqlx::query_as::<_, Page>(
        "SELECT * FROM pages WHERE project_id = ?1 ORDER BY sort_order, updated_at DESC",
    )
    .bind(project_id)
    .fetch_all(pool)
    .await
}

pub async fn get_pages_by_area(
    pool: &Pool<Sqlite>,
    area_id: i64,
) -> Result<Vec<Page>, sqlx::Error> {
    sqlx::query_as::<_, Page>(
        "SELECT * FROM pages WHERE area_id = ?1 ORDER BY sort_order, updated_at DESC",
    )
    .bind(area_id)
    .fetch_all(pool)
    .await
}

pub async fn get_page_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<Page>, sqlx::Error> {
    sqlx::query_as::<_, Page>("SELECT * FROM pages WHERE id = ?1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn update_page(pool: &Pool<Sqlite>, req: UpdatePageRequest) -> Result<Page, sqlx::Error> {
    let project_id = resolve_project_id(pool, req.project_id, req.area_id).await?;
    sqlx::query_as::<_, Page>(
        r#"
        UPDATE pages
        SET project_id = ?1, area_id = ?2, title = ?3, content = ?4,
            page_type = ?5, status = ?6, sort_order = ?7, meeting_id = ?8,
            archived_at = CASE
                WHEN ?6 = 'archived' AND status <> 'archived' THEN CURRENT_TIMESTAMP
                WHEN ?6 <> 'archived' THEN NULL
                ELSE archived_at
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?9
        RETURNING *
        "#,
    )
    .bind(project_id)
    .bind(req.area_id)
    .bind(req.title.trim())
    .bind(req.content)
    .bind(req.page_type)
    .bind(req.status)
    .bind(req.sort_order)
    .bind(req.meeting_id)
    .bind(req.id)
    .fetch_one(pool)
    .await
}

pub async fn delete_page(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM pages WHERE id = ?1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
