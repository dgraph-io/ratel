// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

package server

import (
	"errors"
	"net/url"
)

var errAddrNil = errors.New("addr is empty")

func validateAddr(addr string) (string, error) {
	if addr == "" {
		return "", errAddrNil
	}

	addrURL, err := url.Parse(addr)
	if err != nil {
		return "", err
	}
	if addrURL.Opaque != "" {
		// Maybe the scheme is missing and the url module has parsed the url as
		// if it's in the form "scheme:opaque[?query][#fragment]". For example:
		// "localhost:8080".
		addrURL, err = url.Parse("http://" + addr)
		if err != nil {
			return "", errors.New("addr should be of the form \"[scheme:]//[userinfo@]host[path]\"")
		}
	}
	if addrURL.Host == "" {
		return "", errors.New("host is empty")
	}

	addrURL.ForceQuery = false
	addrURL.RawQuery = ""
	addrURL.Fragment = ""

	return addrURL.String(), nil
}
