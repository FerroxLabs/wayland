use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::ffi::{CStr, CString};
use std::io::{self, Read};
use std::os::fd::RawFd;

const PROTOCOL_VERSION: u8 = 2;
// Restore-over-present carries two authenticated records, each wrapping up to
// MAX_CONTENT_BYTES as base64. Keep the wire bound explicit and shared with the
// TypeScript wrapper; it is deliberately larger than the sum of those records.
const MAX_REQUEST_BYTES: usize = 1_310_720;
const MAX_CONTENT_BYTES: usize = 256 * 1024;
const MAX_RECORD_BYTES: usize = MAX_CONTENT_BYTES + 32 * 1024;
// The helper-owned transaction inventory has independent retention semantics;
// it must not inherit the single archive-record bound.
const MAX_LEDGER_BYTES: usize = 64 * 1024 * 1024;
const MAX_ENVELOPE_BYTES: usize = 64 * 1024;
const MAX_ARCHIVE_KEYS: usize = 64;

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Request {
    version: u8,
    transaction_id: String,
    root: String,
    root_identity: RootIdentity,
    journal_key_base64: Option<String>,
    archive_authentication_keys: Option<Vec<ArchiveAuthenticationKey>>,
    request_fingerprint: Option<String>,
    operation: Operation,
    target: Option<Target>,
    expected: Option<Expected>,
    replacement: Option<Payload>,
    archive_id: Option<String>,
    archived_at: Option<u64>,
    archive: Option<Payload>,
    source_archive_id: Option<String>,
    source_archive: Option<Payload>,
    reconcile_transaction_id: Option<String>,
    reconcile_facts: Option<ReconcileFacts>,
    lookup_transaction_id: Option<String>,
    migration_source: Option<MigrationSource>,
    seal_key_id: Option<String>,
    envelope: Option<Payload>,
}

#[derive(Debug, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
enum Operation {
    Replace,
    Delete,
    Restore,
    MigrateLegacy,
    CommittedLookup,
    MigrationCommittedLookup,
    SealKeyInventory,
    SealKeyRead,
    SealKeyCreate,
    PendingInventory,
    Reconcile,
    ReadLive,
    LiveInventory,
    ArchiveInventory,
    ReadArchive,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(
    tag = "kind",
    rename_all = "snake_case",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
enum Target {
    Constitution {
        source_name: String,
    },
    Specialist {
        specialist_id: String,
        source_name: String,
    },
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Expected {
    present: bool,
    sha256: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct RootIdentity {
    device: String,
    inode: String,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Payload {
    content_base64: String,
    sha256: String,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct ArchiveAuthenticationKey {
    key_id: String,
    key_base64: String,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct MigrationSource {
    target: Target,
    sha256: String,
    parent_request_fingerprint: String,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct ReconcileFacts {
    request_fingerprint: String,
    operation: ReconciledOperation,
    target: Target,
    expected_present: bool,
    expected_sha256: Option<String>,
    replacement_sha256: Option<String>,
    archive_id: Option<String>,
    archived_at: Option<u64>,
    archive_sha256: Option<String>,
    source_archive_id: Option<String>,
    source_archive_sha256: Option<String>,
    recovery_sha256: Option<String>,
    migration_source: Option<MigrationSourceFacts>,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct MigrationSourceFacts {
    target: Target,
    device: String,
    inode: String,
    sha256: String,
    #[serde(default)]
    parent_request_fingerprint: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
enum ReconciledOperation {
    Replace,
    Delete,
    Restore,
    MigrateLegacy,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Receipt {
    ok: bool,
    version: u8,
    transaction_id: String,
    request_fingerprint: Option<String>,
    operation: &'static str,
    outcome: &'static str,
    archived_at: Option<u64>,
    reconcile_disposition: Option<&'static str>,
    final_present: Option<bool>,
    final_sha256: Option<String>,
    previous_sha256: Option<String>,
    replacement_sha256: Option<String>,
    archive_name: Option<String>,
    recovery_name: Option<String>,
    journal_name: Option<String>,
    seal_key_ids: Option<Vec<String>>,
    seal_key_name: Option<String>,
    envelope_base64: Option<String>,
    envelope_sha256: Option<String>,
    target: Option<Target>,
    expected_sha256: Option<String>,
    archive_sha256: Option<String>,
    source_archive_sha256: Option<String>,
    pending_transactions: Option<Vec<String>>,
    pending_transaction_details: Option<Vec<PendingTransactionDetail>>,
    content_base64: Option<String>,
    content_sha256: Option<String>,
    inventory_entries: Option<Vec<String>>,
    guarantees: Guarantees,
}

#[derive(Debug, Serialize, Clone)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct PendingTransactionDetail {
    transaction_id: String,
    reconcile_facts: ReconcileFacts,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Guarantees {
    anchored: bool,
    root_identity_bound: bool,
    reparse_rejected: bool,
    no_replace: bool,
    durable: bool,
    recovery_retained: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorResponse {
    ok: bool,
    version: u8,
    code: String,
    message: String,
}

#[derive(Debug)]
struct FsError {
    code: &'static str,
    message: String,
}

type Result<T> = std::result::Result<T, FsError>;
type Hook<'a> = Option<&'a dyn Fn(&str) -> Result<()>>;

impl FsError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }

    fn io(code: &'static str, context: &str) -> Self {
        Self::new(code, format!("{context}: {}", io::Error::last_os_error()))
    }
}

struct OwnedFd(RawFd);

impl Drop for OwnedFd {
    fn drop(&mut self) {
        // SAFETY: OwnedFd is constructed only from an owned, non-negative descriptor.
        unsafe { libc::close(self.0) };
    }
}

impl OwnedFd {
    fn raw(&self) -> RawFd {
        self.0
    }
}

fn c(value: &str) -> Result<CString> {
    CString::new(value).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "NUL byte in filesystem value",
        )
    })
}

fn sha256(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

fn is_uuid(value: &str) -> bool {
    let bytes = value.as_bytes();
    bytes.len() == 36
        && [8, 13, 18, 23]
            .into_iter()
            .all(|index| bytes[index] == b'-')
        && bytes
            .iter()
            .enumerate()
            .all(|(index, byte)| [8, 13, 18, 23].contains(&index) || byte.is_ascii_hexdigit())
        && bytes[14] == b'4'
        && matches!(bytes[19].to_ascii_lowercase(), b'8' | b'9' | b'a' | b'b')
}

fn is_digest(value: &str) -> bool {
    value.len() == 71
        && value.starts_with("sha256:")
        && value[7..]
            .bytes()
            .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
}

fn is_specialist_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 128
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'-')
}

fn validate_seal_envelope(bytes: &[u8]) -> Result<()> {
    if bytes.len() > MAX_ENVELOPE_BYTES {
        return Err(FsError::new(
            "CONSTITUTION_FS_OVERSIZE",
            "seal-key envelope exceeds limit",
        ));
    }
    let value: serde_json::Value = serde_json::from_slice(bytes).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_ENVELOPE_INVALID",
            "seal-key envelope is not JSON",
        )
    })?;
    let object = value.as_object().ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_ENVELOPE_INVALID",
            "seal-key envelope is not an object",
        )
    })?;
    let expected_keys = ["cipher", "ciphertext", "formatVersion"];
    let mut actual_keys: Vec<_> = object.keys().map(String::as_str).collect();
    actual_keys.sort_unstable();
    let ciphertext = value["ciphertext"].as_str().unwrap_or_default();
    let electron_cipher = value["cipher"] == "electron-safe-storage";
    let file_cipher = value["cipher"] == "wayland-file-key-store";
    let encoded = if file_cipher {
        ciphertext.strip_prefix("fenc:v1:").unwrap_or_default()
    } else {
        ciphertext
    };
    let decoded = BASE64.decode(encoded).ok();
    if actual_keys != expected_keys
        || value["formatVersion"] != 1
        || (!electron_cipher && !file_cipher)
        || encoded.is_empty()
        || decoded.as_ref().is_none_or(|bytes| {
            BASE64.encode(bytes) != encoded || (file_cipher && bytes.len() < 28)
        })
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_ENVELOPE_INVALID",
            "seal-key envelope does not match the Safety v1 schema",
        ));
    }
    Ok(())
}

fn validate_target(target: &Target) -> Result<()> {
    match target {
        Target::Constitution { source_name }
            if source_name == "CONSTITUTION.md" || source_name == "SOUL.md" =>
        {
            Ok(())
        }
        Target::Specialist {
            specialist_id,
            source_name,
        } if is_specialist_id(specialist_id) && source_name == &format!("{specialist_id}.md") => {
            Ok(())
        }
        _ => Err(FsError::new(
            "CONSTITUTION_FS_INVALID_TARGET",
            "target is outside the fixed Constitution schema",
        )),
    }
}

fn journal_key(request: &Request) -> Result<Vec<u8>> {
    let encoded = request.journal_key_base64.as_deref().ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "authenticated transaction operation requires a journal key",
        )
    })?;
    let key = BASE64.decode(encoded).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "journal key is not canonical base64",
        )
    })?;
    if key.len() != 32 || BASE64.encode(&key) != encoded {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "journal key must be exactly 32 bytes",
        ));
    }
    Ok(key)
}

fn archive_authentication_key(request: &Request, key_id: &str) -> Result<Vec<u8>> {
    let keys = request
        .archive_authentication_keys
        .as_ref()
        .ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE",
                "authenticated archive key inventory is absent",
            )
        })?;
    let key = keys
        .iter()
        .find(|candidate| candidate.key_id == key_id)
        .ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE",
                "authenticated archive key id is not in the trusted inventory",
            )
        })?;
    BASE64.decode(&key.key_base64).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "archive authentication key is not canonical base64",
        )
    })
}

fn validate_archive_authentication_keys(request: &Request, required: bool) -> Result<()> {
    let Some(keys) = request.archive_authentication_keys.as_ref() else {
        return if required {
            Err(FsError::new(
                "CONSTITUTION_FS_ARCHIVE_KEY_UNAVAILABLE",
                "authenticated archive operation requires a trusted key inventory",
            ))
        } else {
            Ok(())
        };
    };
    if !required || keys.is_empty() || keys.len() > MAX_ARCHIVE_KEYS {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "archive authentication key inventory is unexpected or outside its bound",
        ));
    }
    let mut key_ids = std::collections::BTreeSet::new();
    for key in keys {
        let decoded = BASE64.decode(&key.key_base64).map_err(|_| {
            FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "archive authentication key is not canonical base64",
            )
        })?;
        if !is_uuid(&key.key_id)
            || decoded.len() != 32
            || BASE64.encode(&decoded) != key.key_base64
            || !key_ids.insert(&key.key_id)
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "archive authentication key inventory is malformed",
            ));
        }
    }
    Ok(())
}

#[derive(Debug)]
enum Validated {
    Constitution {
        replacement: Option<Vec<u8>>,
        archive: Option<(Vec<u8>, String)>,
    },
    Restore {
        source_archive_id: String,
        source_archive: Vec<u8>,
        source_archive_sha256: String,
        current_archive: Option<(Vec<u8>, String)>,
    },
    MigrateLegacy {
        replacement: Vec<u8>,
        source: MigrationSource,
    },
    CommittedLookup(String),
    MigrationCommittedLookup(String),
    SealKeyInventory,
    SealKeyRead(String),
    SealKeyCreate(String, Vec<u8>, String),
    PendingInventory,
    Reconcile(String),
    ReadLive,
    LiveInventory,
    ArchiveInventory,
    ReadArchive(String),
}

fn decode_payload(payload: &Payload, label: &str, limit: usize) -> Result<Vec<u8>> {
    if !is_digest(&payload.sha256) {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            format!("invalid {label} digest"),
        ));
    }
    let bytes = BASE64.decode(&payload.content_base64).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            format!("{label} is not canonical base64"),
        )
    })?;
    if bytes.len() > limit
        || BASE64.encode(&bytes) != payload.content_base64
        || sha256(&bytes) != payload.sha256
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_DIGEST_MISMATCH",
            format!("{label} bytes do not match their digest"),
        ));
    }
    Ok(bytes)
}

fn validate(request: &Request) -> Result<Validated> {
    if request.version != PROTOCOL_VERSION || !is_uuid(&request.transaction_id) {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "unsupported version or invalid transaction id",
        ));
    }
    if request.root_identity.device.parse::<u64>().is_err()
        || request.root_identity.inode.parse::<u64>().is_err()
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "root identity is invalid",
        ));
    }
    let requires_journal_key = matches!(
        request.operation,
        Operation::Replace
            | Operation::Delete
            | Operation::Restore
            | Operation::MigrateLegacy
            | Operation::CommittedLookup
            | Operation::MigrationCommittedLookup
            | Operation::PendingInventory
            | Operation::Reconcile
            | Operation::ReadLive
            | Operation::LiveInventory
            | Operation::ArchiveInventory
            | Operation::ReadArchive
    );
    if requires_journal_key {
        let _ = journal_key(request)?;
    } else if request.journal_key_base64.is_some() {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "non-transaction operation cannot carry a journal key",
        ));
    }
    let requires_archive_keys = match request.operation {
        Operation::Replace | Operation::Delete => request
            .expected
            .as_ref()
            .is_some_and(|expected| expected.present),
        Operation::Restore | Operation::ReadArchive => true,
        Operation::Reconcile => request
            .reconcile_facts
            .as_ref()
            .is_some_and(|facts| facts.archive_id.is_some() || facts.source_archive_id.is_some()),
        _ => false,
    };
    validate_archive_authentication_keys(request, requires_archive_keys)?;
    let is_mutation = matches!(
        request.operation,
        Operation::Replace | Operation::Delete | Operation::Restore | Operation::MigrateLegacy
    );
    if is_mutation {
        if request
            .request_fingerprint
            .as_deref()
            .is_none_or(|fingerprint| !is_digest(fingerprint))
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "mutation requires a canonical request fingerprint",
            ));
        }
    } else if request.operation != Operation::CommittedLookup
        && request.operation != Operation::MigrationCommittedLookup
        && request.request_fingerprint.is_some()
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "non-mutation operation cannot carry a request fingerprint",
        ));
    }
    if request.operation == Operation::CommittedLookup
        || request.operation == Operation::MigrationCommittedLookup
    {
        if request
            .request_fingerprint
            .as_deref()
            .is_none_or(|fingerprint| !is_digest(fingerprint))
            || request
                .lookup_transaction_id
                .as_deref()
                .is_none_or(|id| !is_uuid(id))
            || request.target.is_some()
            || request.expected.is_some()
            || request.replacement.is_some()
            || request.archive_id.is_some()
            || request.archived_at.is_some()
            || request.archive.is_some()
            || request.source_archive_id.is_some()
            || request.source_archive.is_some()
            || request.reconcile_transaction_id.is_some()
            || request.reconcile_facts.is_some()
            || request.migration_source.is_some()
            || request.seal_key_id.is_some()
            || request.envelope.is_some()
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "committed lookup fields disagree",
            ));
        }
        let lookup_id = request
            .lookup_transaction_id
            .clone()
            .expect("validated lookup transaction id");
        return Ok(if request.operation == Operation::CommittedLookup {
            Validated::CommittedLookup(lookup_id)
        } else {
            Validated::MigrationCommittedLookup(lookup_id)
        });
    }
    if request.lookup_transaction_id.is_some() {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "non-lookup operation carries a lookup transaction id",
        ));
    }
    if request.operation == Operation::Reconcile {
        let facts = request.reconcile_facts.as_ref();
        if request
            .reconcile_transaction_id
            .as_deref()
            .is_none_or(|id| !is_uuid(id))
            || facts.is_none()
            || request.target.is_some()
            || request.expected.is_some()
            || request.replacement.is_some()
            || request.request_fingerprint.is_some()
            || request.archive_id.is_some()
            || request.archived_at.is_some()
            || request.archive.is_some()
            || request.source_archive_id.is_some()
            || request.source_archive.is_some()
            || request.migration_source.is_some()
            || request.seal_key_id.is_some()
            || request.envelope.is_some()
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "reconcile fields disagree",
            ));
        }
        let facts = facts.expect("validated reconcile facts");
        validate_target(&facts.target)?;
        if !is_digest(&facts.request_fingerprint)
            || facts.expected_present != facts.expected_sha256.is_some()
            || facts
                .expected_sha256
                .as_deref()
                .is_some_and(|v| !is_digest(v))
            || facts
                .replacement_sha256
                .as_deref()
                .is_some_and(|v| !is_digest(v))
            || facts
                .archive_sha256
                .as_deref()
                .is_some_and(|v| !is_digest(v))
            || facts
                .source_archive_sha256
                .as_deref()
                .is_some_and(|v| !is_digest(v))
            || facts
                .recovery_sha256
                .as_deref()
                .is_some_and(|v| !is_digest(v))
            || facts.archive_id.as_deref().is_some_and(|v| !is_uuid(v))
            || facts
                .source_archive_id
                .as_deref()
                .is_some_and(|v| !is_uuid(v))
            || (facts.expected_present != facts.recovery_sha256.is_some())
            || (facts.expected_present
                && facts.expected_sha256.as_deref() != facts.recovery_sha256.as_deref())
            || (facts.expected_present
                != (facts.archive_id.is_some() && facts.archive_sha256.is_some()))
            || (facts.archive_id.is_some() != facts.archive_sha256.is_some())
            || (facts.archive_id.is_some() != facts.archived_at.is_some())
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "reconciliation facts are internally inconsistent",
            ));
        }
        match facts.operation {
            ReconciledOperation::Replace
                if facts.replacement_sha256.is_some()
                    && facts.source_archive_id.is_none()
                    && facts.source_archive_sha256.is_none()
                    && facts.migration_source.is_none() => {}
            ReconciledOperation::Delete
                if facts.replacement_sha256.is_none()
                    && facts.source_archive_id.is_none()
                    && facts.source_archive_sha256.is_none()
                    && facts.migration_source.is_none() => {}
            ReconciledOperation::Restore
                if facts.source_archive_id.is_some()
                    && facts.source_archive_sha256.is_some()
                    && facts.replacement_sha256.is_some()
                    && facts.migration_source.is_none() => {}
            ReconciledOperation::MigrateLegacy
                if !facts.expected_present
                    && facts.replacement_sha256.is_some()
                    && facts.archive_id.is_none()
                    && facts.source_archive_id.is_none()
                    && facts.migration_source.as_ref().is_some_and(|source| {
                        matches!(
                            &source.target,
                            Target::Constitution { source_name } if source_name == "SOUL.md"
                        ) && source.device.parse::<u64>().is_ok()
                            && source.inode.parse::<u64>().is_ok()
                            && is_digest(&source.sha256)
                            && source
                                .parent_request_fingerprint
                                .as_deref()
                                .is_none_or(is_digest)
                            && Some(source.sha256.as_str()) == facts.replacement_sha256.as_deref()
                    }) => {}
            _ => {
                return Err(FsError::new(
                    "CONSTITUTION_FS_INVALID_REQUEST",
                    "reconciliation operation facts disagree",
                ));
            }
        }
        return Ok(Validated::Reconcile(
            request
                .reconcile_transaction_id
                .clone()
                .expect("validated reconcile id"),
        ));
    }
    if request.reconcile_transaction_id.is_some() || request.reconcile_facts.is_some() {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "non-reconcile operation carries reconcile id",
        ));
    }
    if request.operation == Operation::PendingInventory {
        if request.target.is_some()
            || request.expected.is_some()
            || request.replacement.is_some()
            || request.archive_id.is_some()
            || request.archived_at.is_some()
            || request.archive.is_some()
            || request.source_archive_id.is_some()
            || request.source_archive.is_some()
            || request.migration_source.is_some()
            || request.seal_key_id.is_some()
            || request.envelope.is_some()
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "pending inventory cannot carry mutation fields",
            ));
        }
        return Ok(Validated::PendingInventory);
    }
    if matches!(
        request.operation,
        Operation::ReadLive
            | Operation::LiveInventory
            | Operation::ArchiveInventory
            | Operation::ReadArchive
    ) {
        let mutation_fields_present = request.expected.is_some()
            || request.replacement.is_some()
            || request.archived_at.is_some()
            || request.archive.is_some()
            || request.source_archive_id.is_some()
            || request.source_archive.is_some()
            || request.migration_source.is_some()
            || request.seal_key_id.is_some()
            || request.envelope.is_some();
        if mutation_fields_present {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "read operation cannot carry mutation fields",
            ));
        }
        if request.operation == Operation::ReadArchive {
            if request.target.is_some()
                || request.archive_id.as_deref().is_none_or(|id| !is_uuid(id))
            {
                return Err(FsError::new(
                    "CONSTITUTION_FS_INVALID_REQUEST",
                    "archive read identity is invalid",
                ));
            }
            return Ok(Validated::ReadArchive(
                request.archive_id.clone().expect("validated archive id"),
            ));
        }
        if request.archive_id.is_some() {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "non-archive read cannot carry archive identity",
            ));
        }
        return match request.operation {
            Operation::ReadLive => {
                let target = request.target.as_ref().ok_or_else(|| {
                    FsError::new(
                        "CONSTITUTION_FS_INVALID_REQUEST",
                        "live read target is missing",
                    )
                })?;
                validate_target(target)?;
                Ok(Validated::ReadLive)
            }
            Operation::LiveInventory if request.target.is_none() => Ok(Validated::LiveInventory),
            Operation::ArchiveInventory if request.target.is_none() => {
                Ok(Validated::ArchiveInventory)
            }
            _ => Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "inventory operation cannot carry a target",
            )),
        };
    }
    if matches!(
        request.operation,
        Operation::SealKeyInventory | Operation::SealKeyRead | Operation::SealKeyCreate
    ) {
        if request.target.is_some()
            || request.expected.is_some()
            || request.replacement.is_some()
            || request.archive_id.is_some()
            || request.archived_at.is_some()
            || request.archive.is_some()
            || request.source_archive_id.is_some()
            || request.source_archive.is_some()
            || request.migration_source.is_some()
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "seal-key operations cannot carry Constitution fields",
            ));
        }
        return match request.operation {
            Operation::SealKeyInventory
                if request.seal_key_id.is_none() && request.envelope.is_none() =>
            {
                Ok(Validated::SealKeyInventory)
            }
            Operation::SealKeyRead
                if request.envelope.is_none()
                    && request.seal_key_id.as_deref().is_some_and(is_uuid) =>
            {
                Ok(Validated::SealKeyRead(
                    request.seal_key_id.clone().expect("validated key id"),
                ))
            }
            Operation::SealKeyCreate
                if request.seal_key_id.as_deref().is_some_and(is_uuid)
                    && request.envelope.is_some() =>
            {
                let payload = request.envelope.as_ref().expect("validated envelope");
                let bytes = decode_payload(payload, "seal-key envelope", MAX_ENVELOPE_BYTES)?;
                validate_seal_envelope(&bytes)?;
                Ok(Validated::SealKeyCreate(
                    request.seal_key_id.clone().expect("validated key id"),
                    bytes,
                    payload.sha256.clone(),
                ))
            }
            _ => Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "seal-key operation fields disagree",
            )),
        };
    }
    if request.seal_key_id.is_some() || request.envelope.is_some() {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "Constitution operations cannot carry seal-key fields",
        ));
    }
    let target = request.target.as_ref().ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "missing Constitution target",
        )
    })?;
    let expected = request.expected.as_ref().ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "missing Constitution expectation",
        )
    })?;
    validate_target(target)?;
    if expected.present != expected.sha256.is_some()
        || expected
            .sha256
            .as_deref()
            .is_some_and(|value| !is_digest(value))
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "expected presence and digest disagree",
        ));
    }
    if request.operation == Operation::MigrateLegacy {
        let canonical_target = matches!(
            target,
            Target::Constitution { source_name } if source_name == "CONSTITUTION.md"
        );
        let source = request.migration_source.as_ref().ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "legacy migration source is missing",
            )
        })?;
        let source_is_soul = matches!(
            &source.target,
            Target::Constitution { source_name } if source_name == "SOUL.md"
        );
        let replacement = request.replacement.as_ref().ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "legacy migration replacement is missing",
            )
        })?;
        let replacement_bytes = decode_payload(replacement, "replacement", MAX_CONTENT_BYTES)?;
        if !canonical_target
            || !source_is_soul
            || expected.present
            || request.archive_id.is_some()
            || request.archived_at.is_some()
            || request.archive.is_some()
            || request.source_archive_id.is_some()
            || request.source_archive.is_some()
            || !is_digest(&source.sha256)
            || !is_digest(&source.parent_request_fingerprint)
            || source.sha256 != replacement.sha256
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "legacy migration must atomically copy fixed SOUL.md into absent CONSTITUTION.md",
            ));
        }
        return Ok(Validated::MigrateLegacy {
            replacement: replacement_bytes,
            source: source.clone(),
        });
    }
    if request.migration_source.is_some() {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "non-migration operation carries legacy source facts",
        ));
    }
    if request.operation == Operation::Restore {
        if request.replacement.is_some()
            || request
                .source_archive_id
                .as_deref()
                .is_none_or(|id| !is_uuid(id))
            || request.source_archive.is_none()
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "restore fields disagree",
            ));
        }
        let source = request
            .source_archive
            .as_ref()
            .expect("validated source archive");
        let source_bytes = decode_payload(source, "source archive", MAX_RECORD_BYTES)?;
        let current_archive = request
            .archive
            .as_ref()
            .map(|payload| {
                decode_payload(payload, "current archive", MAX_RECORD_BYTES)
                    .map(|bytes| (bytes, payload.sha256.clone()))
            })
            .transpose()?;
        if expected.present != current_archive.is_some() {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "current target and recovery archive disagree",
            ));
        }
        if expected.present {
            if request.archive_id.as_deref().is_none_or(|id| !is_uuid(id))
                || request.archived_at.is_none()
            {
                return Err(FsError::new(
                    "CONSTITUTION_FS_INVALID_REQUEST",
                    "current target requires authenticated recovery archive identity",
                ));
            }
        } else if request.archive_id.is_some() || request.archived_at.is_some() {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "absent restore target cannot claim current archive identity",
            ));
        }
        return Ok(Validated::Restore {
            source_archive_id: request
                .source_archive_id
                .clone()
                .expect("validated source archive id"),
            source_archive: source_bytes,
            source_archive_sha256: source.sha256.clone(),
            current_archive,
        });
    }
    if request.source_archive_id.is_some() || request.source_archive.is_some() {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "non-restore operation carries source archive",
        ));
    }
    let replacement = match (&request.operation, &request.replacement) {
        (Operation::Replace, Some(payload)) => {
            Some(decode_payload(payload, "replacement", MAX_CONTENT_BYTES)?)
        }
        (Operation::Delete, None) => None,
        _ => {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "operation and replacement disagree",
            ));
        }
    };
    if expected.present {
        if request
            .archive_id
            .as_deref()
            .is_none_or(|value| !is_uuid(value))
            || request.archived_at.is_none()
            || request.archive.is_none()
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "present targets require archive identity and time",
            ));
        }
    } else if request.archive_id.is_some()
        || request.archived_at.is_some()
        || request.archive.is_some()
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "absent targets cannot claim an archive",
        ));
    }
    let archive = request
        .archive
        .as_ref()
        .map(|payload| {
            decode_payload(payload, "authenticated archive", MAX_RECORD_BYTES)
                .map(|bytes| (bytes, payload.sha256.clone()))
        })
        .transpose()?;
    Ok(Validated::Constitution {
        replacement,
        archive,
    })
}

fn is_hmac_digest(value: &str) -> bool {
    let mut parts = value.split(':');
    matches!(parts.next(), Some("hmac-sha256"))
        && parts.next().is_some_and(is_uuid)
        && parts.next().is_some_and(|digest| {
            digest.len() == 64
                && digest
                    .bytes()
                    .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
        })
        && parts.next().is_none()
}

fn decode_lower_hex_32(value: &str) -> Option<[u8; 32]> {
    if value.len() != 64 {
        return None;
    }
    let mut decoded = [0_u8; 32];
    for (index, pair) in value.as_bytes().chunks_exact(2).enumerate() {
        let high = (pair[0] as char).to_digit(16)? as u8;
        let low = (pair[1] as char).to_digit(16)? as u8;
        decoded[index] = (high << 4) | low;
    }
    Some(decoded)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AuthenticatedArchiveMacPayload<'a> {
    kind: &'static str,
    version: u8,
    archive_id: &'a str,
    archived_at: u64,
    target: &'a Target,
    content: &'a str,
}

