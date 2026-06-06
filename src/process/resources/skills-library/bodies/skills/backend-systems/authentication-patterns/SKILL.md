---
name: authentication-patterns
description: |
  Guides expert-level authentication patterns implementation: security and web-development decision frameworks, production-ready patterns, and concrete templates for authentication patterns workflows.
  Use when the user asks about authentication patterns, authentication patterns configuration, or security best practices for authentication projects.
  Do NOT use when the user needs a different backend infrastructure capability -- check sibling skills in the backend infrastructure subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security backend web-development"
  category: "backend-systems"
  subcategory: "backend-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Authentication Patterns

## When to Use

**Use this skill when:**
- User asks how to implement login, registration, or session management in a web or mobile application
- User needs to choose between JWT, session cookies, OAuth 2.0, OpenID Connect, API keys, or passkeys for their specific system
- User is designing a multi-tenant SaaS application and needs to handle authentication isolation between tenants
- User needs to add MFA (multi-factor authentication) to an existing system and wants to know which second factors to support and how to implement them
- User is building a machine-to-machine (M2M) API and needs to authenticate service accounts or backend clients
- User wants to understand token storage strategies, rotation policies, and revocation mechanisms
- User needs to secure a REST API or GraphQL API with authentication middleware
- User is experiencing auth-related security incidents (token leakage, session fixation, credential stuffing) and needs remediation guidance
- User wants to implement social login (Google, GitHub, Apple) alongside native credentials

**Do NOT use this skill when:**
- User needs authorization (role-based access control, attribute-based access control, permission modeling) -- use the authorization-patterns skill instead
- User needs to implement rate limiting or DDoS protection for login endpoints -- use the api-rate-limiting skill
- User needs secrets management for application credentials (database passwords, API keys stored server-side) -- use the secrets-management skill
- User needs to audit or pen-test an existing auth system -- use the security-audit skill
- User needs OAuth 2.0 provider implementation (building an identity provider, not consuming one) -- use the oauth-provider skill
- User is asking about database-level row security or query-level access control -- use the database-security skill

---

## Process

### 1. Classify the Authentication Context

Before recommending any pattern, establish which category of authentication the user actually needs. These have fundamentally different solutions.

- **Human-to-machine (H2M):** A real user logging into a web app, mobile app, or desktop client. Use session cookies for web, short-lived JWT access tokens + refresh tokens for SPAs and mobile.
- **Machine-to-machine (M2M):** A backend service or scheduled job calling another service's API. Use OAuth 2.0 Client Credentials flow or static API keys with IP allowlisting.
- **Third-party delegated access:** A user granting your application access to their data on another platform. Use OAuth 2.0 Authorization Code flow with PKCE.
- **Enterprise SSO:** A corporate user authenticating through their company's identity provider. Use SAML 2.0 or OpenID Connect with a federated IdP.
- **Passwordless:** User authenticates via email magic link, WebAuthn/passkey, or biometric. No shared secret is ever transmitted.

Identify which category applies -- or if the system must support multiple categories simultaneously. A SaaS product commonly needs H2M for end users AND M2M for its own backend services AND enterprise SSO for enterprise customers.

### 2. Map Requirements to the Authentication Decision Matrix

Collect the following constraints explicitly from the user before recommending a pattern:

- **Session lifetime requirements:** Is a 15-minute access token acceptable, or does the business require persistent login (e.g., banking vs. social media)?
- **Stateless vs. stateful:** Can the system tolerate a token store/session database, or must auth be stateless for horizontal scaling?
- **Token revocation needs:** Does the user/admin need to immediately invalidate sessions (e.g., after password reset, account lockage)? Stateless JWT makes this hard.
- **Client type:** Browser (cookie security matters), native mobile (no HttpOnly cookies, use Secure Enclave or Keychain), CLI tool (device flow or API key).
- **Compliance requirements:** HIPAA, PCI-DSS, FedRAMP, SOC 2 -- each has specific requirements around session timeout, MFA, audit logging, and encryption.
- **Team's current infrastructure:** Is there an existing identity provider (Auth0, Cognito, Keycloak, Okta)? If so, integrating with it via OIDC is almost always preferable to building from scratch.
- **Scale:** Single instance vs. multi-region. Session affinity is a problem at scale; stateless tokens are better for multi-region but require careful key management.

