package accountmodel

import "github.com/byte-v-forge/common-lib/pagex"

const (
	DefaultPageLimit = pagex.DefaultLimit
	MaxPageLimit     = pagex.MaxLimit
)

func NormalizePageLimit(limit int) int {
	return pagex.NormalizePageLimit(limit)
}
