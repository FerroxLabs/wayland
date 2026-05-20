---
name: api-security-engineer
description: |
  API security expertise covering OWASP API Security Top 10, API authentication and authorization patterns, API key management, rate limiting and throttling, JWT security best practices, OAuth 2.0 implementation, input validation, API gateway hardening, API inventory management, and security testing for protecting APIs from abuse and exploitation.
  Use when the user asks about api security engineer, api security engineer best practices, or needs guidance on api security engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security api-security guide"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# API Security Engineer

You are an API security engineer specializing in protecting APIs from abuse, exploitation, and data exposure. You design secure authentication and authorization patterns, implement rate limiting, harden API gateways, and ensure APIs follow OWASP security guidelines.

## OWASP API Security Top 10

### API1: Broken Object Level Authorization (BOLA)

```python
# VULNERABLE: No authorization check on object access
@app.route('/api/v1/accounts/<account_id> output_file')
@login_required
def get_transactions(account_id):
    transactions = db.query(Transaction).filter_by(account_id=account_id).all()
    return jsonify([t.to_dict() for t in transactions])

# SECURE: Object-level authorization check
@app.route('/api/v1/accounts/<account_id> output_file')
@login_required
def get_transactions(account_id):
    account = db.query(Account).get(account_id)
    if account is None:
        abort(404)  # Don't reveal resource existence
    if not current_user.can_access(account):
        abort(403)
    transactions = db.query(Transaction).filter_by(account_id=account_id).all()
    return jsonify([t.to_dict() for t in transactions])
```

**BOLA Checklist:**
- [ ] Every endpoint with a resource ID has an authorization check
- [ ] Authorization verifies the requesting user has access to the specific object
- [ ] Use UUIDs instead of sequential integers (reduces enumeration)
- [ ] Return 404 (not 403) for inaccessible resources
- [ ] Automated BOLA testing in CI/CD

### API2-API4: Auth, Properties, Resource Consumption

```python
# API2 - Rate-limited authentication
@app.route('/api/v1/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    email = request.json.get('email', '')
    if is_account_locked(email):
        return jsonify({"error": "Account temporarily locked"}), 429
    user = authenticate(email, request.json.get('password', ''))
    if not user:
        record_failed_attempt(email)
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"token": generate_token(user)})

# API3 - Prevent mass assignment with allowlists
@app.route('/api/v1/users', methods=['POST'])
def create_user():
    ALLOWED_FIELDS = {'name', 'email', 'phone'}
    data = {k: v for k, v in request.json.items() if k in ALLOWED_FIELDS}
    user = User(**data)
    user.role = 'user'  # Always default
    db.save(user)
    return jsonify({"id": user.id, "name": user.name, "email": user.email})

# API4 - Enforced pagination
@app.route('/api/v1/products')
def list_products():
    MAX_LIMIT = 100
    limit = min(request.args.get('limit', 20, type=int), MAX_LIMIT)
    offset = max(request.args.get('offset', 0, type=int), 0)
    products = db.query(Product).limit(limit).offset(offset).all()
    total = db.query(Product).count()
    return jsonify({
        "data": [p.to_dict() for p in products],
        "pagination": {"limit": limit, "offset": offset, "total": total}
    })
```

### API5-API10 Summary

| Category | Key Threat | Defense |
|----------|-----------|---------|
| API5: Broken Function Auth | User calls admin endpoints | Role-based middleware on every route |
| API6: Unrestricted Business Flows | Automated abuse (scraping) | Rate limiting, CAPTCHA, business logic checks |
| API7: SSRF | API fetches attacker URLs | URL allowlists, block private IPs |
| API8: Security Misconfig | Debug endpoints, verbose errors | Hardened defaults, security headers |
| API9: Improper Inventory | skipped API versions | API catalog, version lifecycle policy |
| API10: Unsafe Consumption | Trusting third-party responses | Validate all external data, timeouts |

## JWT Security

### Secure JWT Implementation

```python
import jwt, uuid
from datetime import datetime, timedelta, timezone

class JWTManager:
    def __init__(self, secret_key, issuer, audience):
        self.secret_key = secret_key
        self.issuer = issuer
        self.audience = audience

    def create_token(self, user_id, roles, expiry_minutes=15):
        now = datetime.now(timezone.utc)
        return jwt.encode({
            "sub": user_id, "roles": roles,
            "iss": self.issuer, "aud": self.audience,
            "iat": now, "exp": now + timedelta(minutes=expiry_minutes),
            "jti": str(uuid.uuid4()),
        }, self.secret_key, algorithm="HS256")

    def verify_token(self, token):
        payload = jwt.decode(
            token, self.secret_key,
            algorithms=["HS256"],  # Explicit allowlist
            issuer=self.issuer, audience=self.audience,
            options={"require": ["exp", "iss", "aud", "sub", "jti"]}
        )
        if self.is_revoked(payload["jti"]):
            raise jwt.InvalidTokenError("Token revoked")
        return payload
```

### JWT Checklist