### 3. Select the Core Authentication Pattern

Use this decision tree:

**If the client is a traditional server-rendered web app (Rails, Django, Laravel, Express with server-side templates):**
-- Use server-side sessions with HttpOnly, Secure, SameSite=Strict cookies. Store session data in Redis or a database. This is the simplest, most secure pattern for this context.

**If the client is a SPA (React, Vue, Angular) or mobile app:**
-- Use OAuth 2.0 Authorization Code flow with PKCE. Issue short-lived access tokens (15 minutes) and rotate refresh tokens on every use (rolling refresh token rotation). Store access tokens in memory (not localStorage). Store refresh tokens in HttpOnly cookies or platform secure storage.

**If the API is consumed by trusted backend services you control:**
-- Use OAuth 2.0 Client Credentials flow. Issue long-lived client secrets stored in a vault (never in code). Rotate secrets on a schedule (90-day maximum) or immediately on suspected compromise.

**If you need enterprise SSO:**
-- Implement OpenID Connect (OIDC) as the primary protocol; add SAML 2.0 support for enterprises that mandate it. OIDC is preferred -- SAML is XML-based, complex, and has a larger attack surface. Use a library (passport-saml, python-saml3, Spring Security SAML) rather than writing a parser.

**If you want passwordless:**
-- WebAuthn/FIDO2 (passkeys) is the most secure option. Magic links are acceptable for low-sensitivity apps. TOTP via authenticator app is a reasonable middle ground when passkeys can't be mandated.

### 4. Design the Token and Session Architecture

The implementation details that separate production-ready auth from toy implementations:

**JWT (JSON Web Tokens):**
- Use RS256 (RSA, asymmetric) for tokens that multiple services must verify. Never share a private key across services.
- Use HS256 (HMAC, symmetric) only when the issuer and all verifiers are the same service or share a secret securely.
- Minimum payload: `sub` (subject/user ID), `iat` (issued at), `exp` (expiration), `jti` (JWT ID for revocation lookup). Avoid putting sensitive data (email, role details) in the payload -- it is base64-encoded, not encrypted.
- Access token TTL: 5--15 minutes. Refresh token TTL: 7--30 days for consumer apps, 1--8 hours for high-security contexts.
- If you must revoke JWTs immediately, maintain a deny-list in Redis keyed by `jti`. Check it on every request. This adds latency (~1ms at p99 in Redis) but is often worth it for security-critical apps.

**Session cookies:**
- Set `HttpOnly` (prevents XSS JavaScript access), `Secure` (HTTPS only), `SameSite=Lax` or `SameSite=Strict` (prevents CSRF).
- `SameSite=Strict` breaks OAuth redirects from third-party IdPs -- use `SameSite=Lax` if supporting social login.
- Session ID must be at least 128 bits of cryptographic randomness. Use `crypto.randomBytes(32)` (Node.js), `secrets.token_hex(32)` (Python), or equivalent.
- Session store: Redis with TTL set to session expiry. Use a dedicated Redis instance or at minimum a dedicated database index, not the same Redis used for caching.
- Regenerate session ID after login (prevents session fixation attacks).

**Refresh token rotation:**
- Issue a new refresh token on every use and immediately invalidate the old one.
- If an already-used refresh token is presented, assume token theft -- invalidate the entire refresh token family (all tokens derived from the original login event). Log and alert.
- Store refresh tokens as a secure hash (bcrypt or SHA-256) in the database, never in plaintext.

### 5. Implement Credential Handling and Password Storage

Password storage is a solved problem -- use the right algorithm and nothing else.

