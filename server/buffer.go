// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

package server

import (
	"bytes"
	"errors"
	"io"
)

// buffer implements io.ReadSeeker for []byte.
type buffer struct {
	b   *bytes.Buffer
	idx int64
}

func newBuffer(bs []byte) *buffer {
	return &buffer{b: bytes.NewBuffer(bs)}
}

func (b *buffer) Read(bs []byte) (n int, err error) {
	if len(bs) == 0 {
		return 0, nil
	}
	if b.idx >= int64(b.b.Len()) {
		return 0, io.EOF
	}

	n, err = bytes.NewBuffer(b.b.Bytes()[b.idx:]).Read(bs)
	b.idx += int64(n)
	return n, err
}

func (b *buffer) Seek(offset int64, whence int) (idx int64, err error) {
	var abs int64
	switch whence {
	case 0:
		abs = offset
	case 1:
		abs = int64(b.idx) + offset
	case 2:
		abs = int64(b.b.Len()) + offset
	default:
		return 0, errors.New("buffer.Seek: invalid whence")
	}
	if abs < 0 {
		return 0, errors.New("buffer.Seek: negative position")
	}

	b.idx = abs
	return abs, nil
}
