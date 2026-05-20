---
name: authorization-patterns
description: |
  Guides expert-level authorization patterns implementation: security and design-patterns decision frameworks, production-ready patterns, and concrete templates for authorization patterns workflows.
  Use when the user asks about authorization patterns, authorization patterns configuration, or security best practices for authorization projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security backend design-patterns"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Authorization Patterns

## When to Use

**Use this skill when:**
- User asks how to implement access control in a backend service and needs to choose between RBAC, ABAC, ReBAC, or PBAC models
- User needs to design a permission system for a multi-tenant SaaS application with varying customer-level access policies
- User wants to implement fine-grained authorization and evaluate tools like OPA (Open Policy Agent), Casbin, or a homegrown policy engine
- User is building a microservices architecture and needs to decide whether to enforce authorization at the gateway, at each service, or in a centralized policy decision point (PDP)
- User's current authorization code has grown into an unmaintainable tangle of inline if-checks scattered across business logic and needs to be refactored into a coherent pattern
- User needs to implement row-level security, field-level visibility control, or resource-scoped permissions in an API
- User asks about JWT claims design, token scope strategies, or how to embed authorization data in tokens vs. look it up at runtime
- User is adding audit logging to an authorization system and needs to capture the right decision metadata

**Do NOT use this skill when:**
- User asks about authentication (login flows, session management, OAuth2/OIDC provider configuration) -- use the authentication skill instead
- User needs API gateway configuration in isolation without an authorization design question attached -- use the API gateway skill
- User asks about database access control at the PostgreSQL row security policy level as a standalone DBA topic -- use the database security skill
- User needs general JWT library usage without an authorization design decision -- use the token management skill
- User is asking about network-layer security (firewall rules, VPC policies, IAM for cloud infrastructure) -- use the cloud IAM or infrastructure security skill
- User wants input validation or injection prevention -- use the input validation skill
- User only needs rate limiting or throttling without an access control component -- use the rate limiting skill

---

## Process

### 1. Identify the Authorization Model Required

Start by gathering the access control requirements precisely. The model you choose has deep structural implications and is very hard to change later.

- **RBAC (Role-Based Access Control):** Permissions are assigned to roles, and users are assigned to roles. Correct for most SaaS applications with a limited set of distinct user types (admin, editor, viewer). Works when the number of roles is stable and fewer than ~20.
- **ABAC (Attribute-Based Access Control):** Permissions are evaluated from a policy that considers attributes of the subject (user), resource, action, and environment. Required when "a manager can edit documents owned by members of their department" type logic appears. ABAC policies are written in XACML, Rego (OPA), or Cedar.
- **ReBAC (Relationship-Based Access Control):** Permissions derive from the graph of relationships between users and resources. Google Zanzibar is the canonical example. Required when "a user can edit a document if they are a member of a group that has editor access to the folder containing that document" -- deeply nested, recursive relationship traversal.
- **PBAC (Policy-Based Access Control):** A superset of ABAC where policies are centrally authored, versioned, and evaluated. Common in regulated enterprises using OPA or AWS Cedar.
- Ask the user: How many distinct permission types exist? Do permissions depend on resource ownership? Do they depend on organizational hierarchy? Do they change per tenant?

Quantitative thresholds:
- Fewer than 10 roles, no attribute conditions: pure RBAC is correct
- 10-50 roles with some attribute conditions: RBAC with attribute augmentation
- Dynamic policies that reference resource properties or relationships: ABAC or ReBAC
- Multi-tenant where each tenant defines their own policies: PBAC with tenant-scoped policy namespacing

### 2. Design the Permission Model

Once the model is chosen, define its constituent parts explicitly before writing any code.

