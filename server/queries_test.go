/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

package server

import (
	"os"
	"testing"
)

func setupTestDB(t *testing.T) func() {
	// Create a temporary database file
	tmpFile, err := os.CreateTemp("", "test_queries_*.db")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	tmpFile.Close()

	// Initialize the database
	if err := InitDB(tmpFile.Name()); err != nil {
		os.Remove(tmpFile.Name())
		t.Fatalf("Failed to initialize database: %v", err)
	}

	// Return cleanup function
	return func() {
		CloseDB()
		os.Remove(tmpFile.Name())
	}
}

func TestInitDB(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	// Database should be initialized - test by getting all queries
	queries, err := GetAllQueries()
	if err != nil {
		t.Fatalf("GetAllQueries failed: %v", err)
	}
	if len(queries) != 0 {
		t.Errorf("Expected 0 queries, got %d", len(queries))
	}
}

func TestCreateQuery(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	input := SavedQueryInput{
		Name:        "Test Query",
		Description: "A test query",
		Category:    "Testing",
		Action:      "query",
		Query:       "{ test { uid } }",
	}

	query, err := CreateQuery(input)
	if err != nil {
		t.Fatalf("CreateQuery failed: %v", err)
	}

	if query.ID == 0 {
		t.Error("Expected non-zero ID")
	}
	if query.Name != input.Name {
		t.Errorf("Expected name %q, got %q", input.Name, query.Name)
	}
	if query.Description != input.Description {
		t.Errorf("Expected description %q, got %q", input.Description, query.Description)
	}
	if query.Category != input.Category {
		t.Errorf("Expected category %q, got %q", input.Category, query.Category)
	}
	if query.Action != input.Action {
		t.Errorf("Expected action %q, got %q", input.Action, query.Action)
	}
	if query.Query != input.Query {
		t.Errorf("Expected query %q, got %q", input.Query, query.Query)
	}
}

func TestCreateQueryDefaults(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	// Create query without category and action - should use defaults
	input := SavedQueryInput{
		Name:  "Minimal Query",
		Query: "{ minimal { uid } }",
	}

	query, err := CreateQuery(input)
	if err != nil {
		t.Fatalf("CreateQuery failed: %v", err)
	}

	if query.Category != "General" {
		t.Errorf("Expected default category 'General', got %q", query.Category)
	}
	if query.Action != "query" {
		t.Errorf("Expected default action 'query', got %q", query.Action)
	}
}

func TestGetQueryByID(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	// Create a query first
	input := SavedQueryInput{
		Name:  "Get By ID Test",
		Query: "{ test { uid } }",
	}
	created, err := CreateQuery(input)
	if err != nil {
		t.Fatalf("CreateQuery failed: %v", err)
	}

	// Get by ID
	query, err := GetQueryByID(created.ID)
	if err != nil {
		t.Fatalf("GetQueryByID failed: %v", err)
	}
	if query == nil {
		t.Fatal("Expected query, got nil")
	}
	if query.ID != created.ID {
		t.Errorf("Expected ID %d, got %d", created.ID, query.ID)
	}
	if query.Name != input.Name {
		t.Errorf("Expected name %q, got %q", input.Name, query.Name)
	}
}

func TestGetQueryByIDNotFound(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	query, err := GetQueryByID(99999)
	if err != nil {
		t.Fatalf("GetQueryByID failed: %v", err)
	}
	if query != nil {
		t.Error("Expected nil for non-existent ID")
	}
}

