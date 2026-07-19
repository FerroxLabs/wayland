# Wayland Cloud and Pro

## Product boundary

### Free Desktop

The complete local personal product: provider/agent choice, Core, Flux support, local workspaces, assistants/workflows/skills, local scheduling while awake, MCPs, channels where locally operable, exports, and portable receipts.

### Community self-hosted Cloud

A complete single-user or small-team server with documented deployment, durable storage, Web UI/API, remote workers, backups, health checks, and portable data. It should not be an intentionally broken teaser for Pro.

### Hosted Pro

Charge for work users do not want to operate themselves:

- managed deployment, updates, backups, restore, monitoring, and SLA;
- always-on isolated execution and remote hosts;
- cross-device state and secure handoff from Desktop;
- managed OAuth and connector credentials;
- team/org identity, roles, policies, audit, budgets, and shared workspaces;
- secrets management, retention, regional hosting, compliance controls;
- higher concurrency, storage, scheduled work, and managed compute;
- premium connector packs, templates, support, and admin analytics.

This boundary makes the free product an adoption engine rather than a compromised SKU.

## Cloud readiness gaps at v0.11.18

1. The official Docker image fails during the renderer build from a Node heap OOM.
2. The base image is mutable and resolves a different Bun version from Desktop.
3. Dependency installation is not frozen.
4. The built server is large and starts without five required built-in MCP scripts.
5. Standalone version metadata is unknown.
6. No regular CI job builds, boots, health-checks, authenticates, exercises a bridge action, and shuts down the image.
7. Standalone bridge registration is a partial subset of Desktop and has no generated parity report.
8. Deployment documentation conflicts on ports, versions, Xvfb/Electron versus standalone server, and exposure guidance.
9. Multi-tenant isolation, quotas, secret boundaries, backup/restore, migrations, and observability are not yet a hosted service contract.

## Minimum credible Community Cloud

- digest-pinned multi-stage images and reproducible lockfile installs;
- explicit build memory and route/chunk budgets;
- non-root minimal runtime, health/readiness endpoints, graceful shutdown;
- all declared runtime artifacts and version/build metadata;
- persistent volume schema, migrations, backup, restore, and upgrade rollback;
- reverse-proxy/TLS reference configurations and secure remote defaults;
- capability/parity endpoint and Doctor report;
- deterministic container E2E on every release;
- documented single-user threat model and support matrix.

## Hosted architecture principles

- Isolate tenant data, execution, network policy, secrets, and connector tokens.
- Keep Task/Workspace/Receipt formats portable so users can leave hosted Pro.
- Treat Desktop-to-Cloud handoff as a cryptographically bound transfer of task, workspace snapshot, policy, and expected artifact.
- Use short-lived, scoped connector credentials and log every consequential connector action.
- Separate control plane, execution plane, artifact storage, and connector broker.
- Meter value-aligned resources: active execution, schedules, storage, connector calls, seats, retention—not provider token margin hidden from users.

## Composio fit

[Composio](https://composio.dev/) currently advertises more than 1,000 app integrations rather than 600, with managed OAuth, scoped permissions, audit logs, and sandboxed execution. That makes it a plausible accelerator for Hosted Pro's managed connection broker.

Do not make it the product's connector ontology. Wayland should own a provider-neutral Connector contract so a connection can be backed by:

- a community/official MCP server;
- a native Wayland adapter;
- Composio managed auth/actions;
- another managed connector vendor;
- a customer-owned integration.

Pro value is safe managed authentication, reliability, audit, support, and scale. Open protocols, custom MCPs, and self-hosted connections remain available outside Pro.

## Suggested commercial packaging

Validate willingness to pay before fixing exact quotas.

| Tier | User | Value proposition |
|---|---|---|
| Desktop / Community | Individual builders and self-hosters | Complete local and self-hosted sovereignty. |
| Pro | Individual professionals | Always-on Wayland, cross-device continuity, managed connections, backups, premium support. |
| Team | Small organizations | Shared workspaces, roles, budgets, policies, audit, higher concurrency. |
| Enterprise | Regulated/larger organizations | SSO/SCIM, retention, regional deployment, private networking, compliance and SLA. |