fn validate_authenticated_archive(
    request: &Request,
    bytes: &[u8],
    archive_id: &str,
    target: &Target,
    content: &[u8],
    expected_archived_at: Option<u64>,
) -> Result<()> {
    let text = std::str::from_utf8(bytes).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "authenticated archive is not UTF-8",
        )
    })?;
    let value: serde_json::Value = serde_json::from_str(text).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "authenticated archive is not JSON",
        )
    })?;
    let object = value.as_object().ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "authenticated archive is not an object",
        )
    })?;
    let expected_keys = [
        "archiveId",
        "archivedAt",
        "content",
        "contentDigest",
        "kind",
        "target",
        "version",
    ];
    let mut actual_keys: Vec<_> = object.keys().map(String::as_str).collect();
    actual_keys.sort_unstable();
    if actual_keys != expected_keys {
        return Err(FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "authenticated archive fields are not exact",
        ));
    }
    let parsed_target: Target = serde_json::from_value(value["target"].clone()).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "authenticated archive target is invalid",
        )
    })?;
    if value["kind"] != "wayland-constitution-history"
        || value["version"] != 3
        || value["archiveId"] != archive_id
        || !value["archivedAt"].is_u64()
        || expected_archived_at.is_some_and(|expected| value["archivedAt"] != expected)
        || parsed_target != *target
        || value["content"].as_str().map(str::as_bytes) != Some(content)
        || value["contentDigest"]
            .as_str()
            .is_none_or(|digest| !is_hmac_digest(digest))
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "authenticated archive binding does not match the transaction",
        ));
    }
    let archived_at = value["archivedAt"]
        .as_u64()
        .expect("validated archive time");
    let content_text = value["content"]
        .as_str()
        .expect("validated archive content");
    let digest = value["contentDigest"]
        .as_str()
        .expect("validated archive digest");
    let mut digest_parts = digest.split(':');
    let _algorithm = digest_parts.next().expect("validated digest algorithm");
    let key_id = digest_parts.next().expect("validated digest key id");
    let expected_mac = digest_parts.next().expect("validated digest MAC");
    let key = archive_authentication_key(request, key_id)?;
    let canonical = serde_json::to_vec(&AuthenticatedArchiveMacPayload {
        kind: "wayland-constitution-history",
        version: 3,
        archive_id,
        archived_at,
        target,
        content: content_text,
    })
    .map_err(|error| FsError::new("CONSTITUTION_FS_ARCHIVE_INVALID", error.to_string()))?;
    let expected_mac_bytes = decode_lower_hex_32(expected_mac).ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "authenticated archive MAC is malformed",
        )
    })?;
    let mut mac = Hmac::<Sha256>::new_from_slice(&key).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "cannot initialize authenticated archive MAC",
        )
    })?;
    mac.update(&canonical);
    mac.verify_slice(&expected_mac_bytes).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "authenticated archive MAC does not match its canonical record",
        )
    })?;
    Ok(())
}

fn authenticated_journal_line(
    mut payload: serde_json::Value,
    key: &[u8],
    previous_mac: Option<&str>,
) -> Result<(Vec<u8>, String)> {
    let object = payload
        .as_object_mut()
        .ok_or_else(|| FsError::new("CONSTITUTION_FS_IO", "journal payload is not an object"))?;
    let payload_bytes = serde_json::to_vec(object)
        .map_err(|error| FsError::new("CONSTITUTION_FS_IO", error.to_string()))?;
    let mut mac = Hmac::<Sha256>::new_from_slice(key)
        .map_err(|_| FsError::new("CONSTITUTION_FS_IO", "cannot initialize journal MAC"))?;
    mac.update(previous_mac.unwrap_or("").as_bytes());
    mac.update(b"\n");
    mac.update(&payload_bytes);
    let mac_value = format!("{:x}", mac.finalize().into_bytes());
    object.insert(
        "previousMac".into(),
        previous_mac
            .map(|value| serde_json::Value::String(value.to_owned()))
            .unwrap_or(serde_json::Value::Null),
    );
    object.insert("mac".into(), serde_json::Value::String(mac_value.clone()));
    let mut bytes = serde_json::to_vec(object)
        .map_err(|error| FsError::new("CONSTITUTION_FS_IO", error.to_string()))?;
    bytes.push(b'\n');
    Ok((bytes, mac_value))
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn append_journal_state(
    journal: RawFd,
    key: &[u8],
    previous_mac: &mut String,
    state: &str,
) -> Result<()> {
    let (bytes, next_mac) = authenticated_journal_line(
        serde_json::json!({ "state": state }),
        key,
        Some(previous_mac),
    )?;
    platform::append(journal, &bytes)?;
    *previous_mac = next_mac;
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn append_reconcile_disposition(
    journal: RawFd,
    key: &[u8],
    previous_mac: &mut String,
    disposition: &str,
    reconciliation_transaction_id: &str,
    receipt_sha256: &str,
) -> Result<()> {
    let (bytes, next_mac) = authenticated_journal_line(
        serde_json::json!({
            "state": disposition,
            "reconciliationTransactionId": reconciliation_transaction_id,
            "receiptSha256": receipt_sha256,
        }),
        key,
        Some(previous_mac),
    )?;
    platform::append(journal, &bytes)?;
    *previous_mac = next_mac;
    Ok(())
}

fn verify_journal(bytes: &[u8], key: &[u8]) -> Result<Vec<serde_json::Value>> {
    if !bytes.ends_with(b"\n") {
        return Err(FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "authenticated journal is truncated",
        ));
    }
    let mut previous: Option<String> = None;
    let mut values = Vec::new();
    for line in bytes
        .split(|byte| *byte == b'\n')
        .filter(|line| !line.is_empty())
    {
        let mut value: serde_json::Value = serde_json::from_slice(line).map_err(|_| {
            FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "authenticated journal line is malformed",
            )
        })?;
        let object = value.as_object_mut().ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "authenticated journal line is not an object",
            )
        })?;
        let observed_mac = object
            .remove("mac")
            .and_then(|value| value.as_str().map(str::to_owned))
            .ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_JOURNAL_INVALID",
                    "authenticated journal line has no MAC",
                )
            })?;
        let observed_previous = object.remove("previousMac").ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "authenticated journal line has no previous MAC",
            )
        })?;
        let expected_previous = previous
            .as_ref()
            .map(|value| serde_json::Value::String(value.clone()))
            .unwrap_or(serde_json::Value::Null);
        if observed_previous != expected_previous {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "authenticated journal chain is reordered",
            ));
        }
        let (_, expected_mac) = authenticated_journal_line(
            serde_json::Value::Object(object.clone()),
            key,
            previous.as_deref(),
        )?;
        if observed_mac != expected_mac {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "authenticated journal MAC is invalid",
            ));
        }
        previous = Some(observed_mac);
        values.push(serde_json::Value::Object(object.clone()));
    }
    if values.is_empty() {
        return Err(FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "authenticated journal is empty",
        ));
    }
    Ok(values)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn verify_journal_with_torn_tail_repair(
    file: RawFd,
    bytes: &[u8],
    key: &[u8],
) -> Result<Vec<serde_json::Value>> {
    if bytes.ends_with(b"\n") {
        return verify_journal(bytes, key);
    }
    let prefix_length = bytes
        .iter()
        .rposition(|byte| *byte == b'\n')
        .map(|index| index + 1)
        .ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "authenticated journal has no complete record",
            )
        })?;
    let values = verify_journal(&bytes[..prefix_length], key)?;
    platform::truncate_and_sync(file, prefix_length)?;
    Ok(values)
}

fn last_complete_journal_mac(bytes: &[u8], code: &'static str) -> Result<String> {
    let complete_length = bytes
        .iter()
        .rposition(|byte| *byte == b'\n')
        .map(|index| index + 1)
        .ok_or_else(|| FsError::new(code, "authenticated record MAC is missing"))?;
    bytes[..complete_length]
        .split(|byte| *byte == b'\n')
        .rfind(|line| !line.is_empty())
        .and_then(|line| serde_json::from_slice::<serde_json::Value>(line).ok())
        .and_then(|value| {
            value
                .get("mac")
                .and_then(serde_json::Value::as_str)
                .map(str::to_owned)
        })
        .ok_or_else(|| FsError::new(code, "authenticated record MAC is missing"))
}

fn journal_header(
    request: &Request,
    key: &[u8],
    migration_source: Option<&MigrationSourceFacts>,
) -> Result<(Vec<u8>, String)> {
    let operation = match request.operation {
        Operation::Replace => "replace",
        Operation::Delete => "delete",
        Operation::Restore => "restore",
        Operation::MigrateLegacy => "migrate_legacy",
        _ => {
            return Err(FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "operation cannot create a mutation journal",
            ));
        }
    };
    let replacement_sha256 = if request.operation == Operation::Restore {
        let source = request.source_archive.as_ref().ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_INVALID_REQUEST",
                "restore source is missing",
            )
        })?;
        let bytes = decode_payload(source, "source archive", MAX_RECORD_BYTES)?;
        let value: serde_json::Value = serde_json::from_slice(&bytes).map_err(|_| {
            FsError::new(
                "CONSTITUTION_FS_ARCHIVE_INVALID",
                "restore source is not JSON",
            )
        })?;
        let content = value["content"].as_str().ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_ARCHIVE_INVALID",
                "restore source has no content",
            )
        })?;
        Some(sha256(content.as_bytes()))
    } else {
        request
            .replacement
            .as_ref()
            .map(|payload| payload.sha256.clone())
    };
    let value = serde_json::json!({
        "state": "anchored",
        "transactionId": request.transaction_id,
        "requestFingerprint": request.request_fingerprint,
        "operation": operation,
        "target": request.target,
        "expectedSha256": request.expected.as_ref().and_then(|expected| expected.sha256.as_deref()),
        "replacementSha256": replacement_sha256,
        "archiveId": request.archive_id,
        "archivedAt": request.archived_at,
        "archiveSha256": request.archive.as_ref().map(|payload| payload.sha256.as_str()),
        "sourceArchiveId": request.source_archive_id,
        "sourceArchiveSha256": request.source_archive.as_ref().map(|payload| payload.sha256.as_str()),
        "migrationSource": migration_source,
    });
    authenticated_journal_line(value, key, None)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn persist_authenticated_receipt(
    receipts: RawFd,
    storage_name: &str,
    receipt: &Receipt,
    key: &[u8],
    hook: Hook<'_>,
) -> Result<()> {
    use platform::*;
    let receipt_bytes = serde_json::to_vec(receipt)
        .map_err(|error| FsError::new("CONSTITUTION_FS_IO", error.to_string()))?;
    let (envelope, _) = authenticated_journal_line(
        serde_json::json!({
            "state": "receipt",
            "transactionId": receipt.transaction_id,
            "receiptSha256": sha256(&receipt_bytes),
            "receiptBase64": BASE64.encode(&receipt_bytes),
        }),
        key,
        None,
    )?;
    let name = format!("{storage_name}.json");
    if open_file(receipts, &name)?.is_some() {
        return verify_authenticated_receipt(receipts, storage_name, receipt, key);
    }
    let stage_name = format!(".{storage_name}.receipt.tmp");
    if open_file(receipts, &stage_name)?.is_some() {
        unlink_file(receipts, &stage_name)?;
        fsync_dir(receipts)?;
    }
    checkpoint(hook, "before_receipt_stage_write")?;
    create_file(receipts, &stage_name, &envelope)?;
    fsync_dir(receipts)?;
    checkpoint(hook, "after_receipt_stage_before_publish")?;
    rename_no_replace(receipts, &stage_name, receipts, &name)?;
    fsync_dir(receipts)?;
    checkpoint(hook, "after_receipt_publish_before_commit")?;
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn verify_authenticated_receipt(
    receipts: RawFd,
    storage_name: &str,
    receipt: &Receipt,
    key: &[u8],
) -> Result<()> {
    use platform::*;
    let name = format!("{storage_name}.json");
    let file = open_file(receipts, &name)?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_RECEIPT_MISSING",
            "committed transaction has no authenticated receipt",
        )
    })?;
    let values = verify_journal(&read_all(file.raw(), MAX_RECORD_BYTES)?, key)?;
    if values.len() != 1 {
        return Err(FsError::new(
            "CONSTITUTION_FS_RECEIPT_INVALID",
            "authenticated receipt envelope is not canonical",
        ));
    }
    let value = values
        .first()
        .and_then(serde_json::Value::as_object)
        .ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_RECEIPT_INVALID",
                "authenticated receipt envelope is malformed",
            )
        })?;
    let expected_bytes = serde_json::to_vec(receipt)
        .map_err(|error| FsError::new("CONSTITUTION_FS_IO", error.to_string()))?;
    if value.len() != 4
        || value.get("state") != Some(&serde_json::json!("receipt"))
        || value.get("transactionId") != Some(&serde_json::json!(receipt.transaction_id))
        || value.get("receiptSha256") != Some(&serde_json::json!(sha256(&expected_bytes)))
        || value.get("receiptBase64") != Some(&serde_json::json!(BASE64.encode(&expected_bytes)))
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_RECEIPT_INVALID",
            "authenticated receipt does not match the committed request",
        ));
    }
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn read_authenticated_receipt_value(
    receipts: RawFd,
    storage_name: &str,
    key: &[u8],
) -> Result<(serde_json::Value, String)> {
    use platform::*;
    let name = format!("{storage_name}.json");
    let file = open_file(receipts, &name)?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_RECEIPT_MISSING",
            "definitive transaction disposition has no authenticated receipt",
        )
    })?;
    let values = verify_journal(&read_all(file.raw(), MAX_RECORD_BYTES)?, key)?;
    let envelope = values
        .first()
        .and_then(serde_json::Value::as_object)
        .filter(|_| values.len() == 1)
        .ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_RECEIPT_INVALID",
                "authenticated receipt envelope is not canonical",
            )
        })?;
    let encoded = envelope
        .get("receiptBase64")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_RECEIPT_INVALID",
                "authenticated receipt payload is missing",
            )
        })?;
    let bytes = BASE64.decode(encoded).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_RECEIPT_INVALID",
            "authenticated receipt payload is not base64",
        )
    })?;
    let digest = sha256(&bytes);
    let receipt_transaction_id = storage_name
        .split_once(".reconcile.")
        .map_or(storage_name, |(_, reconciliation_id)| reconciliation_id);
    if envelope.len() != 4
        || envelope.get("state") != Some(&serde_json::json!("receipt"))
        || envelope.get("transactionId") != Some(&serde_json::json!(receipt_transaction_id))
        || envelope.get("receiptSha256") != Some(&serde_json::json!(digest))
        || BASE64.encode(&bytes) != encoded
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_RECEIPT_INVALID",
            "authenticated receipt envelope fields disagree",
        ));
    }
    let value = serde_json::from_slice(&bytes).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_RECEIPT_INVALID",
            "authenticated receipt payload is not JSON",
        )
    })?;
    Ok((value, digest))
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn replay_committed_receipt(
    journals: RawFd,
    receipts: RawFd,
    request: &Request,
    receipt: &Receipt,
    key: &[u8],
    migration_source: Option<&MigrationSourceFacts>,
) -> Result<()> {
    use platform::*;
    let journal_name = format!("{}.jsonl", request.transaction_id);
    let journal = open_file_read_write(journals, &journal_name)?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "bound transaction journal is missing",
        )
    })?;
    let values = verify_journal_with_torn_tail_repair(
        journal.raw(),
        &read_all(journal.raw(), MAX_RECORD_BYTES)?,
        key,
    )?;
    let expected_header = verify_journal(&journal_header(request, key, migration_source)?.0, key)?;
    if values.first() != expected_header.first() {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "retried request disagrees with the authenticated committed journal",
        ));
    }
    if values.last().and_then(|value| value["state"].as_str()) != Some("committed") {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "bound transaction has not committed",
        ));
    }
    if values
        .iter()
        .rev()
        .nth(1)
        .and_then(|value| value["state"].as_str())
        == Some("rolled_back")
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "original mutation was rolled back by reconciliation",
        ));
    }
    verify_authenticated_receipt(receipts, &request.transaction_id, receipt, key)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn assert_no_orphan_receipts(receipts: RawFd, indexed: &[String]) -> Result<()> {
    use platform::*;
    let known: std::collections::HashSet<&str> = indexed.iter().map(String::as_str).collect();
    for name in list_names(receipts)? {
        let bare = name
            .strip_prefix('.')
            .and_then(|value| value.strip_suffix(".receipt.tmp"))
            .or_else(|| name.strip_suffix(".json"))
            .ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_ARTIFACT_ORPHAN",
                    "unexpected authenticated receipt artifact",
                )
            })?;
        let transaction_id = bare.split(".reconcile.").next().unwrap_or(bare);
        if !is_uuid(transaction_id) || !known.contains(transaction_id) {
            return Err(FsError::new(
                "CONSTITUTION_FS_ARTIFACT_ORPHAN",
                "authenticated receipt has no ledger reservation",
            ));
        }
    }
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
mod platform {
    use super::*;

    const DIR_FLAGS: i32 = libc::O_RDONLY | libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC;
    const FILE_FLAGS: i32 = libc::O_RDONLY | libc::O_NOFOLLOW | libc::O_CLOEXEC;

    pub(super) fn open_root(path: &str, expected: &RootIdentity) -> Result<OwnedFd> {
        let path = c(path)?;
        // SAFETY: path is a valid C string and flags require an existing directory.
        let fd = unsafe { libc::open(path.as_ptr(), DIR_FLAGS) };
        if fd < 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_UNSAFE_ROOT",
                "cannot anchor root",
            ));
        }
        let owned = OwnedFd(fd);
        let mut stat = std::mem::MaybeUninit::<libc::stat>::uninit();
        if unsafe { libc::fstat(fd, stat.as_mut_ptr()) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_IO",
                "cannot inspect anchored root",
            ));
        }
        let stat = unsafe { stat.assume_init() };
        let expected_device = expected
            .device
            .parse::<u64>()
            .map_err(|_| FsError::new("CONSTITUTION_FS_INVALID_REQUEST", "invalid root device"))?;
        let expected_inode = expected
            .inode
            .parse::<u64>()
            .map_err(|_| FsError::new("CONSTITUTION_FS_INVALID_REQUEST", "invalid root inode"))?;
        if stat.st_dev as u64 != expected_device || stat.st_ino != expected_inode {
            return Err(FsError::new(
                "CONSTITUTION_FS_ROOT_IDENTITY_MISMATCH",
                "anchored root does not match the caller-bound identity",
            ));
        }
        Ok(owned)
    }

    pub(super) fn open_dir(parent: RawFd, name: &str, create: bool) -> Result<OwnedFd> {
        let name = c(name)?;
        if create {
            // SAFETY: parent is held open and name is a validated fixed component.
            let made = unsafe { libc::mkdirat(parent, name.as_ptr(), 0o700) };
            if made != 0 && io::Error::last_os_error().raw_os_error() != Some(libc::EEXIST) {
                return Err(FsError::io(
                    "CONSTITUTION_FS_IO",
                    "cannot create anchored directory",
                ));
            }
        }
        // SAFETY: parent is held open; O_NOFOLLOW rejects a replaced symlink/reparse leaf.
        let fd = unsafe { libc::openat(parent, name.as_ptr(), DIR_FLAGS) };
        if fd < 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_REPARSE_REJECTED",
                "cannot open anchored directory",
            ));
        }
        Ok(OwnedFd(fd))
    }

    pub(super) fn open_dir_optional(parent: RawFd, name: &str) -> Result<Option<OwnedFd>> {
        let name = c(name)?;
        let fd = unsafe { libc::openat(parent, name.as_ptr(), DIR_FLAGS) };
        if fd >= 0 {
            return Ok(Some(OwnedFd(fd)));
        }
        if io::Error::last_os_error().raw_os_error() == Some(libc::ENOENT) {
            return Ok(None);
        }
        Err(FsError::io(
            "CONSTITUTION_FS_REPARSE_REJECTED",
            "cannot open optional anchored directory",
        ))
    }

    pub(super) fn open_file(parent: RawFd, name: &str) -> Result<Option<OwnedFd>> {
        let name = c(name)?;
        // SAFETY: parent is held open and O_NOFOLLOW rejects a symlink leaf.
        let fd = unsafe { libc::openat(parent, name.as_ptr(), FILE_FLAGS) };
        if fd >= 0 {
            let owned = OwnedFd(fd);
            let mut stat = std::mem::MaybeUninit::<libc::stat>::uninit();
            if unsafe { libc::fstat(fd, stat.as_mut_ptr()) } != 0 {
                return Err(FsError::io(
                    "CONSTITUTION_FS_IO",
                    "cannot inspect anchored file",
                ));
            }
            let stat = unsafe { stat.assume_init() };
            if stat.st_mode & libc::S_IFMT != libc::S_IFREG || stat.st_nlink != 1 {
                return Err(FsError::new(
                    "CONSTITUTION_FS_REPARSE_REJECTED",
                    "anchored file is not a single-link regular file",
                ));
            }
            return Ok(Some(owned));
        }
        if io::Error::last_os_error().raw_os_error() == Some(libc::ENOENT) {
            return Ok(None);
        }
        Err(FsError::io(
            "CONSTITUTION_FS_REPARSE_REJECTED",
            "cannot open target without following links",
        ))
    }

    pub(super) fn open_file_read_write(parent: RawFd, name: &str) -> Result<Option<OwnedFd>> {
        let name = c(name)?;
        let fd = unsafe {
            libc::openat(
                parent,
                name.as_ptr(),
                libc::O_RDWR | libc::O_NOFOLLOW | libc::O_CLOEXEC,
            )
        };
        if fd >= 0 {
            let owned = OwnedFd(fd);
            let mut stat = std::mem::MaybeUninit::<libc::stat>::uninit();
            if unsafe { libc::fstat(fd, stat.as_mut_ptr()) } != 0 {
                return Err(FsError::io("CONSTITUTION_FS_IO", "cannot inspect journal"));
            }
            let stat = unsafe { stat.assume_init() };
            if stat.st_mode & libc::S_IFMT != libc::S_IFREG || stat.st_nlink != 1 {
                return Err(FsError::new(
                    "CONSTITUTION_FS_REPARSE_REJECTED",
                    "journal is not a single-link regular file",
                ));
            }
            return Ok(Some(owned));
        }
        if io::Error::last_os_error().raw_os_error() == Some(libc::ENOENT) {
            return Ok(None);
        }
        Err(FsError::io(
            "CONSTITUTION_FS_REPARSE_REJECTED",
            "cannot open journal without following links",
        ))
    }

    pub(super) fn acquire_transaction_lock(parent: RawFd) -> Result<OwnedFd> {
        let name = c("transaction.lock")?;
        let fd = unsafe {
            libc::openat(
                parent,
                name.as_ptr(),
                libc::O_RDWR | libc::O_CREAT | libc::O_NOFOLLOW | libc::O_CLOEXEC,
                0o600,
            )
        };
        if fd < 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_LOCK_FAILED",
                "cannot open anchored transaction lock",
            ));
        }
        let owned = OwnedFd(fd);
        let mut stat = std::mem::MaybeUninit::<libc::stat>::uninit();
        if unsafe { libc::fstat(fd, stat.as_mut_ptr()) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_LOCK_FAILED",
                "cannot inspect transaction lock",
            ));
        }
        let stat = unsafe { stat.assume_init() };
        if stat.st_mode & libc::S_IFMT != libc::S_IFREG || stat.st_nlink != 1 {
            return Err(FsError::new(
                "CONSTITUTION_FS_REPARSE_REJECTED",
                "transaction lock is not a single-link regular file",
            ));
        }
        if unsafe { libc::flock(fd, libc::LOCK_EX) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_LOCK_FAILED",
                "cannot acquire transaction lock",
            ));
        }
        fsync_dir(parent)?;
        Ok(owned)
    }

    pub(super) fn acquire_existing_transaction_lock(parent: RawFd) -> Result<OwnedFd> {
        let name = c("transaction.lock")?;
        let fd = unsafe {
            libc::openat(
                parent,
                name.as_ptr(),
                libc::O_RDWR | libc::O_NOFOLLOW | libc::O_CLOEXEC,
            )
        };
        if fd < 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_LOCK_FAILED",
                "authenticated transaction state has no existing lock",
            ));
        }
        let owned = OwnedFd(fd);
        let mut stat = std::mem::MaybeUninit::<libc::stat>::uninit();
        if unsafe { libc::fstat(fd, stat.as_mut_ptr()) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_LOCK_FAILED",
                "cannot inspect existing transaction lock",
            ));
        }
        let stat = unsafe { stat.assume_init() };
        if stat.st_mode & libc::S_IFMT != libc::S_IFREG || stat.st_nlink != 1 {
            return Err(FsError::new(
                "CONSTITUTION_FS_REPARSE_REJECTED",
                "transaction lock is not a single-link regular file",
            ));
        }
        if unsafe { libc::flock(fd, libc::LOCK_EX) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_LOCK_FAILED",
                "cannot acquire existing transaction lock",
            ));
        }
        Ok(owned)
    }

    pub(super) fn lock_anchored_root(root: RawFd, exclusive: bool) -> Result<()> {
        let mode = if exclusive {
            libc::LOCK_EX
        } else {
            libc::LOCK_SH
        };
        if unsafe { libc::flock(root, mode) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_LOCK_FAILED",
                "cannot lock the anchored Constitution root",
            ));
        }
        Ok(())
    }

    pub(super) fn file_identity(fd: RawFd) -> Result<(u64, u64)> {
        let mut stat = std::mem::MaybeUninit::<libc::stat>::uninit();
        if unsafe { libc::fstat(fd, stat.as_mut_ptr()) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_IO",
                "cannot inspect held file identity",
            ));
        }
        let stat = unsafe { stat.assume_init() };
        Ok((stat.st_dev as u64, stat.st_ino))
    }

    pub(super) fn file_link_count(fd: RawFd) -> Result<u64> {
        let mut stat = std::mem::MaybeUninit::<libc::stat>::uninit();
        if unsafe { libc::fstat(fd, stat.as_mut_ptr()) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_IO",
                "cannot inspect held file link count",
            ));
        }
        let stat = unsafe { stat.assume_init() };
        Ok(stat.st_nlink as u64)
    }

    pub(super) fn read_all(fd: RawFd, limit: usize) -> Result<Vec<u8>> {
        let mut bytes = Vec::new();
        let mut offset = 0_i64;
        loop {
            let remaining = (limit + 1).saturating_sub(bytes.len());
            if remaining == 0 {
                return Err(FsError::new(
                    "CONSTITUTION_FS_OVERSIZE",
                    "anchored file exceeds limit",
                ));
            }
            let chunk_len = remaining.min(16 * 1024);
            let start = bytes.len();
            bytes.resize(start + chunk_len, 0);
            // SAFETY: the file is a held regular-file descriptor and the tail
            // buffer is writable for chunk_len bytes. pread never shares or
            // mutates the descriptor offset across repeat digest checks.
            let read =
                unsafe { libc::pread(fd, bytes[start..].as_mut_ptr().cast(), chunk_len, offset) };
            if read < 0 {
                return Err(FsError::io("CONSTITUTION_FS_IO", "anchored read failed"));
            }
            bytes.truncate(start + read as usize);
            if read == 0 {
                return Ok(bytes);
            }
            offset += read as i64;
        }
    }

    pub(super) fn create_file(parent: RawFd, name: &str, bytes: &[u8]) -> Result<OwnedFd> {
        let name = c(name)?;
        // SAFETY: parent is held open; O_EXCL and O_NOFOLLOW prohibit replacement/following.
        let fd = unsafe {
            libc::openat(
                parent,
                name.as_ptr(),
                libc::O_WRONLY | libc::O_CREAT | libc::O_EXCL | libc::O_NOFOLLOW | libc::O_CLOEXEC,
                0o600,
            )
        };
        if fd < 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_NO_REPLACE",
                "exclusive file creation failed",
            ));
        }
        let owned = OwnedFd(fd);
        let mut offset = 0;
        while offset < bytes.len() {
            // SAFETY: bytes points to bytes.len() readable bytes and fd is writable.
            let written =
                unsafe { libc::write(fd, bytes[offset..].as_ptr().cast(), bytes.len() - offset) };
            if written <= 0 {
                return Err(FsError::io("CONSTITUTION_FS_IO", "anchored write failed"));
            }
            offset += written as usize;
        }
        if unsafe { libc::fsync(fd) } != 0 {
            return Err(FsError::io("CONSTITUTION_FS_IO", "file fsync failed"));
        }
        Ok(owned)
    }

    pub(super) fn unlink_file(parent: RawFd, name: &str) -> Result<()> {
        let name = c(name)?;
        if unsafe { libc::unlinkat(parent, name.as_ptr(), 0) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_IO",
                "anchored file removal failed",
            ));
        }
        Ok(())
    }

    pub(super) fn append(fd: RawFd, bytes: &[u8]) -> Result<()> {
        if unsafe { libc::lseek(fd, 0, libc::SEEK_END) } < 0 {
            return Err(FsError::io("CONSTITUTION_FS_IO", "journal seek failed"));
        }
        let mut offset = 0;
        while offset < bytes.len() {
            let written =
                unsafe { libc::write(fd, bytes[offset..].as_ptr().cast(), bytes.len() - offset) };
            if written <= 0 {
                return Err(FsError::io("CONSTITUTION_FS_IO", "journal append failed"));
            }
            offset += written as usize;
        }
        if unsafe { libc::fsync(fd) } != 0 {
            return Err(FsError::io("CONSTITUTION_FS_IO", "journal fsync failed"));
        }
        Ok(())
    }

    pub(super) fn truncate_and_sync(fd: RawFd, length: usize) -> Result<()> {
        if unsafe { libc::ftruncate(fd, length as libc::off_t) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_IO",
                "journal tail truncate failed",
            ));
        }
        if unsafe { libc::fsync(fd) } != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_IO",
                "journal repair fsync failed",
            ));
        }
        Ok(())
    }

    pub(super) fn fsync_dir(fd: RawFd) -> Result<()> {
        if unsafe { libc::fsync(fd) } != 0 {
            return Err(FsError::io("CONSTITUTION_FS_IO", "directory fsync failed"));
        }
        Ok(())
    }

    pub(super) fn list_names(fd: RawFd) -> Result<Vec<String>> {
        let dot = c(".")?;
        // Open a fresh file description. dup(2) would share the directory
        // offset, allowing one inventory pass to make the next appear empty.
        let duplicate = unsafe { libc::openat(fd, dot.as_ptr(), DIR_FLAGS) };
        if duplicate < 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_IO",
                "cannot duplicate directory descriptor",
            ));
        }
        let directory = unsafe { libc::fdopendir(duplicate) };
        if directory.is_null() {
            unsafe { libc::close(duplicate) };
            return Err(FsError::io(
                "CONSTITUTION_FS_IO",
                "cannot enumerate anchored directory",
            ));
        }
        let mut names = Vec::new();
        loop {
            let entry = unsafe { libc::readdir(directory) };
            if entry.is_null() {
                break;
            }
            let name = unsafe { CStr::from_ptr((*entry).d_name.as_ptr()) }
                .to_string_lossy()
                .into_owned();
            if name != "." && name != ".." {
                names.push(name);
            }
        }
        unsafe { libc::closedir(directory) };
        Ok(names)
    }

    #[cfg(target_os = "linux")]
    pub(super) fn rename_no_replace(
        old_dir: RawFd,
        old: &str,
        new_dir: RawFd,
        new: &str,
    ) -> Result<()> {
        let old = c(old)?;
        let new = c(new)?;
        let result = unsafe {
            libc::syscall(
                libc::SYS_renameat2,
                old_dir,
                old.as_ptr(),
                new_dir,
                new.as_ptr(),
                libc::RENAME_NOREPLACE,
            )
        };
        if result != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_NO_REPLACE",
                "renameat2(RENAME_NOREPLACE) failed",
            ));
        }
        Ok(())
    }

    #[cfg(target_os = "macos")]
    pub(super) fn rename_no_replace(
        old_dir: RawFd,
        old: &str,
        new_dir: RawFd,
        new: &str,
    ) -> Result<()> {
        let old = c(old)?;
        let new = c(new)?;
        let result = unsafe {
            libc::renameatx_np(
                old_dir,
                old.as_ptr(),
                new_dir,
                new.as_ptr(),
                libc::RENAME_EXCL,
            )
        };
        if result != 0 {
            return Err(FsError::io(
                "CONSTITUTION_FS_NO_REPLACE",
                "renameatx_np(RENAME_EXCL) failed",
            ));
        }
        Ok(())
    }
}

