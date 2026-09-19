import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it, vi } from 'vitest';

const {
  WINDOWS_PUBLISHER_NAME,
  AZURE_TRUSTED_SIGNING,
  resolveWindowsSigningCredentials,
  windowsSignatureRequired,
  signWindowsStagedBinary,
  isWindowsAuthenticodeSigned,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('../../scripts/signWindowsStagedBinary');

const CREDENTIALS = {
  AZURE_TENANT_ID: 'tenant',
  AZURE_CLIENT_ID: 'client',
  AZURE_CLIENT_SECRET: 'secret',
};

function commandText(args: string[]): string {
  return args[args.indexOf('-Command') + 1];
}

describe('windows staged-binary signing', () => {
  it('signs through Invoke-TrustedSigning with the same account electron-builder uses', () => {
    // A second Trusted Signing account or profile here would ship an app whose
    // nested binaries carry a different publisher than the app itself, and the
    // drift would only be visible on a user's machine.
    const builder = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../electron-builder.yml'), 'utf8')) as Record<
      string,
      { azureSignOptions: Record<string, string> }
    >;
    const azure = builder.win.azureSignOptions;
    expect(WINDOWS_PUBLISHER_NAME).toBe(azure.publisherName);
    expect(AZURE_TRUSTED_SIGNING.endpoint).toBe(azure.endpoint);
    expect(AZURE_TRUSTED_SIGNING.codeSigningAccountName).toBe(azure.codeSigningAccountName);
    expect(AZURE_TRUSTED_SIGNING.certificateProfileName).toBe(azure.certificateProfileName);
  });

  it('passes the parameter set Invoke-TrustedSigning requires, including a timestamp', () => {
    const execFileSync = vi.fn();
    signWindowsStagedBinary('C:\\staged\\fuigo.exe', { execFileSync, env: CREDENTIALS });
    const [command, args] = execFileSync.mock.calls[0];
    expect(command).toBe('pwsh');
    const script = commandText(args as string[]);
    expect(script).toContain('Invoke-TrustedSigning');
    expect(script).toContain(`-Endpoint '${AZURE_TRUSTED_SIGNING.endpoint}'`);
    expect(script).toContain(`-CodeSigningAccountName '${AZURE_TRUSTED_SIGNING.codeSigningAccountName}'`);
    expect(script).toContain(`-CertificateProfileName '${AZURE_TRUSTED_SIGNING.certificateProfileName}'`);
    expect(script).toContain("-Files 'C:\\staged\\fuigo.exe'");
    // Trusted Signing leaf certificates live ~3 days. Without an RFC 3161
    // timestamp every signature we ship stops verifying inside a week.
    expect(script).toContain('-TimestampRfc3161');
    expect(script).toContain('-FileDigest');
  });

  it('verifies the result before the caller digests it', () => {
    const scripts: string[] = [];
    const execFileSync = vi.fn((_cmd: string, args: string[]) => {
      scripts.push(commandText(args));
      return '';
    });
    signWindowsStagedBinary('C:\\staged\\fuigo.exe', { execFileSync, env: CREDENTIALS });
    // A signature that silently did not take would surface only as a Smart App
    // Control block on a user's machine, long after the digest was pinned.
    expect(scripts.some((script) => script.includes('Get-AuthenticodeSignature'))).toBe(true);
  });

  it('pins the publisher, not merely a trusted signature', () => {
    const scripts: string[] = [];
    const execFileSync = vi.fn((_cmd: string, args: string[]) => {
      scripts.push(commandText(args));
      return '';
    });
    signWindowsStagedBinary('C:\\staged\\fuigo.exe', { execFileSync, env: CREDENTIALS });
    const verify = scripts.find((script) => script.includes('Get-AuthenticodeSignature'))!;
    expect(verify).toContain("$sig.Status -ne 'Valid'");
    expect(verify).toContain(`-ne '${WINDOWS_PUBLISHER_NAME}'`);
  });

  it('requires the whole service-principal triple before it will try to sign', () => {
    // Azure.Identity's EnvironmentCredential only activates on the full triple,
    // so a partial set fails deep inside PowerShell instead of here.
    expect(resolveWindowsSigningCredentials({ ...CREDENTIALS, AZURE_CLIENT_SECRET: '' })).toBeNull();
    expect(resolveWindowsSigningCredentials({ ...CREDENTIALS, AZURE_TENANT_ID: '  ' })).toBeNull();
    expect(resolveWindowsSigningCredentials({ ...CREDENTIALS, AZURE_CLIENT_ID: undefined })).toBeNull();
    expect(resolveWindowsSigningCredentials(CREDENTIALS)).toMatchObject({ tenantId: 'tenant' });
  });

  it('leaves the binary unsigned, and says so, when the build has no credential', () => {
    const execFileSync = vi.fn();
    expect(signWindowsStagedBinary('C:\\staged\\x.exe', { execFileSync, env: {} })).toBe(false);
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it('fails closed when this build required a signature and had no credential', () => {
    const execFileSync = vi.fn();
    expect(() =>
      signWindowsStagedBinary('C:\\staged\\x.exe', {
        execFileSync,
        env: { WAYLAND_REQUIRE_WINDOWS_SIGNATURE: '1' },
      })
    ).toThrow(/requires an Azure Trusted Signing credential/);
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it('reads the requirement off the environment the release tag sets', () => {
    expect(windowsSignatureRequired({ WAYLAND_REQUIRE_WINDOWS_SIGNATURE: '1' })).toBe(true);
    expect(windowsSignatureRequired({ WAYLAND_REQUIRE_WINDOWS_SIGNATURE: '' })).toBe(false);
    expect(windowsSignatureRequired({})).toBe(false);
  });

  it('propagates a signature that did not verify instead of returning success', () => {
    const execFileSync = vi.fn((_cmd: string, args: string[]) => {
      if (commandText(args).includes('Get-AuthenticodeSignature')) throw new Error('Authenticode status NotSigned');
      return '';
    });
    expect(() => signWindowsStagedBinary('C:\\staged\\x.exe', { execFileSync, env: CREDENTIALS })).toThrow(/NotSigned/);
  });

  it('reports a wrong-publisher or absent signature as not signed', () => {
    const wrongPublisher = vi.fn(() => {
      throw new Error('signed by Someone Else, expected Ferrox Labs, LLC');
    });
    expect(isWindowsAuthenticodeSigned('C:\\staged\\x.exe', { execFileSync: wrongPublisher })).toBe(false);
    const signed = vi.fn(() => '');
    expect(isWindowsAuthenticodeSigned('C:\\staged\\x.exe', { execFileSync: signed })).toBe(true);
  });
});
