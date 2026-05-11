use sqlx::{Pool, Sqlite};
use crate::database::models::meeting::{Meeting, CreateMeetingRequest, UpdateMeetingRequest, UpdateMeetingUrlRequest};

pub async fn create_meeting(
    pool: &Pool<Sqlite>,
    req: CreateMeetingRequest,
) -> Result<Meeting, sqlx::Error> {
    let meeting = sqlx::query_as::<_, Meeting>(
        r#"
        INSERT INTO meetings (title, description, date, start_time, end_time, location, attendees, outlook_id, meeting_url, meeting_type, project_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.date)
    .bind(&req.start_time)
    .bind(&req.end_time)
    .bind(&req.location)
    .bind(&req.attendees)
    .bind(&req.outlook_id)
    .bind(&req.meeting_url)
    .bind(&req.meeting_type)
    .bind(&req.project_id)
    .fetch_one(pool)
    .await?;

    Ok(meeting)
}

pub async fn get_all_meetings(pool: &Pool<Sqlite>) -> Result<Vec<Meeting>, sqlx::Error> {
    let meetings = sqlx::query_as::<_, Meeting>(
        r#"
        SELECT * FROM meetings ORDER BY date ASC, start_time ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(meetings)
}

pub async fn get_meetings_by_date(
    pool: &Pool<Sqlite>,
    date: String,
) -> Result<Vec<Meeting>, sqlx::Error> {
    let meetings = sqlx::query_as::<_, Meeting>(
        r#"
        SELECT * FROM meetings WHERE date = ?1 ORDER BY start_time ASC
        "#,
    )
    .bind(date)
    .fetch_all(pool)
    .await?;

    Ok(meetings)
}

pub async fn get_meeting_by_outlook_id(
    pool: &Pool<Sqlite>,
    outlook_id: String,
) -> Result<Option<Meeting>, sqlx::Error> {
    let meeting = sqlx::query_as::<_, Meeting>(
        r#"
        SELECT * FROM meetings WHERE outlook_id = ?1
        "#,
    )
    .bind(&outlook_id)
    .fetch_optional(pool)
    .await?;

    Ok(meeting)
}

pub async fn update_meeting_url(
    pool: &Pool<Sqlite>,
    req: UpdateMeetingUrlRequest,
) -> Result<Meeting, sqlx::Error> {
    let meeting = if req.meeting_url.is_some() && req.project_id.is_some() {
        // Update both fields
        sqlx::query_as::<_, Meeting>(
            r#"
            UPDATE meetings 
            SET meeting_url = ?1, project_id = ?2, updated_at = CURRENT_TIMESTAMP
            WHERE outlook_id = ?3
            RETURNING *
            "#,
        )
        .bind(&req.meeting_url)
        .bind(&req.project_id)
        .bind(&req.outlook_id)
        .fetch_one(pool)
        .await?
    } else if req.meeting_url.is_some() {
        // Update only meeting_url
        sqlx::query_as::<_, Meeting>(
            r#"
            UPDATE meetings 
            SET meeting_url = ?1, updated_at = CURRENT_TIMESTAMP
            WHERE outlook_id = ?2
            RETURNING *
            "#,
        )
        .bind(&req.meeting_url)
        .bind(&req.outlook_id)
        .fetch_one(pool)
        .await?
    } else if req.project_id.is_some() {
        // Update only project_id
        sqlx::query_as::<_, Meeting>(
            r#"
            UPDATE meetings 
            SET project_id = ?1, updated_at = CURRENT_TIMESTAMP
            WHERE outlook_id = ?2
            RETURNING *
            "#,
        )
        .bind(&req.project_id)
        .bind(&req.outlook_id)
        .fetch_one(pool)
        .await?
    } else {
        return Err(sqlx::Error::Protocol("No fields to update".to_string()));
    };

    Ok(meeting)
}

pub async fn get_meeting_by_id(
    pool: &Pool<Sqlite>,
    id: i64,
) -> Result<Option<Meeting>, sqlx::Error> {
    let meeting = sqlx::query_as::<_, Meeting>(
        r#"
        SELECT * FROM meetings WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(meeting)
}

pub async fn update_meeting(
    pool: &Pool<Sqlite>,
    req: UpdateMeetingRequest,
) -> Result<Meeting, sqlx::Error> {
    let meeting = sqlx::query_as::<_, Meeting>(
        r#"
        UPDATE meetings 
        SET title = ?1, description = ?2, date = ?3, start_time = ?4, 
            end_time = ?5, location = ?6, attendees = ?7, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?8
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.date)
    .bind(&req.start_time)
    .bind(&req.end_time)
    .bind(&req.location)
    .bind(&req.attendees)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(meeting)
}

pub async fn delete_meeting(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM meetings WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}
