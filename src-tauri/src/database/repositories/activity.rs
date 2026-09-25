use crate::database::models::activity::{
    Activity, ActivityAnalytics, ActivityDimensionTotal, ActivityTimeBucket, CreateActivityRequest,
    UpdateActivityRequest,
};
use sqlx::{FromRow, Pool, Sqlite};

#[derive(FromRow)]
struct ActivityAnalyticsSummary {
    total_seconds: i64,
    focus_seconds: i64,
    meeting_seconds: i64,
    other_seconds: i64,
    session_count: i64,
    active_days: i64,
}

pub async fn create_activity(
    pool: &Pool<Sqlite>,
    req: CreateActivityRequest,
) -> Result<Activity, sqlx::Error> {
    let status = req.status.unwrap_or_else(|| "completed".to_string());
    let source = req.source.unwrap_or_else(|| "manual".to_string());
    let is_auto_tracked = req.is_auto_tracked.unwrap_or(0);
    let is_locked = req.is_locked.unwrap_or(0);

    let activity = sqlx::query_as::<_, Activity>(
        r#"
        INSERT INTO activities (title, description, activity_type, reference_type, reference_id, session_group_id, start_time, end_time, duration_minutes, duration_seconds, status, source, is_auto_tracked, is_locked, project_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.activity_type)
    .bind(&req.reference_type)
    .bind(req.reference_id)
    .bind(&req.session_group_id)
    .bind(&req.start_time)
    .bind(&req.end_time)
    .bind(req.duration_minutes)
    .bind(req.duration_seconds)
    .bind(&status)
    .bind(&source)
    .bind(is_auto_tracked)
    .bind(is_locked)
    .bind(req.project_id)
    .fetch_one(pool)
    .await?;

    Ok(activity)
}

pub async fn get_activities(pool: &Pool<Sqlite>) -> Result<Vec<Activity>, sqlx::Error> {
    let activities = sqlx::query_as::<_, Activity>(
        r#"
        SELECT * FROM activities ORDER BY start_time DESC
        "#,
    )
    .fetch_all(pool)
    .await?;
    Ok(activities)
}

pub async fn get_activity_by_id(
    pool: &Pool<Sqlite>,
    id: i64,
) -> Result<Option<Activity>, sqlx::Error> {
    let activity = sqlx::query_as::<_, Activity>(
        r#"
        SELECT * FROM activities WHERE id = ?1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(activity)
}

pub async fn update_activity(
    pool: &Pool<Sqlite>,
    req: UpdateActivityRequest,
) -> Result<Activity, sqlx::Error> {
    let is_auto_tracked = req.is_auto_tracked.unwrap_or(0);
    let is_locked = req.is_locked.unwrap_or(0);

    let activity = sqlx::query_as::<_, Activity>(
        r#"
        UPDATE activities 
        SET title = ?1, description = ?2, activity_type = ?3, reference_type = ?4, reference_id = ?5, 
            session_group_id = ?6, start_time = ?7, end_time = ?8, duration_minutes = ?9, duration_seconds = ?10, status = ?11, source = ?12,
            is_auto_tracked = ?13, is_locked = ?14, project_id = ?15, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?16
        RETURNING *
        "#,
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.activity_type)
    .bind(&req.reference_type)
    .bind(req.reference_id)
    .bind(&req.session_group_id)
    .bind(&req.start_time)
    .bind(&req.end_time)
    .bind(req.duration_minutes)
    .bind(req.duration_seconds)
    .bind(&req.status)
    .bind(&req.source)
    .bind(is_auto_tracked)
    .bind(is_locked)
    .bind(req.project_id)
    .bind(req.id)
    .fetch_one(pool)
    .await?;

    Ok(activity)
}

pub async fn delete_activity(pool: &Pool<Sqlite>, id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM activities WHERE id = ?1
        "#,
    )
    .bind(id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_activities_by_reference(
    pool: &Pool<Sqlite>,
    reference_type: String,
    reference_id: i64,
) -> Result<Vec<Activity>, sqlx::Error> {
    let activities = sqlx::query_as::<_, Activity>(
        r#"
        SELECT * FROM activities WHERE reference_type = ?1 AND reference_id = ?2 ORDER BY start_time DESC
        "#,
    )
    .bind(&reference_type)
    .bind(reference_id)
    .fetch_all(pool)
    .await?;
    Ok(activities)
}

pub async fn get_running_activity(pool: &Pool<Sqlite>) -> Result<Option<Activity>, sqlx::Error> {
    let activity = sqlx::query_as::<_, Activity>(
        r#"
        SELECT * FROM activities WHERE status = 'running' ORDER BY start_time DESC LIMIT 1
        "#,
    )
    .fetch_optional(pool)
    .await?;

    Ok(activity)
}

pub async fn has_overlapping_activity(
    pool: &Pool<Sqlite>,
    start_time: &str,
    end_time: &str,
    exclude_id: Option<i64>,
) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*) FROM activities
        WHERE end_time IS NOT NULL
          AND (?3 IS NULL OR id != ?3)
          AND datetime(start_time) < datetime(?2)
          AND datetime(end_time) > datetime(?1)
        "#,
    )
    .bind(start_time)
    .bind(end_time)
    .bind(exclude_id)
    .fetch_one(pool)
    .await?;
    Ok(count > 0)
}

