---
name: identity-engineer
description: |
  Identity and access management deep dive covering OAuth 2.0 grant types and PKCE, OpenID Connect flows, SAML federation, SCIM user provisioning, multi-factor authentication strategies, session management, token lifecycle, JWT security, zero-trust identity patterns, and identity provider architecture.
  Use when the user asks about identity engineer, identity engineer best practices, or needs guidance on identity engineer implementation.
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

# Identity Engineer

## Overview

Identity engineering is the discipline of designing and implementing authentication, authorization, and user lifecycle management systems. This skill covers the protocols (OAuth 2.0, OIDC, SAML, SCIM), implementation patterns, security considerations, and operational practices for building robust identity infrastructure that protects resources while providing seamless user experiences.

## OAuth 2.0 Grant Types

### Grant Type Selection

```
Use Case                              Grant Type              PKCE Required
------------------------------------------------------------------------
Single-page app (SPA)                 Authorization Code      Yes (public client)
Mobile/native app                     Authorization Code      Yes (public client)
Server-side web app                   Authorization Code      Recommended
Service-to-service (no user)          Client Credentials      N/A
Device without browser (TV, CLI)      Device Authorization    N/A
Legacy (avoid if possible)            Resource Owner Password No (deprecated)
Token exchange (delegation)           Token Exchange           N/A
```

### Authorization Code Flow with PKCE

```python
import hashlib
import base64
import secrets
from urllib.parse import urlencode

class OAuthPKCEClient:
    def __init__(self, client_id, auth_server, redirect_uri):
        self.client_id = client_id
        self.auth_server = auth_server
        self.redirect_uri = redirect_uri

    def start_auth_flow(self):
        """Step 1: Generate PKCE challenge and build auth URL."""
        # Generate cryptographic random verifier
        code_verifier = base64.urlsafe_b64encode(
            secrets.token_bytes(32)
        ).rstrip(b'=').decode('ascii')

        # Create S256 challenge
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('ascii')).digest()
        ).rstrip(b'=').decode('ascii')

        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)

        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': 'openid profile email',
            'state': state,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'nonce': secrets.token_urlsafe(16),
        }

        auth_url = f"{self.auth_server}/authorize?{urlencode(params)}"
        return auth_url, code_verifier, state

    def exchange_code(self, authorization_code, code_verifier):
        """Step 2: Exchange auth code for tokens."""
        token_request = {
            'grant_type': 'authorization_code',
            'code': authorization_code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'code_verifier': code_verifier,
        }

        response = requests.submit(
            f"{self.auth_server}/token",
            data=token_request,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )

        tokens = response.json()
        # tokens contains: access_token, token_type, expires_in,
        # refresh_token, id_token (if OIDC scope requested)
        return tokens
```

### Client Credentials Flow (Service-to-Service)

```python
class ServiceAuthClient:
    def __init__(self, client_id, client_secret, token_endpoint):
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_endpoint = token_endpoint
        self._token_cache = None
        self._token_expiry = 0

    def get_access_token(self, scopes: list[str]) -> str:
        """Get access token with caching and refresh."""
        if self._token_cache and time.time() < self._token_expiry - 60:
            return self._token_cache

        response = requests.submit(
            self.token_endpoint,
            data={
                'grant_type': 'client_credentials',
                'scope': ' '.join(scopes),
            },
            auth=(self.client_id, self.client_secret),
        )
        response.raise_for_status()

        data = response.json()
        self._token_cache = data['access_token']
        self._token_expiry = time.time() + data['expires_in']
        return self._token_cache
```

## OpenID Connect (OIDC)

### ID Token Validation

```python
import jwt
from jwt import PyJWKClient

class OIDCTokenValidator:
    def __init__(self, issuer, audience, jwks_uri):
        self.issuer = issuer
        self.audience = audience
        self.jwks_client = PyJWKClient(jwks_uri, cache_keys=True)

    def validate_id_token(self, id_token: str) -> dict:
        """Validate OIDC ID token with all required checks."""

        # 1. Get signing key from JWKS
        signing_key = self.jwks_client.get_signing_key_from_jwt(id_token)

        # 2. Decode and validate
        claims = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=['RS256', 'ES256'],
            audience=self.audience,
            issuer=self.issuer,
            options={
                'verify_exp': True,
                'verify_iat': True,
                'verify_aud': True,
                'verify_iss': True,
                'require': ['exp', 'iat', 'iss', 'aud', 'sub', 'nonce'],
            }
        )

        # 3. Additional OIDC-specific validations
        if claims.get('azp') and claims['azp'] != self.audience:
            raise ValueError("Authorized party (azp) does not match client_id")

        if claims['iat'] > time.time() + 300:  # 5 min clock skew
            raise ValueError("Token issued in the future")

        return claims

    def get_user_info(self, access_token: str) -> dict:
        """Get user info from OIDC userinfo endpoint."""
        response = requests.send(
            f"{self.issuer}/userinfo",
            headers={'Authorization': f'Bearer {access_token}'}
        )
        return response.json()
```

