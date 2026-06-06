---
name: mobile-security-engineer
description: |
  Mobile application security covering certificate pinning implementation, secure local storage patterns, jailbreak and root detection, code obfuscation and tamper detection, API security for mobile clients, biometric authentication, secure key management, network security, reverse engineering defense, and compliance with OWASP MASVS.
  Use when the user asks about mobile security engineer, mobile security engineer best practices, or needs guidance on mobile security engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices security"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Mobile Security Engineer

## Overview

Mobile security engineering protects applications from reverse engineering, data theft, man-in-the-middle attacks, and runtime tampering. Mobile apps operate in hostile environments where attackers have physical device access, can decompile code, intercept network traffic, and modify app behavior at runtime. This skill covers defense-in-depth strategies aligned with OWASP Mobile Application Security Verification Standard (MASVS).

## OWASP MASVS Security Levels

```
Level        Target Apps              Key Requirements
---------------------------------------------------------------------
MASVS-L1     All apps                 Basic security hygiene: secure
                                      storage, network security, auth

MASVS-L2     Sensitive data apps      Defense against targeted attacks:
             (banking, health, PII)   certificate pinning, obfuscation,
                                      tampering detection

MASVS-R      Highest risk apps        Resilience against reverse
             (payments, DRM)          engineering: root detection,
                                      integrity checks, anti-debug
```

## Certificate Pinning

### iOS Certificate Pinning

```swift
// URLSession delegate for certificate pinning
class PinnedSessionDelegate: NSObject, URLSessionDelegate {
    // SHA-256 hash of the server's public key (SubjectPublicKeyInfo)
    private let pinnedHashes: Set<String> = [
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",  // Primary cert
        "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",  // Backup cert
    ]

    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        guard let serverTrust = challenge.protectionSpace.serverTrust,
              let certificate = SecTrustGetCertificateAtIndex(serverTrust, 0) else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }

        // Extract public key and compute hash
        let publicKey = SecCertificateCopyKey(certificate)
        let publicKeyData = SecKeyCopyExternalRepresentation(publicKey!, nil)! as Data
        let hash = SHA256.hash(data: publicKeyData)
        let hashString = Data(hash).base64EncodedString()

        if pinnedHashes.contains(hashString) {
            completionHandler(.useCredential, URLCredential(trust: serverTrust))
        } else {
            // Pin validation failed - possible MITM
            reportPinningFailure(host: challenge.protectionSpace.host)
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
}

// TrustKit integration (recommended for production)
// Info.plist configuration:
// TSKConfiguration:
//   TSKSwizzleNetworkDelegates: true
//   TSKPinnedDomains:
//     api.myapp.com:
//       TSKPublicKeyHashes: [hash1, hash2]
//       TSKEnforcePinning: true
//       TSKReportUris: [[reference URL]]
```

### Android Certificate Pinning

```kotlin
// OkHttp certificate pinning
val client = OkHttpClient.Builder()
    .certificatePinner(
        CertificatePinner.Builder()
            .add("api.myapp.com",
                "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
            .add("api.myapp.com",
                "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")
            .build()
    )
    .build()

// Network Security Config (Android 7.0+)
// res/xml/network_security_config.xml
/*
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.myapp.com</domain>
        <pin-set expiration="2025-06-01">
            <pin digest="SHA-256">AAAAAAAAAA...=</pin>
            <pin digest="SHA-256">BBBBBBBBBB...=</pin>
        </pin-set>
    </domain-config>

    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
*/
```

### Certificate Pinning Best Practices

```
DO:
  - Pin the public key hash (SPKI), not the certificate itself
  - Always include at least one backup pin (different CA)
  - Set expiration dates and plan for rotation
  - Report pinning failures to a monitoring endpoint
  - Test pin rotation in staging before production

DON'T:
  - Pin leaf certificate (breaks on renewal)
  - Use only one pin (no recovery if key compromised)
  - Skip to update pins before expiration
  - Pin in debug builds (breaks proxy debugging)
```

## Secure Storage

### iOS Keychain

```swift
import Security

class SecureStorage {

    func store(key: String, data: Data, accessibility: CFString = kSecAttrAccessibleWhenUnlockedThisDeviceOnly) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: accessibility,
            kSecAttrAccessControl as String: SecAccessControlCreateWithFlags(
                nil,
                accessibility,
                .biometryCurrentSet,
                nil
            )!,
        ]

        // Delete existing item first
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.storeFailed(status)
        }
    }

    func get(key: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        switch status {
        case errSecSuccess:
            return result as? Data
        case errSecItemNotFound:
            return nil
        default:
            throw KeychainError.retrieveFailed(status)
        }
    }
}

// Accessibility levels (choose based on security needs):
// kSecAttrAccessibleWhenUnlockedThisDeviceOnly  - Best for most sensitive data
// kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly - Good for background access
// kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly - Deleted if passcode removed
```