- Define the **principal** -- who is making the request. Can be a user, a service account, an API key holder, or a machine identity. Each has different token formats and trust levels.
- Define the **resource** -- what is being accessed. Use a consistent resource naming scheme: `organizations/{org_id}/projects/{project_id}/documents/{doc_id}`. This hierarchical naming directly maps to how ReBAC and ABAC policies traverse ownership.
- Define the **action** -- what operation is being performed. Stick to a canonical verb set: `create`, `read`, `update`, `delete`, `list`, `publish`, `archive`. Avoid inventing ad-hoc verbs per endpoint.
- Define **permission strings** as `resource_type:action` -- for example `document:read`, `project:admin`, `organization:billing_manage`. This is the unit that gets assigned to roles or evaluated in policies.
- Document the full permission matrix as a table before writing code. Rows are resource types, columns are actions, cells describe which roles or attributes grant access.
- Decide whether permissions are **additive** (a user's effective permissions are the union of all their roles' permissions) or **deny-override** (explicit deny beats any allow). Almost all modern systems use additive; deny-override is reserved for regulatory contexts like healthcare or financial auditing.

### 3. Choose the Enforcement Architecture

Where and how authorization checks run has major performance and correctness implications.

- **Inline enforcement (embedded policy library):** The application imports a library (Casbin, OPA Go SDK, or a homegrown role checker) and evaluates authorization directly in the request handler. Latency is <1ms. Correct for monoliths or single-service APIs. Risk: policy logic gets duplicated across services over time.
- **Sidecar enforcement:** A policy engine (OPA) runs as a sidecar container. The application sends authorization requests over localhost HTTP/gRPC. Latency is 1-5ms. Correct for containerized microservices. Policies are centrally authored and pushed to all sidecars via a bundle server.
- **Centralized PDP (Policy Decision Point):** A standalone authorization service (Open Policy Agent, Oso, SpiceDB, Permit.io's engine) evaluates all policy decisions. Applications act as PEPs (Policy Enforcement Points) and call the PDP over the network. Latency is 5-50ms per decision without caching. Correct for organizations that need a single audit trail and unified policy management. Requires a caching layer (Redis with short TTL, or the PDP's built-in cache) to avoid the network being a bottleneck.
- **Gateway enforcement:** Authorization is checked at the API gateway or service mesh layer (Envoy + OPA, Kong + a plugin, AWS API Gateway authorizers). Coarse-grained decisions ("is this token valid and does it have the `api:access` scope") belong here. Fine-grained decisions ("can this user read *this specific document*") must remain in the service, because the gateway does not have resource-level context.
- **Never** rely solely on gateway enforcement. Always enforce at the service layer as well (defense in depth). The gateway catches unauthenticated requests; the service enforces business-level permissions.
- For microservices, the canonical pattern is: JWT validation at gateway → scope check at gateway → resource-level authorization check inside the service (using its own PEP call to the PDP).

### 4. Design Token Claims and Context Propagation

Authorization decisions depend on context. Decide what lives in the token vs. what is fetched at decision time.

- **In the token (JWT claims):** User ID (`sub`), tenant ID (`tid`), a small stable set of roles (`roles: ["editor", "billing_admin"]`), token expiry (`exp`), and the issuer (`iss`). Keep JWT payload under 4KB. Do not embed resource-specific permissions in the token -- they become stale the moment permissions change.
- **Fetched at decision time:** Current group memberships, resource ownership, dynamic attributes, recent policy changes. These are fetched by the PDP or by the service's authorization middleware from a fast read store (a read replica or a dedicated permission cache in Redis).
- For multi-tenant systems, always include the `tid` (tenant ID) claim and validate it against the resource being accessed. A valid JWT with `tid: acme_corp` must never grant access to resources owned by `tenant_id: globex`.
- Propagate authorization context through internal service calls via a dedicated header (`X-Authorization-Context`) that carries the original user identity, not just the calling service's identity. Services should evaluate permissions as if the original user is making the call, not as if a trusted backend is making the call.
- Use a short token TTL for high-security contexts (15 minutes for access tokens) and rely on refresh tokens for session continuity. Permission changes take effect at the next token refresh, so TTL is your maximum permission propagation delay.

### 5. Implement the Policy Enforcement Points (PEPs)

The PEP is the code that halts request processing and asks "is this allowed?" Write PEPs as middleware, not inline business logic.