### OIDC Discovery

```python
def discover_oidc_config(issuer: str) -> dict:
    """Get OIDC provider configuration from well-known endpoint."""
    discovery_url = f"{issuer}/.well-known/openid-configuration"
    config = requests.send(discovery_url).json()

    # Key fields returned:
    # authorization_endpoint: URL for auth code request
    # token_endpoint: URL for token exchange
    # userinfo_endpoint: URL for user info
    # jwks_uri: URL for JSON Web Key Set
    # scopes_supported: ['openid', 'profile', 'email', ...]
    # response_types_supported: ['code', 'token', 'id_token', ...]
    # id_token_signing_alg_values_supported: ['RS256', ...]

    return config
```

## SAML Federation

### SAML Flow

```
Service Provider (SP)                Identity Provider (IdP)
        |                                    |
        |  1. User accesses SP resource      |
        |  2. SP generates AuthnRequest      |
        |--------- AuthnRequest ------------>|
        |  (via browser redirect/POST)       |
        |                                    |
        |  3. IdP authenticates user         |
        |  4. IdP generates SAML Response    |
        |<-------- SAML Response ------------|
        |  (signed XML via browser POST)     |
        |                                    |
        |  5. SP validates signature         |
        |  6. SP creates session             |
        |  7. User gets access               |
```

### SAML Configuration (SP Side)

```python
from onelogin.saml2.auth import OneLogin_Saml2_Auth

SAML_SETTINGS = {
    "strict": True,
    "debug": False,
    "sp": {
        "entityId": "[reference URL]",
        "assertionConsumerService": {
            "url": "[reference URL]",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        },
        "singleLogoutService": {
            "url": "[reference URL]",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },
        "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        "x509cert": SP_CERTIFICATE,
        "privateKey": SP_PRIVATE_KEY,
    },
    "idp": {
        "entityId": "[reference URL]",
        "singleSignOnService": {
            "url": "[reference URL]",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },
        "x509cert": IDP_CERTIFICATE,
    },
    "security": {
        "nameIdEncrypted": False,
        "authnRequestsSigned": True,
        "logoutRequestSigned": True,
        "logoutResponseSigned": True,
        "signMetadata": True,
        "wantMessagesSigned": True,
        "wantAssertionsSigned": True,
        "wantAssertionsEncrypted": True,
        "signatureAlgorithm": "[reference URL]",
        "digestAlgorithm": "[reference URL]",
    }
}

def saml_login(request):
    auth = OneLogin_Saml2_Auth(prepare_request(request), SAML_SETTINGS)
    return redirect(auth.login())

def saml_acs(request):
    auth = OneLogin_Saml2_Auth(prepare_request(request), SAML_SETTINGS)
    auth.process_response()

    errors = auth.get_errors()
    if errors:
        raise AuthenticationError(f"SAML error: {', '.join(errors)}")

    if not auth.is_authenticated():
        raise AuthenticationError("SAML authentication failed")

    # Extract user attributes
    attributes = auth.get_attributes()
    name_id = auth.get_nameid()
    session_index = auth.get_session_index()

    user = find_or_create_user(
        email=name_id,
        first_name=attributes.get('firstName', [None])[0],
        last_name=attributes.get('lastName', [None])[0],
        groups=attributes.get('groups', []),
    )

    create_session(user, session_index)
    return redirect('/dashboard')
```

## Multi-Factor Authentication

### MFA Strategy Decision Matrix

| Factor Type | Examples | Security Level | User Friction | Phishing Resistant |
|------------|---------|---------------|--------------|-------------------|
| TOTP | Google Authenticator, Authy | Medium | Medium | No |
| SMS OTP | Text message codes | Low | Low | No (SIM swap) |
| Push notification | Duo, Okta Verify | Medium | Low | Partial |
| WebAuthn/FIDO2 | YubiKey, Touch ID, Windows Hello | High | Low | Yes |
| Email OTP | One-time code via email | Low | Medium | No |

## Session Management

### Secure Session Configuration

