import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const helper = createRequire(import.meta.url)('../../../scripts/publishDraftAssets.cjs');
const local = { name: 'Wayland.zip', size: 10, sha256: 'a'.repeat(64) };
const remote = { ...local, id: 1, digest: `sha256:${local.sha256}` };

describe('immutable draft asset promotion', () => {
  it('creates only draft metadata for the exact commit without file uploads', () => {
    expect(helper.draftMetadata('v1.0.0', 'a'.repeat(40), 'v1.0.0', false)).toEqual({
      tag_name: 'v1.0.0',
      target_commitish: 'a'.repeat(40),
      name: 'v1.0.0',
      draft: true,
      prerelease: false,
      generate_release_notes: true,
    });
  });
  it('rejects public releases and mismatched candidate tags before metadata updates', () => {
    expect(() =>
      helper.validateDraft({ draft: false, tag_name: 'v1.0.0' }, 'v1.0.0', 'a'.repeat(40), 'a'.repeat(40))
    ).toThrow(/public/);
    expect(() => helper.validateDraft(null, 'v1.0.0', 'a'.repeat(40), 'b'.repeat(40))).toThrow(/candidate/);
    expect(() =>
      helper.validateDraft({ draft: true, tag_name: 'v1.0.0' }, 'v1.0.0', 'a'.repeat(40), 'a'.repeat(40))
    ).not.toThrow();
  });

  it('reuses matching server digests without downloads or uploads', () => {
    const api = { upload: vi.fn(), lookup: vi.fn(), download: vi.fn() };
    expect(helper.publishMissingAssets([local], [remote], api)).toEqual({ reused: [local.name], uploaded: [] });
    expect(api.upload).not.toHaveBeenCalled();
    expect(api.download).not.toHaveBeenCalled();
  });

  it('downloads and verifies bytes only when server digest is missing', () => {
    const download = vi.fn(() => local.sha256);
    helper.assetMatches(local, { ...remote, digest: null }, download);
    expect(download).toHaveBeenCalledOnce();
    expect(() => helper.assetMatches(local, { ...remote, digest: null }, () => 'b'.repeat(64))).toThrow(/bytes differ/);
  });

  it('rejects differing existing assets before any upload', () => {
    const api = { upload: vi.fn(), lookup: vi.fn(), download: vi.fn() };
    expect(() =>
      helper.publishMissingAssets(
        [{ ...local, name: 'missing.zip' }, local],
        [{ ...remote, digest: `sha256:${'b'.repeat(64)}` }],
        api
      )
    ).toThrow(/digest differs/);
    expect(api.upload).not.toHaveBeenCalled();
  });

  it('uploads only missing assets and checks their server identity', () => {
    const api = { upload: vi.fn(), lookup: vi.fn(() => [remote]), download: vi.fn() };
    expect(helper.publishMissingAssets([local], [], api)).toEqual({ reused: [], uploaded: [local.name] });
    expect(api.upload).toHaveBeenCalledOnce();
    expect(() => helper.publishMissingAssets([local], [], { ...api, lookup: () => [{ ...remote, size: 9 }] })).toThrow(
      /differs/
    );
  });
});
