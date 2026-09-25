// Models module
// This module contains all data models

pub mod activity;
pub mod area;
pub mod meeting;
pub mod note;
pub mod page;
pub mod page_pin;
pub mod page_update;
pub mod project;
pub mod task;
pub mod task_checklist;
pub mod task_completion_log;

// Re-export all models for easier access
pub use activity::{Activity, ActivityAnalytics, CreateActivityRequest, UpdateActivityRequest};
pub use area::{Area, CreateAreaRequest, UpdateAreaRequest};
pub use meeting::{CreateMeetingRequest, Meeting, UpdateMeetingRequest, UpdateMeetingUrlRequest};
pub use note::{CreateNoteRequest, Note, UpdateNoteRequest};
pub use page::{CreatePageRequest, Page, UpdatePageRequest};
pub use page_pin::{CreatePagePinRequest, PagePin};
pub use page_update::{CreatePageUpdateRequest, PageUpdate, UpdatePageUpdateRequest};
pub use project::{CreateProjectRequest, Project, UpdateProjectRequest};
pub use task::{CreateTaskRequest, Task, UpdateTaskRequest};
pub use task_checklist::{
    CreateTaskChecklistItemRequest, TaskChecklistItem, UpdateTaskChecklistItemRequest,
};
pub use task_completion_log::{
    CreateTaskCompletionLogRequest, TaskCompletionLog, UpdateTaskCompletionLogRequest,
};