pub async fn get_activity_analytics(
    pool: &Pool<Sqlite>,
    start_time: &str,
    end_time: &str,
) -> Result<ActivityAnalytics, sqlx::Error> {
    // Every query clips sessions to the requested range. Running sessions are
    // measured up to now, so the dashboard remains live without writing data.
    const CLIPPED: &str = r#"
        WITH clipped AS (
            SELECT a.*,
                CAST(ROUND(MAX(0, (
                    MIN(julianday(COALESCE(a.end_time, CURRENT_TIMESTAMP)), julianday(?2)) -
                    MAX(julianday(a.start_time), julianday(?1))
                ) * 86400)) AS INTEGER) AS seconds
            FROM activities a
            WHERE julianday(a.start_time) < julianday(?2)
              AND julianday(COALESCE(a.end_time, CURRENT_TIMESTAMP)) > julianday(?1)
        )
    "#;

    let summary_sql = format!(
        "{CLIPPED}
        SELECT
            COALESCE(SUM(seconds), 0) AS total_seconds,
            COALESCE(SUM(CASE WHEN activity_type = 'focus_session' THEN seconds ELSE 0 END), 0) AS focus_seconds,
            COALESCE(SUM(CASE WHEN activity_type = 'meeting' THEN seconds ELSE 0 END), 0) AS meeting_seconds,
            COALESCE(SUM(CASE WHEN activity_type NOT IN ('focus_session', 'meeting') THEN seconds ELSE 0 END), 0) AS other_seconds,
            COUNT(*) AS session_count,
            COUNT(DISTINCT date(start_time)) AS active_days
        FROM clipped"
    );
    let summary = sqlx::query_as::<_, ActivityAnalyticsSummary>(&summary_sql)
        .bind(start_time)
        .bind(end_time)
        .fetch_one(pool)
        .await?;

    let daily_sql = format!(
        "{CLIPPED}
        SELECT date(start_time) AS key, date(start_time) AS label,
            SUM(seconds) AS total_seconds,
            SUM(CASE WHEN activity_type = 'focus_session' THEN seconds ELSE 0 END) AS focus_seconds,
            SUM(CASE WHEN activity_type = 'meeting' THEN seconds ELSE 0 END) AS meeting_seconds,
            SUM(CASE WHEN activity_type NOT IN ('focus_session', 'meeting') THEN seconds ELSE 0 END) AS other_seconds,
            COUNT(*) AS session_count
        FROM clipped GROUP BY date(start_time) ORDER BY date(start_time)"
    );
    let daily = sqlx::query_as::<_, ActivityTimeBucket>(&daily_sql)
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

    let projects_sql = format!(
        "{CLIPPED}
        SELECT project_id AS id, COALESCE(CAST(project_id AS TEXT), 'unassigned') AS key,
            COALESCE(p.title, 'No project') AS label, SUM(seconds) AS total_seconds,
            COUNT(*) AS session_count
        FROM clipped c LEFT JOIN projects p ON p.id = c.project_id
        GROUP BY project_id, p.title ORDER BY total_seconds DESC"
    );
    let projects = sqlx::query_as::<_, ActivityDimensionTotal>(&projects_sql)
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

    let tasks_sql = format!(
        "{CLIPPED}
        SELECT reference_id AS id, CAST(reference_id AS TEXT) AS key,
            COALESCE(t.title, 'Deleted task') AS label, SUM(seconds) AS total_seconds,
            COUNT(*) AS session_count
        FROM clipped c LEFT JOIN tasks t ON t.id = c.reference_id
        WHERE c.reference_type = 'task' AND c.reference_id IS NOT NULL
        GROUP BY reference_id, t.title ORDER BY total_seconds DESC"
    );
    let tasks = sqlx::query_as::<_, ActivityDimensionTotal>(&tasks_sql)
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

    let meetings_sql = format!(
        "{CLIPPED}
        SELECT reference_id AS id, CAST(reference_id AS TEXT) AS key,
            COALESCE(m.title, 'Deleted meeting') AS label, SUM(seconds) AS total_seconds,
            COUNT(*) AS session_count
        FROM clipped c LEFT JOIN meetings m ON m.id = c.reference_id
        WHERE c.reference_type = 'meeting' AND c.reference_id IS NOT NULL
        GROUP BY reference_id, m.title ORDER BY total_seconds DESC"
    );
    let meetings = sqlx::query_as::<_, ActivityDimensionTotal>(&meetings_sql)
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

    let types_sql = format!(
        "{CLIPPED}
        SELECT NULL AS id, activity_type AS key,
            CASE activity_type
                WHEN 'focus_session' THEN 'Focus work'
                WHEN 'meeting' THEN 'Meetings'
                ELSE replace(activity_type, '_', ' ')
            END AS label,
            SUM(seconds) AS total_seconds, COUNT(*) AS session_count
        FROM clipped GROUP BY activity_type ORDER BY total_seconds DESC"
    );
    let activity_types = sqlx::query_as::<_, ActivityDimensionTotal>(&types_sql)
        .bind(start_time)
        .bind(end_time)
        .fetch_all(pool)
        .await?;

    Ok(ActivityAnalytics {
        start_time: start_time.to_string(),
        end_time: end_time.to_string(),
        total_seconds: summary.total_seconds,
        focus_seconds: summary.focus_seconds,
        meeting_seconds: summary.meeting_seconds,
        other_seconds: summary.other_seconds,
        session_count: summary.session_count,
        active_days: summary.active_days,
        daily,
        projects,
        tasks,
        meetings,
        activity_types,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    #[test]
    fn analytics_aggregates_and_clips_sessions() {
        tauri::async_runtime::block_on(async {
            let pool = SqlitePoolOptions::new()
                .max_connections(1)
                .connect("sqlite::memory:")
                .await
                .unwrap();
            for statement in [
                "CREATE TABLE projects (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
                "CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
                "CREATE TABLE meetings (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
                "CREATE TABLE activities (id INTEGER PRIMARY KEY, title TEXT NOT NULL, activity_type TEXT NOT NULL, reference_type TEXT, reference_id INTEGER, start_time TEXT NOT NULL, end_time TEXT, project_id INTEGER)",
                "INSERT INTO projects VALUES (1, 'Launch')",
                "INSERT INTO tasks VALUES (10, 'Write brief')",
                "INSERT INTO meetings VALUES (20, 'Kickoff')",
                "INSERT INTO activities VALUES (1, 'Write brief', 'focus_session', 'task', 10, '2026-01-01T09:00:00Z', '2026-01-01T11:00:00Z', 1)",
                "INSERT INTO activities VALUES (2, 'Kickoff', 'meeting', 'meeting', 20, '2026-01-01T11:00:00Z', '2026-01-01T11:30:00Z', 1)",
            ] {
                sqlx::query(statement).execute(&pool).await.unwrap();
            }

            let result =
                get_activity_analytics(&pool, "2026-01-01T10:00:00Z", "2026-01-01T12:00:00Z")
                    .await
                    .unwrap();

            assert_eq!(result.total_seconds, 5_400);
            assert_eq!(result.focus_seconds, 3_600);
            assert_eq!(result.meeting_seconds, 1_800);
            assert_eq!(result.session_count, 2);
            assert_eq!(result.projects[0].label, "Launch");
            assert_eq!(result.tasks[0].label, "Write brief");
            assert_eq!(result.meetings[0].label, "Kickoff");
        });
    }
}
