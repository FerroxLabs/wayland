/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Which configured connectors "Send to..." may offer, derived from the registry
 * the user already filled in.
 *
 * THERE IS NO SECOND REGISTRY, and that is the point. Destinations are the
 * channel plugins in Settings -> Channels and the users already authorized on
 * them. A parallel list of "places to send things" would be a list that keeps
 * working after the user revokes someone in Settings, which is precisely the
 * kind of quiet divergence that turns a convenience into an incident.
 *
 * Nothing here reads a credential. The plugin's stored secrets are never
 * touched: the label comes from the connector's own display name, and the
 * addresses come from the authorized-user table. Whether the connector can
 * actually log in is the connector's business, and it stays that way.
 */

import type { IChannelPluginConfig, IChannelUser } from '@process/channels/types';
import type { ArtifactSendDestination, ArtifactSendTarget } from '@/common/types/artifacts';

/**
 * Channel types PROVEN to carry an attachment.
 *
 * Deliberately a short allowlist rather than "everything configured". Most
 * channel plugins in this app send text and silently drop anything else, so
 * offering them would produce a button that reports success and delivers a
 * message with nothing attached - worse than no button, because the user
 * believes the file went.
 *
 * `email-imap` is here because the SMTP path in this same change actually
 * attaches the bytes. Adding a type to this set without teaching that plugin
 * to carry `hostAttachments` re-creates exactly the silent-drop failure.
 */
export const FILE_CAPABLE_CHANNEL_TYPES: ReadonlySet<string> = new Set(['email-imap']);

/**
 * The connectors that could accept this deliverable right now.
 *
 * Returns `[]` freely - for nothing configured, for everything disabled, for a
 * connector nobody is authorized on. The card reads an empty list as "render no
 * button", which is the honest rendering of "there is nowhere to send this".
 */
export function buildSendTargets(
  plugins: readonly IChannelPluginConfig[],
  users: readonly IChannelUser[]
): ArtifactSendTarget[] {
  const targets: ArtifactSendTarget[] = [];

  for (const plugin of plugins) {
    if (!plugin?.enabled) continue;
    if (!FILE_CAPABLE_CHANNEL_TYPES.has(plugin.type)) continue;

    const destinations = collectDestinations(plugin.type, users);
    // A connector nobody is authorized on cannot complete a send. Offering it
    // just moves the dead click one level down, into an empty submenu.
    if (destinations.length === 0) continue;

    targets.push({
      targetId: plugin.id,
      channel: plugin.type,
      label: plugin.name || plugin.type,
      destinations,
    });
  }

  return targets;
}

/**
 * The authorized recipients on ONE channel type.
 *
 * Matched on `platformType`, never merged across channels: a Telegram user id
 * is not a mail address, and handing one to the SMTP transport would send the
 * file to an address the user never authorized anywhere.
 */
function collectDestinations(type: string, users: readonly IChannelUser[]): ArtifactSendDestination[] {
  const byAddress = new Map<string, ArtifactSendDestination>();

  for (const user of users) {
    if (!user || user.platformType !== type) continue;

    const destinationId = (user.platformUserId ?? '').trim();
    // A row with no address is not a destination. Offering it would render a
    // blank menu entry that fails the moment it is clicked.
    if (!destinationId) continue;
    // First row wins. Two rows for one address is one recipient, and the
    // duplicate would read as two different people in the menu.
    if (byAddress.has(destinationId)) continue;

    const displayName = (user.displayName ?? '').trim();
    byAddress.set(destinationId, { destinationId, label: displayName || destinationId });
  }

  return [...byAddress.values()];
}