#[cfg(not(any(target_os = "linux", target_os = "macos")))]
mod platform {}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn checkpoint(hook: Hook<'_>, name: &str) -> Result<()> {
    if let Some(hook) = hook {
        hook(name)?;
    }
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn pending_transactions(journals: RawFd, key: &[u8]) -> Result<Vec<String>> {
    use platform::*;
    let mut pending = Vec::new();
    for name in list_names(journals)? {
        let Some(transaction_id) = name.strip_suffix(".jsonl") else {
            return Err(FsError::new(
                "CONSTITUTION_FS_REPARSE_REJECTED",
                "unexpected transaction inventory entry",
            ));
        };
        if !is_uuid(transaction_id) {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "transaction journal filename is not canonical",
            ));
        }
        let file = open_file_read_write(journals, &name)?.ok_or_else(|| {
            FsError::new("CONSTITUTION_FS_CONFLICT", "transaction inventory changed")
        })?;
        let bytes = read_all(file.raw(), MAX_RECORD_BYTES)?;
        let values = verify_journal_with_torn_tail_repair(file.raw(), &bytes, key)?;
        let header = values.first().expect("verified journal header");
        let header_object = header.as_object().expect("verified journal object");
        let expected_header_keys = [
            "archiveId",
            "archiveSha256",
            "archivedAt",
            "expectedSha256",
            "migrationSource",
            "operation",
            "replacementSha256",
            "requestFingerprint",
            "sourceArchiveId",
            "sourceArchiveSha256",
            "state",
            "target",
            "transactionId",
        ];
        let legacy_v1_header_keys = [
            "archiveId",
            "archiveSha256",
            "archivedAt",
            "expectedSha256",
            "operation",
            "replacementSha256",
            "sourceArchiveId",
            "sourceArchiveSha256",
            "state",
            "target",
            "transactionId",
        ];
        let mut keys: Vec<_> = header_object.keys().map(String::as_str).collect();
        keys.sort_unstable();
        if (keys != expected_header_keys && keys != legacy_v1_header_keys)
            || header["state"] != "anchored"
            || header["transactionId"] != transaction_id
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "transaction journal header does not match its filename",
            ));
        }
        let last = values.last().expect("verified non-empty journal");
        if last["state"].as_str() != Some("committed") {
            pending.push(transaction_id.to_owned());
        }
    }
    pending.sort();
    Ok(pending)
}

fn pending_detail_from_header(
    transaction_id: &str,
    header: &serde_json::Value,
) -> Result<PendingTransactionDetail> {
    let object = header.as_object().ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "transaction journal header is not an object",
        )
    })?;
    let expected_keys = [
        "archiveId",
        "archiveSha256",
        "archivedAt",
        "expectedSha256",
        "migrationSource",
        "operation",
        "replacementSha256",
        "requestFingerprint",
        "sourceArchiveId",
        "sourceArchiveSha256",
        "state",
        "target",
        "transactionId",
    ];
    let legacy_v1_keys = [
        "archiveId",
        "archiveSha256",
        "archivedAt",
        "expectedSha256",
        "operation",
        "replacementSha256",
        "sourceArchiveId",
        "sourceArchiveSha256",
        "state",
        "target",
        "transactionId",
    ];
    let mut actual_keys: Vec<_> = object.keys().map(String::as_str).collect();
    actual_keys.sort_unstable();
    let legacy_v1 = actual_keys == legacy_v1_keys;
    if (!legacy_v1 && actual_keys != expected_keys)
        || header["state"] != "anchored"
        || header["transactionId"] != transaction_id
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "transaction journal header is not canonical",
        ));
    }
    let optional_digest = |name: &str| -> Result<Option<String>> {
        match &header[name] {
            serde_json::Value::Null => Ok(None),
            serde_json::Value::String(value) if is_digest(value) => Ok(Some(value.clone())),
            _ => Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                format!("transaction journal {name} is invalid"),
            )),
        }
    };
    let optional_id = |name: &str| -> Result<Option<String>> {
        match &header[name] {
            serde_json::Value::Null => Ok(None),
            serde_json::Value::String(value) if is_uuid(value) => Ok(Some(value.clone())),
            _ => Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                format!("transaction journal {name} is invalid"),
            )),
        }
    };
    let operation = match header["operation"].as_str() {
        Some("replace") => ReconciledOperation::Replace,
        Some("delete") => ReconciledOperation::Delete,
        Some("restore") => ReconciledOperation::Restore,
        Some("migrate_legacy") => ReconciledOperation::MigrateLegacy,
        _ => {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "transaction journal operation is invalid",
            ));
        }
    };
    let target: Target = serde_json::from_value(header["target"].clone()).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "transaction journal target is invalid",
        )
    })?;
    validate_target(&target)?;
    let expected_sha256 = optional_digest("expectedSha256")?;
    let request_fingerprint = if legacy_v1 {
        let canonical = serde_json::to_vec(header).map_err(|_| {
            FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "legacy transaction journal cannot be canonicalized",
            )
        })?;
        let mut domain_bound = b"wayland-constitution-fs-legacy-v1-reconcile\0".to_vec();
        domain_bound.extend_from_slice(&canonical);
        sha256(&domain_bound)
    } else {
        header["requestFingerprint"]
            .as_str()
            .filter(|value| is_digest(value))
            .ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_JOURNAL_INVALID",
                    "transaction journal request fingerprint is invalid",
                )
            })?
            .to_owned()
    };
    let replacement_sha256 = optional_digest("replacementSha256")?;
    let archive_id = optional_id("archiveId")?;
    let archive_sha256 = optional_digest("archiveSha256")?;
    let source_archive_id = optional_id("sourceArchiveId")?;
    let source_archive_sha256 = optional_digest("sourceArchiveSha256")?;
    let archived_at = match &header["archivedAt"] {
        serde_json::Value::Null => None,
        value => Some(value.as_u64().ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "transaction journal archivedAt is invalid",
            )
        })?),
    };
    let expected_present = expected_sha256.is_some();
    let migration_source = match if legacy_v1 {
        &serde_json::Value::Null
    } else {
        &header["migrationSource"]
    } {
        serde_json::Value::Null => None,
        value => Some(
            serde_json::from_value::<MigrationSourceFacts>(value.clone()).map_err(|_| {
                FsError::new(
                    "CONSTITUTION_FS_JOURNAL_INVALID",
                    "transaction journal migration source is invalid",
                )
            })?,
        ),
    };
    if expected_present != (archive_id.is_some() && archive_sha256.is_some())
        || archive_id.is_some() != archived_at.is_some()
        || source_archive_id.is_some() != source_archive_sha256.is_some()
        || match operation {
            ReconciledOperation::Replace => {
                replacement_sha256.is_none() || source_archive_id.is_some()
            }
            ReconciledOperation::Delete => {
                replacement_sha256.is_some() || source_archive_id.is_some()
            }
            ReconciledOperation::Restore => {
                replacement_sha256.is_none() || source_archive_id.is_none()
            }
            ReconciledOperation::MigrateLegacy => {
                expected_present
                    || replacement_sha256.is_none()
                    || source_archive_id.is_some()
                    || migration_source.as_ref().is_none_or(|source| {
                        !matches!(
                            &source.target,
                            Target::Constitution { source_name } if source_name == "SOUL.md"
                        ) || source.device.parse::<u64>().is_err()
                            || source.inode.parse::<u64>().is_err()
                            || !is_digest(&source.sha256)
                            || source
                                .parent_request_fingerprint
                                .as_deref()
                                .is_some_and(|value| !is_digest(value))
                            || Some(source.sha256.as_str()) != replacement_sha256.as_deref()
                    })
            }
        }
        || (operation != ReconciledOperation::MigrateLegacy && migration_source.is_some())
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "transaction journal recovery facts are inconsistent",
        ));
    }
    Ok(PendingTransactionDetail {
        transaction_id: transaction_id.to_owned(),
        reconcile_facts: ReconcileFacts {
            request_fingerprint,
            operation,
            target,
            expected_present,
            recovery_sha256: expected_sha256.clone(),
            expected_sha256,
            replacement_sha256,
            archive_id,
            archived_at,
            archive_sha256,
            source_archive_id,
            source_archive_sha256,
            migration_source,
        },
    })
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn pending_transaction_details(
    journals: RawFd,
    key: &[u8],
) -> Result<Vec<PendingTransactionDetail>> {
    use platform::*;
    let mut details = Vec::new();
    for transaction_id in pending_transactions(journals, key)? {
        let name = format!("{transaction_id}.jsonl");
        let file = open_file_read_write(journals, &name)?.ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "pending transaction journal vanished",
            )
        })?;
        let values = verify_journal_with_torn_tail_repair(
            file.raw(),
            &read_all(file.raw(), MAX_RECORD_BYTES)?,
            key,
        )?;
        details.push(pending_detail_from_header(
            &transaction_id,
            values.first().expect("verified journal header"),
        )?);
    }
    details.sort_by(|left, right| left.transaction_id.cmp(&right.transaction_id));
    Ok(details)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn authoritative_pending_transactions(
    journals: RawFd,
    key: &[u8],
    indexed: &[String],
    bound: &[String],
    observed: &[String],
) -> Result<Vec<String>> {
    let mut pending = pending_transactions(journals, key)?;
    pending.extend(
        indexed
            .iter()
            .filter(|id| observed.binary_search(id).is_err() || bound.binary_search(id).is_err())
            .cloned(),
    );
    pending.sort();
    pending.dedup();
    Ok(pending)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn authoritative_pending_transaction_details(
    journals: RawFd,
    key: &[u8],
    indexed: &[String],
    bound: &[String],
    observed: &[String],
    header_records: &std::collections::HashMap<String, Vec<u8>>,
) -> Result<Vec<PendingTransactionDetail>> {
    let pending_ids = authoritative_pending_transactions(journals, key, indexed, bound, observed)?;
    let mut details: std::collections::HashMap<String, PendingTransactionDetail> =
        pending_transaction_details(journals, key)?
            .into_iter()
            .map(|detail| (detail.transaction_id.clone(), detail))
            .collect();
    for transaction_id in &pending_ids {
        if details.contains_key(transaction_id) {
            continue;
        }
        let header = header_records.get(transaction_id).ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_RECOVERY_FACTS_UNAVAILABLE",
                "pending transaction predates durable authenticated recovery facts",
            )
        })?;
        let verified = verify_journal(header, key)?;
        let detail = pending_detail_from_header(
            transaction_id,
            verified
                .first()
                .expect("verified ledger transaction header"),
        )?;
        details.insert(transaction_id.clone(), detail);
    }
    pending_ids
        .iter()
        .map(|id| {
            details.get(id).cloned().ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_RECOVERY_FACTS_UNAVAILABLE",
                    "pending transaction has no authenticated recovery facts",
                )
            })
        })
        .collect()
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn assert_no_pending(
    journals: RawFd,
    key: &[u8],
    indexed: &[String],
    bound: &[String],
    observed: &[String],
    resumable: Option<&str>,
) -> Result<()> {
    let mut pending = authoritative_pending_transactions(journals, key, indexed, bound, observed)?;
    if let Some(resumable) = resumable {
        pending.retain(|id| id != resumable);
    }
    if pending.is_empty() {
        Ok(())
    } else {
        Err(FsError::new(
            "CONSTITUTION_FS_PENDING_TRANSACTION",
            format!("{} transaction(s) require reconciliation", pending.len()),
        ))
    }
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn journal_ids(journals: RawFd) -> Result<Vec<String>> {
    use platform::*;
    let mut observed = Vec::new();
    for name in list_names(journals)? {
        let id = name.strip_suffix(".jsonl").ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "unexpected transaction ledger entry",
            )
        })?;
        if !is_uuid(id) {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "transaction ledger filename is invalid",
            ));
        }
        observed.push(id.to_owned());
    }
    observed.sort();
    Ok(observed)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
struct TransactionLedger {
    _lock: OwnedFd,
    file: OwnedFd,
    indexed: Vec<String>,
    bound: Vec<String>,
    observed: Vec<String>,
    header_digests: std::collections::HashMap<String, String>,
    header_records: std::collections::HashMap<String, Vec<u8>>,
    last_mac: String,
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn transaction_ledger(history: RawFd, journals: RawFd, key: &[u8]) -> Result<TransactionLedger> {
    transaction_ledger_mode(history, journals, key, true)?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_IO",
            "creating transaction ledger unexpectedly remained absent",
        )
    })
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn existing_transaction_ledger(
    history: RawFd,
    journals: RawFd,
    key: &[u8],
) -> Result<Option<TransactionLedger>> {
    transaction_ledger_mode(history, journals, key, false)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn transaction_ledger_mode(
    history: RawFd,
    journals: RawFd,
    key: &[u8],
    create: bool,
) -> Result<Option<TransactionLedger>> {
    use platform::*;
    const LEDGER_NAME: &str = "transaction-ledger.jsonl";
    if !create && open_file_read_write(history, LEDGER_NAME)?.is_none() {
        if !journal_ids(journals)?.is_empty() {
            return Err(FsError::new(
                "CONSTITUTION_FS_LEDGER_MISMATCH",
                "transaction journals exist without the helper-owned ledger",
            ));
        }
        return Ok(None);
    }
    let lock = if create {
        acquire_transaction_lock(history)?
    } else {
        acquire_existing_transaction_lock(history)?
    };
    let ledger = match open_file_read_write(history, LEDGER_NAME)? {
        Some(ledger) => ledger,
        None if create => {
            if !journal_ids(journals)?.is_empty() {
                return Err(FsError::new(
                    "CONSTITUTION_FS_LEDGER_MISMATCH",
                    "transaction journals exist without the helper-owned ledger",
                ));
            }
            let (header, _) = authenticated_journal_line(
                serde_json::json!({ "state": "ledger", "version": 1 }),
                key,
                None,
            )?;
            let created = create_file(history, LEDGER_NAME, &header)?;
            fsync_dir(history)?;
            drop(created);
            open_file_read_write(history, LEDGER_NAME)?.ok_or_else(|| {
                FsError::new("CONSTITUTION_FS_IO", "created transaction ledger vanished")
            })?
        }
        None => {
            if !journal_ids(journals)?.is_empty() {
                return Err(FsError::new(
                    "CONSTITUTION_FS_LEDGER_MISMATCH",
                    "transaction journals exist without the helper-owned ledger",
                ));
            }
            return Ok(None);
        }
    };
    let bytes = read_all(ledger.raw(), MAX_LEDGER_BYTES)?;
    let values = verify_journal_with_torn_tail_repair(ledger.raw(), &bytes, key)?;
    let header = values
        .first()
        .and_then(serde_json::Value::as_object)
        .ok_or_else(|| {
            FsError::new("CONSTITUTION_FS_LEDGER_INVALID", "ledger header is invalid")
        })?;
    if header.len() != 2
        || header.get("state") != Some(&serde_json::json!("ledger"))
        || header.get("version") != Some(&serde_json::json!(1))
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_LEDGER_INVALID",
            "ledger header is not canonical",
        ));
    }
    let mut indexed = Vec::new();
    let mut bound = Vec::new();
    let mut header_digests = std::collections::HashMap::new();
    let mut header_records = std::collections::HashMap::new();
    for value in values.iter().skip(1) {
        let object = value.as_object().ok_or_else(|| {
            FsError::new("CONSTITUTION_FS_LEDGER_INVALID", "ledger entry is invalid")
        })?;
        let transaction_id = object
            .get("transactionId")
            .and_then(serde_json::Value::as_str);
        let state = object.get("state").and_then(serde_json::Value::as_str);
        let header_digest = object
            .get("headerSha256")
            .and_then(serde_json::Value::as_str);
        let header_base64 = object
            .get("headerBase64")
            .and_then(serde_json::Value::as_str);
        if !matches!(state, Some("indexed" | "journal_bound"))
            || ((state == Some("indexed")
                && (!matches!(object.len(), 3 | 4)
                    || header_digest.is_none_or(|value| !is_digest(value))
                    || (object.len() == 4 && header_base64.is_none())))
                || (state == Some("journal_bound")
                    && (object.len() != 2 || header_digest.is_some() || header_base64.is_some())))
            || transaction_id.is_none_or(|id| !is_uuid(id))
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_LEDGER_INVALID",
                "ledger entry is not canonical",
            ));
        }
        let transaction_id = transaction_id.expect("validated transaction id").to_owned();
        if state == Some("indexed") {
            if let Some(encoded) = header_base64 {
                let header = BASE64.decode(encoded).map_err(|_| {
                    FsError::new(
                        "CONSTITUTION_FS_LEDGER_INVALID",
                        "ledger transaction header is not canonical base64",
                    )
                })?;
                if header.len() > MAX_RECORD_BYTES
                    || BASE64.encode(&header) != encoded
                    || sha256(&header) != header_digest.expect("validated header digest")
                {
                    return Err(FsError::new(
                        "CONSTITUTION_FS_LEDGER_INVALID",
                        "ledger transaction header does not match its digest",
                    ));
                }
                let verified = verify_journal(&header, key)?;
                if verified.len() != 1
                    || verified[0]["state"] != "anchored"
                    || verified[0]["transactionId"] != transaction_id
                {
                    return Err(FsError::new(
                        "CONSTITUTION_FS_LEDGER_INVALID",
                        "ledger transaction header binding is invalid",
                    ));
                }
                header_records.insert(transaction_id.clone(), header);
            }
            header_digests.insert(
                transaction_id.clone(),
                header_digest.expect("validated header digest").to_owned(),
            );
            indexed.push(transaction_id);
        } else {
            bound.push(transaction_id);
        }
    }
    let mut canonical = indexed.clone();
    canonical.sort();
    canonical.dedup();
    let observed = journal_ids(journals)?;
    let mut canonical_bound = bound.clone();
    canonical_bound.sort();
    canonical_bound.dedup();
    if canonical.len() != indexed.len()
        || canonical_bound.len() != bound.len()
        || canonical_bound
            .iter()
            .any(|id| canonical.binary_search(id).is_err())
        || observed
            .iter()
            .any(|id| canonical.binary_search(id).is_err())
        || canonical_bound
            .iter()
            .any(|id| observed.binary_search(id).is_err())
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_LEDGER_MISMATCH",
            "anchored journals disagree with the helper-owned authenticated ledger",
        ));
    }
    let last_mac = last_complete_journal_mac(&bytes, "CONSTITUTION_FS_LEDGER_INVALID")?;
    Ok(Some(TransactionLedger {
        _lock: lock,
        file: ledger,
        indexed,
        bound: canonical_bound,
        observed,
        header_digests,
        header_records,
        last_mac,
    }))
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn index_transaction(
    ledger: RawFd,
    key: &[u8],
    previous_mac: &mut String,
    transaction_id: &str,
    header: &[u8],
) -> Result<()> {
    let header_sha256 = sha256(header);
    let (bytes, next_mac) = authenticated_journal_line(
        serde_json::json!({
            "state": "indexed",
            "transactionId": transaction_id,
            "headerSha256": header_sha256,
            "headerBase64": BASE64.encode(header),
        }),
        key,
        Some(previous_mac),
    )?;
    platform::append(ledger, &bytes)?;
    *previous_mac = next_mac;
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn bind_transaction_journal(
    ledger: RawFd,
    key: &[u8],
    previous_mac: &mut String,
    transaction_id: &str,
) -> Result<()> {
    let (bytes, next_mac) = authenticated_journal_line(
        serde_json::json!({ "state": "journal_bound", "transactionId": transaction_id }),
        key,
        Some(previous_mac),
    )?;
    platform::append(ledger, &bytes)?;
    *previous_mac = next_mac;
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn assert_no_orphan_artifacts(
    root: RawFd,
    history: RawFd,
    recovery: RawFd,
    indexed: &[String],
) -> Result<()> {
    use platform::*;
    let known: std::collections::HashSet<&str> = indexed.iter().map(String::as_str).collect();
    for name in list_names(recovery)? {
        let transaction_id = name
            .strip_suffix(".displaced")
            .or_else(|| name.strip_suffix(".legacy-source"))
            .ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_ARTIFACT_ORPHAN",
                    "unexpected recovery artifact",
                )
            })?;
        if !is_uuid(transaction_id) || !known.contains(transaction_id) {
            return Err(FsError::new(
                "CONSTITUTION_FS_ARTIFACT_ORPHAN",
                "recovery artifact has no authenticated ledger entry",
            ));
        }
    }
    let mut parents = vec![open_dir(root, ".", false)?];
    if let Some(specialists) = open_dir_optional(root, "specialists")? {
        parents.push(specialists);
    }
    if let Some(restored) = open_dir_optional(history, "restored")? {
        parents.push(restored);
    }
    for parent in parents {
        for name in list_names(parent.raw())? {
            let transaction_id = name
                .strip_prefix('.')
                .and_then(|value| value.strip_suffix(".replacement"))
                .or_else(|| {
                    name.strip_prefix('.')
                        .and_then(|value| value.strip_suffix(".restore-reservation"))
                });
            if let Some(transaction_id) = transaction_id
                && (!is_uuid(transaction_id) || !known.contains(transaction_id))
            {
                return Err(FsError::new(
                    "CONSTITUTION_FS_ARTIFACT_ORPHAN",
                    "staged artifact has no authenticated ledger entry",
                ));
            }
        }
    }
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn assert_held_stage(parent: RawFd, name: &str, held: &OwnedFd, expected: &[u8]) -> Result<()> {
    use platform::*;
    let current = open_file(parent, name)?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "staged publication source vanished",
        )
    })?;
    if file_identity(current.raw())? != file_identity(held.raw())?
        || read_all(current.raw(), MAX_CONTENT_BYTES)? != expected
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "staged publication source was replaced",
        ));
    }
    Ok(())
}

fn committed_constitution_receipt(
    request: &Request,
    replacement: Option<&[u8]>,
    archive_sha256: Option<String>,
) -> Receipt {
    let target = request.target.as_ref().expect("validated target");
    let expected = request.expected.as_ref().expect("validated expectation");
    Receipt {
        ok: true,
        version: PROTOCOL_VERSION,
        transaction_id: request.transaction_id.clone(),
        request_fingerprint: request.request_fingerprint.clone(),
        operation: match request.operation {
            Operation::Replace => "replace",
            Operation::Delete => "delete",
            Operation::MigrateLegacy => "migrate_legacy",
            _ => unreachable!("constitution receipt mutation identity"),
        },
        outcome: "committed",
        archived_at: request.archived_at,
        reconcile_disposition: None,
        final_present: None,
        final_sha256: None,
        previous_sha256: expected.sha256.clone(),
        replacement_sha256: replacement.map(sha256),
        archive_name: expected.present.then(|| {
            format!(
                "{}.json",
                request.archive_id.as_deref().expect("validated archive id")
            )
        }),
        recovery_name: if request.operation == Operation::MigrateLegacy {
            Some(format!("{}.legacy-source", request.transaction_id))
        } else {
            expected
                .present
                .then(|| format!("{}.displaced", request.transaction_id))
        },
        journal_name: Some(format!("{}.jsonl", request.transaction_id)),
        seal_key_ids: None,
        seal_key_name: None,
        envelope_base64: None,
        envelope_sha256: None,
        target: Some(target.clone()),
        expected_sha256: expected.sha256.clone(),
        archive_sha256,
        source_archive_sha256: None,
        pending_transactions: None,
        pending_transaction_details: None,
        content_base64: None,
        content_sha256: None,
        inventory_entries: None,
        guarantees: Guarantees {
            anchored: true,
            root_identity_bound: true,
            reparse_rejected: true,
            no_replace: true,
            durable: true,
            recovery_retained: true,
        },
    }
}

fn committed_restore_receipt(
    request: &Request,
    restored_content: &[u8],
    source_archive_sha256: String,
    current_archive_sha256: Option<String>,
) -> Receipt {
    let target = request.target.as_ref().expect("validated restore target");
    let expected = request
        .expected
        .as_ref()
        .expect("validated restore expectation");
    Receipt {
        ok: true,
        version: PROTOCOL_VERSION,
        transaction_id: request.transaction_id.clone(),
        request_fingerprint: request.request_fingerprint.clone(),
        operation: "restore",
        outcome: "committed",
        archived_at: request.archived_at,
        reconcile_disposition: None,
        final_present: None,
        final_sha256: None,
        previous_sha256: expected.sha256.clone(),
        replacement_sha256: Some(sha256(restored_content)),
        archive_name: request.archive_id.as_ref().map(|id| format!("{id}.json")),
        recovery_name: expected
            .present
            .then(|| format!("{}.displaced", request.transaction_id)),
        journal_name: Some(format!("{}.jsonl", request.transaction_id)),
        seal_key_ids: None,
        seal_key_name: None,
        envelope_base64: None,
        envelope_sha256: None,
        target: Some(target.clone()),
        expected_sha256: expected.sha256.clone(),
        archive_sha256: current_archive_sha256,
        source_archive_sha256: Some(source_archive_sha256),
        pending_transactions: None,
        pending_transaction_details: None,
        content_base64: None,
        content_sha256: None,
        inventory_entries: None,
        guarantees: Guarantees {
            anchored: true,
            root_identity_bound: true,
            reparse_rejected: true,
            no_replace: true,
            durable: true,
            recovery_retained: true,
        },
    }
}