### Android Encrypted Storage

```kotlin
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties

class SecureStorage(context: Context) {
    private val masterKeyAlias = MasterKeys.getOrCreate(
        KeyGenParameterSpec.Builder(
            MasterKeys.AES256_GCM_SPEC.keystoreAlias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        .setUserAuthenticationRequired(true)
        .setUserAuthenticationValidityDurationSeconds(300) // 5 min
        .build()
    )

    private val encryptedPrefs = EncryptedSharedPreferences.create(
        "secure_prefs",
        masterKeyAlias,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun storeToken(key: String, token: String) {
        encryptedPrefs.edit().putString(key, token).apply()
    }

    fun getToken(key: String): String? {
        return encryptedPrefs.getString(key, null)
    }
}

// Storage decision matrix:
// Auth tokens      -> EncryptedSharedPreferences or Keystore
// User credentials -> Android Keystore (hardware-backed)
// Session data     -> In-memory only (cleared on app close)
// Cached API data  -> Encrypted database (SQLCipher)
// NEVER use:       -> Plain SharedPreferences, plain SQLite, external storage
```

## Jailbreak and Root Detection

### Multi-Layer Detection

```kotlin
class DeviceIntegrityChecker {

    fun isDeviceCompromised(): Boolean {
        return isRooted() || isEmulator() || isDebuggerAttached() || isHooked()
    }

    private fun isRooted(): Boolean {
        val checks = listOf(
            ::checkRootManagementApps,
            ::checkSuBinary,
            ::checkDangerousProps,
            ::checkRWSystem,
            ::checkMagisk,
        )
        return checks.any { it() }
    }

    private fun checkRootManagementApps(): Boolean {
        val rootApps = listOf(
            "com.topjohnwu.magisk",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser",
        )
        return rootApps.any { isPackageInstalled(it) }
    }

    private fun checkSuBinary(): Boolean {
        val paths = listOf(
            "/system/bin/su", "/system/xbin/su",
            "/sbin/su", "/data/local/su",
            "/data/local/bin/su", "/data/local/xbin/su",
        )
        return paths.any { File(it).exists() }
    }

    private fun checkMagisk(): Boolean {
        // Magisk hides itself, check for signs using ProcessBuilder
        return try {
            val process = ProcessBuilder("which", "magisk")
                .redirectErrorStream(true)
                .start()
            process.waitFor() == 0
        } catch (e: Exception) {
            false
        }
    }

    private fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.contains("generic")
            || Build.MODEL.contains("Emulator")
            || Build.MODEL.contains("Android SDK built for x86")
            || Build.HARDWARE.contains("goldfish")
            || Build.HARDWARE.contains("ranchu")
            || Build.PRODUCT.contains("sdk_gphone"))
    }

    private fun isDebuggerAttached(): Boolean {
        return android.os.Debug.isDebuggerConnected()
            || android.os.Debug.waitingForDebugger()
    }

    private fun isHooked(): Boolean {
        // Check for Frida (common hooking framework)
        return try {
            // Frida typically listens on port 27042
            val socket = java.net.Socket()
            socket.connect(java.net.InetSocketAddress("127.0.0.1", 27042), 1000)
            socket.close()
            true  // Connection succeeded = Frida detected
        } catch (e: Exception) {
            false
        }
    }
}
```

### Response Strategies for Compromised Devices

```
Detection Level    Response                      User Experience
------------------------------------------------------------------------
Informational      Log and monitor               Transparent (analytics only)
Warning            Disable sensitive features     "Some features unavailable
                   (biometric, payments)          on modified devices"
Blocking           Prevent app from running       "This app cannot run on
                                                  modified devices"
Silent             Corrupt sensitive data,        No visible indication
                   report to server               (honeypot approach)

Recommendation: Use graduated response. Don't block outright unless
regulation requires it (banking). Always report to server for risk scoring.
```

## API Security for Mobile

### Secure API Communication Pattern

