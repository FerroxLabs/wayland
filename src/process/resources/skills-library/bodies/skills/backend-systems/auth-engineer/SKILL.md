---
name: auth-engineer
description: |
  Authentication and authorization engineering expertise covering JWT architecture, OAuth 2.0/OIDC flows, session management, RBAC/ABAC, MFA implementation, API key management, token refresh, PKCE flow, and SSO integration.
  Use when the user asks about auth engineer, auth engineer best practices, or needs guidance on auth engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design security"
  category: "backend-systems"
  subcategory: "server-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Auth Engineer

## Purpose

Implement secure, scalable authentication and authorization systems. This skill covers identity protocols, token management, access control patterns, and the security considerations critical for production auth systems.

## Authentication vs Authorization

```
AUTHENTICATION (AuthN): "Who are you?"
  Verifying identity via credentials (password, token, certificate).

AUTHORIZATION (AuthZ): "What can you do?"
  Determining permissions based on identity (role, attribute, policy).

FLOW:
  1. User authenticates (login) -> receives identity token
  2. User makes request with token -> server authorizes the action
  3. If authorized -> perform action
  4. If not authorized -> 403 Forbidden
```

## JWT Architecture

### JWT Structure

```
HEADER.PAYLOAD.SIGNATURE

Header (algorithm + type):
  { "alg": "RS256", "typ": "JWT", "kid": "key-2025-01" }

Payload (claims):
  {
    "sub": "user_abc123",           // Subject (user ID)
    "iss": "[reference URL]", // Issuer
    "aud": "[reference URL]",  // Audience
    "exp": 1705312800,              // Expiration (Unix timestamp)
    "iat": 1705309200,              // Issued at
    "nbf": 1705309200,              // Not before
    "jti": "unique-token-id",       // JWT ID (for revocation)
    "role": "admin",                // Custom claims
    "permissions": ["read:users", "write:users"]
  }

Signature:
  RSASHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), privateKey)
```

### JWT Best Practices

```
DO:
  [x] Use asymmetric keys (RS256, ES256) -- not HS256 for multi-service
  [x] Set short expiry (15min) for access tokens
  [x] Include only necessary claims (keep token small)
  [x] Validate iss, aud, exp, nbf on every request
  [x] Use kid (Key ID) for key rotation
  [x] Store signing keys securely (KMS, Vault)
  [x] Implement token revocation via jti blacklist or short TTL

DO NOT:
  [x] Store sensitive data in JWT payload (it is base64, not encrypted)
  [x] Use JWTs as session storage (no logout capability without blacklist)
  [x] Trust JWT without signature verification
  [x] Accept "alg": "none" (algorithm confusion attack)
  [x] Use long-lived access tokens (>1 hour)
```

### Token Pair Strategy

```
ACCESS TOKEN:
  - Short-lived (15 minutes)
  - Sent with every API request (Authorization: Bearer <token>)
  - Contains identity and permissions
  - Stateless verification (no database lookup)

REFRESH TOKEN:
  - Long-lived (7-30 days)
  - Stored securely (httpOnly cookie or secure storage)
  - Used ONLY to obtain new access tokens
  - Stored in database (allows revocation)
  - One-time use (rotate on each refresh)
```

```ts
// Token refresh flow
async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  // 1. Validate refresh token exists in database
  const storedToken = await db.refreshTokens.findUnique({
    where: { token: hashToken(refreshToken) },
  });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    // Possible token theft -- revoke entire family
    if (storedToken?.familyId) {
      await db.refreshTokens.updateMany({
        where: { familyId: storedToken.familyId },
        data: { revokedAt: new Date() },
      });
    }
    throw new UnauthorizedException('Invalid refresh token');
  }

  # ... (condensed) ...
      familyId: storedToken.familyId,
      expiresAt: addDays(new Date(), 30),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}
```

## OAuth 2.0 / OIDC Flows

### Flow Selection

```
FLOW                        USE CASE
-------------------------------------------------------------
Authorization Code + PKCE   Web apps, mobile apps, SPAs (RECOMMENDED)
Client Credentials          Machine-to-machine (no user)
Device Code                 Smart TVs, CLI tools, IoT
Implicit (DEPRECATED)       Do not use -- use Auth Code + PKCE instead
ROPC (DEPRECATED)           Do not use -- legacy password grant
```

