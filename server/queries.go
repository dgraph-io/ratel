/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

package server

import (
	"database/sql"
	"log"
	"time"

	_ "modernc.org/sqlite"
)

// SavedQuery represents a saved query in the database
type SavedQuery struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Action      string    `json:"action"` // "query" or "mutate"
	Query       string    `json:"query"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// SavedQueryInput is used for creating/updating queries (without ID and timestamps)
type SavedQueryInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Action      string `json:"action"`
	Query       string `json:"query"`
}

// SavedQueriesResponse is the API response for listing queries
type SavedQueriesResponse struct {
	Queries []SavedQuery `json:"queries"`
}

var db *sql.DB

// InitDB initializes the SQLite database connection and creates tables
func InitDB(dbPath string) error {
	var err error
	db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	// SQLite concurrency settings - prevent "database is locked" errors
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	// Enable WAL mode for better concurrent read performance
	if _, err := db.Exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000;`); err != nil {
		log.Printf("Warning: Failed to set SQLite pragmas: %v", err)
	}

	// Create table if not exists
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS saved_queries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		description TEXT DEFAULT '',
		category TEXT DEFAULT 'General',
		action TEXT DEFAULT 'query' CHECK(action IN ('query', 'mutate')),
		query TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`

	if _, err = db.Exec(createTableSQL); err != nil {
		return err
	}

	// Create index separately for better driver compatibility
	if _, err = db.Exec(`CREATE INDEX IF NOT EXISTS idx_category_name ON saved_queries(category, name)`); err != nil {
		return err
	}

	log.Printf("SQLite database initialized at %s", dbPath)
	return nil
}

// CloseDB closes the database connection
func CloseDB() {
	if db != nil {
		db.Close()
	}
}

// GetAllQueries returns all saved queries
func GetAllQueries() ([]SavedQuery, error) {
	rows, err := db.Query(`
		SELECT id, name, description, category, action, query, created_at, updated_at
		FROM saved_queries
		ORDER BY category, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	queries := []SavedQuery{}
	for rows.Next() {
		var q SavedQuery
		err := rows.Scan(&q.ID, &q.Name, &q.Description, &q.Category, &q.Action, &q.Query, &q.CreatedAt, &q.UpdatedAt)
		if err != nil {
			return nil, err
		}
		queries = append(queries, q)
	}

	// Check for iteration errors
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return queries, nil
}

// GetQueryByID returns a single query by ID
func GetQueryByID(id int64) (*SavedQuery, error) {
	var q SavedQuery
	err := db.QueryRow(`
		SELECT id, name, description, category, action, query, created_at, updated_at
		FROM saved_queries
		WHERE id = ?
	`, id).Scan(&q.ID, &q.Name, &q.Description, &q.Category, &q.Action, &q.Query, &q.CreatedAt, &q.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &q, nil
}

// CreateQuery inserts a new query and returns it with the generated ID
func CreateQuery(input SavedQueryInput) (*SavedQuery, error) {
	// Set defaults
	if input.Category == "" {
		input.Category = "General"
	}
	if input.Action == "" {
		input.Action = "query"
	}

	result, err := db.Exec(`
		INSERT INTO saved_queries (name, description, category, action, query)
		VALUES (?, ?, ?, ?, ?)
	`, input.Name, input.Description, input.Category, input.Action, input.Query)

	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return GetQueryByID(id)
}

// UpdateQuery updates an existing query
func UpdateQuery(id int64, input SavedQueryInput) (*SavedQuery, error) {
	// Set defaults
	if input.Category == "" {
		input.Category = "General"
	}
	if input.Action == "" {
		input.Action = "query"
	}

	_, err := db.Exec(`
		UPDATE saved_queries
		SET name = ?, description = ?, category = ?, action = ?, query = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, input.Name, input.Description, input.Category, input.Action, input.Query, id)

	if err != nil {
		return nil, err
	}

	return GetQueryByID(id)
}

// DeleteQuery removes a query by ID
func DeleteQuery(id int64) error {
	_, err := db.Exec(`DELETE FROM saved_queries WHERE id = ?`, id)
	return err
}
