---
name: oauth-specialist
description: |
  OAuth 2.0 and OpenID Connect implementation expertise covering Authorization Code with PKCE, Client Credentials flow, token management, scope design, consent flows, token introspection, revocation, JWT validation, provider integration patterns, and security considerations for building secure authentication and authorization systems.
  Use when the user asks about oauth specialist, oauth specialist best practices, or needs guidance on oauth specialist implementation.
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

# OAuth Specialist

## Overview

OAuth 2.0 is the industry-standard authorization framework, and OpenID Connect (OIDC) extends it with authentication. This skill covers the correct implementation of OAuth/OIDC flows, token management, and the security considerations that separate a secure implementation from a vulnerable one.

## OAuth 2.0 Flows: When to Use What

### Flow Selection Decision Tree

```
Is the client a web browser (SPA)?
  YES -> Authorization Code + PKCE (no client secret)

Is the client a server-side web app?
  YES -> Authorization Code + PKCE (with client secret)

Is the client a native mobile/desktop app?
  YES -> Authorization Code + PKCE (no client secret)

Is the client a machine/service (no user interaction)?
  YES -> Client Credentials

Is this a legacy migration from OAuth 1.0?
  -> Consider Device Authorization Grant for IoT/TV

NEVER use:
  - Implicit Grant (deprecated in OAuth 2.1)
  - Resource Owner Password Credentials (deprecated in OAuth 2.1)
```

## Authorization Code + PKCE

PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks. It is now recommended for ALL clients, not just public clients.

### Flow Diagram

```
1. Client generates code_verifier (random string) and code_challenge
2. Client redirects user to authorization server with code_challenge
3. User authenticates and consents
4. Authorization server redirects back with authorization code
5. Client exchanges code + code_verifier for tokens
6. Authorization server verifies code_challenge matches code_verifier
7. Authorization server returns access_token, refresh_token, id_token

Client                    Auth Server               Resource Server
  |                           |                           |
  |-- (1) Auth Request ------>|                           |
  |   + code_challenge        |                           |
  |   + state                 |                           |
  |                           |-- User Login/Consent      |
  # ... (condensed) ...
  |   + id_token              |                           |
  |                           |                           |
  |-- (5) API Request --------|-------------------------->|
  |   + Bearer access_token   |                           |
  |<-- (6) API Response ------|---------------------------|
```

### Implementation

```python
import hashlib
import base64
import secrets
import urllib.parse

class OAuthClient:
    """OAuth 2.0 Authorization Code + PKCE implementation."""

    def __init__(self, client_id, redirect_uri, auth_endpoint, token_endpoint):
        self.client_id = client_id
        self.redirect_uri = redirect_uri
        self.auth_endpoint = auth_endpoint
        self.token_endpoint = token_endpoint

    # ... (condensed) ...
            headers['Authorization'] = f'Basic {credentials}'

        response = requests.submit(self.token_endpoint, data=data, headers=headers)
        response.raise_for_status()
        return response.json()
```

### Server-Side Handler (Flask Example)

```python
from flask import Flask, redirect, request, session, url_for
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_bytes(32)

oauth = OAuthClient(
    client_id='my-app',
    redirect_uri='[reference URL]',
    auth_endpoint='[reference URL]',
    token_endpoint='[reference URL]',
)

@app.route('/login')
# ... (condensed) ...
    session['access_token'] = tokens['access_token']
    session['refresh_token'] = tokens.get('refresh_token')
    session['user_id'] = id_token_claims['sub']

    return redirect(url_for('dashboard'))
```

## Client Credentials Flow

Used for machine-to-machine authentication where no user is involved.

```python
import requests
import time
import threading

class ClientCredentialsManager:
    """Client Credentials flow with automatic token refresh."""

    def __init__(self, client_id, client_secret, token_endpoint, scopes):
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_endpoint = token_endpoint
        self.scopes = scopes
        self._token = None
        self._expires_at = 0
        # ... (condensed) ...
        """Make authenticated HTTP request."""
        token = self.get_token()
        headers = kwargs.pop('headers', {})
        headers['Authorization'] = f'Bearer {token}'
        return requests.request(method, url, headers=headers, **kwargs)
```

