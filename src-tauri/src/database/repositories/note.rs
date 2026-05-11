use sqlx::{Pool, Sqlite};
use crate::database::models::note::{Note, CreateNoteRequest, UpdateNoteRequest};

pub async fn create_note(
    pool: &Pool<Sqlite>,
    req: CreateNoteRequest,
) -> Result<Note, sqlx::Error> {
    let note = sqlx::query_as::<_, Note>(
        r#"
        INSERT INTO notes (title, content, created_date, project_id, note_type)
        VALUES (?1, ?2, ?3, ?4, ?5)
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.content)
    .bind(&req.created_date)
    .bind(req.project_id)
    .bind(&req.note_type)
    .fetch_one(pool)
    .await?;

    Ok(note)
}

pub async fn get_all_notes(pool: &Pool<Sqlite>) -> Result<Vec<Note>, sqlx::Error> {
    let notes = sqlx::query_as::<_, Note>(
        r#"
        SELECT * FROM notes ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(notes)
}

pub async fn get_notes_by_project(pool: &Pool<Sqlite>, project_id: i64) -> Result<Vec<Note>, sqlx::Error> {
    let notes = sqlx::query_as::<_, Note>(
        r#"
        SELECT * FROM notes WHERE project_id = ?1 ORDER BY created_at DESC
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await?;

    Ok(notes)
}

pub async fn get_note_by_id(pool: &Pool<Sqlite>, id: i64) -> Result<Option<Note>, sqlx::Error> {
    let note = sqlx::query_as::<_, Note>(
        r#"
        SELECT * FROM notes WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(note)
}

pub async fn update_note(
    pool: &Pool<Sqlite>,
    req: UpdateNoteRequest,
) -> Result<Note, sqlx::Error> {
    let note = sqlx::query_as::<_, Note>(
        r#"
        UPDATE notes
        SET title = ?1, content = ?2, project_id = ?3, note_type = ?4, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?5
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.content)
    .bind(req.project_id)
    .bind(&req.note_type)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(note)
}

pub async fn delete_note(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM notes WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}
