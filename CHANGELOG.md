# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- **Saved Queries Feature**: Users can now save, edit, and delete queries directly from the UI
  - New "Saved" dropdown button in the editor panel for quick access to saved queries
  - Queries are stored in a SQLite database for persistence
  - Support for organizing queries by category
  - Queries can be marked as either "query" or "mutate" type
  - Full CRUD operations via REST API (`/api/saved-queries`)

- **New Configuration Options**:
  - `--queries-db` flag to specify the SQLite database path
  - `RATEL_QUERIES_DB` environment variable as alternative configuration
  - Default database location: `<temp-dir>/ratel_queries.db`

- **Save Query Modal**: New modal dialog for saving queries with:
  - Name (required)
  - Description (optional)
  - Category (defaults to "General")
  - Action type (query or mutate)

### Changed

- Replaced YAML-based preloaded queries with SQLite-based saved queries
- Queries are now user-editable through the UI instead of requiring file changes

### Removed

- YAML preloaded queries support (`--preloaded-queries` flag and `RATEL_PRELOADED_QUERIES` env var)
- `preloaded-queries.example.yaml` file

## Previous Changes

For changes prior to this changelog, please refer to the [commit history](https://github.com/dgraph-io/ratel/commits/main).
