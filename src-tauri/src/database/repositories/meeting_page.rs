use crate::database::models::page::Page;
use sqlx::{Pool, Sqlite};

pub async fn get_pages_for_meeting(
    pool: &Pool<Sqlite>,
    meeting_id: i64,
) -> Result<Vec<Page>, sqlx::Error> {
    sqlx::query_as::<_, Page>(
        "SELECT p.* FROM pages p JOIN meeting_pages mp ON mp.page_id = p.id WHERE mp.meeting_id = ?1 ORDER BY mp.created_at, p.id",
    )
    .bind(meeting_id)
    .fetch_all(pool)
    .await
}

pub async fn link_page_to_meeting(
    pool: &Pool<Sqlite>,
    meeting_id: i64,
    page_id: i64,
) -> Result<(), sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let meeting_project: Option<i64> =
        sqlx::query_scalar("SELECT project_id FROM meetings WHERE id = ?1")
            .bind(meeting_id)
            .fetch_one(&mut *transaction)
            .await?;
    let page_project: Option<i64> =
        sqlx::query_scalar("SELECT project_id FROM pages WHERE id = ?1")
            .bind(page_id)
            .fetch_one(&mut *transaction)
            .await?;
    if meeting_project.is_some() && page_project.is_some() && meeting_project != page_project {
        return Err(sqlx::Error::Protocol(
            "The page belongs to a different project".to_string(),
        ));
    }
    if meeting_project.is_none() && page_project.is_some() {
        sqlx::query(
            "UPDATE meetings SET project_id = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        )
        .bind(page_project)
        .bind(meeting_id)
        .execute(&mut *transaction)
        .await?;
    }
    sqlx::query("INSERT OR IGNORE INTO meeting_pages (meeting_id, page_id) VALUES (?1, ?2)")
        .bind(meeting_id)
        .bind(page_id)
        .execute(&mut *transaction)
        .await?;
    transaction.commit().await
}

pub async fn unlink_page_from_meeting(
    pool: &Pool<Sqlite>,
    meeting_id: i64,
    page_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM meeting_pages WHERE meeting_id = ?1 AND page_id = ?2")
        .bind(meeting_id)
        .bind(page_id)
        .execute(pool)
        .await?;
    Ok(())
}