- Create a single `authorize(principal, resource, action)` function or middleware that is the only place authorization is evaluated. Business logic functions never contain `if user.role == "admin"` checks -- they call `authorize()`.
- In Express/Node.js: write an `authz` middleware factory that takes resource type and action, reads the resource identifier from `req.params`, calls the authorization service, and either calls `next()` or returns 403.
- In Go: use a middleware function that wraps handlers. Pass the resolved principal through `context.Context` so downstream handlers can access it without re-evaluating auth.
- In Python/FastAPI: use a `Depends()` injection chain where `get_current_user()` returns the principal and `authorize_resource(action)` is a dependency that performs the check.
- Always return 403 (Forbidden) when authorization fails, never 404, unless the resource existence itself is sensitive and must be hidden (in which case 404 is intentional and must be documented).
- Log every authorization decision: principal ID, resource ID, action, decision (allow/deny), policy version, and timestamp. This is the audit log. Write it to an append-only store.

### 6. Implement the Policy Decision Logic

Write the actual policy rules using the chosen model's primitives.

**For RBAC with a permission table (SQL example):**
```sql
-- Three-table RBAC schema
CREATE TABLE roles (id UUID PRIMARY KEY, name TEXT UNIQUE, tenant_id UUID);
CREATE TABLE role_permissions (role_id UUID, permission TEXT, PRIMARY KEY (role_id, permission));
CREATE TABLE user_roles (user_id UUID, role_id UUID, tenant_id UUID, PRIMARY KEY (user_id, role_id));

-- Authorization query: does user X have permission Y on tenant Z?
SELECT EXISTS (
  SELECT 1
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  WHERE ur.user_id = $1
    AND ur.tenant_id = $2
    AND rp.permission = $3
);
```

**For ABAC with OPA/Rego:**
```rego
package authz

default allow = false

allow {
  input.action == "document:read"
  user_is_member_of_org[input.resource.org_id]
  not document_is_archived
}

user_is_member_of_org[org_id] {
  data.memberships[input.principal.id][org_id]
}

document_is_archived {
  data.documents[input.resource.id].status == "archived"
}
```

**For ReBAC with SpiceDB (Zanzibar-inspired):**
Define a schema that expresses relations:
```
definition user {}
definition organization {
  relation member: user
  relation admin: user
  permission manage = admin
}
definition document {
  relation owner: user
  relation org: organization
  permission read = owner + org->member
  permission write = owner + org->admin
}
```
Then call `CheckPermission(user:alice, read, document:123)` which traverses the relationship graph.

- Cache policy decisions aggressively when the policy and data are stable. Use a read-through cache keyed by `(principal_id, resource_id, action)` with a TTL of 30-60 seconds. Invalidate on role changes and resource ownership changes.
- Version your policies. Tag each policy artifact with a semantic version. Log the policy version alongside every authorization decision so you can replay decisions during audit investigations.

### 7. Handle Authorization in List and Search Endpoints

The hardest part of authorization is not single-resource checks -- it is filtering collections efficiently.

- Naive approach: fetch all resources, then filter in application code. This is correct but breaks at scale (fetching 100,000 rows to return 12 is not acceptable).
- Correct approach for SQL: push authorization filters directly into the database query using a join or a subquery against the permissions table. This is **query rewriting**.
- For PostgreSQL, use Row Level Security (RLS) policies as a defense-in-depth layer in addition to application-level authorization, not as a replacement for it.
- For Elasticsearch or similar search engines, use document-level security by filtering on a `permitted_users` or `permitted_roles` field stored alongside each document.
- For ReBAC systems like SpiceDB, use the `LookupResources` API which returns all resource IDs a user has a given permission on. Use these IDs as a filter clause in your database query.
- Set a maximum result set size for any list operation (typically 1000 items). Paginate using cursor-based pagination. Never allow unbounded queries.
- Document that list endpoints return "what the caller is allowed to see" not "all resources that exist." This is a security contract, not a convenience feature.

### 8. Test and Audit the Authorization System

Authorization bugs are often silent -- the system returns 200 OK when it should return 403.

