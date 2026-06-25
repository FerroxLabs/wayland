/**
 * LAN address discovery for the WebUI QR-login flow.
 *
 * No Electron imports - shared between webuiBridge.ts (Electron mode) and
 * webserver/index.ts (standalone mode).
 *
 * The QR code encodes `http://<lanIP>:<port>/qr-login?token=...`. The phone
 * scanning it must be able to route to <lanIP>. A naive "first non-internal
 * IPv4" pick frequently returns the address of a virtual adapter (Hyper-V
 * vEthernet, VMware VMnet, VirtualBox host-only, WSL, VPN/Tailscale). Those
 * adapters commonly enumerate BEFORE the real Wi-Fi/Ethernet NIC on Windows,
 * so the phone - sitting on the same Wi-Fi as the real NIC - gets a QR that
 * points at an unreachable subnet and the browser hangs (GitHub #105).
 *
 * This module scores candidates so the physical NIC the phone shares a network
 * with is preferred over virtual / point-to-point adapters.
 *
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { networkInterfaces } from 'os';

type NetworkInterfaceLike = {
  family: string | number;
  internal: boolean;
  address: string;
};

/**
 * Adapter names that belong to virtual / hypervisor / VPN NICs. The phone
 * cannot reach the host through these, so they are heavily de-prioritized.
 * Matched case-insensitively as substrings of the interface name.
 */
const VIRTUAL_ADAPTER_HINTS = [
  'vethernet', // Hyper-V
  'vmnet', // VMware
  'vmware',
  'virtualbox',
  'vboxnet',
  'wsl', // Windows Subsystem for Linux
  'docker',
  'tailscale',
  'zerotier',
  'tun', // generic VPN tunnels
  'tap',
  'utun', // macOS VPN tunnels
  'ppp', // dial-up / some VPNs
  'loopback',
  'bridge', // docker/host bridges (macOS bridge100 etc.)
  'llw', // macOS low-latency Wi-Fi (AWDL-adjacent), not routable for phones
  'awdl', // Apple Wireless Direct Link
];

/**
 * Private IPv4 ranges a phone on the same LAN can realistically route to.
 * Used to prefer real private addresses over public/odd ones.
 */
function isPrivateIPv4(ip: string): boolean {
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  return false;
}

/**
 * Link-local (169.254.x) means the interface failed to get a DHCP lease. The
 * phone cannot use it. Lowest priority but still better than nothing.
 */
function isLinkLocalIPv4(ip: string): boolean {
  return ip.startsWith('169.254.');
}

function looksVirtual(interfaceName: string): boolean {
  const lower = interfaceName.toLowerCase();
  return VIRTUAL_ADAPTER_HINTS.some((hint) => lower.includes(hint));
}

/**
 * Score a candidate address. Higher is more likely to be the physical NIC the
 * scanning phone shares a network with.
 *
 * - Virtual adapters are pushed below everything routable.
 * - Real private addresses on physical adapters rank highest.
 * - VirtualBox host-only (192.168.56.x) is private but virtual, so the virtual
 *   penalty correctly demotes it below the real Wi-Fi NIC.
 */
function scoreCandidate(interfaceName: string, address: string): number {
  let score = 0;

  if (isPrivateIPv4(address)) {
    score += 100;
  } else if (isLinkLocalIPv4(address)) {
    score += 10;
  } else {
    // Public or otherwise non-private routable address.
    score += 50;
  }

  if (looksVirtual(interfaceName)) {
    score -= 200;
  }

  return score;
}

/**
 * Pick the best LAN IPv4 address for the QR-login URL.
 *
 * Returns the most-routable private NIC address, preferring physical adapters
 * over virtual ones. Returns null when no external IPv4 exists (e.g. fully
 * offline), in which case callers fall back to `localhost` (desktop-only).
 *
 * Accepts an optional interface map for testability; defaults to the live
 * `os.networkInterfaces()`.
 */
export function getLanIP(
  interfaces: NodeJS.Dict<NetworkInterfaceLike[]> = networkInterfaces() as NodeJS.Dict<NetworkInterfaceLike[]>
): string | null {
  let best: { address: string; score: number } | null = null;

  for (const name of Object.keys(interfaces)) {
    const netInfo = interfaces[name];
    if (!netInfo) continue;

    for (const net of netInfo) {
      // Node 18.4+ returns number (4/6); older versions return 'IPv4'/'IPv6'.
      const isIPv4 = net.family === 'IPv4' || (net.family as unknown) === 4;
      if (!isIPv4 || net.internal) continue;

      const score = scoreCandidate(name, net.address);
      if (best === null || score > best.score) {
        best = { address: net.address, score };
      }
    }
  }

  return best?.address ?? null;
}