func TestGetAllQueries(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	// Create multiple queries
	inputs := []SavedQueryInput{
		{Name: "Query 1", Category: "Cat A", Query: "{ q1 }"},
		{Name: "Query 2", Category: "Cat B", Query: "{ q2 }"},
		{Name: "Query 3", Category: "Cat A", Query: "{ q3 }"},
	}

	for _, input := range inputs {
		if _, err := CreateQuery(input); err != nil {
			t.Fatalf("CreateQuery failed: %v", err)
		}
	}

	queries, err := GetAllQueries()
	if err != nil {
		t.Fatalf("GetAllQueries failed: %v", err)
	}
	if len(queries) != 3 {
		t.Errorf("Expected 3 queries, got %d", len(queries))
	}

	// Should be sorted by category, then name
	if queries[0].Category != "Cat A" || queries[0].Name != "Query 1" {
		t.Errorf("Expected first query to be Cat A/Query 1, got %s/%s", queries[0].Category, queries[0].Name)
	}
	if queries[1].Category != "Cat A" || queries[1].Name != "Query 3" {
		t.Errorf("Expected second query to be Cat A/Query 3, got %s/%s", queries[1].Category, queries[1].Name)
	}
	if queries[2].Category != "Cat B" || queries[2].Name != "Query 2" {
		t.Errorf("Expected third query to be Cat B/Query 2, got %s/%s", queries[2].Category, queries[2].Name)
	}
}

func TestUpdateQuery(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	// Create a query
	input := SavedQueryInput{
		Name:        "Original Name",
		Description: "Original Description",
		Category:    "Original",
		Action:      "query",
		Query:       "{ original }",
	}
	created, err := CreateQuery(input)
	if err != nil {
		t.Fatalf("CreateQuery failed: %v", err)
	}

	// Update it
	updateInput := SavedQueryInput{
		Name:        "Updated Name",
		Description: "Updated Description",
		Category:    "Updated",
		Action:      "mutate",
		Query:       "{ updated }",
	}
	updated, err := UpdateQuery(created.ID, updateInput)
	if err != nil {
		t.Fatalf("UpdateQuery failed: %v", err)
	}

	if updated.ID != created.ID {
		t.Errorf("Expected ID %d, got %d", created.ID, updated.ID)
	}
	if updated.Name != updateInput.Name {
		t.Errorf("Expected name %q, got %q", updateInput.Name, updated.Name)
	}
	if updated.Description != updateInput.Description {
		t.Errorf("Expected description %q, got %q", updateInput.Description, updated.Description)
	}
	if updated.Category != updateInput.Category {
		t.Errorf("Expected category %q, got %q", updateInput.Category, updated.Category)
	}
	if updated.Action != updateInput.Action {
		t.Errorf("Expected action %q, got %q", updateInput.Action, updated.Action)
	}
	if updated.Query != updateInput.Query {
		t.Errorf("Expected query %q, got %q", updateInput.Query, updated.Query)
	}
	// UpdatedAt should be >= CreatedAt (may be same if update is fast)
	if updated.UpdatedAt.Before(created.CreatedAt) {
		t.Error("Expected UpdatedAt to be >= CreatedAt")
	}
}

func TestDeleteQuery(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	// Create a query
	input := SavedQueryInput{
		Name:  "To Delete",
		Query: "{ delete_me }",
	}
	created, err := CreateQuery(input)
	if err != nil {
		t.Fatalf("CreateQuery failed: %v", err)
	}

	// Verify it exists
	query, err := GetQueryByID(created.ID)
	if err != nil {
		t.Fatalf("GetQueryByID failed: %v", err)
	}
	if query == nil {
		t.Fatal("Query should exist before deletion")
	}

	// Delete it
	if err := DeleteQuery(created.ID); err != nil {
		t.Fatalf("DeleteQuery failed: %v", err)
	}

	// Verify it's gone
	query, err = GetQueryByID(created.ID)
	if err != nil {
		t.Fatalf("GetQueryByID failed: %v", err)
	}
	if query != nil {
		t.Error("Query should not exist after deletion")
	}
}

func TestDeleteQueryNonExistent(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	// Deleting non-existent query should not error
	if err := DeleteQuery(99999); err != nil {
		t.Errorf("DeleteQuery should not error for non-existent ID: %v", err)
	}
}

func TestMutateAction(t *testing.T) {
	cleanup := setupTestDB(t)
	defer cleanup()

	input := SavedQueryInput{
		Name:   "Mutation Test",
		Action: "mutate",
		Query:  `mutation { set { _:new <name> "test" . } }`,
	}

	query, err := CreateQuery(input)
	if err != nil {
		t.Fatalf("CreateQuery failed: %v", err)
	}

	if query.Action != "mutate" {
		t.Errorf("Expected action 'mutate', got %q", query.Action)
	}
}