- Write a **permission matrix test suite** that explicitly tests every role-action-resource combination listed in the design document. For N roles and M permissions, write N×M tests. These are not unit tests -- they are behavioral contracts.
- Test **negative cases** explicitly: a user with `document:read` cannot perform `document:delete`. A user in tenant A cannot access resources in tenant B. A deactivated user's token cannot perform any action.
- Test **privilege escalation paths**: can a user with `user:invite` grant themselves `admin` role? Can a user modify their own JWT claims? (They cannot -- but verify this in your token validation tests.)
- Use **mutation testing** (tools like Stryker or mutmut) on authorization logic specifically. If deleting a condition in a policy does not cause a test to fail, you have a missing test.
- For OPA/Rego policies, use `opa test` with a dedicated test file that covers every rule branch.
- Run a quarterly **permission audit**: export the full user-role-permission mapping and verify it against the intended design. Look for permission creep (users accumulating roles over time that they no longer need).
- Set up alerting on authorization failure rates. A spike in 403s often indicates an automated attack (permission enumeration), a deployment that broke auth config, or a client bug worth investigating.

---

## Output Format

When responding to a user authorization design question, produce the following structured output:

```
## Authorization Design -- [System Name]

### Model Selection
| Criterion                        | Assessment                      |
|----------------------------------|---------------------------------|
| Number of roles                  | [count]                         |
| Attribute conditions required    | [yes/no -- describe]            |
| Relationship graph traversal     | [yes/no -- describe depth]      |
| Multi-tenant isolation           | [yes/no]                        |
| Policy ownership (dev vs. ops)   | [who authors policies]          |
| **Recommended Model**            | **[RBAC / ABAC / ReBAC / PBAC]**|

### Permission Matrix
| Resource Type     | create | read | update | delete | list | admin |
|-------------------|--------|------|--------|--------|------|-------|
| [resource_type_1] | [roles]| [roles]| [roles]| [roles]| [roles]| [roles]|
| [resource_type_2] | ...    | ...  | ...    | ...    | ...  | ...   |

### Enforcement Architecture
- **Gateway layer:** [scope/token validation only -- yes/no, what checks]
- **Service layer:** [resource-level PEP -- middleware name/location]
- **PDP:** [inline / sidecar / centralized -- tool name]
- **Cache strategy:** [TTL, cache key, invalidation trigger]

### Token Claims Design
```json
{
  "sub": "user_id",
  "tid": "tenant_id",
  "roles": ["role_name"],
  "scope": "api:access",
  "iat": 1700000000,
  "exp": 1700003600
}
```

### Core Policy Implementation
[Code block: SQL schema, Rego policy, or SpiceDB schema as appropriate]

### Enforcement Point Code
[Code block: middleware or decorator implementation in the user's language]

### List Endpoint Strategy
[Description of query rewriting or lookup approach for collection filtering]

### Testing Checklist
- [ ] Permission matrix tests (all role × action combinations)
- [ ] Cross-tenant isolation tests
- [ ] Deactivated principal tests
- [ ] Privilege escalation tests
- [ ] Policy version logging verified
- [ ] Authorization audit log format confirmed

### Known Trade-offs and Risks
[Specific risks for the chosen approach and mitigations]
```

---

## Rules

1. **NEVER scatter `if user.role == X` checks directly in business logic.** All authorization decisions must pass through a single `authorize(principal, resource, action)` boundary. Business logic that contains role checks cannot be tested in isolation and creates authorization drift.

2. **NEVER trust the tenant ID from the request body or URL parameters alone.** Always verify the resource's actual `tenant_id` (fetched from the database) matches the `tid` claim in the authenticated token. Skipping this check is the #1 cause of cross-tenant data leakage in multi-tenant SaaS.

3. **NEVER embed dynamic permission lists in JWT tokens.** Tokens cannot be invalidated mid-flight. If a user's permissions change (role revoked, account suspended), a token with embedded permission claims will continue to grant access until expiry. Put the user ID and roles in the token; look up fine-grained permissions at decision time from a fast store.

4. **ALWAYS return 403 Forbidden, not 404 Not Found, when a resource exists but the caller lacks permission** -- unless the existence of the resource is itself sensitive (e.g., a private user profile). Document any intentional 404-for-auth responses in the API contract. Using 404 silently hides resources from unauthorized users but misleads authorized users who mistype an ID.

5. **NEVER evaluate authorization after the data has already been returned.** The pattern `fetch_resource() → check_permission() → return or error` is wrong because the database round-trip has already occurred. The correct pattern is `check_permission() → fetch_resource() → return` or use query-level filtering so unauthorized records are never loaded.