### Authorization Code + PKCE Flow

```
PKCE (Proof Key for Code Exchange):
  Prevents authorization code interception attacks.
  Required for public clients (SPAs, mobile apps).
  Recommended for ALL clients.

FLOW:
  1. Client generates code_verifier (random string)
     and code_challenge (SHA256 hash of verifier)

  2. Client redirects user to authorization server:
     GET /authorize?
       response_type=code&
       client_id=CLIENT_ID&
       redirect_uri=[reference URL]
       scope=openid profile email&
       state=random_state_value&
       code_challenge=BASE64URL(SHA256(code_verifier))&
       code_challenge_method=S256
# ... (condensed) ...
     {
       "access_token": "eyJ...",
       "refresh_token": "dGhpcyBpcyBh...",
       "id_token": "eyJ...",       // OIDC
       "token_type": "Bearer",
       "expires_in": 900
     }
```

```ts
// PKCE implementation
import { randomBytes, createHash } from 'crypto';

function generatePKCE() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

// Store verifier in session/cookie, send challenge to /authorize
const { verifier, challenge } = generatePKCE();
session.codeVerifier = verifier;

const authorizeUrl = new URL('[reference URL]');
authorizeUrl.searchParams.set('response_type', 'code');
authorizeUrl.searchParams.set('client_id', CLIENT_ID);
authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authorizeUrl.searchParams.set('scope', 'openid profile email');
authorizeUrl.searchParams.set('state', generateState());
authorizeUrl.searchParams.set('code_challenge', challenge);
authorizeUrl.searchParams.set('code_challenge_method', 'S256');
```

## Session Management

### Session Strategy Selection

```
JWT (Stateless):
  + No server-side storage
  + Scales horizontally without shared state
  + Fast verification (no DB lookup)
  - Cannot revoke individual tokens (without blacklist)
  - Token size grows with claims
  - Best for: APIs, microservices, short-lived operations

Server Sessions (Stateful):
  + Immediate revocation (delete session)
  + Small cookie (just session ID)
  + Full control over session data
  - Requires server-side storage (Redis, DB)
  - Must handle session affinity or shared storage
  - Best for: Traditional web apps, apps needing instant logout

HYBRID (Recommended for most apps):
  - Short-lived JWT access token (15min, stateless)
  - Server-side refresh token (30 days, in database)
  - Best of both worlds
```

### Secure Cookie Configuration

```ts
// Session cookie settings
const sessionCookie = {
  name: '__session',
  httpOnly: true,       // Not accessible via JavaScript
  secure: true,         // HTTPS only
  sameSite: 'lax',      // CSRF protection ('strict' for high-security)
  path: '/',
  domain: '.example.com',
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// CSRF token cookie (readable by JavaScript for form submission)
const csrfCookie = {
  name: '__csrf',
  httpOnly: false,      // JavaScript needs to read this
  secure: true,
  sameSite: 'strict',
  path: '/',
};
```

## RBAC (Role-Based Access Control)

```ts
// Role and permission definitions
const ROLES = {
  admin: {
    permissions: ['users:read', 'users:write', 'users:delete',
                  'orders:read', 'orders:write', 'settings:manage'],
  },
  editor: {
    permissions: ['users:read', 'orders:read', 'orders:write',
                  'content:read', 'content:write'],
  },
  viewer: {
    permissions: ['users:read', 'orders:read', 'content:read'],
  },
} as const;

// Authorization middleware
function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    # ... (condensed) ...
    next();
  };
}

// Usage
app.delete('/api/users/:id', requirePermission('users:delete'), deleteUser);
app.get('/api/orders', requirePermission('orders:read'), listOrders);
```

## ABAC (Attribute-Based Access Control)

```ts
// More flexible than RBAC -- uses attributes of user, resource, and context
interface AccessPolicy {
  effect: 'allow' | 'deny';
  conditions: PolicyCondition[];
}

interface PolicyCondition {
  attribute: string;     // user.role, resource.owner, context.time
  operator: 'eq' | 'in' | 'gt' | 'lt' | 'match';
  value: any;
}

// Example policies
const policies: AccessPolicy[] = [
  {
    effect: 'allow',
    conditions: [
      { attribute: 'user.role', operator: 'eq', value: 'admin' },
    # ... (condensed) ...
  for (const policy of policies) {
    if (policy.conditions.every(c => matchCondition(c, user, resource, action))) {
      return policy.effect === 'allow';
    }
  }
  return false; // Default deny
}
```