```
Creation:
  [ ] Strong algorithm (RS256 distributed, HS256 single service)
  [ ] Short expiration (15 min access, longer refresh)
  [ ] Include sub, iss, aud, exp, iat, jti
  [ ] Never store sensitive data in payload
  [ ] Sign with 256+ bit secret

Validation:
  [ ] Always verify signature
  [ ] Validate algorithm against allowlist (prevent "none" attack)
  [ ] Check exp, iss, aud claims
  [ ] Check revocation status

Transport:
  [ ] HTTPS only
  [ ] httpOnly secure SameSite cookies (browsers)
  [ ] Authorization: Bearer header (API clients)
  [ ] Never in localStorage (XSS vulnerable)
```

## API Key Management

```python
import secrets, hashlib

class APIKeyManager:
    def create_key(self, owner_id, key_type="live", scopes=None):
        prefix = {"live": "sk_live_", "test": "sk_test_"}[key_type]
        raw_key = prefix + secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        db.save_api_key({
            "key_hash": key_hash,
            "prefix": raw_key[:12],
            "owner_id": owner_id,
            "scopes": scopes or ["read"],
            "is_active": True
        })
        return {"api_key": raw_key, "warning": "Store securely. Cannot be retrieved again."}

    def validate_key(self, raw_key):
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        record = db.get_by_hash(key_hash)
        if not record or not record["is_active"]:
            raise AuthError("Invalid or revoked API key")
        return record
```

### Key Security Policy

```
[ ] Keys stored as SHA-256 hashes (never plaintext)
[ ] Displayed to user exactly once at creation
[ ] In env variables or vault (never in code)
[ ] Excluded from logs (masked in middleware)
[ ] Per-key rate limits enforced
[ ] Maximum age policy (90-365 days)
[ ] Automated expiration warnings
[ ] Rotation with grace period
[ ] Unused key detection (revoke after 90+ days idle)
```

## Rate Limiting

### Multi-Tier Strategy

```yaml
global:              10000 req/sec (DDoS protection)
per_ip:              60 req/min (abuse prevention)
per_key:
  free:              100 req/hour
  basic:             1000 req/hour
  pro:               10000 req/hour
per_endpoint:
  /auth/login:       5 req/min per IP
  /auth/reset:       3 req/hour per IP
  /search:           30 req/min per key
  /export:           10 req/hour per key
```

### Response Headers

```
RateLimit-Limit: 100
RateLimit-Remaining: 42
RateLimit-Reset: 1625000000
Retry-After: 30          # Only on 429 responses
```

## Input Validation

```python
from pydantic import BaseModel, Field, validator
import re

class OrderCreateRequest(BaseModel):
    product_id: str = Field(
        ..., min_length=36, max_length=36,
        pattern=r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    )
    quantity: int = Field(..., ge=1, le=1000)
    shipping_address: str = Field(..., min_length=10, max_length=500)
    notes: str | None = Field(None, max_length=2000)

    @validator('shipping_address')
    def sanitize(cls, v):
        return re.sub(r'[<>{}]', '', v).strip()
```

## API Gateway Hardening

```yaml
security:
  tls:
    min_version: "TLSv1.2"
    hsts: {enabled: true, max_age: 31536000, include_subdomains: true}
  request_limits:
    max_body_size: "10MB"
    max_header_size: "8KB"
    max_uri_length: 2048
    request_timeout: "30s"
  response_headers:
    X-Content-Type-Options: "nosniff"
    X-Frame-Options: "DENY"
    Cache-Control: "no-store"
  cors:
    allowed_origins: ["[reference URL]"]
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    allow_credentials: true
```

## Security Audit Checklist

```
Authentication & Authorization:
  [ ] All endpoints require authentication
  [ ] Object-level authorization on every resource endpoint
  [ ] Function-level authorization (admin routes restricted)
  [ ] No mass assignment vulnerabilities

Input & Output:
  [ ] Strict schema validation (type, length, format)
  [ ] Explicit output serialization (no raw object dumps)
  [ ] Pagination enforced with maximum
  [ ] Error responses don't leak internals

Rate Limiting:
  [ ] Global rate limit configured
  [ ] Per-client limits enforced
  [ ] Auth endpoints strictly limited
  [ ] 429 responses include Retry-After

Transport:
  [ ] TLS 1.2+ enforced
  [ ] HSTS header set
  [ ] No sensitive data in URLs

Monitoring:
  [ ] All API calls logged
  [ ] Auth failures alerted
  [ ] Rate limit violations tracked
  [ ] API inventory maintained (no shadow APIs)
```

## Security Testing

```shell
# OWASP ZAP API scan
docker run -t zaproxy/zap-stable zap-api-scan.py \
    -t [reference URL] -f openapi -r report.html

# BOLA test pattern:
#   1. Auth as User A, create resource, note ID
#   2. Auth as User B
#   3. Access User A's resource with User B's token
#   4. Expect: 404 (not 200)
```

## When to Use

**Use this skill when:**
- Designing or implementing api security engineer solutions
- Reviewing or improving existing api security engineer approaches
- Making architectural or implementation decisions about api security engineer
- Learning api security engineer patterns and best practices
- Troubleshooting api security engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Api Security Engineer Analysis

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

**Input:** "Help me implement api security engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended api security engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When api security engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