6. **ALWAYS log the policy version, not just the decision.** Authorization audit logs must contain: `timestamp`, `principal_id`, `resource_id`, `action`, `decision` (allow/deny), `policy_version`, `decision_latency_ms`. Without the policy version, you cannot reproduce a historical authorization decision during an audit.

7. **NEVER use RBAC with more than 50 roles.** Above ~50 roles, the cognitive overhead of role management exceeds the overhead of a simple ABAC policy. Role explosion is a failure mode, not a feature. If you're approaching 50 roles, refactor to ABAC with attribute conditions.

8. **ALWAYS cache authorization decisions with a bounded TTL.** For a centralized PDP, uncached decision latency (5-50ms) will compound across microservice call chains. Use Redis with a 30-60 second TTL keyed on `(principal_id, resource_id, action)`. Invalidate immediately on role change events via a pub/sub channel.

9. **NEVER conflate service-to-service authorization with user authorization.** Internal service calls use mTLS certificates or signed service tokens (not user JWTs). Define a separate principal type for services with its own permission set. A user JWT presented by a compromised internal service should not grant elevated access.

10. **ALWAYS write authorization denial reasons to server-side logs, but return only generic denial messages to clients.** The client receives `{"error": "forbidden"}`. The server log records `denied: user lacks document:write on document_id=X (user has roles: [viewer], required: [editor, admin])`. Returning detailed denial reasons to clients enables permission enumeration attacks.

---

## Edge Cases

### Permission Cache Stale After Role Revocation
When an administrator revokes a user's role (e.g., offboarding, security incident), the user's cached authorization decisions remain valid until TTL expiry -- potentially 30-60 seconds with standard caching. For high-security events (account termination, suspected compromise), implement an **emergency revocation path**: push the user ID to a Redis blocklist set with TTL equal to the maximum token lifetime. Every authorization middleware checks this blocklist before the permission cache. This blocklist check must be fast (a single Redis GET) and must not be skippable.

### Multi-Tenant Policy Isolation with ABAC
When multiple tenants can author their own policies (policy-as-configuration for enterprise customers), policy namespacing is critical. Each tenant's policies must execute in a sandboxed context with access only to their own data slice. In OPA, use bundle namespacing: tenant-specific policies live under `data.tenants.{tenant_id}.authz` and cannot reference `data.tenants.{other_id}`. Validate all tenant-authored policies against a meta-policy (policy about what policies are allowed to do) before activation. Reject any tenant policy that uses `http.send`, file I/O, or references cross-tenant data paths.

### Hierarchical Resource Permissions (Inheritance)
When a user has `project:admin` permission, do they automatically have `document:admin` for all documents in that project? This is permission inheritance, and it must be made explicit rather than assumed. Define inheritance rules in the policy: `allow document:write if allow project:admin on document.project_id`. In ReBAC schemas, this is expressed as a parent relation: `permission write = owner + project->admin`. The risk: unintuitive permission grants where a user doesn't realize their project role grants document access. Always document the full effective permission set (including inherited permissions) in the permission matrix and expose it via a `/permissions/explain` debug endpoint for development environments.

### Wildcard Permissions and Admin Roles
Super-admin roles that grant `*:*` (all permissions on all resources) are necessary but dangerous. Implement the following safeguards: (1) Require a second factor or re-authentication to activate super-admin mode (similar to `sudo`). (2) Log every action taken under a wildcard permission with elevated verbosity. (3) Scope super-admin to specific resource trees where possible (`organization:*` rather than `*:*`). (4) Never issue long-lived tokens for super-admin sessions -- force re-authentication after 1 hour of inactivity. (5) Require two-person authorization for destructive actions even with super-admin privilege (four-eyes principle).

### Authorization in Async/Event-Driven Systems
In event-driven architectures, a message on a queue may be processed long after the originating user's token has expired. The common mistake is to re-use the original JWT for authorization at processing time. The correct pattern is: at publish time, resolve and record the authorization decision alongside the message payload (`{"action": "document.export", "principal_id": "user_123", "authorized_at": "2024-01-15T10:00:00Z", "policy_version": "v2.3.1"}`). The consumer trusts the pre-authorized decision if the event is processed within an acceptable window (e.g., 5 minutes). For long-running async jobs, re-evaluate authorization at key checkpoints using the principal's current permissions fetched from the permission store -- not the original token.

