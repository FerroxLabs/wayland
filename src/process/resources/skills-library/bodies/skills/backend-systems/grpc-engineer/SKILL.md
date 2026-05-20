---
name: grpc-engineer
description: |
  Expert guide for designing and building gRPC services including protobuf schema design, streaming patterns, interceptors, error handling, load balancing, and performance optimization across polyglot environments.
  Use when the user asks about grpc engineer, grpc engineer best practices, or needs guidance on grpc engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design guide"
  category: "backend-systems"
  subcategory: "api-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# gRPC Engineer

You are an expert in designing and building high-performance gRPC services. You guide teams through protobuf schema design, service definition, streaming patterns, interceptor middleware, error handling, and production deployment of gRPC-based systems.

## Core Principles

1. **Schema-first design** - Define your .proto files before writing any service code. The schema is the contract.
2. **Backward compatibility** - Never break existing consumers. Follow protobuf evolution rules strictly.
3. **Streaming when appropriate** - Use unary for simple request/response; streaming for real-time or large payloads.

## Protobuf Schema Design

### Message Best Practices

```protobuf
syntax = "proto3";
package api.v1;

option go_package = "github.com/myorg/myapp/gen/api/v1;apiv1";

import "google/protobuf/timestamp.proto";
import "google/protobuf/field_mask.proto";
import "google/protobuf/wrappers.proto";

message User {
  // Field numbers 1-15 use 1 byte; reserve for frequently accessed fields
  string id = 1;
  string email = 2;
  string display_name = 3;
  UserRole role = 4;
  UserStatus status = 5;

  google.protobuf.Timestamp created_at = 10;
  google.protobuf.Timestamp updated_at = 11;
  google.protobuf.StringValue phone_number = 15;  // Nullable

  reserved 6, 8;
  reserved "legacy_name", "old_email";
}

enum UserRole {
  USER_ROLE_UNSPECIFIED = 0;    // Always have UNSPECIFIED as 0
  USER_ROLE_ADMIN = 1;
  USER_ROLE_EDITOR = 2;
  USER_ROLE_VIEWER = 3;
}
```

### Field Evolution Rules

```
SAFE (backward compatible):
  - Add new fields with new field numbers
  - Add new enum values (not position 0)
  - Add new RPC methods or services

BREAKING (never do):
  - Remove/rename a field or change its number/type
  - Change enum value numbers
  - Remove an RPC method or rename a package

WHEN YOU MUST BREAK:
  - Create a new package version (api.v2)
  - Run both versions during migration
```

## Service Definition

```protobuf
service UserService {
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;         // Opaque cursor
  string filter = 3;
  string order_by = 4;
}

message ListUsersResponse {
  repeated User users = 1;
  string next_page_token = 2;
  int32 total_count = 3;
}

message UpdateUserRequest {
  User user = 1;
  google.protobuf.FieldMask update_mask = 2;
}
```

## Streaming Patterns

### Pattern Decision Matrix

```
PATTERN               USE CASE                        EXAMPLE
---------------------------------------------------------------------
Unary                 Simple request/response         GetUser, CreateOrder
Server streaming      Server pushes multiple items    Subscribe, LargeExport
Client streaming      Client sends multiple items     FileUpload, BatchInsert
Bidirectional         Both sides push messages        Chat, LiveDashboard
```

### Server Streaming (Go)

```go
func (s *server) SubscribeEvents(req *pb.SubscribeRequest, stream pb.Service_SubscribeEventsServer) error {
    ch := s.eventBus.Subscribe(req.Topics)
    defer s.eventBus.Unsubscribe(ch)
    for {
        select {
        case event := <-ch:
            if err := stream.Send(event); err != nil {
                return status.Errorf(codes.Internal, "send failed: %v", err)
            }
        case <-stream.Context().Done():
            return nil
        }
    }
}
```

### Client Streaming (Go)

```go
func (s *server) UploadFile(stream pb.Service_UploadFileServer) error {
    var buf bytes.Buffer
    for {
        chunk, err := stream.Recv()
        if err == io.EOF {
            return stream.SendAndClose(&pb.UploadResponse{
                BytesReceived: int64(buf.Len()),
            })
        }
        if err != nil {
            return err
        }
        buf.Write(chunk.Data)
    }
}
```

## Interceptors (Middleware)

### Common Interceptor Stack

```go
server := grpc.NewServer(
    grpc.ChainUnaryInterceptor(
        recoveryInterceptor,        // 1. Panic recovery (outermost)
        requestIDInterceptor,       // 2. Request ID injection
        loggingInterceptor,         // 3. Request/response logging
        metricsInterceptor,         // 4. Prometheus metrics
        authInterceptor,            // 5. Authentication
        validationInterceptor,      // 6. Request validation
    ),
    grpc.ChainStreamInterceptor(
        streamRecoveryInterceptor,
        streamLoggingInterceptor,
        streamAuthInterceptor,
    ),
)
```

### Authentication Interceptor

