import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { OfficeParser } from 'officeparser';

export type ArtifactEvidence = Readonly<{
  path: string;
  kind: 'docx' | 'pdf';
  bytes: number;
  digest: `sha256:${string}`;
  text: string;
}>;

export type ReceiptSurfaceEvidence = Readonly<{
  status: string;
  origin?: string;
  contract?: string;
  artifactDigest?: string;
  gateClosureDigest?: string;
}>;

export const sha256File = (filePath: string): `sha256:${string}` =>
  `sha256:${createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;

export function assertArtifactEnvelope(filePath: string, kind: 'docx' | 'pdf'): void {
  if (!fs.existsSync(filePath)) throw new Error(`M8_ARTIFACT_MISSING:${filePath}`);
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 256) throw new Error(`M8_ARTIFACT_TRUNCATED:${filePath}:${bytes.length}`);
  if (kind === 'docx' && !bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    throw new Error(`M8_DOCX_NOT_OOXML:${filePath}`);
  }
  if (kind === 'pdf') {
    if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error(`M8_PDF_HEADER_INVALID:${filePath}`);
    if (!bytes.subarray(Math.max(0, bytes.length - 1024)).includes(Buffer.from('%%EOF'))) {
      throw new Error(`M8_PDF_EOF_MISSING:${filePath}`);
    }
  }
}

export function assertCitedText(text: string, requiredMarkers: readonly string[]): void {
  const canonical = text.replace(/\s+/g, ' ').trim().toLocaleLowerCase('en');
  for (const marker of requiredMarkers) {
    if (!canonical.includes(marker.toLocaleLowerCase('en'))) {
      throw new Error(`M8_CITATION_OR_CONTENT_MISSING:${marker}`);
    }
  }
}

export async function inspectNativeArtifact(
  filePath: string,
  kind: 'docx' | 'pdf',
  requiredMarkers: readonly string[]
): Promise<ArtifactEvidence> {
  assertArtifactEnvelope(filePath, kind);
  let text: string;
  try {
    const ast = await OfficeParser.parseOffice(filePath);
    const rendered = await ast.to('text');
    text = typeof rendered.value === 'string' ? rendered.value : Buffer.from(rendered.value).toString('utf8');
  } catch (error) {
    throw new Error(
      `M8_NATIVE_PARSE_FAILED:${path.basename(filePath)}:${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
  assertCitedText(text, requiredMarkers);
  return {
    path: filePath,
    kind,
    bytes: fs.statSync(filePath).size,
    digest: sha256File(filePath),
    text,
  };
}

export function assertTrustedArtifactReceipts(
  receipts: readonly ReceiptSurfaceEvidence[],
  artifacts: readonly ArtifactEvidence[]
): void {
  for (const artifact of artifacts) {
    const matching = receipts.find(
      (receipt) =>
        receipt.status === 'verified' &&
        receipt.origin === 'core/anvil' &&
        receipt.artifactDigest === artifact.digest &&
        /^sha256:[a-f0-9]{64}$/.test(receipt.gateClosureDigest ?? '')
    );
    if (!matching) {
      throw new Error(`M8_RECEIPT_AUTHORITY_MISSING:${path.basename(artifact.path)}:${artifact.digest}`);
    }
  }
}

export function assertEquivalentJ23State(
  plain: readonly ArtifactEvidence[],
  cowork: readonly ArtifactEvidence[],
  requiredMarkers: readonly string[]
): void {
  if (plain.length !== 2 || cowork.length !== 2) throw new Error('M8_J23_NATIVE_OUTPUT_PAIR_INCOMPLETE');
  for (const collection of [plain, cowork]) {
    const kinds = new Set(collection.map((artifact) => artifact.kind));
    if (!kinds.has('docx') || !kinds.has('pdf')) throw new Error('M8_J23_NATIVE_OUTPUT_KIND_MISMATCH');
    for (const artifact of collection) assertCitedText(artifact.text, requiredMarkers);
  }
}
