# Adoption, advocacy, and distribution

## Current baseline

At audit time the public repository was approximately six weeks old with 541 stars, 100 forks, 108 open issues, and 34 releases. Release assets had accumulated 38,939 downloads, of which about 9,465 were installer/archive downloads and the rest were updater metadata or blockmaps. The `getwayland` npm package had 194 downloads in the preceding week.

That is meaningful early pull. It should not be inflated by reporting updater metadata as installs, and none of these numbers prove retained active users.

The public distribution surface is under-configured: the repository has no homepage URL or topics, GitHub Pages is off, the README badge and install/security copy are stale, and deployment guides conflict. The product is moving faster than its trust surface.

## Distribution foundation

1. One canonical website with immediate OS detection, signed-download trust, checksum/signing details, and a 60-second first-value video.
2. Release-derived installation docs for macOS, Windows, Linux, npm CLI, Docker, and source.
3. GitHub topics, homepage, discussions taxonomy, support/security matrix, roadmap, and good-first-issue path.
4. Package channels users already trust: Homebrew cask, WinGet, Chocolatey/Scoop where appropriate, Flatpak/Snap/AppImage/deb/rpm, and npm.
5. Update telemetry that distinguishes metadata checks, successful downloads, successful installs, rollback, and active versions while respecting privacy.
6. A deterministic self-host deploy for Docker Compose plus selected one-click hosts after the base image is proven.

## Turn users into advocates

Advocacy must be a natural by-product of successful work, not a referral modal before value.

### Shareable outcomes

- Publish a polished artifact or live report with optional “Made with Wayland” attribution.
- Share a redacted Task Receipt showing sources, tools, routing, verification, and cost.
- Export a workspace outcome bundle that another user can inspect without installing every provider.

### Remixable systems

- “Save as template” after a task succeeds.
- One-link install/remix for an assistant, workflow, team, connector pack, or scheduled automation.
- Public gallery with runnable previews, declared permissions, compatible hosts/providers, versioning, ratings, and verification badges.
- Creator profiles and analytics showing installs, successful runs, remixes, and retained use—not vanity clicks.

### Collaborative pull

- Invite a reviewer to an artifact or approval without forcing a full setup.
- Convert an invited collaborator into a Desktop, self-host, or Pro workspace user after they experience the result.
- Allow teams to publish internal templates and connector packs, creating organizational distribution.

### Ecosystem incentives

- Portable open manifests and local testing harnesses.
- Verified publisher and security review levels.
- Revenue share for premium hosted templates/connectors later, without preventing free distribution.
- Monthly community showcases built from verified outcomes.
- Contributor recognition linked to shipped capability and support quality.

## Activation journey

The first-run experience should ask for an outcome before a provider matrix:

1. Choose local/private, fastest setup, or bring-your-own-provider posture.
2. State or select one meaningful outcome.
3. Wayland proposes the minimum connection and permission needed.
4. Complete a verified artifact in under ten minutes.
5. Explain what Wayland chose and how to change it.
6. Offer to save, schedule, share, or remix the successful task.

## Trust as distribution

Provider neutrality, receipts, portable data, signed releases, transparent routing/cost, and complete self-hosting can become the community story. Every stale claim, bypass-security instruction, opaque permission, or unreproducible deployment damages that story disproportionately.

## Metrics that matter

- signed installer download to successful first launch;
- first launch to first verified artifact;
- week-one completed tasks, not messages;
- retained workspaces and scheduled automations;
- share-to-view and share-to-remix conversion;
- template install to successful outcome;
- invite-to-collaborate and collaborate-to-install conversion;
- active-version health and update success;
- self-host deploy success and upgrade/restore success;
- community contribution time-to-first-merged-change;
- Pro conversion after users consume managed value.