fn committed_receipt_from_reconcile_facts(
    original_transaction_id: &str,
    facts: &ReconcileFacts,
) -> Receipt {
    let operation = match facts.operation {
        ReconciledOperation::Replace => "replace",
        ReconciledOperation::Delete => "delete",
        ReconciledOperation::Restore => "restore",
        ReconciledOperation::MigrateLegacy => "migrate_legacy",
    };
    Receipt {
        ok: true,
        version: PROTOCOL_VERSION,
        transaction_id: original_transaction_id.to_owned(),
        request_fingerprint: Some(facts.request_fingerprint.clone()),
        operation,
        outcome: "committed",
        archived_at: facts.archived_at,
        reconcile_disposition: None,
        final_present: None,
        final_sha256: None,
        previous_sha256: facts.expected_sha256.clone(),
        replacement_sha256: facts.replacement_sha256.clone(),
        archive_name: facts.expected_present.then(|| {
            format!(
                "{}.json",
                facts.archive_id.as_deref().expect("validated archive id")
            )
        }),
        recovery_name: if facts.operation == ReconciledOperation::MigrateLegacy {
            Some(format!("{original_transaction_id}.legacy-source"))
        } else {
            facts
                .expected_present
                .then(|| format!("{original_transaction_id}.displaced"))
        },
        journal_name: Some(format!("{original_transaction_id}.jsonl")),
        seal_key_ids: None,
        seal_key_name: None,
        envelope_base64: None,
        envelope_sha256: None,
        target: Some(facts.target.clone()),
        expected_sha256: facts.expected_sha256.clone(),
        archive_sha256: facts.archive_sha256.clone(),
        source_archive_sha256: facts.source_archive_sha256.clone(),
        pending_transactions: None,
        pending_transaction_details: None,
        content_base64: None,
        content_sha256: None,
        inventory_entries: None,
        guarantees: Guarantees {
            anchored: true,
            root_identity_bound: true,
            reparse_rejected: true,
            no_replace: true,
            durable: true,
            recovery_retained: true,
        },
    }
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn discard_authenticated_receipt_stage(receipts: RawFd, storage_name: &str) -> Result<()> {
    use platform::*;
    let stage_name = format!(".{storage_name}.receipt.tmp");
    if open_file(receipts, &stage_name)?.is_some() {
        unlink_file(receipts, &stage_name)?;
        fsync_dir(receipts)?;
    }
    Ok(())
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn constitution_transaction(
    request: &Request,
    replacement: Option<Vec<u8>>,
    archive: Option<(Vec<u8>, String)>,
    migration_source: Option<MigrationSource>,
    hook: Hook<'_>,
) -> Result<Receipt> {
    use platform::*;
    let root = open_root(&request.root, &request.root_identity)?;
    lock_anchored_root(root.raw(), true)?;
    let key = journal_key(request)?;
    checkpoint(hook, "anchored")?;
    let target = request.target.as_ref().expect("validated target");
    let expected = request.expected.as_ref().expect("validated expectation");
    let (target_parent, target_name) = match target {
        Target::Constitution { source_name } => {
            (open_dir(root.raw(), ".", false)?, source_name.clone())
        }
        Target::Specialist { specialist_id, .. } => (
            open_dir(root.raw(), "specialists", true)?,
            format!("{specialist_id}.md"),
        ),
    };
    let archives = open_dir(root.raw(), "archives", true)?;
    let history = open_dir(archives.raw(), "constitution-history", true)?;
    let active = open_dir(history.raw(), "active", true)?;
    let recovery = open_dir(history.raw(), "recovery", true)?;
    let journals = open_dir(history.raw(), "transactions", true)?;
    let receipts = open_dir(history.raw(), "receipts", true)?;
    fsync_dir(root.raw())?;
    fsync_dir(archives.raw())?;
    fsync_dir(history.raw())?;
    let held_migration_source = if let Some(source) = migration_source.as_ref() {
        let source_name = match &source.target {
            Target::Constitution { source_name } if source_name == "SOUL.md" => source_name,
            _ => unreachable!("validated fixed legacy source"),
        };
        let recovery_name = format!("{}.legacy-source", request.transaction_id);
        let active_source = open_file(root.raw(), source_name)?;
        let retired_source = open_file(recovery.raw(), &recovery_name)?;
        let held = match (active_source, retired_source) {
            (Some(active), None) => active,
            (None, Some(retired)) => retired,
            _ => {
                return Err(FsError::new(
                    "CONSTITUTION_FS_CONFLICT",
                    "legacy migration source state is absent or ambiguous",
                ));
            }
        };
        if file_link_count(held.raw())? != 1 {
            return Err(FsError::new(
                "CONSTITUTION_FS_REPARSE_REJECTED",
                "legacy migration source has an unsafe hard-link alias",
            ));
        }
        let bytes = read_all(held.raw(), MAX_CONTENT_BYTES)?;
        if sha256(&bytes) != source.sha256 || replacement.as_deref() != Some(bytes.as_slice()) {
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "legacy migration source bytes disagree with the request",
            ));
        }
        let (device, inode) = file_identity(held.raw())?;
        Some((
            held,
            bytes,
            MigrationSourceFacts {
                target: source.target.clone(),
                device: device.to_string(),
                inode: inode.to_string(),
                sha256: source.sha256.clone(),
                parent_request_fingerprint: Some(source.parent_request_fingerprint.clone()),
            },
        ))
    } else {
        None
    };

    let TransactionLedger {
        _lock,
        file: ledger,
        indexed,
        bound,
        observed,
        header_digests,
        header_records: _,
        last_mac: mut ledger_mac,
    } = transaction_ledger(history.raw(), journals.raw(), &key)?;
    assert_no_orphan_artifacts(root.raw(), history.raw(), recovery.raw(), &indexed)?;
    assert_no_orphan_receipts(receipts.raw(), &indexed)?;
    let already_indexed = indexed.iter().any(|id| id == &request.transaction_id);
    let already_bound = bound.binary_search(&request.transaction_id).is_ok();
    let journal_exists = observed.iter().any(|id| id == &request.transaction_id);
    let receipt = committed_constitution_receipt(
        request,
        replacement.as_deref(),
        archive.as_ref().map(|(_, digest)| digest.clone()),
    );
    if already_bound {
        let expected_header_sha256 = sha256(
            &journal_header(
                request,
                &key,
                held_migration_source.as_ref().map(|(_, _, facts)| facts),
            )?
            .0,
        );
        if header_digests.get(&request.transaction_id) != Some(&expected_header_sha256) {
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "retried request disagrees with the authenticated ledger reservation",
            ));
        }
        replay_committed_receipt(
            journals.raw(),
            receipts.raw(),
            request,
            &receipt,
            &key,
            held_migration_source.as_ref().map(|(_, _, facts)| facts),
        )?;
        return Ok(receipt);
    }
    assert_no_pending(
        journals.raw(),
        &key,
        &indexed,
        &bound,
        &observed,
        already_indexed.then_some(request.transaction_id.as_str()),
    )?;
    let existing = open_file(target_parent.raw(), &target_name)?;
    if existing.is_some() != expected.present {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "target presence changed",
        ));
    }
    let expected_snapshot = if let Some(existing) = &existing {
        let bytes = read_all(existing.raw(), MAX_CONTENT_BYTES)?;
        let observed = sha256(&bytes);
        if expected.sha256.as_deref() != Some(observed.as_str()) {
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "target digest changed",
            ));
        }
        Some(bytes)
    } else {
        None
    };
    let journal_name = format!("{}.jsonl", request.transaction_id);
    let (header, mut journal_mac) = journal_header(
        request,
        &key,
        held_migration_source.as_ref().map(|(_, _, facts)| facts),
    )?;
    let header_sha256 = sha256(&header);
    if already_indexed && header_digests.get(&request.transaction_id) != Some(&header_sha256) {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "retried request disagrees with the authenticated ledger reservation",
        ));
    }
    if !already_indexed {
        index_transaction(
            ledger.raw(),
            &key,
            &mut ledger_mac,
            &request.transaction_id,
            &header,
        )?;
    }
    checkpoint(hook, "after_ledger_before_journal")?;
    let journal = if journal_exists {
        let existing = open_file_read_write(journals.raw(), &journal_name)?
            .ok_or_else(|| FsError::new("CONSTITUTION_FS_CONFLICT", "reserved journal vanished"))?;
        let existing_values = verify_journal_with_torn_tail_repair(
            existing.raw(),
            &read_all(existing.raw(), MAX_RECORD_BYTES)?,
            &key,
        )?;
        let expected_values = verify_journal(&header, &key)?;
        if existing_values != expected_values {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "unbound journal does not match the retried request",
            ));
        }
        existing
    } else {
        let created = create_file(journals.raw(), &journal_name, &header)?;
        fsync_dir(journals.raw())?;
        created
    };
    checkpoint(hook, "after_journal_before_ledger_bind")?;
    bind_transaction_journal(ledger.raw(), &key, &mut ledger_mac, &request.transaction_id)?;
    let stage_name = format!(".{}.replacement", request.transaction_id);
    let staged = if let Some(bytes) = &replacement {
        let staged = create_file(target_parent.raw(), &stage_name, bytes)?;
        fsync_dir(target_parent.raw())?;
        append_journal_state(journal.raw(), &key, &mut journal_mac, "replacement_staged")?;
        Some(staged)
    } else {
        None
    };

    let mut previous_sha = None;
    let mut archive_name = None;
    let mut recovery_name = None;
    let mut archive_sha256 = None;
    if let Some(existing) = existing {
        let trusted_bytes = expected_snapshot
            .as_ref()
            .expect("present target has trusted snapshot");
        let observed = sha256(trusted_bytes);
        let held_now = read_all(existing.raw(), MAX_CONTENT_BYTES)?;
        if expected.sha256.as_deref() != Some(observed.as_str()) || held_now != *trusted_bytes {
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "target digest changed",
            ));
        }
        checkpoint(hook, "before_displace")?;
        let displaced_name = format!("{}.displaced", request.transaction_id);
        append_journal_state(journal.raw(), &key, &mut journal_mac, "displace_prepared")?;
        rename_no_replace(
            target_parent.raw(),
            &target_name,
            recovery.raw(),
            &displaced_name,
        )?;
        fsync_dir(target_parent.raw())?;
        fsync_dir(recovery.raw())?;
        checkpoint(hook, "after_displace_before_journal")?;
        append_journal_state(journal.raw(), &key, &mut journal_mac, "displaced")?;
        checkpoint(hook, "displaced")?;

        let displaced = open_file(recovery.raw(), &displaced_name)?
            .ok_or_else(|| FsError::new("CONSTITUTION_FS_IO", "displaced source vanished"))?;
        let old_bytes = read_all(displaced.raw(), MAX_CONTENT_BYTES)?;
        let displaced_sha = sha256(&old_bytes);
        if displaced_sha != observed || old_bytes != *trusted_bytes {
            let _ = create_file(target_parent.raw(), &target_name, trusted_bytes);
            fsync_dir(target_parent.raw())?;
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "target changed during anchored displacement",
            ));
        }

        let id = request.archive_id.as_deref().expect("validated archive id");
        let (archive_bytes, supplied_archive_sha) =
            archive.as_ref().expect("validated authenticated archive");
        validate_authenticated_archive(
            request,
            archive_bytes,
            id,
            target,
            &old_bytes,
            request.archived_at,
        )?;
        let name = format!("{id}.json");
        append_journal_state(journal.raw(), &key, &mut journal_mac, "archive_prepared")?;
        create_file(active.raw(), &name, archive_bytes)?;
        fsync_dir(active.raw())?;
        checkpoint(hook, "after_archive_before_journal")?;
        append_journal_state(journal.raw(), &key, &mut journal_mac, "archived")?;
        checkpoint(hook, "archived")?;
        previous_sha = Some(displaced_sha);
        archive_name = Some(name);
        recovery_name = Some(displaced_name);
        archive_sha256 = Some(supplied_archive_sha.clone());
    }

    if let Some(replacement_bytes) = replacement.as_ref() {
        append_journal_state(journal.raw(), &key, &mut journal_mac, "publish_prepared")?;
        checkpoint(hook, "before_stage_publish")?;
        if let Some((held, original_bytes, facts)) = held_migration_source.as_ref() {
            checkpoint(hook, "before_migration_source_revalidate")?;
            let current = open_file(root.raw(), "SOUL.md")?.ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_CONFLICT",
                    "legacy migration source vanished before publication",
                )
            })?;
            let (device, inode) = file_identity(current.raw())?;
            if file_identity(held.raw())? != (device, inode)
                || device.to_string() != facts.device
                || inode.to_string() != facts.inode
                || file_link_count(held.raw())? != 1
                || file_link_count(current.raw())? != 1
                || read_all(held.raw(), MAX_CONTENT_BYTES)? != *original_bytes
                || read_all(current.raw(), MAX_CONTENT_BYTES)? != *original_bytes
                || sha256(original_bytes) != facts.sha256
            {
                return Err(FsError::new(
                    "CONSTITUTION_FS_CONFLICT",
                    "legacy migration source changed before canonical publication",
                ));
            }
        }
        assert_held_stage(
            target_parent.raw(),
            &stage_name,
            staged.as_ref().expect("replacement has held stage"),
            replacement_bytes,
        )?;
        rename_no_replace(
            target_parent.raw(),
            &stage_name,
            target_parent.raw(),
            &target_name,
        )?;
        fsync_dir(target_parent.raw())?;
        assert_held_stage(
            target_parent.raw(),
            &target_name,
            staged.as_ref().expect("replacement has held stage"),
            replacement_bytes,
        )?;
        checkpoint(hook, "after_publish_before_journal")?;
        append_journal_state(journal.raw(), &key, &mut journal_mac, "published")?;
        if let Some((held, original_bytes, facts)) = held_migration_source.as_ref() {
            let legacy_source_name = format!("{}.legacy-source", request.transaction_id);
            append_journal_state(
                journal.raw(),
                &key,
                &mut journal_mac,
                "migration_source_retire_prepared",
            )?;
            checkpoint(hook, "before_migration_source_retire")?;
            let current = open_file(root.raw(), "SOUL.md")?.ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_CONFLICT",
                    "legacy migration source vanished before retirement",
                )
            })?;
            let (device, inode) = file_identity(current.raw())?;
            if file_identity(held.raw())? != (device, inode)
                || device.to_string() != facts.device
                || inode.to_string() != facts.inode
                || file_link_count(held.raw())? != 1
                || file_link_count(current.raw())? != 1
                || read_all(held.raw(), MAX_CONTENT_BYTES)? != *original_bytes
                || read_all(current.raw(), MAX_CONTENT_BYTES)? != *original_bytes
                || sha256(original_bytes) != facts.sha256
            {
                return Err(FsError::new(
                    "CONSTITUTION_FS_CONFLICT",
                    "legacy migration source changed before retirement",
                ));
            }
            rename_no_replace(root.raw(), "SOUL.md", recovery.raw(), &legacy_source_name)?;
            fsync_dir(root.raw())?;
            fsync_dir(recovery.raw())?;
            checkpoint(hook, "after_migration_source_retire_before_journal")?;
            append_journal_state(
                journal.raw(),
                &key,
                &mut journal_mac,
                "migration_source_retired",
            )?;
            recovery_name = Some(legacy_source_name);
        }
    } else {
        append_journal_state(journal.raw(), &key, &mut journal_mac, "deleted")?;
    }
    checkpoint(hook, "published")?;
    persist_authenticated_receipt(
        receipts.raw(),
        &request.transaction_id,
        &receipt,
        &key,
        hook,
    )?;
    append_journal_state(journal.raw(), &key, &mut journal_mac, "committed")?;
    fsync_dir(journals.raw())?;
    checkpoint(hook, "after_commit_before_response")?;

    // These mutation-derived values are checked while applying the request;
    // the authenticated receipt itself is constructed deterministically from
    // the request so an identical retry can replay the exact committed result.
    debug_assert_eq!(previous_sha, receipt.previous_sha256);
    debug_assert_eq!(archive_name, receipt.archive_name);
    debug_assert_eq!(recovery_name, receipt.recovery_name);
    debug_assert_eq!(archive_sha256, receipt.archive_sha256);
    Ok(receipt)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn restore_transaction(request: &Request, validated: Validated, hook: Hook<'_>) -> Result<Receipt> {
    use platform::*;
    let key = journal_key(request)?;
    let Validated::Restore {
        source_archive_id,
        source_archive,
        source_archive_sha256,
        current_archive,
    } = validated
    else {
        unreachable!("restore dispatcher identity")
    };
    let root = open_root(&request.root, &request.root_identity)?;
    lock_anchored_root(root.raw(), true)?;
    checkpoint(hook, "anchored")?;
    let target = request.target.as_ref().expect("validated restore target");
    let expected = request
        .expected
        .as_ref()
        .expect("validated restore expectation");
    let source_json: serde_json::Value = serde_json::from_slice(&source_archive).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_ARCHIVE_INVALID",
            "restore source is not JSON",
        )
    })?;
    let restored_content = source_json["content"]
        .as_str()
        .ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_ARCHIVE_INVALID",
                "restore source has no content",
            )
        })?
        .as_bytes()
        .to_vec();
    if restored_content.len() > MAX_CONTENT_BYTES {
        return Err(FsError::new(
            "CONSTITUTION_FS_OVERSIZE",
            "restored content exceeds limit",
        ));
    }
    validate_authenticated_archive(
        request,
        &source_archive,
        &source_archive_id,
        target,
        &restored_content,
        None,
    )?;
    let (target_parent, target_name) = match target {
        Target::Constitution { source_name } => {
            (open_dir(root.raw(), ".", false)?, source_name.clone())
        }
        Target::Specialist { specialist_id, .. } => (
            open_dir(root.raw(), "specialists", true)?,
            format!("{specialist_id}.md"),
        ),
    };
    let archives = open_dir(root.raw(), "archives", true)?;
    let history = open_dir(archives.raw(), "constitution-history", true)?;
    let active = open_dir(history.raw(), "active", true)?;
    let restored = open_dir(history.raw(), "restored", true)?;
    let recovery = open_dir(history.raw(), "recovery", true)?;
    let journals = open_dir(history.raw(), "transactions", true)?;
    let receipts = open_dir(history.raw(), "receipts", true)?;
    let TransactionLedger {
        _lock,
        file: ledger,
        indexed,
        bound,
        observed,
        header_digests,
        header_records: _,
        last_mac: mut ledger_mac,
    } = transaction_ledger(history.raw(), journals.raw(), &key)?;
    assert_no_orphan_artifacts(root.raw(), history.raw(), recovery.raw(), &indexed)?;
    assert_no_orphan_receipts(receipts.raw(), &indexed)?;
    let already_indexed = indexed.iter().any(|id| id == &request.transaction_id);
    let already_bound = bound.binary_search(&request.transaction_id).is_ok();
    let journal_exists = observed.iter().any(|id| id == &request.transaction_id);
    let receipt = committed_restore_receipt(
        request,
        &restored_content,
        source_archive_sha256.clone(),
        current_archive.as_ref().map(|(_, digest)| digest.clone()),
    );
    if already_bound {
        let expected_header_sha256 = sha256(&journal_header(request, &key, None)?.0);
        if header_digests.get(&request.transaction_id) != Some(&expected_header_sha256) {
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "retried request disagrees with the authenticated ledger reservation",
            ));
        }
        replay_committed_receipt(
            journals.raw(),
            receipts.raw(),
            request,
            &receipt,
            &key,
            None,
        )?;
        return Ok(receipt);
    }
    assert_no_pending(
        journals.raw(),
        &key,
        &indexed,
        &bound,
        &observed,
        already_indexed.then_some(request.transaction_id.as_str()),
    )?;

    let source_name = format!("{source_archive_id}.json");
    let source_file = open_file(active.raw(), &source_name)?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_ARCHIVE_NOT_FOUND",
            "active archive does not exist",
        )
    })?;
    let source_identity = file_identity(source_file.raw())?;
    let observed_source = read_all(source_file.raw(), MAX_RECORD_BYTES)?;
    if observed_source != source_archive || sha256(&observed_source) != source_archive_sha256 {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "active archive changed before restore",
        ));
    }
    if open_file(restored.raw(), &source_name)?.is_some() {
        return Err(FsError::new(
            "CONSTITUTION_FS_NO_REPLACE",
            "restored archive name is already occupied",
        ));
    }

    let existing = open_file(target_parent.raw(), &target_name)?;
    if existing.is_some() != expected.present {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "restore target presence changed",
        ));
    }
    let expected_snapshot = if let Some(existing) = &existing {
        let bytes = read_all(existing.raw(), MAX_CONTENT_BYTES)?;
        let observed = sha256(&bytes);
        if expected.sha256.as_deref() != Some(observed.as_str()) {
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "restore target digest changed",
            ));
        }
        Some(bytes)
    } else {
        None
    };

    let journal_name = format!("{}.jsonl", request.transaction_id);
    let (header, mut journal_mac) = journal_header(request, &key, None)?;
    let header_sha256 = sha256(&header);
    if already_indexed && header_digests.get(&request.transaction_id) != Some(&header_sha256) {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "retried request disagrees with the authenticated ledger reservation",
        ));
    }
    if !already_indexed {
        index_transaction(
            ledger.raw(),
            &key,
            &mut ledger_mac,
            &request.transaction_id,
            &header,
        )?;
    }
    checkpoint(hook, "after_ledger_before_journal")?;
    let journal = if journal_exists {
        let existing = open_file_read_write(journals.raw(), &journal_name)?
            .ok_or_else(|| FsError::new("CONSTITUTION_FS_CONFLICT", "reserved journal vanished"))?;
        let existing_values = verify_journal_with_torn_tail_repair(
            existing.raw(),
            &read_all(existing.raw(), MAX_RECORD_BYTES)?,
            &key,
        )?;
        let expected_values = verify_journal(&header, &key)?;
        if existing_values != expected_values {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "unbound journal does not match the retried request",
            ));
        }
        existing
    } else {
        let created = create_file(journals.raw(), &journal_name, &header)?;
        fsync_dir(journals.raw())?;
        created
    };
    checkpoint(hook, "after_journal_before_ledger_bind")?;
    bind_transaction_journal(ledger.raw(), &key, &mut ledger_mac, &request.transaction_id)?;
    let reservation_name = format!(".{}.restore-reservation", request.transaction_id);
    create_file(
        restored.raw(),
        &reservation_name,
        source_archive_sha256.as_bytes(),
    )?;
    fsync_dir(restored.raw())?;
    let stage_name = format!(".{}.replacement", request.transaction_id);
    let staged = create_file(target_parent.raw(), &stage_name, &restored_content)?;
    fsync_dir(target_parent.raw())?;
    append_journal_state(journal.raw(), &key, &mut journal_mac, "restore_staged")?;

    let mut previous_sha = None;
    let mut recovery_name = None;
    let mut current_archive_sha = None;
    if let Some(existing) = existing {
        let trusted_bytes = expected_snapshot
            .as_ref()
            .expect("present restore target has trusted snapshot");
        let observed = sha256(trusted_bytes);
        if expected.sha256.as_deref() != Some(observed.as_str())
            || read_all(existing.raw(), MAX_CONTENT_BYTES)? != *trusted_bytes
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "restore target digest changed",
            ));
        }
        let displaced_name = format!("{}.displaced", request.transaction_id);
        append_journal_state(
            journal.raw(),
            &key,
            &mut journal_mac,
            "restore_displace_prepared",
        )?;
        rename_no_replace(
            target_parent.raw(),
            &target_name,
            recovery.raw(),
            &displaced_name,
        )?;
        fsync_dir(target_parent.raw())?;
        fsync_dir(recovery.raw())?;
        checkpoint(hook, "after_restore_displace_before_journal")?;
        append_journal_state(journal.raw(), &key, &mut journal_mac, "displaced")?;
        checkpoint(hook, "restore_displaced")?;
        let displaced = open_file(recovery.raw(), &displaced_name)?
            .ok_or_else(|| FsError::new("CONSTITUTION_FS_IO", "restore displacement vanished"))?;
        let bytes = read_all(displaced.raw(), MAX_CONTENT_BYTES)?;
        if sha256(&bytes) != observed || bytes != *trusted_bytes {
            let _ = create_file(target_parent.raw(), &target_name, trusted_bytes);
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "restore target changed during displacement",
            ));
        }
        let (record, digest) = current_archive
            .as_ref()
            .expect("validated current recovery archive");
        let current_id = request
            .archive_id
            .as_deref()
            .expect("validated current archive id");
        validate_authenticated_archive(
            request,
            record,
            current_id,
            target,
            &bytes,
            request.archived_at,
        )?;
        append_journal_state(
            journal.raw(),
            &key,
            &mut journal_mac,
            "current_archive_prepared",
        )?;
        create_file(active.raw(), &format!("{current_id}.json"), record)?;
        fsync_dir(active.raw())?;
        checkpoint(hook, "after_current_archive_before_journal")?;
        append_journal_state(journal.raw(), &key, &mut journal_mac, "current_archived")?;
        previous_sha = Some(observed);
        recovery_name = Some(displaced_name);
        current_archive_sha = Some(digest.clone());
    }

    append_journal_state(
        journal.raw(),
        &key,
        &mut journal_mac,
        "restore_publish_prepared",
    )?;
    checkpoint(hook, "before_restore_stage_publish")?;
    assert_held_stage(target_parent.raw(), &stage_name, &staged, &restored_content)?;
    rename_no_replace(
        target_parent.raw(),
        &stage_name,
        target_parent.raw(),
        &target_name,
    )?;
    fsync_dir(target_parent.raw())?;
    assert_held_stage(
        target_parent.raw(),
        &target_name,
        &staged,
        &restored_content,
    )?;
    checkpoint(hook, "after_restore_publish_before_journal")?;
    append_journal_state(
        journal.raw(),
        &key,
        &mut journal_mac,
        "restored_content_published",
    )?;
    checkpoint(hook, "restore_published")?;
    checkpoint(hook, "before_restore_source_retire")?;
    append_journal_state(
        journal.raw(),
        &key,
        &mut journal_mac,
        "source_retire_prepared",
    )?;
    rename_no_replace(active.raw(), &source_name, restored.raw(), &source_name)?;
    fsync_dir(active.raw())?;
    fsync_dir(restored.raw())?;
    let retired = open_file(restored.raw(), &source_name)?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "retired source archive vanished",
        )
    })?;
    if file_identity(retired.raw())? != source_identity
        || read_all(retired.raw(), MAX_RECORD_BYTES)? != observed_source
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "source archive identity changed during retirement",
        ));
    }
    checkpoint(hook, "after_source_retire_before_journal")?;
    checkpoint(hook, "restore_source_retired")?;
    append_journal_state(journal.raw(), &key, &mut journal_mac, "source_retired")?;
    persist_authenticated_receipt(
        receipts.raw(),
        &request.transaction_id,
        &receipt,
        &key,
        hook,
    )?;
    append_journal_state(journal.raw(), &key, &mut journal_mac, "committed")?;
    fsync_dir(journals.raw())?;
    checkpoint(hook, "after_commit_before_response")?;

    debug_assert_eq!(previous_sha, receipt.previous_sha256);
    debug_assert_eq!(recovery_name, receipt.recovery_name);
    debug_assert_eq!(current_archive_sha, receipt.archive_sha256);
    Ok(receipt)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn seal_key_transaction(
    request: &Request,
    validated: Validated,
    hook: Hook<'_>,
) -> Result<Receipt> {
    use platform::*;
    let root = open_root(&request.root, &request.root_identity)?;
    lock_anchored_root(root.raw(), true)?;
    checkpoint(hook, "anchored")?;
    let archives = open_dir(root.raw(), "archives", true)?;
    let history = open_dir(archives.raw(), "constitution-history", true)?;
    let keys = open_dir(history.raw(), "seal-keys", true)?;
    fsync_dir(root.raw())?;
    fsync_dir(archives.raw())?;
    fsync_dir(history.raw())?;
    checkpoint(hook, "key_store_anchored")?;

    let mut key_name = None;
    let mut envelope_base64 = None;
    let mut envelope_sha256 = None;
    let (operation, ids) = match validated {
        Validated::SealKeyInventory => {
            let mut found = Vec::new();
            for name in list_names(keys.raw())? {
                if let Some(id) = name.strip_suffix(".json")
                    && is_uuid(id)
                {
                    let file = open_file(keys.raw(), &name)?.ok_or_else(|| {
                        FsError::new("CONSTITUTION_FS_CONFLICT", "seal-key inventory changed")
                    })?;
                    let bytes = read_all(file.raw(), MAX_ENVELOPE_BYTES)?;
                    validate_seal_envelope(&bytes)?;
                    found.push(id.to_owned());
                } else {
                    return Err(FsError::new(
                        "CONSTITUTION_FS_REPARSE_REJECTED",
                        "unexpected seal-key inventory entry",
                    ));
                }
            }
            found.sort();
            ("seal_key_inventory", Some(found))
        }
        Validated::SealKeyRead(id) => {
            let name = format!("{id}.json");
            let file = open_file(keys.raw(), &name)?.ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_KEY_NOT_FOUND",
                    "seal-key envelope does not exist",
                )
            })?;
            let bytes = read_all(file.raw(), MAX_ENVELOPE_BYTES)?;
            validate_seal_envelope(&bytes)?;
            envelope_sha256 = Some(sha256(&bytes));
            envelope_base64 = Some(BASE64.encode(bytes));
            key_name = Some(name);
            ("seal_key_read", Some(vec![id]))
        }
        Validated::SealKeyCreate(id, bytes, digest) => {
            let existing = list_names(keys.raw())?;
            if existing.len() >= MAX_ARCHIVE_KEYS {
                return Err(FsError::new(
                    "CONSTITUTION_FS_ARCHIVE_KEY_LIMIT",
                    "retained archive key history reached its cap",
                ));
            }
            for entry in existing {
                let existing_id = entry.strip_suffix(".json").ok_or_else(|| {
                    FsError::new(
                        "CONSTITUTION_FS_REPARSE_REJECTED",
                        "unexpected seal-key inventory entry",
                    )
                })?;
                if !is_uuid(existing_id) || open_file(keys.raw(), &entry)?.is_none() {
                    return Err(FsError::new(
                        "CONSTITUTION_FS_REPARSE_REJECTED",
                        "unsafe seal-key inventory entry",
                    ));
                }
            }
            let name = format!("{id}.json");
            validate_seal_envelope(&bytes)?;
            create_file(keys.raw(), &name, &bytes)?;
            fsync_dir(keys.raw())?;
            key_name = Some(name);
            envelope_sha256 = Some(digest);
            ("seal_key_create", Some(vec![id]))
        }
        Validated::Constitution { .. }
        | Validated::Restore { .. }
        | Validated::MigrateLegacy { .. }
        | Validated::CommittedLookup(_)
        | Validated::MigrationCommittedLookup(_)
        | Validated::PendingInventory
        | Validated::Reconcile(_)
        | Validated::ReadLive
        | Validated::LiveInventory
        | Validated::ArchiveInventory
        | Validated::ReadArchive(_) => {
            unreachable!("separated by dispatcher")
        }
    };
    Ok(Receipt {
        ok: true,
        version: PROTOCOL_VERSION,
        transaction_id: request.transaction_id.clone(),
        request_fingerprint: None,
        operation,
        outcome: "committed",
        archived_at: None,
        reconcile_disposition: None,
        final_present: None,
        final_sha256: None,
        previous_sha256: None,
        replacement_sha256: None,
        archive_name: None,
        recovery_name: None,
        journal_name: None,
        seal_key_ids: ids,
        seal_key_name: key_name,
        envelope_base64,
        envelope_sha256,
        target: None,
        expected_sha256: None,
        archive_sha256: None,
        source_archive_sha256: None,
        pending_transactions: None,
        pending_transaction_details: None,
        content_base64: None,
        content_sha256: None,
        inventory_entries: None,
        guarantees: Guarantees {
            anchored: true,
            root_identity_bound: true,
            reparse_rejected: true,
            no_replace: true,
            durable: true,
            recovery_retained: true,
        },
    })
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn pending_inventory_transaction(request: &Request, hook: Hook<'_>) -> Result<Receipt> {
    use platform::*;
    let key = journal_key(request)?;
    let root = open_root(&request.root, &request.root_identity)?;
    lock_anchored_root(root.raw(), true)?;
    checkpoint(hook, "anchored")?;
    let Some(archives) = open_dir_optional(root.raw(), "archives")? else {
        return Ok(pending_inventory_receipt(request, Vec::new()));
    };
    let Some(history) = open_dir_optional(archives.raw(), "constitution-history")? else {
        return Ok(pending_inventory_receipt(request, Vec::new()));
    };
    let ledger_exists = open_file(history.raw(), "transaction-ledger.jsonl")?.is_some();
    let Some(journals) = open_dir_optional(history.raw(), "transactions")? else {
        if ledger_exists {
            return Err(FsError::new(
                "CONSTITUTION_FS_LEDGER_MISMATCH",
                "transaction ledger exists without its journal inventory",
            ));
        }
        if let Some(recovery) = open_dir_optional(history.raw(), "recovery")? {
            assert_no_orphan_artifacts(root.raw(), history.raw(), recovery.raw(), &[])?;
        }
        return Ok(pending_inventory_receipt(request, Vec::new()));
    };
    let Some(ledger) = existing_transaction_ledger(history.raw(), journals.raw(), &key)? else {
        if let Some(recovery) = open_dir_optional(history.raw(), "recovery")? {
            assert_no_orphan_artifacts(root.raw(), history.raw(), recovery.raw(), &[])?;
        }
        return Ok(pending_inventory_receipt(request, Vec::new()));
    };
    let recovery = open_dir_optional(history.raw(), "recovery")?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_ARTIFACT_ORPHAN",
            "transaction state exists without recovery inventory",
        )
    })?;
    assert_no_orphan_artifacts(root.raw(), history.raw(), recovery.raw(), &ledger.indexed)?;
    let pending_details = authoritative_pending_transaction_details(
        journals.raw(),
        &key,
        &ledger.indexed,
        &ledger.bound,
        &ledger.observed,
        &ledger.header_records,
    )?;
    Ok(pending_inventory_receipt(request, pending_details))
}

