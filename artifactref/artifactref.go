package artifactref

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	commonv1 "github.com/byte-v-forge/common-lib/gen/go/byte/v/forge/contracts/common/v1"
	"github.com/byte-v-forge/common-lib/hashx"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Artifact struct {
	ContentType string
	SizeBytes   int64
	Body        []byte
}

type Resolver interface {
	ResolveArtifact(ctx context.Context, ref *commonv1.ArtifactRef) (Artifact, error)
}

func New(artifactID string, uri string, contentType string, sizeBytes int64, purpose string, expiresAt time.Time) *commonv1.ArtifactRef {
	artifactID = strings.TrimSpace(artifactID)
	if artifactID == "" {
		return nil
	}
	ref := &commonv1.ArtifactRef{
		ArtifactId:  artifactID,
		Uri:         strings.TrimSpace(uri),
		ContentType: strings.TrimSpace(contentType),
		SizeBytes:   sizeBytes,
		Purpose:     strings.TrimSpace(purpose),
	}
	if !expiresAt.IsZero() {
		ref.ExpiresAt = timestamppb.New(expiresAt)
	}
	return ref
}

func Clone(ref *commonv1.ArtifactRef, defaultPurpose string) *commonv1.ArtifactRef {
	if !Configured(ref) {
		return nil
	}
	return &commonv1.ArtifactRef{
		ArtifactId:  strings.TrimSpace(ref.GetArtifactId()),
		Uri:         strings.TrimSpace(ref.GetUri()),
		ContentType: strings.TrimSpace(ref.GetContentType()),
		SizeBytes:   ref.GetSizeBytes(),
		Purpose:     firstNonEmpty(ref.GetPurpose(), defaultPurpose),
		ExpiresAt:   ref.GetExpiresAt(),
	}
}

func Configured(ref *commonv1.ArtifactRef) bool {
	return strings.TrimSpace(ref.GetArtifactId()) != ""
}

func Validate(ref *commonv1.ArtifactRef) error {
	if !Configured(ref) {
		return errors.New("artifact_id is required")
	}
	if strings.TrimSpace(ref.GetPurpose()) == "" {
		return errors.New("artifact purpose is required")
	}
	return nil
}

func StableID(prefix string, parts ...string) string {
	prefix = cleanSegment(prefix)
	if prefix == "" {
		prefix = "artifact"
	}
	clean := make([]string, 0, len(parts))
	for _, part := range parts {
		if value := strings.TrimSpace(part); value != "" {
			clean = append(clean, value)
		}
	}
	if len(clean) == 0 {
		return prefix
	}
	return fmt.Sprintf("%s-%s", prefix, hashx.ShortSHA256(hashx.StableParts(clean...), 24))
}

func Display(ref *commonv1.ArtifactRef) string {
	if !Configured(ref) {
		return ""
	}
	id := strings.TrimSpace(ref.GetArtifactId())
	if len(id) > 12 {
		id = id[:12]
	}
	if purpose := strings.TrimSpace(ref.GetPurpose()); purpose != "" {
		return purpose + "/" + id
	}
	return id
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value = strings.TrimSpace(value); value != "" {
			return value
		}
	}
	return ""
}

func cleanSegment(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.NewReplacer(" ", "-", "_", "-", "/", "-", ":", "-").Replace(value)
	value = strings.Trim(value, "-")
	return value
}