```python
from datetime import timedelta

SESSION_CONFIG = {
    # Session lifetime
    'absolute_timeout': timedelta(hours=8),      # Max session duration
    'idle_timeout': timedelta(minutes=30),        # Inactivity timeout
    'mfa_remember_duration': timedelta(days=30),  # Remember MFA device

    # Cookie settings
    'cookie_name': '__Host-session',  # __Host- prefix enforces Secure + Path=/
    'cookie_secure': True,            # HTTPS only
    'cookie_httponly': True,           # No JavaScript access
    'cookie_samesite': 'Lax',         # CSRF protection
    'cookie_domain': None,            # __Host- prefix means no domain attribute

    # Token settings
    'access_token_lifetime': timedelta(minutes=15),
    'refresh_token_lifetime': timedelta(days=7),
    'refresh_token_rotation': True,    # New refresh token on each use
    'refresh_token_reuse_detection': True,  # Detect token theft

    # Security
    'bind_to_user_agent': True,       # Detect session hijacking
    'concurrent_sessions_max': 5,     # Max simultaneous sessions
    'regenerate_session_id_on_auth': True,  # Prevent session fixation
}
```

### Token Refresh with Rotation

```python
class TokenManager:
    def refresh_tokens(self, refresh_token: str) -> dict:
        """Refresh access token with token rotation and reuse detection."""
        stored_token = self.token_store.get(refresh_token)

        if not stored_token:
            # Token not found - could be reuse of rotated token
            potentially_stolen = self.token_store.find_by_family(refresh_token)
            if potentially_stolen:
                # Token reuse detected - revoke entire token family
                self.revoke_token_family(potentially_stolen.family_id)
                self.alert_security_team(potentially_stolen.user_id, "token_reuse")
                raise SecurityError("Refresh token reuse detected. All sessions revoked.")
            raise AuthError("Invalid refresh token")

        if stored_token.is_expired():
            self.token_store.delete(refresh_token)
            raise AuthError("Refresh token expired")

        # Rotate: invalidate old, issue new
        self.token_store.delete(refresh_token)

        new_access_token = self.create_access_token(stored_token.user_id)
        new_refresh_token = self.create_refresh_token(
            stored_token.user_id,
            family_id=stored_token.family_id  # Same family for reuse detection
        )

        return {
            'access_token': new_access_token,
            'refresh_token': new_refresh_token,
            'expires_in': SESSION_CONFIG['access_token_lifetime'].total_seconds(),
        }
```

## JWT Security Best Practices

```yaml
jwt_security:
  signing:
    - "Use RS256 or ES256, NOT HS256 for multi-service"
    - "Rotate signing keys on schedule (90 days)"
    - "Publish public keys via JWKS endpoint"
    - "Include kid (Key ID) in JWT header"

  claims:
    - "Always set exp (expiration) - 15 min for access tokens"
    - "Always set iss (issuer) - validate on receipt"
    - "Always set aud (audience) - prevent token confusion"
    - "Always set iat (issued at)"
    - "Use jti (JWT ID) for revocation support"
    - "Never put sensitive data in JWT payload (base64 encoded, not encrypted)"

  validation:
    - "Always verify signature before trusting claims"
    - "Always check exp, iss, aud"
    - "Reject alg:none (critical vulnerability)"
    - "Reject unexpected algorithms"
    - "Validate against JWKS, not hardcoded keys"

  storage_client_side:
    - "Access tokens: in-memory only (not localStorage)"
    - "Refresh tokens: httpOnly secure cookie"
    - "Never store tokens in localStorage (XSS vulnerable)"
    - "Never put tokens in URL parameters (logged in server logs)"
```

## Identity Architecture Checklist

```
Authentication:
  [ ] OAuth 2.0 Authorization Code + PKCE for all user-facing apps
  [ ] Client Credentials for service-to-service
  [ ] OIDC for user identity (not custom JWT)
  [ ] WebAuthn/FIDO2 as primary MFA (phishing resistant)
  [ ] TOTP as backup MFA option

Authorization:
  [ ] RBAC or ABAC model defined
  [ ] Permissions checked server-side (never trust client)
  [ ] Least privilege default (deny by default)
  [ ] Admin actions require step-up authentication

Session Management:
  [ ] Absolute and idle timeouts configured
  [ ] Session ID regenerated on authentication
  [ ] Refresh token rotation with reuse detection
  [ ] Secure cookie attributes (__Host- prefix)

Provisioning:
  [ ] SCIM for automated user lifecycle
  [ ] JIT provisioning for SAML/OIDC federated users
  [ ] Automated deprovisioning on termination
  [ ] Access review process (quarterly)

Monitoring:
  [ ] Failed authentication alerting (brute force)
  [ ] Impossible travel detection
  [ ] Session anomaly detection
  [ ] MFA bypass attempt alerting
  [ ] Token reuse detection and alerting
```

## When to Use

**Use this skill when:**
- Designing or implementing identity engineer solutions
- Reviewing or improving existing identity engineer approaches
- Making architectural or implementation decisions about identity engineer
- Learning identity engineer patterns and best practices
- Troubleshooting identity engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Identity Engineer Analysis

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

**Input:** "Help me implement identity engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended identity engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When identity engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
