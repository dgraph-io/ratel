package server

import "testing"

func TestReadableCommitInfo(t *testing.T) {
	// The exact shape the build script produces: every space replaced.
	const baked = "eb93c19¨•¨¨•¨Thu¨•¨Oct¨•¨1"
	const want = "eb93c19  Thu Oct 1"
	if got := readableCommitInfo(baked); got != want {
		t.Errorf("readableCommitInfo(%q) = %q, want %q", baked, got, want)
	}
}

func TestReadableCommitInfoLeavesOrdinaryTextAlone(t *testing.T) {
	for _, in := range []string{"", "eb93c19", "already has spaces"} {
		if got := readableCommitInfo(in); got != in {
			t.Errorf("readableCommitInfo(%q) = %q, want it unchanged", in, got)
		}
	}
}