## MFA Implementation

```ts
// TOTP (Time-based One-Time Password) setup
import { authenticator } from 'otplib';

// Enrollment
async function enrollMFA(userId: string): Promise<MFASetup> {
  const secret = authenticator.generateSecret();

  // Store encrypted secret
  await db.users.update({
    where: { id: userId },
    data: { mfaSecret: encrypt(secret), mfaEnabled: false },
  });

  const otpauthUrl = authenticator.keyuri(
    user.email,
    'MyApp',
    secret
  );
# ... (condensed) ...
      data: { mfaBackupCodes: user.mfaBackupCodes },
    });
    return generateTokenPair(user);
  }

  throw new UnauthorizedException('Invalid MFA token');
}
```

## API Key Management

```ts
// API key generation and storage
async function createApiKey(userId: string, name: string): Promise<ApiKeyResponse> {
  const keyId = 'key_' + randomBytes(8).toString('hex');
  const secret = randomBytes(32).toString('base64url');
  const fullKey = `${keyId}.${secret}`;

  await db.apiKeys.create({
    data: {
      id: keyId,
      hashedSecret: hashToken(secret),
      userId,
      name,
      permissions: ['read'],
      lastUsedAt: null,
      expiresAt: addDays(new Date(), 365),
    },
  });

  # ... (condensed) ...
    where: { id: keyId },
    data: { lastUsedAt: new Date() },
  });

  req.user = { id: apiKey.userId, permissions: apiKey.permissions };
  next();
}
```

## SSO Integration

```
PROTOCOLS:
  SAML 2.0:  Enterprise SSO (Okta, Azure AD, OneLogin)
  OIDC:      Modern SSO (Google, Auth0, Keycloak)

SAML FLOW:
  1. User accesses Service Provider (SP)
  2. SP redirects to Identity Provider (IdP) with SAML AuthnRequest
  3. User authenticates at IdP
  4. IdP sends SAML Response to SP's ACS endpoint
  5. SP validates SAML assertion and creates session

OIDC FLOW:
  Standard Authorization Code + PKCE flow
  IdP returns id_token with user identity claims
```

## Security Hardening

```
PASSWORD STORAGE:
  - Use bcrypt (cost factor 12) or Argon2id
  - Never store plaintext or MD5/SHA hashes
  - bcrypt has built-in salt

RATE LIMITING AUTH ENDPOINTS:
  - Login:     5 attempts per 15 minutes per IP/account
  - MFA:       5 attempts per 15 minutes
  - Password reset: 3 requests per hour per email
  - API key creation: 10 per hour

BRUTE FORCE PROTECTION:
  - Progressive delays after failed attempts
  - Account lockout after N failures (with unlock flow)
  - CAPTCHA after 3 failed attempts

TOKEN SECURITY:
  - Hash refresh tokens and API keys before storage
  - Use timing-safe comparison for token validation
  - Rotate signing keys periodically (with kid header)
```

## Auth Architecture Checklist

- [ ] Passwords hashed with bcrypt (cost 12+) or Argon2id
- [ ] JWT access tokens short-lived (15 minutes)
- [ ] Refresh tokens stored hashed in database, rotated on use
- [ ] PKCE used for all OAuth flows (including confidential clients)
- [ ] RBAC or ABAC implemented for authorization
- [ ] MFA available with TOTP and backup codes
- [ ] API keys hashed before storage, shown only once
- [ ] Rate limiting on all auth endpoints
- [ ] Secure cookie settings (httpOnly, secure, sameSite)
- [ ] CSRF protection for cookie-based auth
- [ ] Token revocation mechanism in place
- [ ] Signing keys rotated with kid-based selection
- [ ] Audit logging for auth events (login, logout, permission changes)
- [ ] Account lockout after repeated failures

## When to Use

**Use this skill when:**
- Designing or implementing auth engineer solutions
- Reviewing or improving existing auth engineer approaches
- Making architectural or implementation decisions about auth engineer
- Learning auth engineer patterns and best practices
- Troubleshooting auth engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Auth Engineer Analysis

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

**Input:** "Help me implement auth engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended auth engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When auth engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