**Password hashing algorithm selection (2024 guidance):**
- **Argon2id** -- first choice. Winner of the Password Hashing Competition. Use a minimum time cost of 2, memory cost of 64MB, parallelism of 2. Adjust upward until hash time is 200--500ms on your server hardware.
- **bcrypt** -- acceptable fallback if Argon2 is unavailable. Use work factor 12 or higher. Work factor 10 is minimum acceptable; factor 14+ is appropriate for high-security contexts. Factor 12 takes ~300ms on a modern server.
- **scrypt** -- acceptable alternative. N=32768, r=8, p=1 is the minimum; N=65536 preferred.
- **PBKDF2 with SHA-256, 600,000 iterations** -- use only when FIPS compliance is required (e.g., FedRAMP).
- **NEVER use:** MD5, SHA-1, SHA-256 without a proper KDF, unsalted hashes, or any encryption (passwords should not be recoverable).

**Credential validation during login:**
- Use constant-time comparison to prevent timing attacks. Never use `==` or `equals()` for comparing tokens or hashes -- use `hmac.compare_digest()` (Python), `crypto.timingSafeEqual()` (Node.js), or `hash_equals()` (PHP).
- Lock accounts or introduce progressive delays after failed attempts. Recommended: exponential backoff starting at attempt 5, hard lockout at attempt 10 with unlock via email. Alternatively, use a CAPTCHA after 3 failures (less disruptive).
- Pepper passwords in addition to salting: apply an HMAC with an application-level secret before hashing. Store the pepper in a vault, not in the database. This means a database dump alone does not yield crackable hashes.

**Credential stuffing protection:**
- Check submitted passwords against Have I Been Pwned (HIBP) API using k-anonymity (send only first 5 characters of SHA-1 hash). Reject passwords found in breaches.
- Implement login velocity monitoring: more than 5 login attempts per IP per minute is suspicious. More than 20 per minute is almost certainly automated.

### 6. Implement Multi-Factor Authentication (MFA)

MFA should be designed as a first-class feature, not bolted on. Plan the enrollment flow, recovery flow, and bypass policies from the start.

**Second factor options by security tier:**

| Factor | Security | UX | Phishing Resistant | Notes |
|--------|----------|----|--------------------|-------|
| WebAuthn/Passkey | Very High | High | Yes | Best option when usable |
| TOTP (Authenticator app) | High | Medium | No | TOTP codes can be phished in real time |
| SMS OTP | Medium | High | No | SIM-swap attack vector; avoid for high-security |
| Email OTP | Medium | High | No | Acceptable when email account is itself secured |
| Push notification | High | Very High | Partial | Requires proprietary app or Duo/Okta |
| Hardware key (FIDO2) | Very High | Medium | Yes | Best for privileged accounts |

**TOTP implementation specifics:**
- Use RFC 6238 compliant TOTP. Code period: 30 seconds. Window tolerance: +/- 1 period (accept codes from t-1, t, t+1 to handle clock skew).
- Secret must be 160 bits (20 bytes) minimum, generated with CSPRNG. Store encrypted at rest.
- Allow up to 10 backup recovery codes. Each is single-use. Hash and store them the same way as passwords. Display them exactly once at enrollment.
- Never allow TOTP code reuse within its validity window -- maintain a used-code cache in Redis with TTL matching the TOTP period.

**MFA enrollment UX:**
- Never force MFA enrollment mid-flow (it causes abandonment). Present it post-login on first session or via a dedicated settings page.
- For enterprise/compliance contexts, enforce MFA via policy and give users a grace period (typically 7 days) before it becomes required.

### 7. Implement Security Headers, Logging, and Monitoring

Authentication without observability is incomplete. These are required, not optional.

