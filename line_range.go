// SPDX-FileCopyrightText: 2023 M. Shulhan <ms@kilabit.info>
// SPDX-License-Identifier: GPL-3.0-or-later

package awwan

import (
	"strconv"
	"strings"
)

// lineRange contains the start and end of line number.
// For single line, the Start and End must be equal.
// For range that does not have an end, the End value must be zero.
type lineRange struct {
	list []linePosition
}

// parseLineRange parse a line range in the following format,
//
//	line-range = start ["-" [end]] *("," line-range)
//
// The start must be greater than zero.
// The end is optional, if its exist it must be equal or greater than start.
//
// The next line-range must not overlap with previous range, otherwise it will
// be skipped.
func parseLineRange(raw string) (lr lineRange) {
	raw = strings.TrimSpace(raw)
	if len(raw) == 0 {
		return lr
	}

	var (
		listRange = strings.Split(raw, ",")

		rawPos string
		start  int64
		end    int64
		err    error
		ok     bool
	)
	for _, rawPos = range listRange {
		rawPos = strings.TrimSpace(rawPos)
		if len(rawPos) == 0 {
			continue
		}

		var pos = strings.Split(rawPos, "-")
		if len(pos) > 2 {
			// Invalid range.
			continue
		}

		start, err = strconv.ParseInt(pos[0], 10, 64)
		if err != nil || start <= 0 {
			continue
		}
		if len(pos) == 1 {
			lr.add(start, start)
			continue
		}

		if len(pos[1]) == 0 {
			ok = lr.add(start, 0)
			if ok {
				break
			}
			continue
		}

		end, err = strconv.ParseInt(pos[1], 10, 64)
		if err != nil || end < start {
			continue
		}

		lr.add(start, end)
	}
	return lr
}

// add new position to line range.
// It will return true if new position is added to the list.
func (lr *lineRange) add(start, end int64) bool {
	var pos linePosition
	for _, pos = range lr.list {
		if start <= pos.start {
			return false
		}
		if start <= pos.end {
			return false
		}
		continue
	}
	lr.list = append(lr.list, linePosition{start: start, end: end})
	return true
}