fn pending_inventory_receipt(
    request: &Request,
    pending_details: Vec<PendingTransactionDetail>,
) -> Receipt {
    let pending = pending_details
        .iter()
        .map(|detail| detail.transaction_id.clone())
        .collect();
    Receipt {
        ok: true,
        version: PROTOCOL_VERSION,
        transaction_id: request.transaction_id.clone(),
        request_fingerprint: None,
        operation: "pending_inventory",
        outcome: "committed",
        archived_at: None,
        reconcile_disposition: None,
        final_present: None,
        final_sha256: None,
        previous_sha256: None,
        replacement_sha256: None,
        archive_name: None,
        recovery_name: None,
        journal_name: None,
        seal_key_ids: None,
        seal_key_name: None,
        envelope_base64: None,
        envelope_sha256: None,
        target: None,
        expected_sha256: None,
        archive_sha256: None,
        source_archive_sha256: None,
        pending_transactions: Some(pending),
        pending_transaction_details: Some(pending_details),
        content_base64: None,
        content_sha256: None,
        inventory_entries: None,
        guarantees: Guarantees {
            anchored: true,
            root_identity_bound: true,
            reparse_rejected: true,
            no_replace: true,
            durable: true,
            recovery_retained: true,
        },
    }
}

fn committed_lookup_disposition_receipt(
    request: &Request,
    original_id: &str,
    operation: &'static str,
    outcome: &'static str,
) -> Receipt {
    Receipt {
        ok: true,
        version: PROTOCOL_VERSION,
        transaction_id: request.transaction_id.clone(),
        request_fingerprint: request.request_fingerprint.clone(),
        operation,
        outcome,
        archived_at: None,
        reconcile_disposition: None,
        final_present: None,
        final_sha256: None,
        previous_sha256: None,
        replacement_sha256: None,
        archive_name: None,
        recovery_name: None,
        journal_name: Some(format!("{original_id}.jsonl")),
        seal_key_ids: None,
        seal_key_name: None,
        envelope_base64: None,
        envelope_sha256: None,
        target: None,
        expected_sha256: None,
        archive_sha256: None,
        source_archive_sha256: None,
        pending_transactions: None,
        pending_transaction_details: None,
        content_base64: None,
        content_sha256: None,
        inventory_entries: None,
        guarantees: Guarantees {
            anchored: true,
            root_identity_bound: true,
            reparse_rejected: true,
            no_replace: true,
            durable: true,
            recovery_retained: true,
        },
    }
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn committed_lookup_transaction(
    request: &Request,
    original_id: &str,
    migration_parent_binding: bool,
    hook: Hook<'_>,
) -> Result<Receipt> {
    use platform::*;
    let key = journal_key(request)?;
    let fingerprint = request
        .request_fingerprint
        .as_deref()
        .expect("validated lookup fingerprint");
    let lookup_operation = if migration_parent_binding {
        "migration_committed_lookup"
    } else {
        "committed_lookup"
    };
    let root = open_root(&request.root, &request.root_identity)?;
    lock_anchored_root(root.raw(), false)?;
    checkpoint(hook, "anchored")?;
    let Some(archives) = open_dir_optional(root.raw(), "archives")? else {
        return Ok(committed_lookup_disposition_receipt(
            request,
            original_id,
            lookup_operation,
            "not_found",
        ));
    };
    let Some(history) = open_dir_optional(archives.raw(), "constitution-history")? else {
        return Ok(committed_lookup_disposition_receipt(
            request,
            original_id,
            lookup_operation,
            "not_found",
        ));
    };
    let ledger_exists = open_file(history.raw(), "transaction-ledger.jsonl")?.is_some();
    let Some(journals) = open_dir_optional(history.raw(), "transactions")? else {
        if ledger_exists {
            return Err(FsError::new(
                "CONSTITUTION_FS_LEDGER_MISMATCH",
                "transaction ledger exists without journal inventory",
            ));
        }
        if let Some(receipts) = open_dir_optional(history.raw(), "receipts")? {
            assert_no_orphan_receipts(receipts.raw(), &[])?;
        }
        return Ok(committed_lookup_disposition_receipt(
            request,
            original_id,
            lookup_operation,
            "not_found",
        ));
    };
    let Some(ledger) = existing_transaction_ledger(history.raw(), journals.raw(), &key)? else {
        if let Some(receipts) = open_dir_optional(history.raw(), "receipts")? {
            assert_no_orphan_receipts(receipts.raw(), &[])?;
        }
        return Ok(committed_lookup_disposition_receipt(
            request,
            original_id,
            lookup_operation,
            "not_found",
        ));
    };
    if let Some(receipts) = open_dir_optional(history.raw(), "receipts")? {
        assert_no_orphan_receipts(receipts.raw(), &ledger.indexed)?;
    }
    if !ledger.indexed.iter().any(|id| id == original_id) {
        return Ok(committed_lookup_disposition_receipt(
            request,
            original_id,
            lookup_operation,
            "not_found",
        ));
    }
    if !ledger.bound.iter().any(|id| id == original_id)
        || !ledger.observed.iter().any(|id| id == original_id)
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_PENDING_TRANSACTION",
            "looked-up transaction requires reconciliation",
        ));
    }
    let header = ledger.header_records.get(original_id).ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_RECOVERY_FACTS_UNAVAILABLE",
            "looked-up transaction lacks authenticated recovery facts",
        )
    })?;
    let header_values = verify_journal(header, &key)?;
    let header_value = header_values
        .first()
        .ok_or_else(|| FsError::new("CONSTITUTION_FS_JOURNAL_INVALID", "journal is empty"))?;
    let detail = pending_detail_from_header(original_id, header_value)?;
    let binding_matches = if migration_parent_binding {
        detail.reconcile_facts.operation == ReconciledOperation::MigrateLegacy
            && detail
                .reconcile_facts
                .migration_source
                .as_ref()
                .and_then(|source| source.parent_request_fingerprint.as_deref())
                == Some(fingerprint)
    } else {
        detail.reconcile_facts.request_fingerprint == fingerprint
    };
    if !binding_matches {
        return Err(FsError::new(
            "CONSTITUTION_FS_CONFLICT",
            "lookup binding disagrees with the authenticated original request",
        ));
    }
    let journal_name = format!("{original_id}.jsonl");
    let journal = open_file_read_write(journals.raw(), &journal_name)?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "bound lookup journal is missing",
        )
    })?;
    let values = verify_journal_with_torn_tail_repair(
        journal.raw(),
        &read_all(journal.raw(), MAX_RECORD_BYTES)?,
        &key,
    )?;
    if values.first() != Some(header_value) {
        return Err(FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "lookup journal disagrees with authenticated ledger facts",
        ));
    }
    if values.last().and_then(|value| value["state"].as_str()) != Some("committed") {
        return Err(FsError::new(
            "CONSTITUTION_FS_PENDING_TRANSACTION",
            "looked-up transaction has no definitive disposition",
        ));
    }
    let receipts = open_dir_optional(history.raw(), "receipts")?.ok_or_else(|| {
        FsError::new(
            "CONSTITUTION_FS_RECEIPT_MISSING",
            "definitive transaction receipt inventory is missing",
        )
    })?;
    let terminal_disposition = values
        .iter()
        .rev()
        .nth(1)
        .and_then(serde_json::Value::as_object);
    if terminal_disposition.and_then(|value| value["state"].as_str()) == Some("rolled_back") {
        let terminal = terminal_disposition.expect("matched terminal rollback");
        let reconciliation_id = terminal
            .get("reconciliationTransactionId")
            .and_then(serde_json::Value::as_str)
            .filter(|value| is_uuid(value))
            .ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_JOURNAL_INVALID",
                    "rollback disposition lacks reconciliation identity",
                )
            })?;
        let terminal_receipt_sha256 = terminal
            .get("receiptSha256")
            .and_then(serde_json::Value::as_str)
            .filter(|value| is_digest(value))
            .ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_JOURNAL_INVALID",
                    "rollback disposition lacks receipt digest",
                )
            })?;
        if terminal.len() != 3 {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "rollback disposition fields are not exact",
            ));
        }
        let storage_name = format!("{original_id}.reconcile.{reconciliation_id}");
        let (receipt_value, receipt_sha256) =
            read_authenticated_receipt_value(receipts.raw(), &storage_name, &key)?;
        if receipt_sha256 != terminal_receipt_sha256
            || receipt_value["operation"] != "reconcile"
            || receipt_value["outcome"] != "committed"
            || receipt_value["transactionId"] != reconciliation_id
            || receipt_value["reconcileDisposition"] != "rolled_back"
            || receipt_value["version"] != PROTOCOL_VERSION
            || receipt_value["ok"] != true
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_RECEIPT_INVALID",
                "authenticated rollback receipt disagrees with its terminal disposition",
            ));
        }
        return Ok(committed_lookup_disposition_receipt(
            request,
            original_id,
            lookup_operation,
            "rolled_back",
        ));
    }
    let receipt = committed_receipt_from_reconcile_facts(original_id, &detail.reconcile_facts);
    verify_authenticated_receipt(receipts.raw(), original_id, &receipt, &key)?;
    Ok(receipt)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn assert_no_pending_for_read(root: RawFd, key: &[u8]) -> Result<()> {
    use platform::*;
    let Some(archives) = open_dir_optional(root, "archives")? else {
        return Ok(());
    };
    let Some(history) = open_dir_optional(archives.raw(), "constitution-history")? else {
        return Ok(());
    };
    let ledger_exists = open_file(history.raw(), "transaction-ledger.jsonl")?.is_some();
    let Some(journals) = open_dir_optional(history.raw(), "transactions")? else {
        return if ledger_exists {
            Err(FsError::new(
                "CONSTITUTION_FS_LEDGER_MISMATCH",
                "transaction ledger exists without its journal inventory",
            ))
        } else {
            Ok(())
        };
    };
    let Some(ledger) = existing_transaction_ledger(history.raw(), journals.raw(), key)? else {
        return Ok(());
    };
    assert_no_pending(
        journals.raw(),
        key,
        &ledger.indexed,
        &ledger.bound,
        &ledger.observed,
        None,
    )
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn reconcile_transaction(request: &Request, reconcile_id: &str, hook: Hook<'_>) -> Result<Receipt> {
    use platform::*;
    let key = journal_key(request)?;
    let root = open_root(&request.root, &request.root_identity)?;
    lock_anchored_root(root.raw(), true)?;
    checkpoint(hook, "anchored")?;
    let facts = request
        .reconcile_facts
        .as_ref()
        .expect("validated reconciliation facts");
    let archives = open_dir(root.raw(), "archives", true)?;
    let history = open_dir(archives.raw(), "constitution-history", true)?;
    let active = open_dir(history.raw(), "active", true)?;
    let restored = open_dir(history.raw(), "restored", true)?;
    let recovery = open_dir(history.raw(), "recovery", true)?;
    let journals = open_dir(history.raw(), "transactions", true)?;
    let receipts = open_dir(history.raw(), "receipts", true)?;
    let mut ledger = transaction_ledger(history.raw(), journals.raw(), &key)?;
    assert_no_orphan_artifacts(root.raw(), history.raw(), recovery.raw(), &ledger.indexed)?;
    assert_no_orphan_receipts(receipts.raw(), &ledger.indexed)?;
    let journal_name = format!("{reconcile_id}.jsonl");
    let journal = match open_file_read_write(journals.raw(), &journal_name)? {
        Some(journal) => journal,
        None if ledger.indexed.iter().any(|id| id == reconcile_id)
            && !ledger.bound.iter().any(|id| id == reconcile_id)
            && !ledger.observed.iter().any(|id| id == reconcile_id) =>
        {
            let header = ledger.header_records.get(reconcile_id).ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_RECOVERY_FACTS_UNAVAILABLE",
                    "ledger-only transaction predates durable authenticated recovery facts",
                )
            })?;
            let verified = verify_journal(header, &key)?;
            let detail = pending_detail_from_header(
                reconcile_id,
                verified
                    .first()
                    .expect("verified ledger transaction header"),
            )?;
            if detail.reconcile_facts != *facts {
                return Err(FsError::new(
                    "CONSTITUTION_FS_JOURNAL_INVALID",
                    "caller reconciliation facts disagree with the authenticated ledger",
                ));
            }
            let created = create_file(journals.raw(), &journal_name, header)?;
            fsync_dir(journals.raw())?;
            drop(created);
            open_file_read_write(journals.raw(), &journal_name)?.ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_CONFLICT",
                    "reconstructed reconciliation journal vanished",
                )
            })?
        }
        None => {
            return Err(FsError::new(
                "CONSTITUTION_FS_TRANSACTION_NOT_FOUND",
                "reconciliation journal does not exist",
            ));
        }
    };
    if !ledger.bound.iter().any(|id| id == reconcile_id) {
        if !ledger.indexed.iter().any(|id| id == reconcile_id) {
            return Err(FsError::new(
                "CONSTITUTION_FS_LEDGER_MISMATCH",
                "reconciliation journal lacks an authenticated reservation",
            ));
        }
        bind_transaction_journal(ledger.file.raw(), &key, &mut ledger.last_mac, reconcile_id)?;
    }
    let bytes = read_all(journal.raw(), MAX_RECORD_BYTES)?;
    let values = verify_journal_with_torn_tail_repair(journal.raw(), &bytes, &key)?;
    let header = values.first().expect("verified journal header").clone();
    let authenticated_detail = pending_detail_from_header(reconcile_id, &header)?;
    if authenticated_detail.reconcile_facts != *facts {
        return Err(FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "journal is not exactly bound to caller-authorized facts",
        ));
    }
    let terminal_reconciliation = values
        .iter()
        .rev()
        .nth(1)
        .and_then(serde_json::Value::as_object)
        .and_then(|object| {
            let state = object.get("state")?.as_str()?;
            let reconciliation_id = object.get("reconciliationTransactionId")?.as_str()?;
            let receipt_sha256 = object.get("receiptSha256")?.as_str()?;
            (object.len() == 3 && matches!(state, "rolled_forward" | "rolled_back")).then(|| {
                (
                    state.to_owned(),
                    reconciliation_id.to_owned(),
                    receipt_sha256.to_owned(),
                )
            })
        })
        .filter(|_| {
            values.last().is_some_and(|value| {
                value.as_object().is_some_and(|object| {
                    object.len() == 1
                        && object.get("state") == Some(&serde_json::json!("committed"))
                })
            })
        });
    let terminal_disposition_index = terminal_reconciliation
        .as_ref()
        .map(|_| values.len().saturating_sub(2));
    let mut observed_states = Vec::new();
    for (index, value) in values.iter().enumerate().skip(1) {
        let object = value.as_object().ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "journal state is not an object",
            )
        })?;
        if Some(index) != terminal_disposition_index
            && (object.len() != 1 || !object.contains_key("state"))
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_JOURNAL_INVALID",
                "journal state fields are not exact",
            ));
        }
        observed_states.push(
            value["state"]
                .as_str()
                .ok_or_else(|| {
                    FsError::new(
                        "CONSTITUTION_FS_JOURNAL_INVALID",
                        "journal state is not a string",
                    )
                })?
                .to_owned(),
        );
    }
    let allowed: Vec<&str> = match (&facts.operation, facts.expected_present) {
        (ReconciledOperation::Replace, true) => vec![
            "replacement_staged",
            "displace_prepared",
            "displaced",
            "archive_prepared",
            "archived",
            "publish_prepared",
            "published",
            "committed",
        ],
        (ReconciledOperation::Replace, false) => {
            vec![
                "replacement_staged",
                "publish_prepared",
                "published",
                "committed",
            ]
        }
        (ReconciledOperation::Delete, true) => vec![
            "displace_prepared",
            "displaced",
            "archive_prepared",
            "archived",
            "deleted",
            "committed",
        ],
        (ReconciledOperation::Delete, false) => vec!["deleted", "committed"],
        (ReconciledOperation::Restore, true) => vec![
            "restore_staged",
            "restore_displace_prepared",
            "displaced",
            "current_archive_prepared",
            "current_archived",
            "restore_publish_prepared",
            "restored_content_published",
            "source_retire_prepared",
            "source_retired",
            "committed",
        ],
        (ReconciledOperation::Restore, false) => {
            vec![
                "restore_staged",
                "restore_publish_prepared",
                "restored_content_published",
                "source_retire_prepared",
                "source_retired",
                "committed",
            ]
        }
        (ReconciledOperation::MigrateLegacy, false) => {
            vec![
                "replacement_staged",
                "publish_prepared",
                "published",
                "migration_source_retire_prepared",
                "migration_source_retired",
                "committed",
            ]
        }
        (ReconciledOperation::MigrateLegacy, true) => unreachable!("validated migration absence"),
    };
    let operation_state_count = observed_states.len()
        - if terminal_reconciliation.is_some() {
            2
        } else {
            0
        };
    if operation_state_count >= allowed.len()
        || observed_states[..operation_state_count]
            .iter()
            .zip(allowed.iter())
            .any(|(actual, expected)| actual != expected)
    {
        return Err(FsError::new(
            "CONSTITUTION_FS_JOURNAL_INVALID",
            "journal state sequence is impossible or already terminal",
        ));
    }
    let last_state = observed_states[..operation_state_count]
        .last()
        .map(String::as_str)
        .unwrap_or("anchored");

    let target = &facts.target;
    let (target_parent, target_name) = match target {
        Target::Constitution { source_name } => {
            (open_dir(root.raw(), ".", false)?, source_name.clone())
        }
        Target::Specialist { specialist_id, .. } => (
            open_dir(root.raw(), "specialists", true)?,
            format!("{specialist_id}.md"),
        ),
    };
    let recovery_name = format!("{reconcile_id}.displaced");
    let verify_current = |expected: Option<&str>| -> Result<()> {
        let current = open_file(target_parent.raw(), &target_name)?;
        match (current, expected) {
            (None, None) => Ok(()),
            (Some(file), Some(digest))
                if sha256(&read_all(file.raw(), MAX_CONTENT_BYTES)?) == digest =>
            {
                Ok(())
            }
            _ => Err(FsError::new(
                "CONSTITUTION_FS_RECONCILE_CONFLICT",
                "live target does not match the authorized crash state",
            )),
        }
    };
    let verify_named = |dir: RawFd, name: &str, limit: usize, digest: &str| -> Result<Vec<u8>> {
        let file = open_file(dir, name)?.ok_or_else(|| {
            FsError::new(
                "CONSTITUTION_FS_RECONCILE_CONFLICT",
                format!("required reconciliation artifact {name} is missing"),
            )
        })?;
        let content = read_all(file.raw(), limit)?;
        if sha256(&content) != digest {
            return Err(FsError::new(
                "CONSTITUTION_FS_RECONCILE_CONFLICT",
                format!("reconciliation artifact {name} digest changed"),
            ));
        }
        Ok(content)
    };

    let source_details = if facts.operation == ReconciledOperation::Restore {
        let source_id = facts
            .source_archive_id
            .as_deref()
            .expect("validated source id");
        let source_digest = facts
            .source_archive_sha256
            .as_deref()
            .expect("validated source digest");
        let source_name = format!("{source_id}.json");
        let active_file = open_file(active.raw(), &source_name)?;
        let restored_file = open_file(restored.raw(), &source_name)?;
        let (bytes, in_active) = match (active_file, restored_file) {
            (Some(file), None) => (read_all(file.raw(), MAX_RECORD_BYTES)?, true),
            (None, Some(file)) => (read_all(file.raw(), MAX_RECORD_BYTES)?, false),
            _ => {
                return Err(FsError::new(
                    "CONSTITUTION_FS_RECONCILE_CONFLICT",
                    "source archive retirement state is ambiguous",
                ));
            }
        };
        if sha256(&bytes) != source_digest {
            return Err(FsError::new(
                "CONSTITUTION_FS_RECONCILE_CONFLICT",
                "source archive digest changed",
            ));
        }
        let value: serde_json::Value = serde_json::from_slice(&bytes).map_err(|_| {
            FsError::new(
                "CONSTITUTION_FS_ARCHIVE_INVALID",
                "source archive is invalid JSON",
            )
        })?;
        let content = value["content"]
            .as_str()
            .ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_ARCHIVE_INVALID",
                    "source archive has no content",
                )
            })?
            .as_bytes()
            .to_vec();
        validate_authenticated_archive(request, &bytes, source_id, target, &content, None)?;
        Some((source_name, bytes, content, in_active))
    } else {
        None
    };

    let migration_source_details = if facts.operation == ReconciledOperation::MigrateLegacy {
        let source = facts
            .migration_source
            .as_ref()
            .expect("validated legacy migration source facts");
        let recovery_name = format!("{reconcile_id}.legacy-source");
        let active_file = open_file(root.raw(), "SOUL.md")?;
        let retired_file = open_file(recovery.raw(), &recovery_name)?;
        let (file, in_active) = match (active_file, retired_file) {
            (Some(active_source), None) => (active_source, true),
            (None, Some(retired_source)) => (retired_source, false),
            _ => {
                return Err(FsError::new(
                    "CONSTITUTION_FS_RECONCILE_CONFLICT",
                    "legacy migration source retirement state is ambiguous",
                ));
            }
        };
        let (device, inode) = file_identity(file.raw())?;
        let bytes = read_all(file.raw(), MAX_CONTENT_BYTES)?;
        if file_link_count(file.raw())? != 1
            || device.to_string() != source.device
            || inode.to_string() != source.inode
            || sha256(&bytes) != source.sha256
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_RECONCILE_CONFLICT",
                "legacy migration source no longer matches authenticated facts",
            ));
        }
        Some((recovery_name, bytes, in_active))
    } else {
        None
    };

    let current_digest = match open_file(target_parent.raw(), &target_name)? {
        Some(file) => Some(sha256(&read_all(file.raw(), MAX_CONTENT_BYTES)?)),
        None => None,
    };
    let publication_phase = matches!(
        last_state,
        "publish_prepared"
            | "published"
            | "deleted"
            | "restore_publish_prepared"
            | "restored_content_published"
            | "source_retire_prepared"
            | "source_retired"
            | "migration_source_retire_prepared"
            | "migration_source_retired"
    );
    let publication_observed = match facts.operation {
        ReconciledOperation::Replace => {
            current_digest.as_deref() == facts.replacement_sha256.as_deref()
        }
        ReconciledOperation::Delete => last_state == "deleted" && current_digest.is_none(),
        ReconciledOperation::Restore => source_details
            .as_ref()
            .is_some_and(|(_, _, content, _)| current_digest == Some(sha256(content))),
        ReconciledOperation::MigrateLegacy => {
            current_digest.as_deref() == facts.replacement_sha256.as_deref()
        }
    };

    let archive_maybe_created = matches!(
        last_state,
        "archive_prepared"
            | "archived"
            | "publish_prepared"
            | "published"
            | "deleted"
            | "current_archive_prepared"
            | "current_archived"
            | "restore_publish_prepared"
            | "restored_content_published"
            | "source_retire_prepared"
            | "source_retired"
    ) && facts.expected_present;
    if archive_maybe_created {
        let archive_id = facts.archive_id.as_deref().expect("validated archive id");
        let archive_digest = facts
            .archive_sha256
            .as_deref()
            .expect("validated archive digest");
        match open_file(active.raw(), &format!("{archive_id}.json"))? {
            Some(file) => {
                if sha256(&read_all(file.raw(), MAX_RECORD_BYTES)?) != archive_digest {
                    return Err(FsError::new(
                        "CONSTITUTION_FS_RECONCILE_CONFLICT",
                        "authenticated archive artifact digest changed",
                    ));
                }
            }
            None if matches!(last_state, "archive_prepared" | "current_archive_prepared") => {}
            None => {
                return Err(FsError::new(
                    "CONSTITUTION_FS_RECONCILE_CONFLICT",
                    "required authenticated archive artifact is missing",
                ));
            }
        }
    }

    let rolled_forward = match terminal_reconciliation
        .as_ref()
        .map(|value| value.0.as_str())
    {
        Some("rolled_forward") => true,
        Some("rolled_back") => false,
        _ => publication_phase && publication_observed,
    };
    if rolled_forward {
        if facts.expected_present {
            let recovery_digest = facts
                .recovery_sha256
                .as_deref()
                .expect("validated recovery digest");
            let _ = verify_named(
                recovery.raw(),
                &recovery_name,
                MAX_CONTENT_BYTES,
                recovery_digest,
            )?;
        }
        if let Some((source_name, source_bytes, _, in_active)) = source_details {
            if in_active {
                rename_no_replace(active.raw(), &source_name, restored.raw(), &source_name)?;
                fsync_dir(active.raw())?;
                fsync_dir(restored.raw())?;
            }
            let retired = verify_named(
                restored.raw(),
                &source_name,
                MAX_RECORD_BYTES,
                facts
                    .source_archive_sha256
                    .as_deref()
                    .expect("validated source digest"),
            )?;
            if retired != source_bytes {
                return Err(FsError::new(
                    "CONSTITUTION_FS_RECONCILE_CONFLICT",
                    "retired source archive bytes changed",
                ));
            }
        }
        if let Some((source_name, source_bytes, in_active)) = migration_source_details {
            if in_active {
                rename_no_replace(root.raw(), "SOUL.md", recovery.raw(), &source_name)?;
                fsync_dir(root.raw())?;
                fsync_dir(recovery.raw())?;
            }
            let retired = verify_named(
                recovery.raw(),
                &source_name,
                MAX_CONTENT_BYTES,
                facts
                    .migration_source
                    .as_ref()
                    .expect("validated legacy migration source facts")
                    .sha256
                    .as_str(),
            )?;
            if retired != source_bytes {
                return Err(FsError::new(
                    "CONSTITUTION_FS_RECONCILE_CONFLICT",
                    "retired legacy migration source bytes changed",
                ));
            }
        }
    } else {
        if let Some((source_name, source_bytes, in_active)) = migration_source_details {
            if !in_active {
                rename_no_replace(recovery.raw(), &source_name, root.raw(), "SOUL.md")?;
                fsync_dir(recovery.raw())?;
                fsync_dir(root.raw())?;
            }
            let restored_source = verify_named(
                root.raw(),
                "SOUL.md",
                MAX_CONTENT_BYTES,
                facts
                    .migration_source
                    .as_ref()
                    .expect("validated legacy migration source facts")
                    .sha256
                    .as_str(),
            )?;
            if restored_source != source_bytes {
                return Err(FsError::new(
                    "CONSTITUTION_FS_RECONCILE_CONFLICT",
                    "restored legacy migration source bytes changed",
                ));
            }
        }
        let recovery_file = open_file(recovery.raw(), &recovery_name)?;
        if let Some(recovery_file) = recovery_file {
            let recovery_digest = facts.recovery_sha256.as_deref().ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_RECONCILE_CONFLICT",
                    "unexpected recovery artifact has no authorized digest",
                )
            })?;
            let recovery_bytes = read_all(recovery_file.raw(), MAX_CONTENT_BYTES)?;
            if sha256(&recovery_bytes) != recovery_digest {
                return Err(FsError::new(
                    "CONSTITUTION_FS_RECONCILE_CONFLICT",
                    "recovery artifact digest changed",
                ));
            }
            match open_file(target_parent.raw(), &target_name)? {
                None => {
                    create_file(target_parent.raw(), &target_name, &recovery_bytes)?;
                    fsync_dir(target_parent.raw())?;
                }
                Some(file)
                    if sha256(&read_all(file.raw(), MAX_CONTENT_BYTES)?) == recovery_digest => {}
                _ => {
                    return Err(FsError::new(
                        "CONSTITUTION_FS_RECONCILE_CONFLICT",
                        "cannot restore recovery bytes over a competing target",
                    ));
                }
            }
        } else {
            verify_current(facts.expected_sha256.as_deref())?;
            if matches!(
                last_state,
                "displaced"
                    | "archive_prepared"
                    | "archived"
                    | "current_archive_prepared"
                    | "current_archived"
            ) {
                return Err(FsError::new(
                    "CONSTITUTION_FS_RECONCILE_CONFLICT",
                    "recorded displacement is missing authorized recovery bytes",
                ));
            }
        }
    }
    let final_sha256 = match open_file(target_parent.raw(), &target_name)? {
        Some(file) => Some(sha256(&read_all(file.raw(), MAX_CONTENT_BYTES)?)),
        None => None,
    };
    let authorized_final_sha256 = if rolled_forward {
        match facts.operation {
            ReconciledOperation::Replace
            | ReconciledOperation::Restore
            | ReconciledOperation::MigrateLegacy => facts.replacement_sha256.as_ref(),
            ReconciledOperation::Delete => None,
        }
    } else {
        facts.expected_sha256.as_ref()
    };
    if final_sha256.as_ref() != authorized_final_sha256 {
        return Err(FsError::new(
            "CONSTITUTION_FS_RECONCILE_CONFLICT",
            "final live target does not match the selected reconciliation disposition",
        ));
    }
    let disposition = if rolled_forward {
        "rolled_forward"
    } else {
        "rolled_back"
    };
    let final_archive_name = if let (Some(archive_id), Some(archive_digest)) =
        (facts.archive_id.as_deref(), facts.archive_sha256.as_deref())
    {
        let name = format!("{archive_id}.json");
        match open_file(active.raw(), &name)? {
            Some(file) => {
                if sha256(&read_all(file.raw(), MAX_RECORD_BYTES)?) != archive_digest {
                    return Err(FsError::new(
                        "CONSTITUTION_FS_RECONCILE_CONFLICT",
                        "post-reconcile archive digest changed",
                    ));
                }
                Some(name)
            }
            None => None,
        }
    } else {
        None
    };
    let final_recovery_candidate = if facts.operation == ReconciledOperation::MigrateLegacy {
        format!("{reconcile_id}.legacy-source")
    } else {
        recovery_name
    };
    let final_recovery_name = if open_file(recovery.raw(), &final_recovery_candidate)?.is_some() {
        Some(final_recovery_candidate)
    } else {
        None
    };
    let receipt = Receipt {
        ok: true,
        version: PROTOCOL_VERSION,
        transaction_id: request.transaction_id.clone(),
        request_fingerprint: None,
        operation: "reconcile",
        outcome: "committed",
        archived_at: final_archive_name.as_ref().and(facts.archived_at),
        reconcile_disposition: Some(disposition),
        final_present: Some(final_sha256.is_some()),
        final_sha256: final_sha256.clone(),
        previous_sha256: facts.expected_sha256.clone(),
        replacement_sha256: facts.replacement_sha256.clone(),
        archive_name: final_archive_name.clone(),
        recovery_name: final_recovery_name,
        journal_name: Some(journal_name),
        seal_key_ids: None,
        seal_key_name: None,
        envelope_base64: None,
        envelope_sha256: None,
        target: Some(target.clone()),
        expected_sha256: facts.expected_sha256.clone(),
        archive_sha256: final_archive_name
            .as_ref()
            .and(facts.archive_sha256.clone()),
        source_archive_sha256: facts.source_archive_sha256.clone(),
        pending_transactions: None,
        pending_transaction_details: None,
        content_base64: None,
        content_sha256: None,
        inventory_entries: None,
        guarantees: Guarantees {
            anchored: true,
            root_identity_bound: true,
            reparse_rejected: true,
            no_replace: true,
            durable: true,
            recovery_retained: true,
        },
    };
    let reconcile_receipt_name = format!("{reconcile_id}.reconcile.{}", request.transaction_id);
    if let Some((terminal_disposition, terminal_request_id, terminal_receipt_sha256)) =
        terminal_reconciliation
    {
        let expected_receipt_bytes = serde_json::to_vec(&receipt)
            .map_err(|error| FsError::new("CONSTITUTION_FS_IO", error.to_string()))?;
        if terminal_disposition != disposition
            || terminal_request_id != request.transaction_id
            || terminal_receipt_sha256 != sha256(&expected_receipt_bytes)
        {
            return Err(FsError::new(
                "CONSTITUTION_FS_CONFLICT",
                "terminal reconciliation is bound to a different request or result",
            ));
        }
        verify_authenticated_receipt(receipts.raw(), &reconcile_receipt_name, &receipt, &key)?;
        return Ok(receipt);
    }

    // Resolve any interrupted original receipt publication before sealing the
    // reconciliation result. A rolled-forward mutation receives its exact
    // reconstructible receipt; a rolled-back mutation cannot claim commit.
    if rolled_forward {
        let original_receipt = committed_receipt_from_reconcile_facts(reconcile_id, facts);
        persist_authenticated_receipt(receipts.raw(), reconcile_id, &original_receipt, &key, None)?;
    } else {
        discard_authenticated_receipt_stage(receipts.raw(), reconcile_id)?;
    }
    persist_authenticated_receipt(
        receipts.raw(),
        &reconcile_receipt_name,
        &receipt,
        &key,
        hook,
    )?;
    let receipt_sha256 = sha256(
        &serde_json::to_vec(&receipt)
            .map_err(|error| FsError::new("CONSTITUTION_FS_IO", error.to_string()))?,
    );
    let latest_bytes = read_all(journal.raw(), MAX_RECORD_BYTES)?;
    let mut journal_mac =
        last_complete_journal_mac(&latest_bytes, "CONSTITUTION_FS_JOURNAL_INVALID")?;
    append_reconcile_disposition(
        journal.raw(),
        &key,
        &mut journal_mac,
        disposition,
        &request.transaction_id,
        &receipt_sha256,
    )?;
    append_journal_state(journal.raw(), &key, &mut journal_mac, "committed")?;
    fsync_dir(journals.raw())?;
    checkpoint(hook, "after_commit_before_response")?;
    Ok(receipt)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn read_transaction(request: &Request, operation: Validated, hook: Hook<'_>) -> Result<Receipt> {
    use platform::*;
    let root = open_root(&request.root, &request.root_identity)?;
    lock_anchored_root(root.raw(), false)?;
    checkpoint(hook, "anchored")?;
    let key = journal_key(request)?;
    assert_no_pending_for_read(root.raw(), &key)?;
    let mut target = None;
    let mut content_base64 = None;
    let mut content_sha256 = None;
    let mut inventory_entries = None;
    let operation_name = match operation {
        Validated::ReadLive => {
            let requested = request.target.as_ref().expect("validated read target");
            let (parent, name) = match requested {
                Target::Constitution { source_name } => {
                    (open_dir(root.raw(), ".", false)?, source_name.clone())
                }
                Target::Specialist { specialist_id, .. } => {
                    let specialists =
                        open_dir_optional(root.raw(), "specialists")?.ok_or_else(|| {
                            FsError::new(
                                "CONSTITUTION_FS_NOT_FOUND",
                                "specialist directory is absent",
                            )
                        })?;
                    (specialists, format!("{specialist_id}.md"))
                }
            };
            let file = open_file(parent.raw(), &name)?.ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_NOT_FOUND",
                    "live Constitution target is absent",
                )
            })?;
            let bytes = read_all(file.raw(), MAX_CONTENT_BYTES)?;
            content_sha256 = Some(sha256(&bytes));
            content_base64 = Some(BASE64.encode(bytes));
            target = Some(requested.clone());
            "read_live"
        }
        Validated::LiveInventory => {
            let mut entries = Vec::new();
            for name in ["CONSTITUTION.md", "SOUL.md"] {
                if open_file(root.raw(), name)?.is_some() {
                    entries.push(format!("constitution:{name}"));
                }
            }
            if let Some(specialists) = open_dir_optional(root.raw(), "specialists")? {
                for name in list_names(specialists.raw())? {
                    let id = name.strip_suffix(".md").ok_or_else(|| {
                        FsError::new(
                            "CONSTITUTION_FS_REPARSE_REJECTED",
                            "unexpected specialist entry",
                        )
                    })?;
                    if !is_specialist_id(id) || open_file(specialists.raw(), &name)?.is_none() {
                        return Err(FsError::new(
                            "CONSTITUTION_FS_REPARSE_REJECTED",
                            "specialist inventory entry is unsafe",
                        ));
                    }
                    entries.push(format!("specialist:{id}"));
                }
            }
            entries.sort();
            inventory_entries = Some(entries);
            "live_inventory"
        }
        Validated::ArchiveInventory => {
            let mut entries = Vec::new();
            if let Some(archives) = open_dir_optional(root.raw(), "archives")?
                && let Some(history) = open_dir_optional(archives.raw(), "constitution-history")?
            {
                for (area, prefix) in [("active", "active"), ("restored", "restored")] {
                    if let Some(directory) = open_dir_optional(history.raw(), area)? {
                        for name in list_names(directory.raw())? {
                            if name.starts_with('.') {
                                continue;
                            }
                            let id = name.strip_suffix(".json").ok_or_else(|| {
                                FsError::new(
                                    "CONSTITUTION_FS_REPARSE_REJECTED",
                                    "unexpected archive entry",
                                )
                            })?;
                            if !is_uuid(id) || open_file(directory.raw(), &name)?.is_none() {
                                return Err(FsError::new(
                                    "CONSTITUTION_FS_REPARSE_REJECTED",
                                    "archive inventory entry is unsafe",
                                ));
                            }
                            entries.push(format!("{prefix}:{id}"));
                        }
                    }
                }
            }
            entries.sort();
            inventory_entries = Some(entries);
            "archive_inventory"
        }
        Validated::ReadArchive(archive_id) => {
            let archives = open_dir_optional(root.raw(), "archives")?.ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_ARCHIVE_NOT_FOUND",
                    "archive store is absent",
                )
            })?;
            let history =
                open_dir_optional(archives.raw(), "constitution-history")?.ok_or_else(|| {
                    FsError::new(
                        "CONSTITUTION_FS_ARCHIVE_NOT_FOUND",
                        "archive history is absent",
                    )
                })?;
            let name = format!("{archive_id}.json");
            let mut found = Vec::new();
            for area in ["active", "restored"] {
                if let Some(directory) = open_dir_optional(history.raw(), area)?
                    && let Some(file) = open_file(directory.raw(), &name)?
                {
                    found.push(read_all(file.raw(), MAX_RECORD_BYTES)?);
                }
            }
            if found.len() != 1 {
                return Err(FsError::new(
                    if found.is_empty() {
                        "CONSTITUTION_FS_ARCHIVE_NOT_FOUND"
                    } else {
                        "CONSTITUTION_FS_CONFLICT"
                    },
                    "archive identity is not uniquely anchored",
                ));
            }
            let bytes = found.pop().expect("one anchored archive");
            let value: serde_json::Value = serde_json::from_slice(&bytes).map_err(|_| {
                FsError::new("CONSTITUTION_FS_ARCHIVE_INVALID", "archive is not JSON")
            })?;
            let parsed_target: Target =
                serde_json::from_value(value["target"].clone()).map_err(|_| {
                    FsError::new(
                        "CONSTITUTION_FS_ARCHIVE_INVALID",
                        "archive target is invalid",
                    )
                })?;
            let content = value["content"].as_str().ok_or_else(|| {
                FsError::new(
                    "CONSTITUTION_FS_ARCHIVE_INVALID",
                    "archive content is absent",
                )
            })?;
            validate_authenticated_archive(
                request,
                &bytes,
                &archive_id,
                &parsed_target,
                content.as_bytes(),
                None,
            )?;
            content_sha256 = Some(sha256(&bytes));
            content_base64 = Some(BASE64.encode(bytes));
            target = Some(parsed_target);
            "read_archive"
        }
        _ => unreachable!("read dispatcher identity"),
    };
    Ok(Receipt {
        ok: true,
        version: PROTOCOL_VERSION,
        transaction_id: request.transaction_id.clone(),
        request_fingerprint: None,
        operation: operation_name,
        outcome: "committed",
        archived_at: None,
        reconcile_disposition: None,
        final_present: None,
        final_sha256: None,
        previous_sha256: None,
        replacement_sha256: None,
        archive_name: None,
        recovery_name: None,
        journal_name: None,
        seal_key_ids: None,
        seal_key_name: None,
        envelope_base64: None,
        envelope_sha256: None,
        target,
        expected_sha256: None,
        archive_sha256: None,
        source_archive_sha256: None,
        pending_transactions: None,
        pending_transaction_details: None,
        content_base64,
        content_sha256,
        inventory_entries,
        guarantees: Guarantees {
            anchored: true,
            root_identity_bound: true,
            reparse_rejected: true,
            no_replace: true,
            durable: true,
            recovery_retained: true,
        },
    })
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn transaction(request: &Request, hook: Hook<'_>) -> Result<Receipt> {
    match validate(request)? {
        Validated::Constitution {
            replacement,
            archive,
        } => constitution_transaction(request, replacement, archive, None, hook),
        Validated::MigrateLegacy {
            replacement,
            source,
        } => constitution_transaction(request, Some(replacement), None, Some(source), hook),
        Validated::CommittedLookup(original_id) => {
            committed_lookup_transaction(request, &original_id, false, hook)
        }
        Validated::MigrationCommittedLookup(original_id) => {
            committed_lookup_transaction(request, &original_id, true, hook)
        }
        restore @ Validated::Restore { .. } => restore_transaction(request, restore, hook),
        Validated::PendingInventory => pending_inventory_transaction(request, hook),
        Validated::Reconcile(reconcile_id) => reconcile_transaction(request, &reconcile_id, hook),
        read @ (Validated::ReadLive
        | Validated::LiveInventory
        | Validated::ArchiveInventory
        | Validated::ReadArchive(_)) => read_transaction(request, read, hook),
        seal_operation => seal_key_transaction(request, seal_operation, hook),
    }
}