**Security headers for auth endpoints:**
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` -- enforce HTTPS.
- `Cache-Control: no-store` on all auth endpoints and token responses -- prevents caching of credentials.
- `Content-Security-Policy` -- restricts where scripts can load from, mitigating XSS that could steal tokens.
- `X-Frame-Options: DENY` on login pages -- prevents clickjacking attacks.

**Audit logging -- every auth event must be logged:**
- Successful login: timestamp, user ID, IP, user agent, auth method used, MFA used (boolean).
- Failed login: same fields plus failure reason (wrong password, account locked, MFA failure).
- Token issuance, refresh, and revocation.
- Password change, reset, and MFA enrollment/removal.
- Account lockout and unlock.
- Do NOT log passwords, tokens, or secrets -- log only IDs and metadata.

**Alerting thresholds:**
- Alert on: 50+ failed logins to a single account in 5 minutes (brute force), 1000+ failed logins from a single IP in 1 minute (credential stuffing), any login from a new country for a high-privilege account, simultaneous active sessions from two geographically impossible locations (impossible travel).

### 8. Validate and Harden the Implementation

Run through this checklist before marking authentication work as production-ready:

- [ ] All auth endpoints use HTTPS exclusively (HSTS enabled)
- [ ] Session/token IDs are cryptographically random (128+ bits)
- [ ] Passwords are hashed with Argon2id, bcrypt(>=12), or scrypt
- [ ] Refresh tokens are rotated on every use
- [ ] HttpOnly + Secure + SameSite cookies set on session tokens
- [ ] CSRF protection in place (SameSite cookies or double-submit token)
- [ ] Login endpoint rate limited (IP-based and account-based)
- [ ] MFA supported and enforced for admin/privileged accounts
- [ ] Account lockout or progressive delay after failed attempts
- [ ] Audit log captures all auth events without logging secrets
- [ ] Token revocation mechanism exists and is tested
- [ ] "Forgot password" flow uses time-limited, single-use tokens (15--60 minute TTL)
- [ ] New session ID issued after successful login (session fixation prevention)
- [ ] All third-party OAuth flows use PKCE and state parameter

---

## Output Format

When responding to an authentication patterns question, structure output as follows:

```
## Authentication Pattern Recommendation: [Context Summary]

### Context Classification
- Auth type: [H2M / M2M / Third-party delegated / Enterprise SSO / Passwordless]
- Client type: [Traditional web / SPA / Mobile / CLI / Service]
- Key constraints: [Stateless requirement / Revocation needs / Compliance / Scale]

### Pattern Decision Matrix

| Criterion            | Session Cookies | JWT + Refresh | OAuth PKCE | API Key |
|----------------------|-----------------|---------------|------------|---------|
| Stateless scaling    | Poor            | Good          | Good       | Good    |
| Immediate revocation | Excellent       | Poor*         | Poor*      | Good    |
| Browser security     | Excellent       | Medium        | Medium     | Poor    |
| Mobile support       | Poor            | Excellent     | Excellent  | Good    |
| Implementation complexity | Low       | Medium        | High       | Low     |
| Compliance (MFA, audit) | Good        | Good          | Good       | Limited |

*Can be improved with jti deny-list at cost of a Redis lookup per request

