/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

package server

// PreloadedQueriesConfig represents the YAML configuration file structure
type PreloadedQueriesConfig struct {
	Version string           `yaml:"version" json:"version"`
	Queries []PreloadedQuery `yaml:"queries" json:"queries"`
}

// PreloadedQuery represents a single preloaded query definition
type PreloadedQuery struct {
	Name        string              `yaml:"name" json:"name"`
	Description string              `yaml:"description" json:"description"`
	Category    string              `yaml:"category" json:"category"`
	Action      string              `yaml:"action" json:"action"` // "query" or "mutate"
	Query       string              `yaml:"query" json:"query"`
	Variables   []PreloadedVariable `yaml:"variables" json:"variables"`
}

// PreloadedVariable represents a variable placeholder in a query
type PreloadedVariable struct {
	Name        string `yaml:"name" json:"name"`
	Type        string `yaml:"type" json:"type"` // "string", "int", "float", "bool"
	Label       string `yaml:"label" json:"label"`
	Description string `yaml:"description" json:"description"`
	Required    bool   `yaml:"required" json:"required"`
	Default     string `yaml:"default" json:"default"`
	Placeholder string `yaml:"placeholder" json:"placeholder"`
}

// PreloadedQueriesResponse is the API response structure
type PreloadedQueriesResponse struct {
	Enabled bool             `json:"enabled"`
	Queries []PreloadedQuery `json:"queries"`
}