### GraphQL and Field-Level Authorization
REST authorization maps cleanly to HTTP method + resource path. GraphQL requires field-level authorization because a single query can request fields with different sensitivity levels. Implement field-level resolvers that each call `authorize(principal, parent_resource, field_action)`. Use a schema directive approach (`@auth(requires: "document:read_sensitive")`) to declare authorization requirements at the schema level, enforced by a server-side directive handler. Never return a field as `null` silently when the caller lacks permission -- either throw a field-level error with code `FORBIDDEN` or use a permission-aware type that excludes the field from the schema response for unauthorized callers. Mixing these behaviors in the same API without documentation is a source of client confusion and silent data leakage.

### Database-Level vs. Application-Level Authorization
Row Level Security (RLS) in PostgreSQL is a powerful defense-in-depth tool, but it is not a substitute for application-level authorization. RLS operates at the database connection level using session variables (`SET LOCAL app.current_user_id = $1`). The risk: if your application uses a connection pool (PgBouncer in transaction mode), session variables may not be reliably set per-transaction. Use RLS as a secondary layer that catches bugs in the application layer, not as the primary enforcement mechanism. The application layer RBAC/ABAC check always runs first. RLS runs as a safety net. Test that RLS actually blocks unauthorized access by writing integration tests that bypass the application layer and query the database directly with different session variables.

### Authorization for Machine-to-Machine (M2M) APIs
Service accounts and API keys require their own authorization model. Mistakes include: issuing API keys that have the same permission set as human admin users (scope them narrowly to specific operations), not expiring API keys (enforce a maximum lifetime of 1 year with 90-day rotation reminders), and not recording which service generated a key (always store `created_by`, `purpose`, and `last_used_at` on every key). For M2M, use OAuth2 client credentials flow to issue scoped access tokens rather than static API keys where possible. Define a separate `service_account` principal type with its own roles that cannot overlap with human user roles. Service accounts should never have `user:impersonate` or `admin:manage_users` permissions.

---

## Example

**Input:** "We're building a multi-tenant document management SaaS. We have Organizations, Projects inside organizations, and Documents inside projects. Users can be members of an organization with roles of Admin, Editor, or Viewer. We're using Node.js with PostgreSQL and need to figure out the right authorization approach. We'll have roughly 100 tenants at launch with ~500 users."

**Output:**

## Authorization Design -- Document Management SaaS

### Model Selection
| Criterion                        | Assessment                                                     |
|----------------------------------|----------------------------------------------------------------|
| Number of roles                  | 3 per tenant (Admin, Editor, Viewer) -- stable and bounded     |
| Attribute conditions required    | Minimal -- ownership check for delete, active membership check |
| Relationship graph traversal     | Shallow -- 3 levels max (org → project → document)             |
| Multi-tenant isolation           | Yes -- strict tenant boundary required                         |
| Policy ownership                 | Development team authors policies; tenant admins assign roles  |
| **Recommended Model**            | **RBAC with hierarchical resource scoping**                    |

At 3 roles and 3 resource levels, full ABAC is unnecessary overhead. The hierarchical inheritance (org admin implies project admin) is expressible as explicit policy rules in RBAC, not requiring a full ReBAC graph engine. SpiceDB or OPA would be correct at 10x this complexity; for this scope, a well-structured PostgreSQL permission schema plus a clean middleware layer is the right choice.

---

### Permission Matrix

| Resource     | create      | read                | update              | delete              | list                       | manage_members       |
|--------------|-------------|---------------------|---------------------|---------------------|----------------------------|----------------------|
| Organization | (system)    | Admin/Editor/Viewer | Admin               | (system)            | Admin/Editor/Viewer        | Admin                |
| Project      | Admin       | Admin/Editor/Viewer | Admin/Editor        | Admin               | Admin/Editor/Viewer        | Admin                |
| Document     | Admin/Editor| Admin/Editor/Viewer | Admin/Editor        | Admin/Editor (own)* | Admin/Editor/Viewer        | N/A                  |

