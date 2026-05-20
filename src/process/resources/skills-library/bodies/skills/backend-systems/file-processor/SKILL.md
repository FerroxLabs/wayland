---
name: file-processor
description: |
  File processing pipeline expertise covering upload handling (multipart, streaming, resumable), virus scanning, image processing, PDF generation, storage backends, presigned URLs, and file type validation.
  Use when the user asks about file processor, file processor best practices, or needs guidance on file processor implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design guide"
  category: "backend-systems"
  subcategory: "server-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# File Processor

## Purpose

Design and implement robust file processing pipelines that handle upload, validation, processing, storage, and delivery. This skill covers upload strategies, security considerations, media processing, cloud storage patterns, and production operational concerns.

## Upload Strategy Selection

### Decision Matrix

```
SCENARIO                          STRATEGY
------------------------------------------------------
Small files (<10MB)               Multipart form upload
Large files (>10MB)               Presigned URL (direct-to-storage)
Very large files (>1GB)           Resumable upload (tus protocol)
Multiple small files              Batch multipart
Sensitive files                   Server-side upload (no direct)
User avatars/profile images       Multipart + server processing
Video uploads                     Resumable + async processing
API file attachments              Base64 in JSON (small) or multipart

PRESIGNED URL FLOW (recommended for large files):
  1. Client requests upload URL from API
  2. API generates presigned URL (S3, GCS, Azure)
  3. Client uploads directly to storage
  4. Storage notifies API (webhook or client confirms)
  5. API processes file (resize, scan, etc.)
```

## Multipart Upload Handling

```ts
import multer from 'multer';
import path from 'path';

// Configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,    // 10MB max
    files: 5,                       // Max 5 files per request
    fields: 10,                     // Max 10 non-file fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      # ... (condensed) ...
    } catch (error) {
      res.status(422).json({ error: error.message });
    }
  }
);
```

## Presigned URL Upload

```ts
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: ENV_CONFIG_VALUE });

// Generate presigned upload URL
app.post('/api/upload/presign', authenticate, async (req, res) => {
  const { filename, contentType, size } = req.body;

  // Validate before generating URL
  if (size > 100 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large (max 100MB)' });
  }

  # ... (condensed) ...

  await db.uploads.update({ where: { id: upload.id }, data: { status: 'processing' } });

  res.json({ status: 'processing' });
});
```

## Resumable Upload (tus Protocol)

```ts
import { Server as TusServer } from '@tus/server';
import { S3Store } from '@tus/s3-store';

const tusServer = new TusServer({
  path: '/api/upload/resumable',
  datastore: new S3Store({
    s3ClientConfig: {
      region: ENV_CONFIG_VALUE,
    },
    bucket: ENV_CONFIG_VALUE!,
    partSize: 8 * 1024 * 1024,
  }),
  maxSize: 5 * 1024 * 1024 * 1024, // 5GB max
  onUploadCreate: async (req, res, upload) => {
    # ... (condensed) ...
    return res;
  },
});

app.all('/api/upload/resumable/*', (req, res) => tusServer.handle(req, res));
```

## File Type Validation

### Content-Based Validation (Not Extension)

```ts
import { fileTypeFromBuffer } from 'file-type';

async function validateFileContent(file: { buffer: Buffer; mimetype: string }): Promise<void> {
  // Check magic bytes (actual file content)
  const detected = await fileTypeFromBuffer(file.buffer);

  if (!detected) {
    throw new Error('Unable to determine file type');
  }

  const allowedMimeTypes: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png':  ['png'],
    'image/webp': ['webp'],
    # ... (condensed) ...
  const pixels = (metadata.width ?? 0) * (metadata.height ?? 0);
  if (pixels > 100_000_000) {
    throw new Error('Image too large (decompression bomb protection)');
  }
}
```

## Virus Scanning

```ts
import NodeClam from 'clamscan';

const clam = await new NodeClam().init({
  clamdscan: {
    socket: '/var/run/clamav/clamd.ctl',
    timeout: 60000,
    multiscan: true,
  },
  preference: 'clamdscan',
});

async function scanBuffer(buffer: Buffer): Promise<{ clean: boolean; virus?: string }> {
  try {
    const { Readable } = await import('stream');
    # ... (condensed) ...
  }

  // 3. Process and store
  return await storeFile(file);
}
```

## Image Processing (Sharp)

```ts
import sharp from 'sharp';

// Generate multiple image sizes
async function processImage(
  input: Buffer,
  options: { maxWidth?: number; maxHeight?: number; quality?: number; format?: 'webp' | 'avif' }
): Promise<ProcessedImage> {
  const { quality = 80, format = 'webp' } = options;

  const sizes = [
    { name: 'thumbnail', width: 200, height: 200, fit: 'cover' as const },
    { name: 'small', width: 400, height: 400, fit: 'inside' as const },
    { name: 'medium', width: 800, height: 800, fit: 'inside' as const },
    { name: 'large', width: 1600, height: 1600, fit: 'inside' as const },
  # ... (condensed) ...
  return sharp(input)
    .rotate()  // Auto-rotate based on EXIF before stripping
    .withMetadata({ orientation: undefined })
    .toBuffer();
}
```