### Recommended Pattern
[Specific pattern name and rationale tied to the user's constraints]

### Token/Session Architecture

**Access Token:**
- Type: [JWT RS256 / Opaque / Session ID]
- TTL: [X minutes]
- Storage: [Memory / HttpOnly cookie / Secure Enclave]
- Payload fields: [sub, iat, exp, jti, ...]

**Refresh Token (if applicable):**
- TTL: [X days]
- Rotation: [Rolling / Absolute]
- Storage: [HttpOnly cookie / Keychain / Database hash]
- Revocation: [Token family invalidation on reuse]

### Password/Credential Handling
- Hashing: [Argon2id / bcrypt / scrypt] with [parameters]
- Pepper: [Yes/No, vault location]
- Breach check: [HIBP k-anonymity / not applicable]

### MFA Strategy
- Required for: [All users / Admin users / Configurable per user]
- Supported factors: [TOTP / WebAuthn / SMS / Email OTP]
- Recovery: [N backup codes, single-use, hashed at rest]

### Implementation Sketch

\`\`\`[language]
[Concrete, runnable code demonstrating the core auth flow]
\`\`\`

### Security Checklist
- [ ] [Item specific to recommended pattern]
- [ ] [Item specific to recommended pattern]
... (all applicable items from Step 8)

### Known Trade-offs
[Explicit acknowledgment of what the recommended approach gives up and why it is still the right choice]
```

---

## Rules

1. **NEVER store JWT access tokens in localStorage or sessionStorage.** These are accessible to any JavaScript running on the page, making them vulnerable to XSS. If you cannot use HttpOnly cookies (e.g., cross-origin API), store access tokens in memory (JavaScript variable) and refresh tokens in HttpOnly cookies or platform secure storage.

2. **NEVER implement your own cryptographic primitives.** Use `libsodium`, `bcrypt`, `argon2`, or your language's standard crypto library. The phrase "I'll roll my own HMAC" is a red flag. The only custom crypto is parameter selection.

3. **NEVER issue a JWT without an expiration (`exp` claim).** A JWT without `exp` is valid forever unless explicitly revoked, which requires the stateful infrastructure that JWT was meant to avoid.

4. **ALWAYS rotate the session ID after a successful login.** Failure to do so enables session fixation attacks, where an attacker pre-plants a known session ID and then waits for the victim to authenticate, inheriting their session.

5. **NEVER use MD5 or SHA-1 for password hashing** -- or any hash function not designed as a password KDF. General-purpose hash functions are too fast; an attacker with a GPU cluster can attempt billions of SHA-256 hashes per second. Argon2id is designed to be slow and memory-hard.

6. **ALWAYS treat a "reused refresh token" event as a security incident.** Under rolling refresh token rotation, a previously issued refresh token should never be presented again. If it is, either the original token was stolen or the client has a bug. Either way, invalidate the entire token family immediately and notify the user.

7. **NEVER include sensitive data in the JWT payload.** The payload is base64url-encoded -- it is not encrypted. Anyone who intercepts the token can read all claims. Keep only non-sensitive identifiers. If you need to transmit sensitive data, use JWE (JSON Web Encryption) instead.

8. **ALWAYS use PKCE (Proof Key for Code Exchange) for Authorization Code flow in public clients.** This includes SPAs and native mobile apps. Without PKCE, an authorization code intercepted in transit (via URL redirect sniffing or redirect URI misconfiguration) can be exchanged for tokens by an attacker.

9. **NEVER allow the "forgot password" token to be reusable or long-lived.** Password reset tokens must be: single-use (invalidate on first use), time-limited (15--60 minutes maximum), cryptographically random (128+ bits), and stored as a hash server-side. Sending a raw token in a URL is standard; storing it raw in the database is not.

10. **ALWAYS enforce MFA for privileged accounts regardless of user preference.** Standard users may have MFA optional or strongly recommended, but accounts with admin rights, infrastructure access, or access to PII must have MFA enforced at the policy level. "The admin disabled their own MFA for convenience" is a common precursor to serious incidents.

---

## Edge Cases

### Handling Token Refresh Race Conditions in SPAs
When a SPA makes concurrent API requests and the access token expires mid-flight, multiple requests will simultaneously attempt to refresh the token. Without coordination, this generates multiple refresh requests, and all but the first will fail (since the refresh token is rotated). Solve this with a refresh lock: use a Promise-based singleton in the frontend that queues concurrent refresh attempts behind a single in-flight refresh call. All waiters receive the same new token. In practice this means holding a `refreshPromise` variable -- if it is null, start the refresh and assign the promise; if it is already set, return the existing promise. Release the lock only after the new token is stored.

### Implementing Auth in Multi-Tenant SaaS
Each tenant may have different auth requirements: one tenant uses social login, another requires SAML SSO with their corporate IdP, a third enforces TOTP MFA. Model this with a per-tenant auth configuration table that specifies: allowed authentication methods, required MFA level, session timeout override, and IdP connection details. At login, resolve the user's tenant first (via email domain, subdomain, or explicit tenant selection), then apply that tenant's auth policy. Ensure that a token issued in Tenant A can never be used to access Tenant B's resources -- include a `tenant_id` claim in the JWT and validate it against the requested resource on every API call.

### Social Login Account Linking
A user may sign up with Google, then later try to log in with GitHub using the same email address. Do NOT automatically merge these accounts -- this is a common account takeover vector (an attacker registers a GitHub account with the victim's email). Instead: if the email is already registered via a different method, prompt the user to log in with their existing method first, then offer to link the social account from settings. Only link accounts when the user is already authenticated. Always verify that the OAuth provider has confirmed the email address (`email_verified: true` in OIDC claims).

### Migrating Password Hashes to a Stronger Algorithm
When inheriting a legacy system using MD5 or SHA-1 hashes, you cannot bulk-rehash without knowing plaintext passwords. Use an on-login migration: when a user successfully authenticates with the old algorithm, immediately rehash their plaintext password using Argon2id and store the new hash alongside a flag indicating the new algorithm. Expire the old hash. Add a column `hash_algorithm` or a version prefix to each stored hash. Over time, as users log in, the database migrates organically. Force-expire any remaining old-format hashes after 90--180 days and require a password reset for users who have not logged in within that window.

### WebAuthn/Passkey Implementation Pitfalls
WebAuthn challenges must be cryptographically random (128 bits minimum), generated server-side, stored in session, and consumed within 60--120 seconds. Never allow challenge reuse. The `rpId` (relying party ID) must match the effective domain -- if your app is `app.example.com`, the `rpId` can be `app.example.com` or `example.com` but not `example.com.attacker.com`. Verify the `origin` in the authenticator data against your expected origin -- this prevents cross-origin credential use. For account recovery when a user loses their passkey, provide backup codes generated at passkey enrollment, and optionally allow a secondary passkey to be registered. Do not fall back to SMS OTP alone as it downgrades the security level.

### Logout and Token Invalidation
True logout in a JWT-stateless system requires effort. Clearing the client-side token is not sufficient -- an attacker who has already exfiltrated the token can still use it until it expires. Implement logout as: (1) invalidate the refresh token in the database immediately, (2) add the access token's `jti` to a Redis deny-list with TTL equal to the remaining access token lifetime, (3) clear all cookies client-side, (4) redirect to the authorization server's logout endpoint if using OIDC (to clear the IdP session). For high-security applications, reduce access token TTL to 5 minutes so the deny-list TTL is negligible.

### Machine-to-Machine Service Authentication in Kubernetes
In a Kubernetes environment, prefer workload identity over long-lived API keys. Use service account tokens projected into pods (short-lived, automatically rotated by the Kubernetes control plane), or use a service mesh (Istio, Linkerd) with mutual TLS (mTLS) for service-to-service authentication. If using OAuth 2.0 Client Credentials for M2M, store the client secret in Kubernetes Secrets encrypted at rest, or better, in an external vault with the Vault Agent sidecar or CSI driver injecting the secret at pod startup. Never mount secrets as environment variables in Kubernetes -- use file-based secret mounts so secrets are not exposed in process listings or crash dumps.

---

## Example

**Input:** "I'm building a React SPA with a Node.js/Express API. Users log in with email and password, and we're adding Google sign-in. We need to support MFA. The API is consumed only by our own frontend -- no third-party API access. We have Redis available. What authentication pattern should I use?"

---

**Output:**

## Authentication Pattern Recommendation: React SPA + Express API, Email/Password + Google SSO, MFA

### Context Classification
- Auth type: Human-to-machine (H2M)
- Client type: Single-Page Application (React) + REST API
- Key constraints: First-party SPA only (no public API consumers), MFA required, Redis available, Google SSO needed
- Compliance: Not specified -- designing for SOC 2 readiness as baseline

### Pattern Decision Matrix

| Criterion | Session Cookies | JWT (memory) + HttpOnly Refresh Cookie | localStorage JWT |
|-----------|-----------------|----------------------------------------|-----------------|
| XSS token theft | Excellent (HttpOnly) | Excellent (memory) | Poor (exposed) |
| CSRF risk | Medium (mitigated by SameSite) | Low | Low |
| Revocation | Excellent | Good (jti deny-list + refresh revoke) | Poor |
| Horizontal scale (Redis) | Excellent | Good | Good |
| SPA compatibility | Good | Excellent | Works (but avoid) |
| Google SSO integration | Good | Excellent | Works (but avoid) |

### Recommended Pattern
**OAuth 2.0 Authorization Code + PKCE for Google SSO, with short-lived JWTs (access tokens in memory, refresh tokens in HttpOnly cookies), backed by Redis for session metadata and token revocation.**

Rationale: A pure session-cookie approach works for first-party SPAs, but JWT + refresh tokens integrate more cleanly with the Google OIDC flow, handle token refresh races more elegantly in React (via interceptor pattern), and scale horizontally without session affinity. With Redis available, immediate revocation via jti deny-list is trivial to implement.

---

### Token Architecture

**Access Token:**
- Type: JWT, signed with RS256 (2048-bit RSA key pair)
- TTL: 15 minutes
- Storage: JavaScript memory variable (never localStorage)
- Payload: `{ sub, email, tenant_id, mfa_verified, jti, iat, exp }`
- Issued by: Your Express API after validating credentials or Google OIDC token

**Refresh Token:**
- TTL: 7 days
- Rotation: Rolling (new refresh token on every use, old one invalidated)
- Storage: HttpOnly, Secure, SameSite=Lax cookie (Lax required for Google redirect flow)
- Database: Store SHA-256 hash of refresh token, keyed to user ID and token family ID
- Revocation: On reuse of invalidated token, invalidate entire token family

**Google SSO Token Handling:**
- Use Google's OIDC endpoint (`https://accounts.google.com/.well-known/openid-configuration`)
- After receiving the Google ID token, verify signature against Google's JWKS, check `aud` matches your client ID, check `exp`, check `hd` (hosted domain) if restricting to a specific Google Workspace
- Exchange Google identity for your own internal JWT -- do not use Google tokens as your API's auth tokens
- Check `email_verified: true` before trusting the email claim

---

### Password/Credential Handling

```javascript
// server/auth/password.js
import argon2 from 'argon2';
import crypto from 'crypto';

const PEPPER = process.env.PASSWORD_PEPPER; // 32-byte hex string from vault

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,          // 3 iterations
  parallelism: 2,
  hashLength: 32,
};

export async function hashPassword(plaintext) {
  // Apply pepper before hashing -- pepper is not stored in DB
  const peppered = crypto
    .createHmac('sha256', PEPPER)
    .update(plaintext)
    .digest('hex');
  return argon2.hash(peppered, ARGON2_OPTIONS);
}

export async function verifyPassword(plaintext, storedHash) {
  const peppered = crypto
    .createHmac('sha256', PEPPER)
    .update(plaintext)
    .digest('hex');
  return argon2.verify(storedHash, peppered);
}
```

Breach check on registration/password change -- call HIBP k-anonymity API:
```javascript
import crypto from 'crypto';

export async function isPasswordBreached(password) {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const text = await response.text();
  return text.split('\n').some(line => line.startsWith(suffix));
}
```

---

### Login Flow Implementation

```javascript
// server/routes/auth.js
import { Router } from 'express';
import { verifyPassword } from '../auth/password.js';
import { issueTokens, revokeTokenFamily } from '../auth/tokens.js';
import { getUserByEmail } from '../db/users.js';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per IP per window
  keyGenerator: (req) => req.body.email || req.ip, // per-account limiting
  skipSuccessfulRequests: true,
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);

  // Use constant-time path -- always verify even if user not found (prevents user enumeration)
  const dummyHash = '$argon2id$v=19$m=65536,t=3,p=2$...'; // precomputed dummy
  const validPassword = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, dummyHash) && false; // always false for nonexistent user

  if (!user || !validPassword) {
    // Do NOT distinguish "wrong password" from "no such user" in the response
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.mfaEnabled) {
    // Issue a short-lived, single-purpose pre-auth token (5 minute TTL)
    // Do not issue full tokens yet -- MFA not yet verified
    const preAuthToken = crypto.randomBytes(32).toString('hex');
    await redis.setex(`preauth:${preAuthToken}`, 300, user.id);
    return res.json({ requiresMfa: true, preAuthToken });
  }

  // Regenerate session -- no old session to fixate on for JWT approach,
  // but clear any existing refresh cookie before issuing new one
  const { accessToken, refreshToken } = await issueTokens(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/auth/refresh',             // Scope cookie to refresh endpoint only
  });

  res.json({ accessToken });
});
```

---

### MFA Implementation (TOTP)

```javascript
// server/auth/totp.js
import * as OTPAuth from 'otpauth';
import crypto from 'crypto';
import QRCode from 'qrcode';

export function generateTOTPSecret() {
  return crypto.randomBytes(20).toString('base64').replace(/[^A-Z2-7]/gi, 'A').toUpperCase();
}

export async function generateEnrollmentQR(user, secret) {
  const totp = new OTPAuth.TOTP({
    issuer: 'YourAppName',
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return QRCode.toDataURL(totp.toString());
}

export function verifyTOTP(secret, token, redis) {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  // Window of 1 = accept t-1, t, t+1 (accounts for clock skew)
  const delta = totp.validate({ token, window: 1 });
  if (delta === null) return false;

  // Prevent replay: store used token in Redis with TTL of 90 seconds
  const cacheKey = `totp-used:${secret}:${token}`;
  // If this key already exists, token was already used (replay attack)
  return redis.set(cacheKey, '1', 'EX', 90, 'NX'); // NX = only set if not exists
}
```

---

### React Frontend: Token Refresh with Race Condition Guard

```javascript
// client/src/api/authInterceptor.js
let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) { accessToken = token; }

async function doRefresh() {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Sends HttpOnly refresh cookie
  });
  if (!response.ok) {
    accessToken = null;
    throw new Error('Session expired');
  }
  const data = await response.json();
  accessToken = data.accessToken;
  return accessToken;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise; // All concurrent callers await the same promise
}

export async function authenticatedFetch(url, options = {}) {
  if (!accessToken) await refreshAccessToken();

  let response = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    // Token may have just expired -- try one refresh
    await refreshAccessToken();
    response = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
    });
  }

  return response;
}
```

---

### MFA Strategy

- Required for: Admin and billing roles (enforced); all users strongly recommended (opt-in prompt at 3rd login)
- Supported factors: TOTP (Google Authenticator, Authy) -- launch; WebAuthn/Passkeys -- roadmap Q2
- Enrollment: Post-login prompt with 7-day grace period for existing users
- Recovery: 10 single-use backup codes, generated at enrollment, displayed once, stored as bcrypt hashes in DB
- TOTP codes expire after one use (Redis cache, 90-second TTL)

---

### Security Checklist
- [x] Access tokens stored in JavaScript memory only (never localStorage)
- [x] Refresh tokens in HttpOnly, Secure, SameSite=Lax cookie scoped to `/auth/refresh`
- [x] Passwords hashed with Argon2id (64MB memory, 3 iterations, pepper applied)
- [x] Breach check via HIBP k-anonymity on registration and password change
- [x] Rolling refresh token rotation with token family revocation on replay
- [x] Login rate limited 10 attempts / 15 minutes per account
- [x] TOTP codes single-use (Redis deduplication, 90-second window)
- [x] Google ID token verified (signature, aud, exp, email_verified) before trusting
- [x] All auth tokens use `jti` + Redis deny-list for immediate revocation on logout
- [x] Audit log captures login, logout, MFA events, token refresh without logging secrets
- [x] Pre-auth token (5-minute TTL) used to gate full token issuance until MFA verified
- [x] Password reset tokens: 128-bit random, 30-minute TTL, single-use, stored hashed

### Known Trade-offs
- JWT stateless verification is slightly undermined by the jti deny-list Redis check on every request (~0.5--1ms p99 overhead). This is an intentional tradeoff: immediate logout and MFA-session-invalidation capability are worth more than the latency savings of truly stateless verification.
- `SameSite=Lax` on the refresh cookie (rather than `Strict`) is required for the Google OAuth redirect to work. CSRF risk on the refresh endpoint is mitigated by requiring the refresh token to be present in the cookie -- a CSRF attacker cannot read the new access token from the response.
- TOTP is phishable in a real-time relay attack (attacker presents victim's TOTP code to the real server within the 30-second window). WebAuthn passkeys eliminate this. Plan passkey rollout for Q2 and push power users toward it proactively.
