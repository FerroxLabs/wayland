/**
 * peAuthenticode.js
 *
 * Reads the PE certificate table (IMAGE_DIRECTORY_ENTRY_SECURITY, data
 * directory index 4) straight out of a Windows executable, so the packaged
 * resource gate can prove that a binary we bundle already-signed from upstream
 * still carries its Authenticode signature by the time it reaches the package.
 *
 * Exists because wayland-nano v0.1.1 shipped a win32-x64 executable whose
 * certificate table was empty (#914). The digest pins all matched, the
 * installer itself was signed, and nothing anywhere in the build ever looked at
 * the executable's own signature - so an unsigned binary rode inside a signed
 * installer and Windows Defender blocked it on users' machines.
 *
 * This module NEVER signs anything, and nothing downstream of it may either.
 * bundled-wayland-core\win32-*\wayland-core.exe and
 * bundled-wayland-nano\win32-*\wayland-nano.exe are deliberately excluded from
 * our own Authenticode pass by the negative `signExts` patterns in
 * electron-builder.yml, because Authenticode signing rewrites the file and
 * would break the binarySha256 those binaries are pinned to. The only correct
 * check for them is that the UPSTREAM signature survived the trip.
 *
 * Scope note: this asserts a signature is PRESENT and structurally well formed.
 * It deliberately does not evaluate the certificate chain or the signer name -
 * the bytes are already pinned to an exact binarySha256 verified against the
 * publisher's own shasums asset, so an attacker cannot substitute a different,
 * differently signed executable without failing that pin first. The gap #914
 * left open was the total absence of a signature, and that is what this closes.
 *
 * FAILS CLOSED. Anything that cannot be parsed as a signed PE image -
 * truncated, not a PE at all, a certificate table pointing outside the file, a
 * malformed WIN_CERTIFICATE header - is reported UNSIGNED. A file this module
 * does not understand is never given the benefit of the doubt.
 */
'use strict';

const fs = require('fs');

const DOS_HEADER_SIZE = 0x40;
const DOS_MAGIC = 0x5a4d; // 'MZ'
const E_LFANEW_OFFSET = 0x3c; // DOS stub field holding the PE header offset
const PE_SIGNATURE = 0x00004550; // 'PE\0\0'
const COFF_HEADER_SIZE = 20;
const SIZE_OF_OPTIONAL_HEADER_OFFSET = 16; // within the COFF header
const MAGIC_PE32 = 0x10b;
const MAGIC_PE32PLUS = 0x20b;
// PE32 and PE32+ differ only in that PE32 carries a 4-byte BaseOfData field and
// keeps five fields at 4 bytes that PE32+ widens to 8, which shifts everything
// after them by 16 bytes.
const NUMBER_OF_RVA_AND_SIZES_OFFSET = { [MAGIC_PE32]: 92, [MAGIC_PE32PLUS]: 108 };
const DATA_DIRECTORY_OFFSET = { [MAGIC_PE32]: 96, [MAGIC_PE32PLUS]: 112 };
const DATA_DIRECTORY_ENTRY_SIZE = 8;
const CERTIFICATE_DIRECTORY_INDEX = 4;
const WIN_CERTIFICATE_HEADER_SIZE = 8;
const WIN_CERT_REVISION_1_0 = 0x0100;
const WIN_CERT_REVISION_2_0 = 0x0200;
const WIN_CERT_TYPE_PKCS_SIGNED_DATA = 0x0002;

class PeParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PeParseError';
  }
}