*An Editor can delete only documents they created. An Admin can delete any document in the project.

---

### Database Schema

```sql
-- Tenants
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects belong to organizations
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL
);

-- Documents belong to projects
CREATE TABLE documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by   UUID NOT NULL REFERENCES users(id),
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Roles scoped to an organization (RBAC)
CREATE TYPE org_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE organization_members (
  user_id         UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            org_role NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);

-- Index for fast membership lookup
CREATE INDEX idx_org_members_user ON organization_members(user_id, organization_id);
```

---

### Token Claims Design

```json
{
  "sub": "usr_01HB5X2KJPQ3R4",
  "tid": "org_01HA3N7MKQP1T2",
  "email": "alice@acme.com",
  "roles": ["editor"],
  "scope": "api:access",
  "iat": 1700000000,
  "exp": 1700003600
}
```

The `tid` claim identifies the tenant. The `roles` array contains the user's role within that tenant. Fine-grained per-resource ownership is not embedded in the token -- it is evaluated at request time using the `documents.created_by` column.

---

### Enforcement Architecture

- **Gateway layer:** Validate JWT signature, check `exp`, verify `scope` includes `api:access`. Return 401 if invalid. No resource-level checks here.
- **Service middleware:** RBAC check runs in Express middleware before the route handler. Ownership check for delete operations runs inside the route handler after the resource is identified but before the delete executes.
- **PDP:** Inline evaluation using a `canUser()` helper that queries the `organization_members` table. Results are cached in-process (node-lru-cache) with a 45-second TTL, keyed on `(user_id, org_id, permission)`.
- **Cache invalidation:** On role change events (member added/removed/updated), emit a Redis pub/sub message to the channel `auth:invalidate:{user_id}`. All instances flush that user's cache entries.

---

### Authorization Middleware (Node.js/Express)

```javascript
// middleware/authorize.js
const { getUserOrgRole } = require('../services/authorizationService');
const { authCache } = require('../services/authCache');
const { createAuditLog } = require('../services/auditLog');

/**
 * Middleware factory: authorize(requiredPermission, options)
 * requiredPermission: e.g., 'project:create', 'document:read'
 * options.getOrgId: function(req) => orgId -- how to extract org from request
 */
function authorize(requiredPermission, options = {}) {
  return async (req, res, next) => {
    const principal = req.user; // set by JWT validation middleware upstream
    const orgId = options.getOrgId
      ? options.getOrgId(req)
      : req.params.orgId || req.body.organizationId;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    // Verify the org ID from the request matches the JWT tenant claim
    if (principal.tid !== orgId) {
      createAuditLog({
        principalId: principal.sub,
        resourceType: 'organization',
        resourceId: orgId,
        action: requiredPermission,
        decision: 'deny',
        reason: 'tenant_mismatch',
        policyVersion: '1.0.0',
      });
      return res.status(403).json({ error: 'forbidden' });
    }

    const cacheKey = `${principal.sub}:${orgId}:${requiredPermission}`;
    let allowed = authCache.get(cacheKey);

    if (allowed === undefined) {
      const role = await getUserOrgRole(principal.sub, orgId);
      allowed = roleHasPermission(role, requiredPermission);
      authCache.set(cacheKey, allowed, 45); // 45-second TTL
    }

    createAuditLog({
      principalId: principal.sub,
      resourceType: requiredPermission.split(':')[0],
      resourceId: orgId,
      action: requiredPermission,
      decision: allowed ? 'allow' : 'deny',
      policyVersion: '1.0.0',
    });

    if (!allowed) {
      return res.status(403).json({ error: 'forbidden' });
    }

    next();
  };
}

// Role-permission mapping -- single source of truth
const ROLE_PERMISSIONS = {
  admin: [
    'organization:read', 'organization:update', 'organization:manage_members',
    'project:create', 'project:read', 'project:update', 'project:delete', 'project:list',
    'document:create', 'document:read', 'document:update', 'document:delete', 'document:list',
  ],
  editor: [
    'organization:read',
    'project:read', 'project:update', 'project:list',
    'document:create', 'document:read', 'document:update', 'document:list',
  ],
  viewer: [
    'organization:read',
    'project:read', 'project:list',
    'document:read', 'document:list',
  ],
};

function roleHasPermission(role, permission) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

module.exports = { authorize, roleHasPermission };
```

