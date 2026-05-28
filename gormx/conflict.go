package gormx

import (
	"strings"

	"gorm.io/gorm/clause"
)

func ConflictColumns(names ...string) []clause.Column {
	columns := make([]clause.Column, 0, len(names))
	for _, name := range names {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		columns = append(columns, clause.Column{Name: name})
	}
	return columns
}

func OnConflictDoNothing(columns ...string) clause.OnConflict {
	return clause.OnConflict{
		Columns:   ConflictColumns(columns...),
		DoNothing: true,
	}
}

func OnConflictUpdateColumns(conflictColumns []string, updateColumns []string) clause.OnConflict {
	return clause.OnConflict{
		Columns:   ConflictColumns(conflictColumns...),
		DoUpdates: clause.AssignmentColumns(trimColumns(updateColumns)),
	}
}

func OnConflictUpdateAssignments(conflictColumns []string, updates map[string]any) clause.OnConflict {
	return clause.OnConflict{
		Columns:   ConflictColumns(conflictColumns...),
		DoUpdates: clause.Assignments(updates),
	}
}

func trimColumns(columns []string) []string {
	out := make([]string, 0, len(columns))
	for _, column := range columns {
		column = strings.TrimSpace(column)
		if column != "" {
			out = append(out, column)
		}
	}
	return out
}