```go
func authInterceptor(
    ctx context.Context, req interface{},
    info *grpc.UnaryServerInfo, handler grpc.UnaryHandler,
) (interface{}, error) {
    if info.FullMethod == "/grpc.health.v1.Health/Check" {
        return handler(ctx, req)
    }
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "missing metadata")
    }
    tokens := md.Get("authorization")
    if len(tokens) == 0 {
        return nil, status.Error(codes.Unauthenticated, "missing token")
    }
    claims, err := validateToken(tokens[0])
    if err != nil {
        return nil, status.Errorf(codes.Unauthenticated, "invalid token: %v", err)
    }
    ctx = context.WithValue(ctx, claimsKey, claims)
    return handler(ctx, req)
}
```

## Error Handling

### gRPC Status Codes

```
CODE                  WHEN TO USE
-----------------------------------------------------------
INVALID_ARGUMENT (3)  Client sent bad input (validation)
NOT_FOUND (5)         Resource does not exist
ALREADY_EXISTS (6)    Duplicate resource creation
PERMISSION_DENIED (7) Authenticated but not authorized
UNAUTHENTICATED (16)  Missing or invalid credentials
RESOURCE_EXHAUSTED (8) Rate limit or quota exceeded
FAILED_PRECONDITION (9) System not in required state
ABORTED (10)          Concurrency conflict (retry)
INTERNAL (13)         Internal server error
UNAVAILABLE (14)      Temporarily unavailable (retry)
```

### Rich Error Details

```go
func validateCreateUser(req *pb.CreateUserRequest) error {
    var violations []*errdetails.BadRequest_FieldViolation
    if req.Email == "" {
        violations = append(violations, &errdetails.BadRequest_FieldViolation{
            Field: "email", Description: "Email is required",
        })
    }
    if len(violations) > 0 {
        st := status.New(codes.InvalidArgument, "validation failed")
        detailed, _ := st.WithDetails(&errdetails.BadRequest{FieldViolations: violations})
        return detailed.Err()
    }
    return nil
}
```

## Performance Optimization

### Connection and Keepalive

```go
conn, _ := grpc.Dial(target,
    grpc.WithTransportCredentials(creds),
    grpc.WithKeepaliveParams(keepalive.ClientParameters{
        Time: 10 * time.Second, Timeout: 3 * time.Second,
        PermitWithoutStream: true,
    }),
    grpc.WithDefaultCallOptions(
        grpc.MaxCallRecvMsgSize(10*1024*1024),
        grpc.MaxCallSendMsgSize(10*1024*1024),
    ),
)
```

### Load Balancing

```
CLIENT-SIDE (service-to-service):
  round_robin, pick_first, or custom weighted
  conn, _ := grpc.Dial("dns:///service:50051",
      grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`))

PROXY-BASED (external clients):
  Envoy: full gRPC-aware L7 proxy
  Cloud LBs: GCP has native gRPC support
```

## Code Generation with Buf

```yaml
# buf.gen.yaml
version: v2
plugins:
  - remote: buf.build/protocolbuffers/go
    out: gen
    opt: paths=source_relative
  - remote: buf.build/grpc/go
    out: gen
    opt: paths=source_relative
```

```shell
buf lint                                    # Lint protos
buf breaking --against '.git#branch=main'   # Check breaking changes
buf generate                                # Generate code
```

## Health Checking and Reflection

```go
import "google.golang.org/grpc/health"
import healthpb "google.golang.org/grpc/health/grpc_health_v1"

healthServer := health.NewServer()
healthpb.RegisterHealthServer(grpcServer, healthServer)
healthServer.SetServingStatus("api.v1.UserService", healthpb.HealthCheckResponse_SERVING)

// Reflection (dev/staging only)
reflection.Register(grpcServer)
```

```shell
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext -d '{"id":"user_123"}' localhost:50051 api.v1.UserService/GetUser
```

## Production Checklist

```
SCHEMA:
  [ ] All enums have UNSPECIFIED = 0 value
  [ ] Reserved fields for any removed fields
  [ ] buf lint and breaking change detection in CI

SERVICE:
  [ ] Health check endpoint registered
  [ ] Interceptor chain: recovery > logging > metrics > auth > validation
  [ ] Deadlines propagated across service boundaries
  [ ] Graceful shutdown implemented

PERFORMANCE:
  [ ] Keepalive configured on client and server
  [ ] Max message size set appropriately
  [ ] Client-side load balancing configured

SECURITY:
  [ ] TLS enabled in production (never plaintext)
  [ ] Auth interceptor on all non-health RPCs
  [ ] Reflection disabled in production
  [ ] Input validation on all request messages
```

## When to Use

**Use this skill when:**
- Designing or implementing grpc engineer solutions
- Reviewing or improving existing grpc engineer approaches
- Making architectural or implementation decisions about grpc engineer
- Learning grpc engineer patterns and best practices
- Troubleshooting grpc engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Grpc Engineer Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement grpc engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended grpc engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When grpc engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
