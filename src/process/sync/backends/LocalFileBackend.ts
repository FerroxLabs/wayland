import * as fs from 'node:fs';
import * as path from 'node:path';

/** Reads/writes a single encrypted blob file at a user-specified path. */
export class LocalFileBackend {
  private readonly filePath: string;

  constructor(dirPath: string) {
    this.filePath = path.join(dirPath, 'wayland-sync.enc');
  }

  /** Read the raw encrypted blob. Returns null if the file doesn't exist. */
  read(): Buffer | null {
    try {
      return fs.readFileSync(this.filePath);
    } catch {
      return null;
    }
  }

  /** Write the raw encrypted blob atomically (write to tmp, then rename). */
  write(data: Buffer): void {
    const tmp = this.filePath + '.tmp';
    fs.writeFileSync(tmp, data);
    fs.renameSync(tmp, this.filePath);
  }
}
