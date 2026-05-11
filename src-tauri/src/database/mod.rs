// Database module
// This module provides a new modular database structure

// Re-export connection functionality
pub use connection::init_db;

// New modular structure
pub mod connection;
pub mod models;
pub mod repositories;