## PDF Generation

```ts
import PDFDocument from 'pdfkit';

async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Invoice #${invoice.number}`, { align: 'right' });
    # ... (condensed) ...
    doc.text(formatCurrency(invoice.total), 460, y + 15);

    doc.end();
  });
}
```

## Storage Backends

### S3-Compatible Storage

```ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class FileStorage {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.s3 = new S3Client({ region: ENV_CONFIG_VALUE });
    this.bucket = ENV_CONFIG_VALUE!;
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      # ... (condensed) ...
      Bucket: this.bucket,
      Key: key,
    }));
  }
}
```

### Storage Key Strategy

```
KEY STRUCTURE:
  {type}/{user_id}/{year}/{month}/{file_id}{extension}
  Example: avatars/usr_abc123/2025/01/f7a9b3c4.webp

  uploads/{user_id}/{file_id}/{variant}.{format}
  Example: uploads/usr_abc123/f7a9b3c4/thumbnail.webp
           uploads/usr_abc123/f7a9b3c4/medium.webp
           uploads/usr_abc123/f7a9b3c4/original.webp

RULES:
  - NEVER use original filename in storage key (security)
  - Generate unique IDs (UUID, ULID)
  - Include user ID for access control and cleanup
  - Date-based prefix helps with S3 partitioning
  - Keep extensions for CDN content-type detection
```

## CDN Integration

```ts
class CDNService {
  private readonly cdnDomain = ENV_CONFIG_VALUE;

  getPublicUrl(key: string): string {
    return `[reference URL]
  }

  // Image transformation via CDN (Cloudflare, Imgix, etc.)
  getImageUrl(key: string, transforms: ImageTransform): string {
    const params = new URLSearchParams();
    if (transforms.width) params.set('w', String(transforms.width));
    if (transforms.height) params.set('h', String(transforms.height));
    if (transforms.quality) params.set('q', String(transforms.quality));
    if (transforms.format) params.set('f', transforms.format);
    params.set('fit', transforms.fit ?? 'cover');

    return `[reference URL])}/${key}`;
  }
}
```

## File Processing Pipeline

```ts
import { Queue, Worker } from 'bullmq';

const processingQueue = new Queue('file-processing');

const worker = new Worker('file-processing', async (job) => {
  const { uploadId, key, contentType } = job.data;

  // 1. Download from storage
  const fileBuffer = await storage.download(key);

  // 2. Virus scan
  await job.updateProgress(10);
  const scanResult = await scanBuffer(fileBuffer);
  if (!scanResult.clean) {
    # ... (condensed) ...
    await alerting.notify(`File processing permanently failed: ${job.data.uploadId}`, {
      error: error.message,
    });
  }
});
```

## Cleanup and Lifecycle

```ts
// Clean up orphaned uploads (pending > 24 hours)
async function cleanupOrphanedUploads() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orphans = await db.uploads.findMany({
    where: { status: 'pending', createdAt: { lt: cutoff } },
  });

  for (const upload of orphans) {
    try {
      await storage.remove(upload.key);
    } catch {
      // File may not exist, that is fine
    }
    # ... (condensed) ...

// S3 lifecycle policy (set via AWS console or Terraform)
// - Move to Glacier after 90 days
// - Delete incomplete multipart uploads after 7 days
// - Delete expired presigned upload objects after 1 day
```

## File Processing Checklist

- [ ] Upload strategy selected (multipart, presigned URL, resumable)
- [ ] File size limits enforced (client-side and server-side)
- [ ] File type validated by content (magic bytes), not just extension
- [ ] Virus scanning integrated into processing pipeline
- [ ] Image decompression bomb protection implemented
- [ ] Images processed into multiple sizes/formats (WebP/AVIF)
- [ ] EXIF metadata stripped for privacy
- [ ] Storage keys use random IDs (never user-provided filenames)
- [ ] Presigned URLs have appropriate expiration times
- [ ] CDN configured for file delivery with cache headers
- [ ] Processing pipeline runs asynchronously (queue-based)
- [ ] Failed processing triggers alerts and retry
- [ ] File cleanup job handles orphaned uploads
- [ ] Storage lifecycle policies configured for cost optimization
- [ ] Access control verified before file delivery

## When to Use

**Use this skill when:**
- Designing or implementing file processor solutions
- Reviewing or improving existing file processor approaches
- Making architectural or implementation decisions about file processor
- Learning file processor patterns and best practices
- Troubleshooting file processor-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# File Processor Analysis

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

**Input:** "Help me implement file processor for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended file processor approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When file processor must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
