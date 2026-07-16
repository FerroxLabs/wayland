/**
 * MCP session-truth is still an experimental consumer of the Core launch
 * receipts. Keep it impossible to activate in packaged production builds until
 * the M0A/M1 authority and replay gates are sealed.
 */
export const MCP_SESSION_TRUTH_PREVIEW_ENV = 'WAYLAND_MCP_SESSION_TRUTH_PREVIEW';

function isAuthoritativelyPackaged(): boolean {
  try {
    return getPlatformServices().paths.isPackaged();
  } catch {
    // Platform authority unavailable is not evidence that preview behavior is safe.
    return true;
  }
}

export function isMcpSessionTruthPreviewEnabled(
  env: NodeJS.ProcessEnv = process.env,
  packaged: boolean = isAuthoritativelyPackaged()
): boolean {
  // Test harness only. Development and packaged applications cannot activate
  // automatic restart, persistence, or readiness promotion before MCP-2.
  return packaged === false && env.NODE_ENV === 'test' && env[MCP_SESSION_TRUTH_PREVIEW_ENV] === '1';
}
import { getPlatformServices } from '@/common/platform';
