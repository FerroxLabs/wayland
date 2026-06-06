---
name: crypto-engineer
description: |
  Cryptography implementation expertise covering symmetric vs asymmetric encryption, password hashing (bcrypt, argon2), digital signatures, key management, TLS configuration, secure random generation, common cryptographic pitfalls, and practical usage of libsodium and OpenSSL for building secure systems.
  Use when the user asks about crypto engineer, crypto engineer best practices, or needs guidance on crypto engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "security guide best-practices"
  category: "security"
  subcategory: "application-security"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Cryptography Engineer

## Overview

Cryptography is the foundation of secure systems. This skill covers the practical implementation of cryptographic operations -- not the mathematical theory, but the engineering decisions that determine whether your encryption actually protects data. The cardinal rule of cryptography is: never implement your own cryptographic primitives. Use well-vetted libraries and follow established patterns.

## Symmetric vs Asymmetric Encryption

### Decision Matrix

| Property | Symmetric | Asymmetric |
|----------|-----------|------------|
| Speed | Fast (100x+) | Slow |
| Key distribution | Requires shared secret | Public key can be shared |
| Key size | 128-256 bits | 2048-4096 bits (RSA), 256 bits (ECC) |
| Use case | Bulk data encryption | Key exchange, digital signatures |
| Examples | AES-GCM, ChaCha20-Poly1305 | RSA, ECDSA, Ed25519, X25519 |

### Symmetric Encryption (AES-GCM)

```python
# AES-256-GCM: authenticated encryption (confidentiality + integrity)
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

def encrypt_aes_gcm(plaintext: bytes, key: bytes) -> bytes:
    """
    Encrypt with AES-256-GCM.
    Returns: nonce (12 bytes) + ciphertext + tag (16 bytes)
    """
    if len(key) != 32:
        raise ValueError("Key must be 32 bytes for AES-256")

    nonce = os.urandom(12)  # 96-bit nonce, MUST be unique per key
    aesgcm = AESGCM(key)
    # ... (condensed) ...
def encrypt_with_aad(plaintext: bytes, key: bytes, aad: bytes) -> bytes:
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data=aad)
    return nonce + ciphertext
```

### ChaCha20-Poly1305 (Alternative to AES-GCM)

```python
# Preferred on platforms without AES hardware acceleration (ARM, mobile)
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
import os

def encrypt_chacha(plaintext: bytes, key: bytes) -> bytes:
    """Encrypt with ChaCha20-Poly1305."""
    nonce = os.urandom(12)
    chacha = ChaCha20Poly1305(key)
    ciphertext = chacha.encrypt(nonce, plaintext, associated_data=None)
    return nonce + ciphertext

# Key generation
key = ChaCha20Poly1305.generate_key()
```

### Asymmetric Encryption (RSA-OAEP)

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

# Key pair generation
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=4096,  # Minimum 2048, prefer 4096
)
public_key = private_key.public_key()

# Encrypt with public key (anyone can encrypt)
def rsa_encrypt(plaintext: bytes, public_key) -> bytes:
    return public_key.encrypt(
        plaintext,
        # ... (condensed) ...

public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
)
```

## Password Hashing

### Algorithm Selection

| Algorithm | Recommended | Tunable | Notes |
|-----------|-------------|---------|-------|
| Argon2id | Best choice | Time, memory, parallelism | Winner of Password Hashing Competition |
| bcrypt | Good | Cost factor | Widely deployed, 72-byte limit |
| scrypt | Good | CPU, memory, parallelism | Used in cryptocurrency |
| PBKDF2 | Acceptable | Iterations | NIST approved, weakest of the four |
| MD5/SHA1/SHA256 | NEVER | N/A | Not password hashing functions |

### Argon2id (Recommended)

```python
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError

# Production configuration
ph = PasswordHasher(
    time_cost=3,          # Number of iterations
    memory_cost=65536,    # 64 MB memory usage
    parallelism=4,        # 4 threads
    hash_len=32,          # Output hash length
    salt_len=16,          # Salt length
    type=Type.ID,         # Argon2id (hybrid, recommended)
)

# Hash password
# ... (condensed) ...
    return ph.check_needs_rehash(stored_hash)

# Tuning: target 0.5-1.0 seconds per hash
# Increase memory_cost first (makes GPU attacks expensive)
# Then increase time_cost if more latency is acceptable
```

### bcrypt

```python
import bcrypt