```kotlin
class SecureApiClient(private val context: Context) {

    // Device attestation for API calls
    fun getDeviceAttestation(): String {
        // Android: Use Play Integrity API
        val integrityManager = IntegrityManagerFactory.create(context)
        val integrityTokenResponse = integrityManager
            .requestIntegrityToken(
                IntegrityTokenRequest.builder()
                    .setNonce(generateNonce())
                    .build()
            )
            .await()
        return integrityTokenResponse.token()
    }

    // Request signing to prevent tampering
    fun signRequest(method: String, path: String, body: String, timestamp: Long): String {
        val message = "$method\n$path\n$timestamp\n${sha256(body)}"
        val key = getSigningKey()  // From secure storage
        return hmacSha256(key, message)
    }

    // Anti-replay: timestamp + nonce
    fun buildSecureHeaders(request: Request): Headers {
        val timestamp = System.currentTimeMillis() / 1000
        val nonce = UUID.randomUUID().toString()
        val body = request.body?.toString() ?: ""

        return Headers.Builder()
            .add("X-Timestamp", timestamp.toString())
            .add("X-Nonce", nonce)
            .add("X-Signature", signRequest(
                request.method, request.url.encodedPath, body, timestamp))
            .add("X-Device-Id", getDeviceId())
            .add("X-App-Version", BuildConfig.VERSION_NAME)
            .build()
    }
}
```

### API Security Checklist

```
Transport:
  [ ] TLS 1.2+ enforced (no cleartext)
  [ ] Certificate pinning with backup pins
  [ ] No sensitive data in URL parameters

Authentication:
  [ ] Short-lived access tokens (15 min)
  [ ] Refresh tokens stored in secure storage
  [ ] Biometric gating for sensitive operations
  [ ] Device attestation for critical endpoints

Request Security:
  [ ] Request signing (HMAC)
  [ ] Timestamp validation (prevent replay)
  [ ] Rate limiting per device
  [ ] Input validation on client AND server

Response Security:
  [ ] No sensitive data in responses beyond need
  [ ] Cache-Control: no-store for sensitive endpoints
  [ ] Response integrity verification
```

## Biometric Authentication

### iOS Face ID / Touch ID

```swift
import LocalAuthentication

class BiometricAuth {
    func authenticate(reason: String, completion: @escaping (Bool, Error?) -> Void) {
        let context = LAContext()
        context.localizedFallbackTitle = "Use Passcode"

        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            completion(false, error)
            return
        }

        context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason
        ) { success, authError in
            DispatchQueue.main.async {
                completion(success, authError)
            }
        }
    }

    func biometricType() -> String {
        let context = LAContext()
        _ = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
        switch context.biometryType {
        case .faceID: return "Face ID"
        case .touchID: return "Touch ID"
        case .opticID: return "Optic ID"
        default: return "None"
        }
    }
}
```

## Security Testing Checklist (MASVS Aligned)

```
Storage (MASVS-STORAGE):
  [ ] Sensitive data not in plaintext storage
  [ ] Keychain/Keystore used for credentials
  [ ] No sensitive data in app backups
  [ ] No sensitive data in system logs
  [ ] Clipboard cleared after paste of sensitive data
  [ ] No sensitive data in screenshots/app switcher

Network (MASVS-NETWORK):
  [ ] TLS 1.2+ with strong cipher suites
  [ ] Certificate pinning implemented
  [ ] No cleartext traffic permitted
  [ ] Certificate validation not bypassed

Authentication (MASVS-AUTH):
  [ ] Biometric auth uses platform APIs correctly
  [ ] Session tokens properly invalidated on logout
  [ ] Password/PIN stored as hash, never plaintext
  [ ] Step-up auth for sensitive operations

Resilience (MASVS-RESILIENCE):
  [ ] Root/jailbreak detection active
  [ ] Debugger detection active
  [ ] Code obfuscation applied
  [ ] Integrity checks on app binary
  [ ] Reverse engineering countermeasures tested

Platform (MASVS-PLATFORM):
  [ ] Permissions minimized to required only
  [ ] WebView configured securely (no file access)
  [ ] Deep links validated (no open redirect)
  [ ] IPC mechanisms secured
```

## When to Use

**Use this skill when:**
- Designing or implementing mobile security engineer solutions
- Reviewing or improving existing mobile security engineer approaches
- Making architectural or implementation decisions about mobile security engineer
- Learning mobile security engineer patterns and best practices
- Troubleshooting mobile security engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Mobile Security Engineer Analysis

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

**Input:** "Help me implement mobile security engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended mobile security engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When mobile security engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
