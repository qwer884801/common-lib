package grpcclient

import (
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func NewInsecure(addr string, opts ...grpc.DialOption) (*grpc.ClientConn, error) {
	return newInsecure(strings.TrimSpace(addr), opts...)
}

func NewInsecurePassthrough(addr string, opts ...grpc.DialOption) (*grpc.ClientConn, error) {
	return newInsecure(TargetPassthrough(addr), opts...)
}

func TargetPassthrough(addr string) string {
	addr = strings.TrimSpace(addr)
	if addr == "" || strings.Contains(addr, "://") || strings.HasPrefix(addr, "passthrough:") {
		return addr
	}
	return "passthrough:///" + addr
}

func newInsecure(target string, opts ...grpc.DialOption) (*grpc.ClientConn, error) {
	options := append([]grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}, opts...)
	return grpc.NewClient(target, options...)
}