# Hash with bcrypt (work factor 12 = ~250ms on modern hardware)
def hash_password_bcrypt(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# Verify
def verify_password_bcrypt(stored_hash: str, password: str) -> bool:
    return bcrypt.checkpw(
        password.encode('utf-8'),
        stored_hash.encode('utf-8')
    )
# ... (condensed) ...
    # Pre-hash to handle passwords > 72 bytes
    pre_hash = base64.b64encode(
        hashlib.sha256(password.encode('utf-8')).digest()
    )
    return bcrypt.hashpw(pre_hash, bcrypt.gensalt(rounds=12)).decode('utf-8')
```

## Digital Signatures

### Ed25519 (Recommended for new projects)

```python
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

# Generate signing key
private_key = Ed25519PrivateKey.generate()
public_key = private_key.public_key()

# Sign
def sign_message(message: bytes, private_key) -> bytes:
    return private_key.sign(message)

# Verify
def verify_signature(message: bytes, signature: bytes, public_key) -> bool:
    try:
        # ... (condensed) ...
# - Fast (10x faster than RSA)
# - Small signatures (64 bytes vs 256+ for RSA)
# - Small keys (32 bytes vs 256+ for RSA)
# - Deterministic (same message = same signature, no random failures)
# - Resistant to many implementation pitfalls
```

### RSA Signatures (PSS padding)

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding, utils
from cryptography.hazmat.primitives import hashes

# Sign with RSA-PSS (preferred over PKCS1v15 for new code)
def rsa_sign(message: bytes, private_key) -> bytes:
    return private_key.sign(
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )

# ... (condensed) ...
            hashes.SHA256()
        )
        return True
    except Exception:
        return False
```

## Key Management

### Key Hierarchy

```
Master Key (KEK - Key Encryption Key)
  |
  +-- Data Encryption Key (DEK) for database encryption
  |
  +-- Data Encryption Key (DEK) for file encryption
  |
  +-- Data Encryption Key (DEK) for API token encryption

The master key encrypts all DEKs.
DEKs encrypt actual data.
This allows key rotation without re-encrypting all data.
```

### Envelope Encryption Pattern

```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class EnvelopeEncryption:
    """
    Envelope encryption: encrypt data with a DEK,
    encrypt the DEK with a KEK (master key).
    """

    def __init__(self, master_key: bytes):
        self.master_key = master_key  # From KMS, HSM, or secure config

    def encrypt(self, plaintext: bytes) -> dict:
        # Generate random DEK for this encryption
        # ... (condensed) ...
        data_nonce = envelope['encrypted_data'][:12]
        data_cipher = AESGCM(dek)
        return data_cipher.decrypt(
            data_nonce, envelope['encrypted_data'][12:], None
        )
```

### Key Rotation

```python
class KeyRotationManager:
    """Manage key rotation without re-encrypting all data."""

    def __init__(self, key_store):
        self.key_store = key_store

    def rotate_master_key(self):
        """Generate new master key, keep old for decryption."""
        new_key = AESGCM.generate_key(bit_length=256)
        new_version = self.key_store.get_current_version() + 1
        self.key_store.store_key(new_version, new_key)
        self.key_store.set_current_version(new_version)
        # Old keys remain available for decryption
        # New encryptions use new key
# ... (condensed) ...
    def decrypt(self, envelope: dict) -> bytes:
        key_version = envelope['key_version']
        key = self.key_store.get_key(key_version)
        decryptor = EnvelopeEncryption(key)
        return decryptor.decrypt(envelope)
```

## TLS Configuration

### Server Configuration (Nginx)

```nginx
# Modern TLS configuration (TLS 1.3 only)
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers off;

# Intermediate TLS configuration (TLS 1.2 + 1.3)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;

# Session settings
# ... (condensed) ...
ssl_certificate [system-path]
ssl_certificate_key [system-path]

# DH parameters (generate with: openssl dhparam -out dhparam.pem 4096)
ssl_dhparam [system-path]
```

### TLS Testing

```shell
# Test TLS configuration
# SSLLabs (web): [reference URL]
# testssl.shell-cmd (CLI):
testssl.shell-cmd [reference URL]

# OpenSSL client testing
openssl s_client -connect example.com:443 -tls1_3
openssl s_client -connect example.com:443 -tls1_2

# Check certificate details
openssl s_client -connect example.com:443 </dev/null 2> output_file | \
    openssl x509 -noout -text

# Verify certificate chain
openssl verify -CAfile ca-bundle.crt certificate.pem
```

## Secure Random Generation

```python
import os
import secrets

# CORRECT: Cryptographically secure random
token = secrets.token_hex(32)            # 64 hex chars
token = secrets.token_urlsafe(32)        # 43 URL-safe chars
random_bytes = os.urandom(32)            # 32 random bytes
random_int = secrets.randbelow(1000000)  # Random int [0, 1000000)

# WRONG: Not cryptographically secure (predictable)
import random
token = random.randint(0, 999999)  # NEVER for security purposes
# random.Random uses Mersenne Twister - predictable after 624 outputs

# ... (condensed) ...
    return f"{prefix}_{random_part}"

# Constant-time comparison (prevents timing attacks)
def safe_compare(a: str, b: str) -> bool:
    return secrets.compare_digest(a.encode(), b.encode())
```

## Common Cryptographic Pitfalls

### Pitfall 1: ECB Mode

```
ECB (Electronic Codebook) encrypts each block independently.
Identical plaintext blocks produce identical ciphertext blocks.
This reveals patterns in the data.

NEVER use ECB mode. Use GCM or CTR with authentication.
```

### Pitfall 2: Unauthenticated Encryption

```
AES-CBC without HMAC allows bit-flipping attacks.
An attacker can modify ciphertext to change the decrypted plaintext
in predictable ways without knowing the key.

ALWAYS use authenticated encryption:
  - AES-GCM (recommended)
  - ChaCha20-Poly1305 (recommended)
  - AES-CBC + HMAC-SHA256 (encrypt-then-MAC, acceptable)
```

### Pitfall 3: Nonce Reuse

```
Reusing a nonce with the same key in AES-GCM or ChaCha20-Poly1305
completely breaks confidentiality and authenticity.

Solutions:
  - Use random 96-bit nonce (safe for ~2^32 encryptions per key)
  - Use a counter-based nonce (safe for 2^96 encryptions)
  - Rotate keys before nonce space exhaustion
  - Use AES-GCM-SIV (nonce-misuse resistant) if nonce uniqueness
    cannot be guaranteed
```

### Pitfall 4: Timing Attacks

```python
# VULNERABLE: String comparison leaks length info
def check_token(provided, expected):
    return provided == expected  # Short-circuits on first mismatch

# FIXED: Constant-time comparison
import hmac
def check_token_safe(provided, expected):
    return hmac.compare_digest(
        provided.encode('utf-8'),
        expected.encode('utf-8')
    )
```

### Pitfall 5: Insufficient Key Derivation

## Libsodium Usage

```python
# Libsodium via PyNaCl - higher-level, harder to misuse
from nacl.public import PrivateKey, PublicKey, Box
from nacl.secret import SecretBox
from nacl.signing import SigningKey
from nacl.utils import random

# Symmetric encryption (SecretBox = XSalsa20-Poly1305)
key = random(SecretBox.KEY_SIZE)  # 32 bytes
box = SecretBox(key)
encrypted = box.encrypt(b"secret message")  # nonce auto-generated
decrypted = box.decrypt(encrypted)

# Asymmetric encryption (Box = X25519 + XSalsa20-Poly1305)
alice_key = PrivateKey.generate()
# ... (condensed) ...
# Digital signatures (Ed25519)
signing_key = SigningKey.generate()
verify_key = signing_key.verify_key
signed = signing_key.sign(b"important message")
verify_key.verify(signed)  # Raises BadSignatureError if tampered
```

## Algorithm Selection Quick Reference

| Purpose | Recommended | Acceptable | Never Use |
|---------|-------------|------------|-----------|
| Symmetric encryption | AES-256-GCM, ChaCha20-Poly1305 | AES-256-CBC + HMAC | AES-ECB, DES, 3DES, RC4 |
| Password hashing | Argon2id | bcrypt, scrypt | MD5, SHA-1, SHA-256 (raw) |
| Digital signatures | Ed25519 | ECDSA (P-256), RSA-PSS (4096) | RSA-PKCS1v15, DSA |
| Key exchange | X25519 | ECDH (P-256) | RSA key transport < 2048 |
| Hashing (non-password) | SHA-256, SHA-3, BLAKE2 | SHA-512 | MD5, SHA-1 |
| MAC | HMAC-SHA256 | Poly1305 | HMAC-MD5 |
| Random generation | os.urandom, secrets | /dev/urandom | random.Random, Math.random |

## When to Use

**Use this skill when:**
- Designing or implementing crypto engineer solutions
- Reviewing or improving existing crypto engineer approaches
- Making architectural or implementation decisions about crypto engineer
- Learning crypto engineer patterns and best practices
- Troubleshooting crypto engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Crypto Engineer Analysis

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

**Input:** "Help me implement crypto engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended crypto engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When crypto engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
