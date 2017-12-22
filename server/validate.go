package server

import (
	"errors"
	"net/url"
)

func validateAddr(addr string) (string, error) {
	addrURL, err := url.Parse(addr)
	if err != nil {
		return "", err
	}
	if addrURL.Opaque != "" {
		// Maybe the scheme is missing (ex. localhost:8080).
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
