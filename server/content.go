/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

package server

import (
	"net/http"
	"time"
)

type content struct {
	name    string
	modTime time.Time
	bs      []byte
}

func (c *content) serve(w http.ResponseWriter, r *http.Request) {
	http.ServeContent(w, r, c.name, c.modTime, newBuffer(c.bs))
}