#[cfg(not(any(target_os = "linux", target_os = "macos")))]
fn transaction(request: &Request, _hook: Option<&dyn Fn(&str) -> Result<()>>) -> Result<Receipt> {
    let _ = validate(request)?;
    Err(FsError::new(
        "CONSTITUTION_FS_UNSAFE_PLATFORM",
        "this build has no proven handle-relative no-replace transaction backend",
    ))
}

fn run() -> Result<Receipt> {
    let mut input = Vec::new();
    io::stdin()
        .take((MAX_REQUEST_BYTES + 1) as u64)
        .read_to_end(&mut input)
        .map_err(|error| FsError::new("CONSTITUTION_FS_IO", error.to_string()))?;
    if input.len() > MAX_REQUEST_BYTES {
        return Err(FsError::new(
            "CONSTITUTION_FS_REQUEST_OVERSIZE",
            "request exceeds the protocol bound",
        ));
    }
    let request: Request = serde_json::from_slice(&input).map_err(|_| {
        FsError::new(
            "CONSTITUTION_FS_INVALID_REQUEST",
            "request is not exact protocol JSON",
        )
    })?;
    transaction(&request, None)
}

fn main() {
    match run() {
        Ok(receipt) => println!(
            "{}",
            serde_json::to_string(&receipt).expect("receipt serialization")
        ),
        Err(error) => {
            println!(
                "{}",
                serde_json::to_string(&ErrorResponse {
                    ok: false,
                    version: PROTOCOL_VERSION,
                    code: error.code.into(),
                    message: error.message
                })
                .expect("error serialization")
            );
            std::process::exit(2);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::sync::atomic::{AtomicU64, Ordering};

    static NEXT: AtomicU64 = AtomicU64::new(1);

    fn temp(label: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!(
            "wayland-constitution-fs-{label}-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&path).unwrap();
        path
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    fn root_identity(root: &Path) -> RootIdentity {
        use std::os::unix::fs::MetadataExt;
        let metadata = fs::metadata(root).unwrap();
        RootIdentity {
            device: metadata.dev().to_string(),
            inode: metadata.ino().to_string(),
        }
    }

    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    fn root_identity(_root: &Path) -> RootIdentity {
        RootIdentity {
            device: "0".into(),
            inode: "0".into(),
        }
    }

    const ARCHIVE_KEY_ID: &str = "ffffffff-ffff-4fff-8fff-ffffffffffff";
    const ARCHIVE_KEY: [u8; 32] = [73_u8; 32];

    fn archive_keys() -> Vec<ArchiveAuthenticationKey> {
        vec![ArchiveAuthenticationKey {
            key_id: ARCHIVE_KEY_ID.into(),
            key_base64: BASE64.encode(ARCHIVE_KEY),
        }]
    }

    fn archive_record(id: &str, target: &Target, content: &[u8]) -> Vec<u8> {
        let content = std::str::from_utf8(content).unwrap();
        let canonical = serde_json::to_vec(&AuthenticatedArchiveMacPayload {
            kind: "wayland-constitution-history",
            version: 3,
            archive_id: id,
            archived_at: 1_784_073_600_000_u64,
            target,
            content,
        })
        .unwrap();
        let mut mac = Hmac::<Sha256>::new_from_slice(&ARCHIVE_KEY).unwrap();
        mac.update(&canonical);
        let digest = format!(
            "hmac-sha256:{ARCHIVE_KEY_ID}:{:x}",
            mac.finalize().into_bytes()
        );
        serde_json::to_vec(&serde_json::json!({
            "kind": "wayland-constitution-history",
            "version": 3,
            "archiveId": id,
            "archivedAt": 1_784_073_600_000_u64,
            "target": target,
            "contentDigest": digest,
            "content": content,
        }))
        .unwrap()
    }

    fn envelope(ciphertext: &[u8]) -> Vec<u8> {
        format!(
            "{{\"formatVersion\":1,\"cipher\":\"electron-safe-storage\",\"ciphertext\":\"{}\"}}\n",
            BASE64.encode(ciphertext)
        )
        .into_bytes()
    }

    fn file_key_envelope(ciphertext: &[u8]) -> Vec<u8> {
        format!(
            "{{\"formatVersion\":1,\"cipher\":\"wayland-file-key-store\",\"ciphertext\":\"fenc:v1:{}\"}}\n",
            BASE64.encode(ciphertext)
        )
        .into_bytes()
    }

    fn request(root: &Path, expected: Option<&[u8]>, replacement: Option<&[u8]>) -> Request {
        let target = Target::Constitution {
            source_name: "CONSTITUTION.md".into(),
        };
        let archive_id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
        let archive = expected.map(|bytes| archive_record(archive_id, &target, bytes));
        Request {
            version: PROTOCOL_VERSION,
            transaction_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa".into(),
            root: root.to_string_lossy().into_owned(),
            root_identity: root_identity(root),
            journal_key_base64: Some(BASE64.encode([42_u8; 32])),
            archive_authentication_keys: expected.map(|_| archive_keys()),
            request_fingerprint: Some(sha256(b"test-request")),
            operation: if replacement.is_some() {
                Operation::Replace
            } else {
                Operation::Delete
            },
            target: Some(target),
            expected: Some(Expected {
                present: expected.is_some(),
                sha256: expected.map(sha256),
            }),
            replacement: replacement.map(|bytes| Payload {
                content_base64: BASE64.encode(bytes),
                sha256: sha256(bytes),
            }),
            archive_id: expected.map(|_| archive_id.into()),
            archived_at: expected.map(|_| 1_784_073_600_000),
            archive: archive.as_ref().map(|bytes| Payload {
                content_base64: BASE64.encode(bytes),
                sha256: sha256(bytes),
            }),
            source_archive_id: None,
            source_archive: None,
            reconcile_transaction_id: None,
            reconcile_facts: None,
            lookup_transaction_id: None,
            migration_source: None,
            seal_key_id: None,
            envelope: None,
        }
    }

    fn restore_request(root: &Path, current: Option<&[u8]>, restored_content: &[u8]) -> Request {
        let target = Target::Constitution {
            source_name: "CONSTITUTION.md".into(),
        };
        let source_id = "99999999-9999-4999-8999-999999999999";
        let source = archive_record(source_id, &target, restored_content);
        let source_dir = root.join("archives/constitution-history/active");
        fs::create_dir_all(&source_dir).unwrap();
        fs::write(source_dir.join(format!("{source_id}.json")), &source).unwrap();
        let current_id = "88888888-8888-4888-8888-888888888888";
        let current_archive = current.map(|bytes| archive_record(current_id, &target, bytes));
        Request {
            version: PROTOCOL_VERSION,
            transaction_id: "77777777-7777-4777-8777-777777777777".into(),
            root: root.to_string_lossy().into_owned(),
            root_identity: root_identity(root),
            journal_key_base64: Some(BASE64.encode([42_u8; 32])),
            archive_authentication_keys: Some(archive_keys()),
            request_fingerprint: Some(sha256(b"restore-request")),
            operation: Operation::Restore,
            target: Some(target),
            expected: Some(Expected {
                present: current.is_some(),
                sha256: current.map(sha256),
            }),
            replacement: None,
            archive_id: current.map(|_| current_id.into()),
            archived_at: current.map(|_| 1_784_073_600_000),
            archive: current_archive.as_ref().map(|bytes| Payload {
                content_base64: BASE64.encode(bytes),
                sha256: sha256(bytes),
            }),
            source_archive_id: Some(source_id.into()),
            source_archive: Some(Payload {
                content_base64: BASE64.encode(&source),
                sha256: sha256(&source),
            }),
            reconcile_transaction_id: None,
            reconcile_facts: None,
            lookup_transaction_id: None,
            migration_source: None,
            seal_key_id: None,
            envelope: None,
        }
    }

    fn reconcile_request(original: &Request) -> Request {
        let operation = match &original.operation {
            Operation::Replace => ReconciledOperation::Replace,
            Operation::Delete => ReconciledOperation::Delete,
            Operation::Restore => ReconciledOperation::Restore,
            _ => unreachable!(),
        };
        let expected = original.expected.as_ref().unwrap();
        Request {
            version: PROTOCOL_VERSION,
            transaction_id: "66666666-6666-4666-8666-666666666666".into(),
            root: original.root.clone(),
            root_identity: original.root_identity.clone(),
            journal_key_base64: original.journal_key_base64.clone(),
            archive_authentication_keys: original
                .archive_authentication_keys
                .as_ref()
                .map(|_| archive_keys()),
            request_fingerprint: None,
            operation: Operation::Reconcile,
            target: None,
            expected: None,
            replacement: None,
            archive_id: None,
            archived_at: None,
            archive: None,
            source_archive_id: None,
            source_archive: None,
            reconcile_transaction_id: Some(original.transaction_id.clone()),
            reconcile_facts: Some(ReconcileFacts {
                request_fingerprint: original.request_fingerprint.clone().unwrap(),
                operation,
                target: original.target.clone().unwrap(),
                expected_present: expected.present,
                expected_sha256: expected.sha256.clone(),
                replacement_sha256: if original.operation == Operation::Restore {
                    let source = original.source_archive.as_ref().expect("restore source");
                    let bytes = BASE64.decode(&source.content_base64).unwrap();
                    let value: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
                    Some(sha256(value["content"].as_str().unwrap().as_bytes()))
                } else {
                    original.replacement.as_ref().map(|p| p.sha256.clone())
                },
                archive_id: original.archive_id.clone(),
                archived_at: original.archived_at,
                archive_sha256: original.archive.as_ref().map(|p| p.sha256.clone()),
                source_archive_id: original.source_archive_id.clone(),
                source_archive_sha256: original.source_archive.as_ref().map(|p| p.sha256.clone()),
                recovery_sha256: expected.sha256.clone(),
                migration_source: None,
            }),
            lookup_transaction_id: None,
            migration_source: None,
            seal_key_id: None,
            envelope: None,
        }
    }

    fn pending_request(original: &Request) -> Request {
        Request {
            version: PROTOCOL_VERSION,
            transaction_id: "55555555-5555-4555-8555-555555555555".into(),
            root: original.root.clone(),
            root_identity: original.root_identity.clone(),
            journal_key_base64: original.journal_key_base64.clone(),
            archive_authentication_keys: None,
            request_fingerprint: None,
            operation: Operation::PendingInventory,
            target: None,
            expected: None,
            replacement: None,
            archive_id: None,
            archived_at: None,
            archive: None,
            source_archive_id: None,
            source_archive: None,
            reconcile_transaction_id: None,
            reconcile_facts: None,
            lookup_transaction_id: None,
            migration_source: None,
            seal_key_id: None,
            envelope: None,
        }
    }

    fn read_request(root: &Path, operation: Operation, target: Option<Target>) -> Request {
        Request {
            version: PROTOCOL_VERSION,
            transaction_id: "22222222-2222-4222-8222-222222222222".into(),
            root: root.to_string_lossy().into_owned(),
            root_identity: root_identity(root),
            journal_key_base64: Some(BASE64.encode([42_u8; 32])),
            archive_authentication_keys: None,
            request_fingerprint: None,
            operation,
            target,
            expected: None,
            replacement: None,
            archive_id: None,
            archived_at: None,
            archive: None,
            source_archive_id: None,
            source_archive: None,
            reconcile_transaction_id: None,
            reconcile_facts: None,
            lookup_transaction_id: None,
            migration_source: None,
            seal_key_id: None,
            envelope: None,
        }
    }

    fn lookup_request(original: &Request, fingerprint: &str) -> Request {
        Request {
            version: PROTOCOL_VERSION,
            transaction_id: "33333333-3333-4333-8333-333333333333".into(),
            root: original.root.clone(),
            root_identity: original.root_identity.clone(),
            journal_key_base64: original.journal_key_base64.clone(),
            archive_authentication_keys: None,
            request_fingerprint: Some(fingerprint.into()),
            operation: Operation::CommittedLookup,
            target: None,
            expected: None,
            replacement: None,
            archive_id: None,
            archived_at: None,
            archive: None,
            source_archive_id: None,
            source_archive: None,
            reconcile_transaction_id: None,
            reconcile_facts: None,
            lookup_transaction_id: Some(original.transaction_id.clone()),
            migration_source: None,
            seal_key_id: None,
            envelope: None,
        }
    }

    fn migration_request(root: &Path, content: &[u8]) -> Request {
        let mut value = request(root, None, Some(content));
        value.operation = Operation::MigrateLegacy;
        value.request_fingerprint = Some(sha256(b"migration-request"));
        value.migration_source = Some(MigrationSource {
            target: Target::Constitution {
                source_name: "SOUL.md".into(),
            },
            sha256: sha256(content),
            parent_request_fingerprint: sha256(b"parent-request"),
        });
        value
    }

    fn migration_lookup_request(original: &Request, parent_fingerprint: &str) -> Request {
        let mut value = lookup_request(original, parent_fingerprint);
        value.operation = Operation::MigrationCommittedLookup;
        value
    }

    fn reconcile_from_detail(original: &Request, detail: &PendingTransactionDetail) -> Request {
        let mut value = pending_request(original);
        value.transaction_id = "44444444-4444-4444-8444-444444444444".into();
        value.operation = Operation::Reconcile;
        value.reconcile_transaction_id = Some(detail.transaction_id.clone());
        value.reconcile_facts = Some(detail.reconcile_facts.clone());
        value.archive_authentication_keys = if detail.reconcile_facts.archive_id.is_some()
            || detail.reconcile_facts.source_archive_id.is_some()
        {
            Some(archive_keys())
        } else {
            None
        };
        value
    }

    fn serialized_receipt(receipt: &Receipt) -> Vec<u8> {
        serde_json::to_vec(receipt).unwrap()
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn parent_swap_cannot_redirect_anchored_transaction() {
        let root = temp("parent-swap");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let moved = root.with_extension("anchored");
        let outside = temp("outside");
        fs::write(outside.join("CONSTITUTION.md"), b"outside").unwrap();
        let hook = |point: &str| {
            if point == "anchored" {
                fs::rename(&root, &moved).unwrap();
                std::os::unix::fs::symlink(&outside, &root).unwrap();
            }
            Ok(())
        };
        let receipt = transaction(
            &request(&root, Some(b"original"), Some(b"new")),
            Some(&hook),
        )
        .unwrap();
        assert_eq!(receipt.outcome, "committed");
        assert_eq!(fs::read(moved.join("CONSTITUTION.md")).unwrap(), b"new");
        assert_eq!(
            fs::read(outside.join("CONSTITUTION.md")).unwrap(),
            b"outside"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn real_directory_swap_before_open_is_rejected_by_root_identity() {
        let root = temp("root-identity");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let value = request(&root, Some(b"original"), Some(b"new"));
        let original = root.with_extension("original");
        fs::rename(&root, &original).unwrap();
        fs::create_dir(&root).unwrap();
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let error = transaction(&value, None).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_ROOT_IDENTITY_MISMATCH");
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"original");
        assert_eq!(
            fs::read(original.join("CONSTITUTION.md")).unwrap(),
            b"original"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn leaf_swap_fails_closed_and_retains_displaced_bytes() {
        let root = temp("leaf-swap");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let stolen = root.join("stolen.md");
        let hook = |point: &str| {
            if point == "before_displace" {
                fs::rename(root.join("CONSTITUTION.md"), &stolen).unwrap();
                fs::write(root.join("CONSTITUTION.md"), b"attacker").unwrap();
            }
            Ok(())
        };
        let error = transaction(
            &request(&root, Some(b"original"), Some(b"new")),
            Some(&hook),
        )
        .unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_CONFLICT");
        assert_eq!(fs::read(&stolen).unwrap(), b"original");
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"original");
        assert_eq!(fs::read(root.join("archives/constitution-history/recovery/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.displaced")).unwrap(), b"attacker");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn recovery_leaf_swap_never_publishes_swapped_bytes() {
        let root = temp("recovery-swap");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let hook = |point: &str| {
            if point == "displaced" {
                let recovery = root.join("archives/constitution-history/recovery");
                fs::rename(
                    recovery.join("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.displaced"),
                    recovery.join("stolen.displaced"),
                )
                .unwrap();
                fs::write(
                    recovery.join("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.displaced"),
                    b"attacker",
                )
                .unwrap();
            }
            Ok(())
        };
        let error = transaction(
            &request(&root, Some(b"original"), Some(b"new")),
            Some(&hook),
        )
        .unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_CONFLICT");
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"original");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn no_replace_collision_never_overwrites_competing_target() {
        let root = temp("collision");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let hook = |point: &str| {
            if point == "archived" {
                fs::write(root.join("CONSTITUTION.md"), b"competitor").unwrap();
            }
            Ok(())
        };
        let error = transaction(
            &request(&root, Some(b"original"), Some(b"new")),
            Some(&hook),
        )
        .unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_NO_REPLACE");
        assert_eq!(
            fs::read(root.join("CONSTITUTION.md")).unwrap(),
            b"competitor"
        );
        assert_eq!(fs::read(root.join("archives/constitution-history/recovery/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.displaced")).unwrap(), b"original");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn injected_crash_retains_recovery_archive_and_journal() {
        let root = temp("crash");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let hook = |point: &str| {
            if point == "archived" {
                return Err(FsError::new("INJECTED_CRASH", "test checkpoint"));
            }
            Ok(())
        };
        let error = transaction(
            &request(&root, Some(b"original"), Some(b"new")),
            Some(&hook),
        )
        .unwrap_err();
        assert_eq!(error.code, "INJECTED_CRASH");
        assert!(root.join("archives/constitution-history/recovery/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.displaced").is_file());
        assert!(
            root.join(
                "archives/constitution-history/active/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.json"
            )
            .is_file()
        );
        assert!(root.join("archives/constitution-history/transactions/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jsonl").is_file());
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn committed_regular_response_loss_replays_exact_receipt_and_rejects_changed_facts() {
        let root = temp("regular-response-loss");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let original = request(&root, Some(b"original"), Some(b"new"));
        let hook = |point: &str| {
            if point == "after_commit_before_response" {
                return Err(FsError::new("INJECTED_RESPONSE_LOSS", "stdout lost"));
            }
            Ok(())
        };
        assert_eq!(
            transaction(&original, Some(&hook)).unwrap_err().code,
            "INJECTED_RESPONSE_LOSS"
        );
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"new");
        let replayed = transaction(&original, None).unwrap();
        let duplicate = transaction(&original, None).unwrap();
        assert_eq!(
            serialized_receipt(&replayed),
            serialized_receipt(&duplicate)
        );
        let changed = request(&root, Some(b"original"), Some(b"different"));
        assert_eq!(
            transaction(&changed, None).unwrap_err().code,
            "CONSTITUTION_FS_CONFLICT"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn committed_receipt_missing_or_corrupt_fails_closed() {
        for case in ["missing", "corrupt"] {
            let root = temp(case);
            let original = request(&root, None, Some(b"new"));
            transaction(&original, None).unwrap();
            let receipt = root.join(format!(
                "archives/constitution-history/receipts/{}.json",
                original.transaction_id
            ));
            if case == "missing" {
                fs::remove_file(receipt).unwrap();
            } else {
                fs::write(receipt, b"{\"state\":\"receipt\"}\n").unwrap();
            }
            let error = transaction(&original, None).unwrap_err();
            assert!(matches!(
                error.code,
                "CONSTITUTION_FS_RECEIPT_MISSING" | "CONSTITUTION_FS_JOURNAL_INVALID"
            ));
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn interrupted_receipt_stage_and_partial_write_reconcile_without_false_commit() {
        for (case, checkpoint_name) in [
            ("complete-stage", "after_receipt_stage_before_publish"),
            ("partial-stage", "before_receipt_stage_write"),
        ] {
            let root = temp(case);
            let original = request(&root, None, Some(b"new"));
            let hook = |point: &str| {
                if point == checkpoint_name {
                    return Err(FsError::new(
                        "INJECTED_RECEIPT_FAILURE",
                        "receipt interrupted",
                    ));
                }
                Ok(())
            };
            assert_eq!(
                transaction(&original, Some(&hook)).unwrap_err().code,
                "INJECTED_RECEIPT_FAILURE"
            );
            let stage = root.join(format!(
                "archives/constitution-history/receipts/.{}.receipt.tmp",
                original.transaction_id
            ));
            if case == "partial-stage" {
                fs::write(&stage, b"{\"partial\":").unwrap();
            } else {
                assert!(stage.is_file());
            }
            let reconciled = transaction(&reconcile_request(&original), None).unwrap();
            assert_eq!(reconciled.reconcile_disposition, Some("rolled_forward"));
            assert!(!stage.exists());
            let replayed = transaction(&original, None).unwrap();
            assert_eq!(replayed.replacement_sha256, Some(sha256(b"new")));
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn every_regular_effect_gap_reconciles_and_unblocks_next_transaction() {
        for checkpoint_name in [
            "after_displace_before_journal",
            "after_archive_before_journal",
            "after_publish_before_journal",
        ] {
            let root = temp(checkpoint_name);
            fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
            let original = request(&root, Some(b"original"), Some(b"new"));
            let hook = |point: &str| {
                if point == checkpoint_name {
                    return Err(FsError::new("INJECTED_CRASH", "effect gap"));
                }
                Ok(())
            };
            assert_eq!(
                transaction(&original, Some(&hook)).unwrap_err().code,
                "INJECTED_CRASH"
            );
            let reconciled = transaction(&reconcile_request(&original), None).unwrap();
            let rolled_forward = checkpoint_name == "after_publish_before_journal";
            assert_eq!(
                reconciled.reconcile_disposition,
                Some(if rolled_forward {
                    "rolled_forward"
                } else {
                    "rolled_back"
                })
            );
            assert_eq!(reconciled.final_present, Some(true));
            assert_eq!(
                reconciled.final_sha256,
                Some(sha256(if rolled_forward { b"new" } else { b"original" }))
            );
            assert_eq!(
                fs::read(root.join("CONSTITUTION.md")).unwrap(),
                if rolled_forward {
                    b"new".as_slice()
                } else {
                    b"original".as_slice()
                }
            );
            assert_eq!(
                reconciled.archive_name.is_some(),
                checkpoint_name != "after_displace_before_journal"
            );
            let pending = transaction(&pending_request(&original), None).unwrap();
            assert_eq!(pending.pending_transactions, Some(Vec::new()));

            let mut next = request(&root, None, Some(b"soul"));
            next.transaction_id = "44444444-4444-4444-8444-444444444444".into();
            next.target = Some(Target::Constitution {
                source_name: "SOUL.md".into(),
            });
            transaction(&next, None).unwrap();
            assert_eq!(fs::read(root.join("SOUL.md")).unwrap(), b"soul");
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn forged_plaintext_terminal_cannot_hide_pending_transaction() {
        let root = temp("forged-terminal");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let original = request(&root, Some(b"original"), Some(b"new"));
        let hook = |point: &str| {
            if point == "after_displace_before_journal" {
                return Err(FsError::new("INJECTED_CRASH", "effect gap"));
            }
            Ok(())
        };
        assert_eq!(
            transaction(&original, Some(&hook)).unwrap_err().code,
            "INJECTED_CRASH"
        );
        let journal = root.join(format!(
            "archives/constitution-history/transactions/{}.jsonl",
            original.transaction_id
        ));
        use std::io::Write;
        let mut file = fs::OpenOptions::new().append(true).open(&journal).unwrap();
        file.write_all(b"{\"state\":\"committed\"}\n").unwrap();
        file.sync_all().unwrap();
        drop(file);
        assert_eq!(
            verify_journal(&fs::read(&journal).unwrap(), &[42_u8; 32])
                .unwrap_err()
                .code,
            "CONSTITUTION_FS_JOURNAL_INVALID"
        );
        let error = transaction(&pending_request(&original), None).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_JOURNAL_INVALID");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn authenticated_journal_repairs_only_an_incomplete_tail_then_reconciles() {
        use std::io::Write;
        let root = temp("torn-journal-tail");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let original = request(&root, Some(b"original"), Some(b"new"));
        let hook = |point: &str| {
            if point == "after_archive_before_journal" {
                return Err(FsError::new("INJECTED_CRASH", "effect gap"));
            }
            Ok(())
        };
        transaction(&original, Some(&hook)).unwrap_err();
        let journal = root.join(format!(
            "archives/constitution-history/transactions/{}.jsonl",
            original.transaction_id
        ));
        let mut file = fs::OpenOptions::new().append(true).open(&journal).unwrap();
        file.write_all(b"{\"state\":\"archived\"").unwrap();
        file.sync_all().unwrap();
        drop(file);
        let receipt = transaction(&reconcile_request(&original), None).unwrap();
        assert_eq!(receipt.reconcile_disposition, Some("rolled_back"));
        let repaired = fs::read(&journal).unwrap();
        assert!(repaired.ends_with(b"\n"));
        assert!(
            !String::from_utf8(repaired)
                .unwrap()
                .contains("\"archived\"\"")
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn authenticated_ledger_repairs_only_an_incomplete_tail() {
        use std::io::Write;
        let root = temp("torn-ledger-tail");
        let original = request(&root, None, Some(b"new"));
        transaction(&original, None).unwrap();
        let ledger = root.join("archives/constitution-history/transaction-ledger.jsonl");
        let mut file = fs::OpenOptions::new().append(true).open(&ledger).unwrap();
        file.write_all(b"{\"state\":\"indexed\"").unwrap();
        file.sync_all().unwrap();
        drop(file);
        let pending = transaction(&pending_request(&original), None).unwrap();
        assert_eq!(pending.pending_transactions, Some(Vec::new()));
        assert!(fs::read(&ledger).unwrap().ends_with(b"\n"));
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn helper_owned_ledger_detects_deleted_transaction_journal() {
        let root = temp("deleted-journal");
        let original = request(&root, None, Some(b"new"));
        transaction(&original, None).unwrap();
        fs::remove_file(root.join(format!(
            "archives/constitution-history/transactions/{}.jsonl",
            original.transaction_id
        )))
        .unwrap();
        let error = transaction(&pending_request(&original), None).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_LEDGER_MISMATCH");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn ledger_only_crash_is_visible_and_retryable_before_any_effect() {
        let root = temp("ledger-only");
        let original = request(&root, None, Some(b"new"));
        let hook = |point: &str| {
            if point == "after_ledger_before_journal" {
                return Err(FsError::new("INJECTED_CRASH", "ledger durable first"));
            }
            Ok(())
        };
        assert_eq!(
            transaction(&original, Some(&hook)).unwrap_err().code,
            "INJECTED_CRASH"
        );
        let pending = transaction(&pending_request(&original), None).unwrap();
        assert_eq!(
            pending.pending_transactions,
            Some(vec![original.transaction_id.clone()])
        );
        let details = pending.pending_transaction_details.unwrap();
        assert_eq!(details.len(), 1);
        assert_eq!(details[0].transaction_id, original.transaction_id);
        assert_eq!(
            details[0].reconcile_facts,
            reconcile_request(&original).reconcile_facts.unwrap()
        );
        let reconciled = transaction(&reconcile_request(&original), None).unwrap();
        assert_eq!(reconciled.reconcile_disposition, Some("rolled_back"));
        assert!(!root.join("CONSTITUTION.md").exists());
        let mut next = request(&root, None, Some(b"new"));
        next.transaction_id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb".into();
        transaction(&next, None).unwrap();
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"new");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn ledger_reservation_rejects_changed_retry_facts() {
        let root = temp("changed-ledger-retry");
        let original = request(&root, None, Some(b"new"));
        let hook = |point: &str| {
            if point == "after_ledger_before_journal" {
                return Err(FsError::new("INJECTED_CRASH", "ledger durable first"));
            }
            Ok(())
        };
        transaction(&original, Some(&hook)).unwrap_err();
        let changed = request(&root, None, Some(b"different"));
        let error = transaction(&changed, None).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_CONFLICT");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn unbound_journal_crash_is_visible_and_retryable_before_any_effect() {
        let root = temp("journal-unbound");
        let original = request(&root, None, Some(b"new"));
        let hook = |point: &str| {
            if point == "after_journal_before_ledger_bind" {
                return Err(FsError::new("INJECTED_CRASH", "journal not yet bound"));
            }
            Ok(())
        };
        assert_eq!(
            transaction(&original, Some(&hook)).unwrap_err().code,
            "INJECTED_CRASH"
        );
        let pending = transaction(&pending_request(&original), None).unwrap();
        assert_eq!(
            pending.pending_transactions,
            Some(vec![original.transaction_id.clone()])
        );
        transaction(&original, None).unwrap();
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"new");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn renamed_authenticated_journal_is_rejected_by_filename_binding() {
        use platform::*;
        let root = temp("renamed-journal");
        let original = request(&root, None, Some(b"new"));
        transaction(&original, None).unwrap();
        let directory = root.join("archives/constitution-history/transactions");
        let renamed = "99999999-9999-4999-8999-999999999999.jsonl";
        fs::rename(
            directory.join(format!("{}.jsonl", original.transaction_id)),
            directory.join(renamed),
        )
        .unwrap();
        let held_root = open_root(&original.root, &original.root_identity).unwrap();
        let archives = open_dir(held_root.raw(), "archives", false).unwrap();
        let history = open_dir(archives.raw(), "constitution-history", false).unwrap();
        let journals = open_dir(history.raw(), "transactions", false).unwrap();
        let error = pending_transactions(journals.raw(), &[42_u8; 32]).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_JOURNAL_INVALID");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn orphan_recovery_artifact_is_rejected() {
        let root = temp("orphan-recovery");
        let recovery = root.join("archives/constitution-history/recovery");
        fs::create_dir_all(&recovery).unwrap();
        fs::write(
            recovery.join("88888888-8888-4888-8888-888888888888.displaced"),
            b"orphan",
        )
        .unwrap();
        let original = request(&root, None, Some(b"new"));
        let error = transaction(&pending_request(&original), None).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_ARTIFACT_ORPHAN");
    }

    #[test]
    fn ledger_retention_is_independent_of_single_record_bound() {
        let key = [42_u8; 32];
        let (mut bytes, mut mac) = authenticated_journal_line(
            serde_json::json!({ "state": "ledger", "version": 1 }),
            &key,
            None,
        )
        .unwrap();
        for index in 0..3_000_u32 {
            let transaction_id = format!("00000000-0000-4000-8000-{index:012x}");
            let (line, next) = authenticated_journal_line(
                serde_json::json!({
                    "state": "indexed",
                    "transactionId": transaction_id,
                    "headerSha256": "sha256:0000000000000000000000000000000000000000000000000000000000000000",
                }),
                &key,
                Some(&mac),
            )
            .unwrap();
            bytes.extend(line);
            mac = next;
        }
        assert!(bytes.len() > MAX_RECORD_BYTES);
        assert!(bytes.len() < MAX_LEDGER_BYTES);
        assert_eq!(verify_journal(&bytes, &key).unwrap().len(), 3_001);
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn anchored_reads_and_inventories_do_not_create_storage() {
        let root = temp("anchored-read");
        fs::write(root.join("CONSTITUTION.md"), b"rules").unwrap();
        fs::create_dir(root.join("specialists")).unwrap();
        fs::write(root.join("specialists/research.md"), b"research").unwrap();
        let read = read_request(
            &root,
            Operation::ReadLive,
            Some(Target::Constitution {
                source_name: "CONSTITUTION.md".into(),
            }),
        );
        let receipt = transaction(&read, None).unwrap();
        assert_eq!(receipt.content_base64, Some(BASE64.encode(b"rules")));
        let live = transaction(&read_request(&root, Operation::LiveInventory, None), None).unwrap();
        assert_eq!(
            live.inventory_entries,
            Some(vec![
                "constitution:CONSTITUTION.md".into(),
                "specialist:research".into(),
            ])
        );
        assert!(!root.join("archives").exists());
        let archives = transaction(
            &read_request(&root, Operation::ArchiveInventory, None),
            None,
        )
        .unwrap();
        assert_eq!(archives.inventory_entries, Some(Vec::new()));
        assert!(!root.join("archives").exists());
    }

    #[test]
    fn headless_file_key_envelope_is_versioned_and_fail_closed() {
        let envelope = file_key_envelope(&[7_u8; 32]);
        validate_seal_envelope(&envelope).unwrap();
        let tampered = file_key_envelope(&[7_u8; 12]);
        assert_eq!(
            validate_seal_envelope(&tampered).unwrap_err().code,
            "CONSTITUTION_FS_ENVELOPE_INVALID"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn anchored_archive_read_binds_record_digest_and_summary() {
        let root = temp("archive-read");
        let id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
        let target = Target::Constitution {
            source_name: "CONSTITUTION.md".into(),
        };
        let record = archive_record(id, &target, b"historic");
        let active = root.join("archives/constitution-history/active");
        fs::create_dir_all(&active).unwrap();
        fs::write(active.join(format!("{id}.json")), &record).unwrap();
        let mut request = read_request(&root, Operation::ReadArchive, None);
        request.archive_id = Some(id.into());
        request.archive_authentication_keys = Some(archive_keys());
        let receipt = transaction(&request, None).unwrap();
        assert_eq!(receipt.content_base64, Some(BASE64.encode(&record)));
        assert_eq!(receipt.content_sha256, Some(sha256(&record)));
        assert_eq!(receipt.target, Some(target));
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn forged_hmac_shaped_archive_is_rejected() {
        let root = temp("archive-forged-mac");
        let id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
        let target = Target::Constitution {
            source_name: "CONSTITUTION.md".into(),
        };
        let mut record: serde_json::Value =
            serde_json::from_slice(&archive_record(id, &target, b"historic")).unwrap();
        record["contentDigest"] =
            serde_json::Value::String(format!("hmac-sha256:{ARCHIVE_KEY_ID}:{}", "00".repeat(32)));
        let record = serde_json::to_vec(&record).unwrap();
        let active = root.join("archives/constitution-history/active");
        fs::create_dir_all(&active).unwrap();
        fs::write(active.join(format!("{id}.json")), &record).unwrap();
        let mut request = read_request(&root, Operation::ReadArchive, None);
        request.archive_id = Some(id.into());
        request.archive_authentication_keys = Some(archive_keys());
        let error = transaction(&request, None).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_ARCHIVE_INVALID");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn caller_archived_at_must_match_the_authenticated_record_and_retry_header() {
        let root = temp("archive-time-binding");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let mut mismatched = request(&root, Some(b"original"), Some(b"new"));
        mismatched.archived_at = Some(1_784_073_600_001);
        let error = transaction(&mismatched, None).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_ARCHIVE_INVALID");

        let root = temp("archive-time-reconcile");
        fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
        let original = request(&root, Some(b"original"), Some(b"new"));
        let hook = |point: &str| {
            if point == "after_archive_before_journal" {
                return Err(FsError::new("INJECTED_CRASH", "archive durable"));
            }
            Ok(())
        };
        transaction(&original, Some(&hook)).unwrap_err();
        let mut reconcile = reconcile_request(&original);
        reconcile.reconcile_facts.as_mut().unwrap().archived_at = Some(1_784_073_600_001);
        let error = transaction(&reconcile, None).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_JOURNAL_INVALID");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn root_lock_serializes_mutation_against_independent_reader() {
        use platform::*;
        let root = temp("process-lock");
        let identity = root_identity(&root);
        let held_root = open_root(root.to_str().unwrap(), &identity).unwrap();
        lock_anchored_root(held_root.raw(), true).unwrap();
        let mut pipe = [0_i32; 2];
        assert_eq!(unsafe { libc::pipe(pipe.as_mut_ptr()) }, 0);
        let child = unsafe { libc::fork() };
        assert!(child >= 0);
        if child == 0 {
            unsafe {
                libc::close(pipe[0]);
                libc::write(pipe[1], b"R".as_ptr().cast(), 1);
                libc::close(held_root.raw());
            }
            std::mem::forget(held_root);
            let child_root = open_root(root.to_str().unwrap(), &identity).unwrap();
            lock_anchored_root(child_root.raw(), false).unwrap();
            unsafe {
                libc::write(pipe[1], b"A".as_ptr().cast(), 1);
            }
            drop(child_root);
            unsafe { libc::_exit(0) };
        }
        unsafe { libc::close(pipe[1]) };
        let mut byte = [0_u8; 1];
        assert_eq!(
            unsafe { libc::read(pipe[0], byte.as_mut_ptr().cast(), 1) },
            1
        );
        assert_eq!(byte[0], b'R');
        let mut poll = libc::pollfd {
            fd: pipe[0],
            events: libc::POLLIN,
            revents: 0,
        };
        assert_eq!(unsafe { libc::poll(&mut poll, 1, 100) }, 0);
        drop(held_root);
        assert_eq!(
            unsafe { libc::read(pipe[0], byte.as_mut_ptr().cast(), 1) },
            1
        );
        assert_eq!(byte[0], b'A');
        let mut status = 0;
        assert_eq!(unsafe { libc::waitpid(child, &mut status, 0) }, child);
        assert!(libc::WIFEXITED(status));
        assert_eq!(libc::WEXITSTATUS(status), 0);
        unsafe { libc::close(pipe[0]) };
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn every_restore_effect_gap_reconciles_and_unblocks_next_transaction() {
        for checkpoint_name in [
            "after_restore_displace_before_journal",
            "after_current_archive_before_journal",
            "after_restore_publish_before_journal",
            "after_source_retire_before_journal",
        ] {
            let root = temp(checkpoint_name);
            fs::write(root.join("CONSTITUTION.md"), b"current").unwrap();
            let original = restore_request(&root, Some(b"current"), b"historic");
            let hook = |point: &str| {
                if point == checkpoint_name {
                    return Err(FsError::new("INJECTED_CRASH", "restore effect gap"));
                }
                Ok(())
            };
            assert_eq!(
                transaction(&original, Some(&hook)).unwrap_err().code,
                "INJECTED_CRASH"
            );
            let reconciled = transaction(&reconcile_request(&original), None).unwrap();
            let rolled_forward = matches!(
                checkpoint_name,
                "after_restore_publish_before_journal" | "after_source_retire_before_journal"
            );
            assert_eq!(
                reconciled.reconcile_disposition,
                Some(if rolled_forward {
                    "rolled_forward"
                } else {
                    "rolled_back"
                })
            );
            assert_eq!(reconciled.final_present, Some(true));
            assert_eq!(
                reconciled.final_sha256,
                Some(sha256(if rolled_forward {
                    b"historic"
                } else {
                    b"current"
                }))
            );
            assert_eq!(
                fs::read(root.join("CONSTITUTION.md")).unwrap(),
                if rolled_forward {
                    b"historic".as_slice()
                } else {
                    b"current".as_slice()
                }
            );
            assert_eq!(
                reconciled.archive_name.is_some(),
                checkpoint_name != "after_restore_displace_before_journal"
            );
            let pending = transaction(&pending_request(&original), None).unwrap();
            assert_eq!(pending.pending_transactions, Some(Vec::new()));

            let mut next = request(&root, None, Some(b"soul"));
            next.transaction_id = "33333333-3333-4333-8333-333333333333".into();
            next.target = Some(Target::Constitution {
                source_name: "SOUL.md".into(),
            });
            transaction(&next, None).unwrap();
            assert_eq!(fs::read(root.join("SOUL.md")).unwrap(), b"soul");
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn committed_restore_response_loss_replays_exact_receipt() {
        let root = temp("restore-response-loss");
        fs::write(root.join("CONSTITUTION.md"), b"current").unwrap();
        let original = restore_request(&root, Some(b"current"), b"historic");
        let hook = |point: &str| {
            if point == "after_commit_before_response" {
                return Err(FsError::new("INJECTED_RESPONSE_LOSS", "stdout lost"));
            }
            Ok(())
        };
        assert_eq!(
            transaction(&original, Some(&hook)).unwrap_err().code,
            "INJECTED_RESPONSE_LOSS"
        );
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"historic");
        let replayed = transaction(&original, None).unwrap();
        let duplicate = transaction(&original, None).unwrap();
        assert_eq!(
            serialized_receipt(&replayed),
            serialized_receipt(&duplicate)
        );
        assert_eq!(replayed.operation, "restore");
        assert_eq!(
            replayed.source_archive_sha256,
            original
                .source_archive
                .as_ref()
                .map(|source| source.sha256.clone())
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn reconcile_response_loss_replays_both_dispositions_and_binds_request_id() {
        for (case, crash_point, expected_disposition) in [
            (
                "reconcile-forward-response-loss",
                "after_publish_before_journal",
                "rolled_forward",
            ),
            (
                "reconcile-back-response-loss",
                "after_archive_before_journal",
                "rolled_back",
            ),
        ] {
            let root = temp(case);
            fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
            let original = request(&root, Some(b"original"), Some(b"new"));
            let crash = |point: &str| {
                if point == crash_point {
                    return Err(FsError::new("INJECTED_CRASH", "mutation interrupted"));
                }
                Ok(())
            };
            transaction(&original, Some(&crash)).unwrap_err();
            let reconciliation = reconcile_request(&original);
            let response_loss = |point: &str| {
                if point == "after_commit_before_response" {
                    return Err(FsError::new(
                        "INJECTED_RESPONSE_LOSS",
                        "reconcile stdout lost",
                    ));
                }
                Ok(())
            };
            assert_eq!(
                transaction(&reconciliation, Some(&response_loss))
                    .unwrap_err()
                    .code,
                "INJECTED_RESPONSE_LOSS"
            );
            let replayed = transaction(&reconciliation, None).unwrap();
            let duplicate = transaction(&reconciliation, None).unwrap();
            assert_eq!(replayed.reconcile_disposition, Some(expected_disposition));
            assert_eq!(
                serialized_receipt(&replayed),
                serialized_receipt(&duplicate)
            );

            let mut changed_request_id = reconcile_request(&original);
            changed_request_id.transaction_id = "12121212-1212-4212-8212-121212121212".into();
            assert_eq!(
                transaction(&changed_request_id, None).unwrap_err().code,
                "CONSTITUTION_FS_CONFLICT"
            );
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn reconcile_receipt_stage_and_publication_interruptions_are_retryable() {
        for checkpoint_name in [
            "after_receipt_stage_before_publish",
            "after_receipt_publish_before_commit",
        ] {
            let root = temp(checkpoint_name);
            fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
            let original = request(&root, Some(b"original"), Some(b"new"));
            let crash = |point: &str| {
                if point == "after_archive_before_journal" {
                    return Err(FsError::new("INJECTED_CRASH", "mutation interrupted"));
                }
                Ok(())
            };
            transaction(&original, Some(&crash)).unwrap_err();
            let reconciliation = reconcile_request(&original);
            let receipt_failure = |point: &str| {
                if point == checkpoint_name {
                    return Err(FsError::new(
                        "INJECTED_RECEIPT_FAILURE",
                        "reconcile receipt interrupted",
                    ));
                }
                Ok(())
            };
            assert_eq!(
                transaction(&reconciliation, Some(&receipt_failure))
                    .unwrap_err()
                    .code,
                "INJECTED_RECEIPT_FAILURE"
            );
            let replayed = transaction(&reconciliation, None).unwrap();
            assert_eq!(replayed.reconcile_disposition, Some("rolled_back"));
            let duplicate = transaction(&reconciliation, None).unwrap();
            assert_eq!(
                serialized_receipt(&replayed),
                serialized_receipt(&duplicate)
            );
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn committed_reconcile_receipt_missing_or_corrupt_fails_closed() {
        for case in ["reconcile-receipt-missing", "reconcile-receipt-corrupt"] {
            let root = temp(case);
            fs::write(root.join("CONSTITUTION.md"), b"original").unwrap();
            let original = request(&root, Some(b"original"), Some(b"new"));
            let crash = |point: &str| {
                if point == "after_archive_before_journal" {
                    return Err(FsError::new("INJECTED_CRASH", "mutation interrupted"));
                }
                Ok(())
            };
            transaction(&original, Some(&crash)).unwrap_err();
            let reconciliation = reconcile_request(&original);
            transaction(&reconciliation, None).unwrap();
            let receipt = root.join(format!(
                "archives/constitution-history/receipts/{}.reconcile.{}.json",
                original.transaction_id, reconciliation.transaction_id
            ));
            if case.ends_with("missing") {
                fs::remove_file(receipt).unwrap();
            } else {
                fs::write(receipt, b"{\"state\":\"receipt\"}\n").unwrap();
            }
            let error = transaction(&reconciliation, None).unwrap_err();
            assert!(matches!(
                error.code,
                "CONSTITUTION_FS_RECEIPT_MISSING" | "CONSTITUTION_FS_JOURNAL_INVALID"
            ));
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn source_archive_swap_before_retirement_cannot_report_commit() {
        let root = temp("source-retirement-swap");
        let original = restore_request(&root, None, b"historic");
        let source_name = "99999999-9999-4999-8999-999999999999.json";
        let hook = |point: &str| {
            if point == "before_restore_source_retire" {
                let active = root.join("archives/constitution-history/active");
                fs::rename(active.join(source_name), active.join("stolen.json")).unwrap();
                fs::write(active.join(source_name), b"attacker").unwrap();
            }
            Ok(())
        };
        let error = transaction(&original, Some(&hook)).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_CONFLICT");
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"historic");
        let journal = fs::read_to_string(root.join(format!(
            "archives/constitution-history/transactions/{}.jsonl",
            original.transaction_id
        )))
        .unwrap();
        assert!(!journal.contains("\"state\":\"committed\""));
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn replaced_ordinary_stage_never_publishes_or_commits() {
        let root = temp("ordinary-stage-swap");
        let original = request(&root, None, Some(b"trusted"));
        let stage = root.join(format!(".{}.replacement", original.transaction_id));
        let hook = |point: &str| {
            if point == "before_stage_publish" {
                fs::remove_file(&stage).unwrap();
                fs::write(&stage, b"attacker").unwrap();
            }
            Ok(())
        };
        let error = transaction(&original, Some(&hook)).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_CONFLICT");
        assert!(!root.join("CONSTITUTION.md").exists());
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn replaced_restore_stage_never_publishes_or_commits() {
        let root = temp("restore-stage-swap");
        let original = restore_request(&root, None, b"trusted");
        let stage = root.join(format!(".{}.replacement", original.transaction_id));
        let hook = |point: &str| {
            if point == "before_restore_stage_publish" {
                fs::remove_file(&stage).unwrap();
                fs::write(&stage, b"attacker").unwrap();
            }
            Ok(())
        };
        let error = transaction(&original, Some(&hook)).unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_CONFLICT");
        assert!(!root.join("CONSTITUTION.md").exists());
    }

    #[test]
    fn rejects_targets_outside_fixed_schema() {
        let root = temp("invalid-target");
        let mut value = request(&root, None, Some(b"new"));
        value.target = Some(Target::Specialist {
            specialist_id: "../escape".into(),
            source_name: "../escape.md".into(),
        });
        assert_eq!(
            validate(&value).unwrap_err().code,
            "CONSTITUTION_FS_INVALID_TARGET"
        );
    }

    #[test]
    fn v2_mutations_require_canonical_request_fingerprint() {
        let root = temp("v2-fingerprint-required");
        let mut value = request(&root, None, Some(b"new"));
        value.request_fingerprint = None;
        assert_eq!(
            validate(&value).unwrap_err().code,
            "CONSTITUTION_FS_INVALID_REQUEST"
        );
        value.request_fingerprint = Some("not-a-digest".into());
        assert_eq!(
            validate(&value).unwrap_err().code,
            "CONSTITUTION_FS_INVALID_REQUEST"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn committed_lookup_is_durable_and_fingerprint_bound() {
        let root = temp("committed-lookup");
        let original = request(&root, None, Some(b"new"));
        let committed = transaction(&original, None).unwrap();
        assert_eq!(committed.transaction_id, original.transaction_id);
        assert_eq!(committed.request_fingerprint, original.request_fingerprint);

        let fingerprint = original.request_fingerprint.as_deref().unwrap();
        let replayed = transaction(&lookup_request(&original, fingerprint), None).unwrap();
        assert_eq!(
            serialized_receipt(&replayed),
            serialized_receipt(&committed)
        );

        let mismatch =
            transaction(&lookup_request(&original, &sha256(b"different")), None).unwrap_err();
        assert_eq!(mismatch.code, "CONSTITUTION_FS_CONFLICT");

        let mut absent = lookup_request(&original, fingerprint);
        absent.lookup_transaction_id = Some("12121212-1212-4121-8121-121212121212".into());
        let absent = transaction(&absent, None).unwrap();
        assert_eq!(absent.operation, "committed_lookup");
        assert_eq!(absent.outcome, "not_found");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn lookup_and_reads_fail_closed_while_original_is_pending() {
        let root = temp("lookup-pending");
        let original = request(&root, None, Some(b"new"));
        let hook = |name: &str| {
            if name == "after_ledger_before_journal" {
                Err(FsError::new(
                    "INJECTED",
                    "stop after authenticated reservation",
                ))
            } else {
                Ok(())
            }
        };
        assert_eq!(
            transaction(&original, Some(&hook)).unwrap_err().code,
            "INJECTED"
        );
        let fingerprint = original.request_fingerprint.as_deref().unwrap();
        assert_eq!(
            transaction(&lookup_request(&original, fingerprint), None)
                .unwrap_err()
                .code,
            "CONSTITUTION_FS_PENDING_TRANSACTION"
        );
        let mut archive_read = read_request(&root, Operation::ReadArchive, None);
        archive_read.archive_id = Some("efefefef-efef-4efe-8efe-efefefefefef".into());
        archive_read.archive_authentication_keys = Some(archive_keys());
        for read in [
            read_request(
                &root,
                Operation::ReadLive,
                Some(Target::Constitution {
                    source_name: "CONSTITUTION.md".into(),
                }),
            ),
            read_request(&root, Operation::LiveInventory, None),
            read_request(&root, Operation::ArchiveInventory, None),
            archive_read,
        ] {
            assert_eq!(
                transaction(&read, None).unwrap_err().code,
                "CONSTITUTION_FS_PENDING_TRANSACTION"
            );
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn committed_lookup_reports_only_definitive_rollback() {
        let root = temp("lookup-rolled-back");
        let original = request(&root, None, Some(b"new"));
        let hook = |name: &str| {
            if name == "after_journal_before_ledger_bind" {
                Err(FsError::new("INJECTED", "stop before any live effect"))
            } else {
                Ok(())
            }
        };
        assert_eq!(
            transaction(&original, Some(&hook)).unwrap_err().code,
            "INJECTED"
        );
        let pending = transaction(&pending_request(&original), None).unwrap();
        let detail = pending
            .pending_transaction_details
            .as_ref()
            .and_then(|items| items.first())
            .unwrap();
        let reconciled = transaction(&reconcile_from_detail(&original, detail), None).unwrap();
        assert_eq!(reconciled.reconcile_disposition, Some("rolled_back"));
        let lookup = transaction(
            &lookup_request(&original, original.request_fingerprint.as_deref().unwrap()),
            None,
        )
        .unwrap();
        assert_eq!(lookup.operation, "committed_lookup");
        assert_eq!(lookup.outcome, "rolled_back");
        fs::remove_file(root.join(format!(
            "archives/constitution-history/receipts/{}.reconcile.{}.json",
            original.transaction_id, "44444444-4444-4444-8444-444444444444"
        )))
        .unwrap();
        assert_eq!(
            transaction(
                &lookup_request(&original, original.request_fingerprint.as_deref().unwrap()),
                None,
            )
            .unwrap_err()
            .code,
            "CONSTITUTION_FS_RECEIPT_MISSING"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn pending_inventory_on_pristine_root_is_strictly_noncreating() {
        let root = temp("pending-noncreating");
        let value = request(&root, None, Some(b"unused"));
        let receipt = transaction(&pending_request(&value), None).unwrap();
        assert!(receipt.pending_transactions.as_ref().unwrap().is_empty());
        assert!(!root.join("archives").exists());

        let partial = temp("pending-noncreating-partial");
        fs::create_dir_all(partial.join("archives/constitution-history/transactions")).unwrap();
        let partial_request = request(&partial, None, Some(b"unused"));
        let partial_history = partial.join("archives/constitution-history");
        transaction(&pending_request(&partial_request), None).unwrap();
        assert!(!partial_history.join("transaction.lock").exists());
        assert!(!partial_history.join("transaction-ledger.jsonl").exists());
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn legacy_v1_terminal_journal_inventory_is_read_compatible_but_pending_is_visible() {
        use platform::*;

        let root = temp("legacy-v1-journal-compatibility");
        let journals_path = root.join("journals");
        fs::create_dir(&journals_path).unwrap();
        let key = [42_u8; 32];
        let id = "abababab-abab-4aba-8aba-abababababab";
        let target = Target::Constitution {
            source_name: "CONSTITUTION.md".into(),
        };
        let (mut bytes, header_mac) = authenticated_journal_line(
            serde_json::json!({
                "state": "anchored",
                "transactionId": id,
                "operation": "replace",
                "target": target,
                "expectedSha256": null,
                "replacementSha256": sha256(b"legacy"),
                "archiveId": null,
                "archivedAt": null,
                "archiveSha256": null,
                "sourceArchiveId": null,
                "sourceArchiveSha256": null,
            }),
            &key,
            None,
        )
        .unwrap();
        let (committed, _) = authenticated_journal_line(
            serde_json::json!({"state":"committed"}),
            &key,
            Some(&header_mac),
        )
        .unwrap();
        bytes.extend(committed);
        fs::write(journals_path.join(format!("{id}.jsonl")), bytes).unwrap();
        let root_fd = open_root(root.to_str().unwrap(), &root_identity(&root)).unwrap();
        let journals = open_dir(root_fd.raw(), "journals", false).unwrap();
        assert!(
            pending_transactions(journals.raw(), &key)
                .unwrap()
                .is_empty()
        );

        let pending_id = "cdcdcdcd-cdcd-4cdc-8dcd-cdcdcdcdcdcd";
        let pending_value = serde_json::json!({
            "state": "anchored",
            "transactionId": pending_id,
            "operation": "delete",
            "target": Target::Constitution { source_name: "CONSTITUTION.md".into() },
            "expectedSha256": sha256(b"legacy"),
            "replacementSha256": null,
            "archiveId": "efefefef-efef-4efe-8efe-efefefefefef",
            "archivedAt": 1_u64,
            "archiveSha256": sha256(b"archive"),
            "sourceArchiveId": null,
            "sourceArchiveSha256": null,
        });
        let (pending_header, _) =
            authenticated_journal_line(pending_value.clone(), &key, None).unwrap();
        fs::write(
            journals_path.join(format!("{pending_id}.jsonl")),
            pending_header,
        )
        .unwrap();
        assert_eq!(
            pending_transactions(journals.raw(), &key).unwrap(),
            vec![pending_id.to_owned()]
        );
        let first = pending_detail_from_header(pending_id, &pending_value).unwrap();
        let second = pending_detail_from_header(pending_id, &pending_value).unwrap();
        assert_eq!(first.reconcile_facts, second.reconcile_facts);
        assert!(is_digest(&first.reconcile_facts.request_fingerprint));
        assert_eq!(first.reconcile_facts.operation, ReconciledOperation::Delete);
        assert_eq!(
            first.reconcile_facts.expected_sha256,
            Some(sha256(b"legacy"))
        );
        assert_eq!(
            first.reconcile_facts.archive_sha256,
            Some(sha256(b"archive"))
        );
        assert!(first.reconcile_facts.migration_source.is_none());
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn migrate_legacy_atomically_publishes_held_soul_bytes() {
        let root = temp("migrate-legacy-happy");
        fs::write(root.join("SOUL.md"), b"legacy").unwrap();
        let value = migration_request(&root, b"legacy");
        let receipt = transaction(&value, None).unwrap();
        assert_eq!(receipt.operation, "migrate_legacy");
        assert_eq!(receipt.request_fingerprint, value.request_fingerprint);
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"legacy");
        assert!(!root.join("SOUL.md").exists());
        assert_eq!(
            fs::read(root.join(format!(
                "archives/constitution-history/recovery/{}.legacy-source",
                value.transaction_id
            )))
            .unwrap(),
            b"legacy"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn committed_migration_lookup_is_parent_bound_after_source_retirement() {
        let root = temp("migrate-parent-bound-lookup");
        fs::write(root.join("SOUL.md"), b"legacy").unwrap();
        let value = migration_request(&root, b"legacy");
        let parent = value
            .migration_source
            .as_ref()
            .unwrap()
            .parent_request_fingerprint
            .clone();
        let committed = transaction(&value, None).unwrap();
        assert!(!root.join("SOUL.md").exists());

        let replayed = transaction(&migration_lookup_request(&value, &parent), None).unwrap();
        assert_eq!(
            serialized_receipt(&replayed),
            serialized_receipt(&committed)
        );

        let mismatch = transaction(
            &migration_lookup_request(&value, &sha256(b"different-parent")),
            None,
        )
        .unwrap_err();
        assert_eq!(mismatch.code, "CONSTITUTION_FS_CONFLICT");

        let mut absent = migration_lookup_request(&value, &parent);
        absent.lookup_transaction_id = Some("12121212-1212-4121-8121-121212121212".into());
        let absent = transaction(&absent, None).unwrap();
        assert_eq!(absent.operation, "migration_committed_lookup");
        assert_eq!(absent.outcome, "not_found");
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn migration_retirement_crashes_reconcile_to_one_post_state() {
        for crash_point in [
            "after_publish_before_journal",
            "before_migration_source_retire",
            "after_migration_source_retire_before_journal",
        ] {
            let root = temp(&format!("migrate-retire-crash-{crash_point}"));
            fs::write(root.join("SOUL.md"), b"legacy").unwrap();
            let value = migration_request(&root, b"legacy");
            let hook = |point: &str| {
                if point == crash_point {
                    Err(FsError::new("INJECTED", "migration retirement interrupted"))
                } else {
                    Ok(())
                }
            };
            assert_eq!(
                transaction(&value, Some(&hook)).unwrap_err().code,
                "INJECTED"
            );
            let pending = transaction(&pending_request(&value), None).unwrap();
            let detail = pending
                .pending_transaction_details
                .as_ref()
                .and_then(|items| items.first())
                .unwrap();
            let reconciled = transaction(&reconcile_from_detail(&value, detail), None).unwrap();
            assert_eq!(reconciled.reconcile_disposition, Some("rolled_forward"));
            assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"legacy");
            assert!(!root.join("SOUL.md").exists());
            assert_eq!(
                fs::read(root.join(format!(
                    "archives/constitution-history/recovery/{}.legacy-source",
                    value.transaction_id
                )))
                .unwrap(),
                b"legacy"
            );
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn migrate_legacy_rejects_source_swap_and_in_place_edit() {
        for attack in ["swap", "edit"] {
            let root = temp(&format!("migrate-source-{attack}"));
            fs::write(root.join("SOUL.md"), b"legacy").unwrap();
            let value = migration_request(&root, b"legacy");
            let attack_root = root.clone();
            let hook = move |name: &str| {
                if name == "before_migration_source_revalidate" {
                    if attack == "swap" {
                        fs::rename(attack_root.join("SOUL.md"), attack_root.join("OLD.md"))
                            .unwrap();
                        fs::write(attack_root.join("SOUL.md"), b"attacker").unwrap();
                    } else {
                        fs::write(attack_root.join("SOUL.md"), b"edited").unwrap();
                    }
                }
                Ok(())
            };
            assert_eq!(
                transaction(&value, Some(&hook)).unwrap_err().code,
                "CONSTITUTION_FS_CONFLICT"
            );
            assert!(!root.join("CONSTITUTION.md").exists());
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn migrate_legacy_rejects_hardlink_and_symlink_sources() {
        use std::os::unix::fs::symlink;

        let hardlink_root = temp("migrate-hardlink");
        fs::write(hardlink_root.join("SOUL.md"), b"legacy").unwrap();
        fs::hard_link(
            hardlink_root.join("SOUL.md"),
            hardlink_root.join("ALIAS.md"),
        )
        .unwrap();
        assert_eq!(
            transaction(&migration_request(&hardlink_root, b"legacy"), None)
                .unwrap_err()
                .code,
            "CONSTITUTION_FS_REPARSE_REJECTED"
        );

        let symlink_root = temp("migrate-symlink");
        let outside = temp("migrate-symlink-outside");
        fs::write(outside.join("source.md"), b"legacy").unwrap();
        symlink(outside.join("source.md"), symlink_root.join("SOUL.md")).unwrap();
        assert!(transaction(&migration_request(&symlink_root, b"legacy"), None).is_err());
        assert!(!symlink_root.join("CONSTITUTION.md").exists());
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn migrate_legacy_no_replace_blocks_canonical_race() {
        let root = temp("migrate-canonical-race");
        fs::write(root.join("SOUL.md"), b"legacy").unwrap();
        let value = migration_request(&root, b"legacy");
        let attack_root = root.clone();
        let hook = move |name: &str| {
            if name == "before_stage_publish" {
                fs::write(attack_root.join("CONSTITUTION.md"), b"competitor").unwrap();
            }
            Ok(())
        };
        assert_eq!(
            transaction(&value, Some(&hook)).unwrap_err().code,
            "CONSTITUTION_FS_NO_REPLACE"
        );
        assert_eq!(
            fs::read(root.join("CONSTITUTION.md")).unwrap(),
            b"competitor"
        );
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn interrupted_migration_reconciles_from_authenticated_native_identity_facts() {
        let root = temp("migrate-reconcile");
        fs::write(root.join("SOUL.md"), b"legacy").unwrap();
        let value = migration_request(&root, b"legacy");
        let hook = |name: &str| {
            if name == "after_publish_before_journal" {
                Err(FsError::new("INJECTED", "response gap after publication"))
            } else {
                Ok(())
            }
        };
        assert_eq!(
            transaction(&value, Some(&hook)).unwrap_err().code,
            "INJECTED"
        );
        let pending = transaction(&pending_request(&value), None).unwrap();
        let detail = pending
            .pending_transaction_details
            .as_ref()
            .and_then(|items| items.first())
            .unwrap();
        let source = detail.reconcile_facts.migration_source.as_ref().unwrap();
        assert_eq!(
            source.target,
            Target::Constitution {
                source_name: "SOUL.md".into()
            }
        );
        assert_eq!(source.sha256, sha256(b"legacy"));
        let receipt = transaction(&reconcile_from_detail(&value, detail), None).unwrap();
        assert_eq!(receipt.reconcile_disposition, Some("rolled_forward"));
        assert_eq!(fs::read(root.join("CONSTITUTION.md")).unwrap(), b"legacy");
    }

    fn seal_request(
        root: &Path,
        operation: Operation,
        id: Option<&str>,
        envelope: Option<&[u8]>,
    ) -> Request {
        Request {
            version: PROTOCOL_VERSION,
            transaction_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc".into(),
            root: root.to_string_lossy().into_owned(),
            root_identity: root_identity(root),
            journal_key_base64: None,
            archive_authentication_keys: None,
            request_fingerprint: None,
            operation,
            target: None,
            expected: None,
            replacement: None,
            archive_id: None,
            archived_at: None,
            archive: None,
            source_archive_id: None,
            source_archive: None,
            reconcile_transaction_id: None,
            reconcile_facts: None,
            lookup_transaction_id: None,
            migration_source: None,
            seal_key_id: id.map(str::to_owned),
            envelope: envelope.map(|bytes| Payload {
                content_base64: BASE64.encode(bytes),
                sha256: sha256(bytes),
            }),
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn seal_key_inventory_and_read_are_anchored_and_reparse_safe() {
        let root = temp("key-parent-swap");
        let moved = root.with_extension("anchored");
        let outside = temp("key-outside");
        let id = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
        let stored_envelope = envelope(b"encrypted-envelope");
        transaction(
            &seal_request(
                &root,
                Operation::SealKeyCreate,
                Some(id),
                Some(&stored_envelope),
            ),
            None,
        )
        .unwrap();
        let hook = |point: &str| {
            if point == "anchored" {
                fs::rename(&root, &moved).unwrap();
                std::os::unix::fs::symlink(&outside, &root).unwrap();
            }
            Ok(())
        };
        let inventory = transaction(
            &seal_request(&root, Operation::SealKeyInventory, None, None),
            Some(&hook),
        )
        .unwrap();
        assert_eq!(inventory.seal_key_ids, Some(vec![id.to_owned()]));
        assert!(!outside.join("archives").exists());
        let read = transaction(
            &seal_request(&moved, Operation::SealKeyRead, Some(id), None),
            None,
        )
        .unwrap();
        assert_eq!(read.envelope_base64, Some(BASE64.encode(&stored_envelope)));
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn seal_key_create_rejects_the_sixty_fifth_retained_key() {
        let root = temp("key-cap");
        let keys = root.join("archives/constitution-history/seal-keys");
        fs::create_dir_all(&keys).unwrap();
        for index in 0..MAX_ARCHIVE_KEYS {
            let id = format!("{index:08x}-0000-4000-8000-{index:012x}");
            fs::write(keys.join(format!("{id}.json")), envelope(b"retained")).unwrap();
        }
        let id = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
        let error = transaction(
            &seal_request(
                &root,
                Operation::SealKeyCreate,
                Some(id),
                Some(&envelope(b"new")),
            ),
            None,
        )
        .unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_ARCHIVE_KEY_LIMIT");
        assert!(!keys.join(format!("{id}.json")).exists());
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn concurrent_key_creators_cannot_cross_the_retained_key_cap() {
        let root = temp("key-cap-concurrent");
        let keys = root.join("archives/constitution-history/seal-keys");
        fs::create_dir_all(&keys).unwrap();
        for index in 0..(MAX_ARCHIVE_KEYS - 1) {
            let id = format!("{index:08x}-0000-4000-8000-{index:012x}");
            fs::write(keys.join(format!("{id}.json")), envelope(b"retained")).unwrap();
        }
        let children = [
            "aaaaaaaa-0000-4000-8000-000000000001",
            "aaaaaaaa-0000-4000-8000-000000000002",
        ]
        .map(|id| {
            let child = unsafe { libc::fork() };
            assert!(child >= 0);
            if child == 0 {
                let result = transaction(
                    &seal_request(
                        &root,
                        Operation::SealKeyCreate,
                        Some(id),
                        Some(&envelope(b"new")),
                    ),
                    None,
                );
                let status = match result {
                    Ok(_) => 0,
                    Err(error) if error.code == "CONSTITUTION_FS_ARCHIVE_KEY_LIMIT" => 10,
                    Err(_) => 20,
                };
                unsafe { libc::_exit(status) };
            }
            child
        });
        let mut outcomes = Vec::new();
        for child in children {
            let mut status = 0;
            assert_eq!(unsafe { libc::waitpid(child, &mut status, 0) }, child);
            assert!(libc::WIFEXITED(status));
            outcomes.push(libc::WEXITSTATUS(status));
        }
        outcomes.sort();
        assert_eq!(outcomes, vec![0, 10]);
        assert_eq!(fs::read_dir(keys).unwrap().count(), MAX_ARCHIVE_KEYS);
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    #[test]
    fn seal_key_create_is_exclusive_and_preserves_first_envelope() {
        let root = temp("key-exclusive");
        let id = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
        let first = envelope(b"first");
        let second = envelope(b"second");
        transaction(
            &seal_request(&root, Operation::SealKeyCreate, Some(id), Some(&first)),
            None,
        )
        .unwrap();
        let error = transaction(
            &seal_request(&root, Operation::SealKeyCreate, Some(id), Some(&second)),
            None,
        )
        .unwrap_err();
        assert_eq!(error.code, "CONSTITUTION_FS_NO_REPLACE");
        let read = transaction(
            &seal_request(&root, Operation::SealKeyRead, Some(id), None),
            None,
        )
        .unwrap();
        assert_eq!(read.envelope_base64, Some(BASE64.encode(&first)));
    }
}