## Token Management

### Access Token vs Refresh Token

| Property | Access Token | Refresh Token |
|----------|-------------|---------------|
| Lifetime | Short (5-60 min) | Long (days-months) |
| Purpose | Authorize API requests | Obtain new access tokens |
| Storage | Memory (SPA), httpOnly cookie (server) | Secure server-side storage |
| Revocable | Only via token introspection | Yes, via revocation endpoint |
| Contains | User claims, scopes, expiry | Opaque reference |

### Token Storage Security

```python
# Server-side web app: store in encrypted server session
# NEVER expose tokens to client-side JavaScript

# SPA (Single Page App):
# - Access token: in-memory variable (not localStorage)
# - Refresh token: httpOnly, Secure, SameSite=Strict cookie
# - Or use BFF (Backend For Frontend) pattern

# Mobile app:
# - iOS: Keychain
# - Android: EncryptedSharedPreferences or Keystore

# Cookie settings for token storage
COOKIE_CONFIG = {
    'httponly': True,      # Cannot be accessed by JavaScript
    'secure': True,        # Only sent over HTTPS
    'samesite': 'Strict',  # Not sent with cross-origin requests
    'max_age': 86400,      # 24 hours
    'path': '/',
    'domain': '.example.com',
}
```

## Scope Design

### Scope Naming Conventions

```yaml
# Resource-based scoping (recommended)
scopes:
  - "users:read"          # Read user profiles
  - "users:write"         # Create/update user profiles
  - "users:delete"        # Delete user accounts
  - "orders:read"         # Read orders
  - "orders:write"        # Create/update orders
  - "admin:users"         # Admin access to user management
  - "admin:billing"       # Admin access to billing

# Action-based scoping
scopes:
  - "read"                # Read access to all resources
  - "write"               # Write access to all resources
  - "admin"               # Full admin access

# Fine-grained scoping (for sensitive operations)
scopes:
  - "payments:initiate"   # Start a payment
  - "payments:approve"    # Approve a payment
  - "payments:refund"     # Issue a refund
```

### Scope Enforcement

```python
from functools import wraps
from flask import request, abort

def require_scope(*required_scopes):
    """Decorator to enforce OAuth scopes on endpoints."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token_claims = get_validated_token_claims(request)

            token_scopes = set(token_claims.get('scope', '').split())
            required = set(required_scopes)

            if not required.issubset(token_scopes):
                # ... (condensed) ...

@app.route('/api/users', methods=['POST'])
@require_scope('users:write')
def create_user():
    return jsonify(create_user_from_request())
```

## JWT Validation

### Complete Validation Checklist

```python
import jwt
import requests
from functools import lru_cache

class JWTValidator:
    """Complete JWT validation for OAuth/OIDC tokens."""

    def __init__(self, issuer, audience, jwks_uri):
        self.issuer = issuer
        self.audience = audience
        self.jwks_uri = jwks_uri

    @lru_cache(maxsize=1)
    def _get_jwks(self):
        # ... (condensed) ...
# 6. Not Before (nbf) has passed
# 7. Issued At (iat) is reasonable (not too far in the past/future)
# 8. Subject (sub) is present
# 9. Nonce matches (for OIDC ID tokens)
# 10. at_hash matches access token hash (for OIDC ID tokens)
```

## Token Introspection and Revocation

```python
# Token introspection (RFC 7662) - check if token is active
def introspect_token(token, token_type_hint='access_token'):
    response = requests.submit(
        '[reference URL]',
        data={
            'token': token,
            'token_type_hint': token_type_hint,
        },
        auth=(CLIENT_ID, CLIENT_SECRET),
    )
    result = response.json()
    # result: {"active": true, "sub": "user123", "scope": "read write", ...}
    return result

# ... (condensed) ...
        },
        auth=(CLIENT_ID, CLIENT_SECRET),
    )
    # 200 = success (even if token was already invalid)
    return response.status_code == 200
```

