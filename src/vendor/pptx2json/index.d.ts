// Vendored from npm pptx2json@0.0.10 (abandoned) - see M22.
// Type declarations for the vendored pptx2json module.

declare class PPTX2Json {
  constructor(options?: { jszipBinary?: string; jszipGenerateType?: string });
  toJson(filePath: string): Promise<Record<string, unknown>>;
  buffer2json(buffer: Buffer): Promise<Record<string, unknown>>;
  toPPTX(json: Record<string, unknown>, options?: { file?: string }): Promise<Buffer | void>;
  getMaxSlideIds(json: Record<string, unknown>): { id: number; rid: number };
  getSlideLayoutTypeHash(json: Record<string, unknown>): Record<string, string>;
}

export = PPTX2Json;