function readImage(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    throw new PeParseError(`cannot read ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Locate the certificate data directory entry. Returns its raw file offset and
 * size WITHOUT judging them: {offset: 0, size: 0} is the honest description of
 * an unsigned image, and is exactly what wayland-nano v0.1.1 win32-x64 reports.
 * Throws PeParseError when the file is not a PE image this module understands.
 */
function readPeCertificateTable(filePath, image) {
  const bytes = image || readImage(filePath);
  const need = (end, what) => {
    if (!Number.isSafeInteger(end) || end < 0 || bytes.length < end) {
      throw new PeParseError(`${filePath}: ${what} runs past the end of the file (${bytes.length} bytes)`);
    }
  };

  need(DOS_HEADER_SIZE, 'DOS header');
  if (bytes.readUInt16LE(0) !== DOS_MAGIC) {
    throw new PeParseError(`${filePath}: not a PE image (missing MZ signature)`);
  }
  const peOffset = bytes.readUInt32LE(E_LFANEW_OFFSET);
  need(peOffset + 4 + COFF_HEADER_SIZE, 'PE and COFF headers');
  if (bytes.readUInt32LE(peOffset) !== PE_SIGNATURE) {
    throw new PeParseError(`${filePath}: not a PE image (missing PE signature at 0x${peOffset.toString(16)})`);
  }

  const sizeOfOptionalHeader = bytes.readUInt16LE(peOffset + 4 + SIZE_OF_OPTIONAL_HEADER_OFFSET);
  const optionalHeaderOffset = peOffset + 4 + COFF_HEADER_SIZE;
  need(optionalHeaderOffset + 2, 'optional header magic');
  const magic = bytes.readUInt16LE(optionalHeaderOffset);
  if (magic !== MAGIC_PE32 && magic !== MAGIC_PE32PLUS) {
    throw new PeParseError(`${filePath}: unsupported optional header magic 0x${magic.toString(16)}`);
  }

  const directoriesOffset = DATA_DIRECTORY_OFFSET[magic];
  const minimumOptionalHeaderSize =
    directoriesOffset + (CERTIFICATE_DIRECTORY_INDEX + 1) * DATA_DIRECTORY_ENTRY_SIZE;
  if (sizeOfOptionalHeader < minimumOptionalHeaderSize) {
    throw new PeParseError(
      `${filePath}: optional header is ${sizeOfOptionalHeader} bytes, too small to hold a certificate data directory`
    );
  }

  const numberOfRvaAndSizesOffset = optionalHeaderOffset + NUMBER_OF_RVA_AND_SIZES_OFFSET[magic];
  need(numberOfRvaAndSizesOffset + 4, 'NumberOfRvaAndSizes');
  const numberOfRvaAndSizes = bytes.readUInt32LE(numberOfRvaAndSizesOffset);
  if (numberOfRvaAndSizes <= CERTIFICATE_DIRECTORY_INDEX) {
    throw new PeParseError(
      `${filePath}: image declares only ${numberOfRvaAndSizes} data directories, so it has no certificate table`
    );
  }

  const entryOffset = optionalHeaderOffset + directoriesOffset + CERTIFICATE_DIRECTORY_INDEX * DATA_DIRECTORY_ENTRY_SIZE;
  need(entryOffset + DATA_DIRECTORY_ENTRY_SIZE, 'certificate data directory entry');
  return { offset: bytes.readUInt32LE(entryOffset), size: bytes.readUInt32LE(entryOffset + 4) };
}

/**
 * Parse the WIN_CERTIFICATE at the certificate table. Throws PeParseError when
 * the image is unsigned or the attribute certificate is malformed - both are
 * failures for a binary we are supposed to be shipping already signed.
 */
function inspectAuthenticode(filePath) {
  const bytes = readImage(filePath);
  const { offset, size } = readPeCertificateTable(filePath, bytes);
  if (offset === 0 || size === 0) {
    throw new PeParseError(
      `${filePath}: PE certificate table is empty (offset=${offset}, size=${size}) - the binary is NOT Authenticode signed`
    );
  }
  if (offset + size > bytes.length) {
    throw new PeParseError(
      `${filePath}: certificate table at ${offset}+${size} runs past the end of the file (${bytes.length} bytes)`
    );
  }
  if (size < WIN_CERTIFICATE_HEADER_SIZE) {
    throw new PeParseError(`${filePath}: certificate table is ${size} bytes, too small for a WIN_CERTIFICATE header`);
  }

  const certificateLength = bytes.readUInt32LE(offset);
  const revision = bytes.readUInt16LE(offset + 4);
  const certificateType = bytes.readUInt16LE(offset + 6);
  if (certificateLength <= WIN_CERTIFICATE_HEADER_SIZE || certificateLength > size) {
    throw new PeParseError(
      `${filePath}: WIN_CERTIFICATE dwLength=${certificateLength} is not a valid length inside a ${size}-byte certificate table`
    );
  }
  if (revision !== WIN_CERT_REVISION_1_0 && revision !== WIN_CERT_REVISION_2_0) {
    throw new PeParseError(`${filePath}: unsupported WIN_CERTIFICATE revision 0x${revision.toString(16)}`);
  }
  if (certificateType !== WIN_CERT_TYPE_PKCS_SIGNED_DATA) {
    throw new PeParseError(
      `${filePath}: WIN_CERTIFICATE type 0x${certificateType.toString(16)} is not PKCS#7 signed data (0x2)`
    );
  }

  return {
    certificateTableOffset: offset,
    certificateTableSize: size,
    certificateLength,
    revision,
    certificateType,
  };
}

/**
 * Boolean form for the packaged-resource gate, which reports a bare verdict.
 * Every parse failure collapses to false: unparseable is never a pass.
 */
function isAuthenticodeSigned(filePath) {
  try {
    inspectAuthenticode(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Human-readable verdict for build logs and failure diagnostics. */
function describeAuthenticode(filePath) {
  try {
    const info = inspectAuthenticode(filePath);
    return `Authenticode signature present (${info.certificateLength} bytes, revision 0x${info.revision.toString(16)})`;
  } catch (error) {
    return `Authenticode check FAILED: ${error instanceof Error ? error.message : String(error)}`;
  }
}

module.exports = {
  PeParseError,
  WIN_CERT_REVISION_1_0,
  WIN_CERT_REVISION_2_0,
  WIN_CERT_TYPE_PKCS_SIGNED_DATA,
  readPeCertificateTable,
  inspectAuthenticode,
  isAuthenticodeSigned,
  describeAuthenticode,
};