---

### Ownership Check for Editor Delete (Route Handler Pattern)

```javascript
// routes/documents.js
router.delete('/:orgId/projects/:projectId/documents/:documentId',
  authenticate,
  authorize('document:delete', { getOrgId: req => req.params.orgId }),
  async (req, res) => {
    const { documentId } = req.params;
    const principal = req.user;

    // Fetch the document to verify it belongs to this project/org (prevents IDOR)
    const document = await db.query(
      `SELECT d.id, d.created_by, p.organization_id
       FROM documents d
       JOIN projects p ON d.project_id = p.id
       WHERE d.id = $1 AND d.project_id = $2 AND p.organization_id = $3`,
      [documentId, req.params.projectId, req.params.orgId]
    );

    if (!document.rows[0]) {
      // Use 404 here because the document genuinely doesn't exist in this context
      return res.status(404).json({ error: 'document not found' });
    }

    const isOwner = document.rows[0].created_by === principal.sub;
    const isAdmin = principal.roles.includes('admin');

    // Editors can only delete their own documents
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'forbidden' });
    }

    await db.query('DELETE FROM documents WHERE id = $1', [documentId]);
    res.status(204).send();
  }
);
```

---

### List Endpoint with Authorization-Aware Query

```javascript
// Fetch documents the user is allowed to see -- never fetch all then filter
async function listDocuments(userId, orgId, projectId) {
  // Authorization is enforced at the join level -- no post-fetch filtering
  const result = await db.query(
    `SELECT d.id, d.title, d.status, d.created_by, d.created_at
     FROM documents d
     JOIN projects p ON d.project_id = p.id
     JOIN organization_members om
       ON om.organization_id = p.organization_id
      AND om.user_id = $1
     WHERE d.project_id = $2
       AND p.organization_id = $3
       AND om.role IN ('admin', 'editor', 'viewer')
       AND d.status = 'active'
     ORDER BY d.created_at DESC
     LIMIT 100`,
    [userId, projectId, orgId]
  );
  return result.rows;
}
```

The `organization_members` join ensures only users who are members of the organization receive results. The query never loads unauthorized documents into application memory.

---

### Testing Checklist

```
Permission matrix tests:
[ ] admin can create/read/update/delete/list documents
[ ] editor can create/read/update/list documents
[ ] editor cannot delete another editor's document
[ ] editor can delete their own document
[ ] viewer can only read and list documents
[ ] viewer receives 403 on document:create
[ ] viewer receives 403 on document:update

Cross-tenant isolation tests:
[ ] user in org_A cannot read documents from org_B using a valid token
[ ] user in org_A with admin role cannot manage members of org_B
[ ] forged orgId in request body is rejected (tid mismatch check)

Principal state tests:
[ ] removed organization member's subsequent request returns 403
[ ] cache invalidation fires on role change and takes effect within 45 seconds

Privilege escalation tests:
[ ] editor cannot call manage_members endpoint
[ ] viewer cannot elevate to editor by modifying request body role field
[ ] JWT with tampered roles claim is rejected by signature validation

Audit log tests:
[ ] every allow decision generates an audit log entry
[ ] every deny decision generates an audit log entry
[ ] audit log contains principal_id, resource_id, action, decision, policy_version
```

---

### Known Trade-offs and Risks

- **In-process cache vs. Redis cache:** The chosen in-process LRU cache means that if a role is revoked, all running Node.js instances will continue to allow access for up to 45 seconds. For most document management use cases this is acceptable. For scenarios involving immediate offboarding after a security incident, add the Redis blocklist pattern described in Edge Cases.
- **Role expansion:** The current RBAC schema assigns one role per user per organization. If customers request project-level roles (different role in different projects), the schema must be extended to `(user_id, project_id, role)`. Build this now or document it as a known limitation, because customers will ask for it.
- **Audit log write latency:** Writing to the audit log on every request adds a database write per authorization check. Move audit log writes to an async queue (a `setImmediate` call writing to a Redis stream, drained by a background worker) if this becomes a bottleneck above ~500 req/s.
