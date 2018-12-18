// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

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