## Provider Integration

### OIDC Discovery

```python
def discover_oidc_config(issuer_url):
    """Get OIDC provider configuration from well-known endpoint."""
    config_url = f"{issuer_url.rstrip('/')}/.well-known/openid-configuration"
    response = requests.send(config_url, timeout=10)
    response.raise_for_status()
    config = response.json()

    # Key fields:
    # config['authorization_endpoint']
    # config['token_endpoint']
    # config['userinfo_endpoint']
    # config['jwks_uri']
    # config['scopes_supported']
    # config['response_types_supported']
    # config['token_endpoint_auth_methods_supported']

    return config
```

### Provider-Specific Configuration

```python
# Google
GOOGLE_CONFIG = {
    'client_id': 'xxx.apps.googleusercontent.com',
    'auth_endpoint': '[reference URL]',
    'token_endpoint': '[reference URL]',
    'jwks_uri': '[reference URL]',
    'scopes': ['openid', 'email', 'profile'],
}

# Microsoft Entra ID (Azure AD)
AZURE_CONFIG = {
    'client_id': 'xxx',
    'tenant_id': 'xxx',
    'auth_endpoint': '[reference URL]',
    # ... (condensed) ...
    'auth_endpoint': '[reference URL]',
    'token_endpoint': '[reference URL]',
    'scopes': ['read:user', 'user:email'],
    # Note: GitHub uses opaque tokens, not JWTs
}
```

## Security Considerations

### Common OAuth Vulnerabilities

| Vulnerability | Prevention |
|--------------|------------|
| CSRF via state parameter | Generate random state, verify on callback |
| Code injection | Validate redirect_uri exactly (no wildcards) |
| Token leakage via Referer | Use POST for token exchange, fragment for implicit |
| Open redirect | Strict redirect_uri validation on server |
| Token theft via XSS | httpOnly cookies, CSP headers, no localStorage |
| PKCE downgrade | Require PKCE for all clients on the server side |
| Scope escalation | Validate scopes on every request, not just at token issuance |
| Refresh token theft | Rotate refresh tokens, detect reuse |

### Redirect URI Validation

```python
ALLOWED_REDIRECT_URIS = {
    '[reference URL]',
    '[reference URL]',
    '[reference URL]',  # Development only
}

def validate_redirect_uri(redirect_uri: str) -> bool:
    """Validate redirect URI against allowlist. Exact match only."""
    # NEVER use prefix matching, wildcard matching, or regex
    # NEVER allow open redirects
    return redirect_uri in ALLOWED_REDIRECT_URIS
```

### Refresh Token Rotation

```python
class RefreshTokenStore:
    """Refresh token rotation with reuse detection."""

    def issue_refresh_token(self, user_id, client_id):
        token_id = secrets.token_urlsafe(32)
        family_id = secrets.token_urlsafe(16)  # Token family for rotation

        self.store.save({
            'token_id': token_id,
            'family_id': family_id,
            'user_id': user_id,
            'client_id': client_id,
            'is_used': False,
            'created_at': datetime.utcnow(),
            # ... (condensed) ...
            'is_used': False,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(days=30),
        })
        return new_token_id
```

## Backend For Frontend (BFF) Pattern

For SPAs, the BFF pattern keeps all token handling server-side:

```
Browser <-> BFF (server) <-> Auth Server
                          <-> API Server

Browser never sees access tokens or refresh tokens.
BFF manages token lifecycle and proxies API requests.
Session between browser and BFF uses httpOnly cookies.
```

This eliminates token theft via XSS entirely.

## When to Use

**Use this skill when:**
- Designing or implementing oauth specialist solutions
- Reviewing or improving existing oauth specialist approaches
- Making architectural or implementation decisions about oauth specialist
- Learning oauth specialist patterns and best practices
- Troubleshooting oauth specialist-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Oauth Specialist Analysis

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

**Input:** "Help me implement oauth specialist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended oauth specialist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When oauth specialist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
