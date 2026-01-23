/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

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
