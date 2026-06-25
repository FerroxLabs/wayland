/**
 * Re-add the held connectors that needed runtime-args or BYO support, now that
 * PackageRef.runtimeArguments + the BYO-stdio (env client creds) path are wired.
 * Package identifiers verified on npm. Run: node scripts/gen-mcp-held-connectors.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/renderer/mcp-catalog');
const TODAY = '2026-06-13';
const slug = (id) => id.replace(/[^A-Za-z0-9_.-]/g, '-');

// Each def fully specifies its package + auth + guide steps (bespoke, not templated).
const DEFS = [
  {
    id: 'com.digitalocean/digitalocean-mcp', title: 'DigitalOcean', tier: 'builder',
    cats: ['infrastructure', 'devops'], tags: ['digitalocean', 'cloud', 'hosting'], brand: '#0080FF', rank: 200,
    desc: "Manage App Platform, droplets, managed databases, Kubernetes, and the container registry - DigitalOcean's official MCP.",
    web: 'https://docs.digitalocean.com/reference/mcp', repo: 'https://github.com/digitalocean/digitalocean-mcp',
    pkg: { registryType: 'npm', identifier: '@digitalocean/mcp', version: '1.0.58', runtimeHint: 'npx',
      runtimeArguments: ['--services', 'apps,databases,droplets,kubernetes,networking,monitoring'],
      env: [{ name: 'DIGITALOCEAN_API_TOKEN', description: 'DigitalOcean personal access token.', isRequired: true, isSecret: true }] },
    auth: { method: 'api-key', providerName: 'DigitalOcean', providerSignupUrl: 'https://cloud.digitalocean.com/account/api/tokens' },
    steps: [
      { id: 'install', title: 'Install the MCP server', autoCompletedByInstall: true,
        body: 'Wayland runs `npx @digitalocean/mcp` on first launch - no manual install needed.' },
      { id: 'api-key', title: 'Paste your DigitalOcean API token',
        externalAction: { label: 'Get a DigitalOcean token', url: 'https://cloud.digitalocean.com/account/api/tokens' },
        inputs: [{ name: 'DIGITALOCEAN_API_TOKEN', label: 'DigitalOcean API token', secret: true }],
        primaryAction: { label: 'Save & connect', action: 'api-key-save' },
        body: '1. Click **Get a DigitalOcean token** above, generate a token with read/write scopes, and copy it.\n2. Paste it above and click **Save & connect**.' },
    ],
  },
  {
    id: 'com.upstash/upstash-mcp', title: 'Upstash', tier: 'builder',
    cats: ['database', 'infrastructure'], tags: ['upstash', 'redis', 'qstash'], brand: '#00E9A3', rank: 201,
    desc: "Manage Upstash Redis, QStash, and Workflow resources in natural language - Upstash's official MCP.",
    web: 'https://github.com/upstash/mcp-server', repo: 'https://github.com/upstash/mcp-server',
    pkg: { registryType: 'npm', identifier: '@upstash/mcp-server', version: '0.2.3', runtimeHint: 'npx',
      runtimeArguments: ['--email', '{{UPSTASH_EMAIL}}', '--api-key', '{{UPSTASH_API_KEY}}'],
      env: [{ name: 'UPSTASH_EMAIL', description: 'Upstash account email.', isRequired: true, isSecret: false },
            { name: 'UPSTASH_API_KEY', description: 'Upstash management API key.', isRequired: true, isSecret: true }] },
    auth: { method: 'api-key', providerName: 'Upstash', providerSignupUrl: 'https://console.upstash.com/account/api' },
    steps: [
      { id: 'install', title: 'Install the MCP server', autoCompletedByInstall: true,
        body: 'Wayland runs `npx @upstash/mcp-server` on first launch - no manual install needed.' },
      { id: 'api-key', title: 'Paste your Upstash email and management API key',
        externalAction: { label: 'Get an Upstash API key', url: 'https://console.upstash.com/account/api' },
        inputs: [{ name: 'UPSTASH_EMAIL', label: 'Upstash account email' },
                 { name: 'UPSTASH_API_KEY', label: 'Upstash management API key', secret: true }],
        primaryAction: { label: 'Save & connect', action: 'api-key-save' },
        body: '1. Click **Get an Upstash API key** above and create a management API key.\n2. Enter the account email and the key above, then click **Save & connect**.' },
    ],
  },
  {
    id: 'com.twilio/twilio-mcp', title: 'Twilio', tier: 'worker',
    cats: ['communication'], tags: ['twilio', 'sms', 'voice'], brand: '#F22F46', rank: 202,
    desc: "Send SMS, place calls, and reach the full Twilio API surface - Twilio Alpha's official MCP.",
    web: 'https://github.com/twilio-labs/mcp', repo: 'https://github.com/twilio-labs/mcp',
    pkg: { registryType: 'npm', identifier: '@twilio-alpha/mcp', version: '0.7.0', runtimeHint: 'npx',
      runtimeArguments: ['{{TWILIO_CREDENTIALS}}'],
      env: [{ name: 'TWILIO_CREDENTIALS', description: 'AccountSID/APIKeySID:APIKeySecret', isRequired: true, isSecret: true }] },
    auth: { method: 'api-key', providerName: 'Twilio', providerSignupUrl: 'https://console.twilio.com' },
    steps: [
      { id: 'install', title: 'Install the MCP server', autoCompletedByInstall: true,
        body: 'Wayland runs `npx @twilio-alpha/mcp` on first launch - no manual install needed.' },
      { id: 'api-key', title: 'Paste your Twilio credentials',
        externalAction: { label: 'Open Twilio Console', url: 'https://console.twilio.com' },
        inputs: [{ name: 'TWILIO_CREDENTIALS', label: 'Credentials (AccountSID/APIKeySID:APIKeySecret)', secret: true }],
        primaryAction: { label: 'Save & connect', action: 'api-key-save' },
        body: 'In the Twilio Console create an **API Key** (Account > API keys & tokens). Then paste a single string in this exact format:\n\n`ACxxxxxxxx/SKxxxxxxxx:your_api_key_secret`\n\n(Account SID `/` API Key SID `:` API Key Secret), then click **Save & connect**.' },
    ],
  },
  {
    id: 'com.xero/xero-mcp', title: 'Xero', tier: 'worker',
    cats: ['payments', 'productivity'], tags: ['xero', 'accounting', 'invoices'], brand: '#13B5EA', rank: 203,
    desc: "Accounting in natural language - invoices, contacts, P&L and balance-sheet reports, bank transactions - Xero's official MCP.",
    web: 'https://github.com/XeroAPI/xero-mcp-server', repo: 'https://github.com/XeroAPI/xero-mcp-server',
    pkg: { registryType: 'npm', identifier: '@xeroapi/xero-mcp-server', version: '0.0.17', runtimeHint: 'npx',
      env: [{ name: 'XERO_CLIENT_ID', description: 'Xero Custom Connection client ID.', isRequired: true, isSecret: false },
            { name: 'XERO_CLIENT_SECRET', description: 'Xero Custom Connection client secret.', isRequired: true, isSecret: true }] },
    auth: { method: 'oauth2-byo', providerName: 'Xero', providerSignupUrl: 'https://developer.xero.com/app/manage',
      byoClient: { registrationUrl: 'https://developer.xero.com/app/manage', requiresSecret: true } },
    steps: [
      { id: 'install', title: 'Install the MCP server', autoCompletedByInstall: true,
        body: 'Wayland runs `npx @xeroapi/xero-mcp-server` on first launch - no manual install needed.' },
      { id: 'oauth-client', title: 'Create a Xero Custom Connection',
        externalAction: { label: 'Open Xero developer portal', url: 'https://developer.xero.com/app/manage' },
        inputs: [{ name: 'XERO_CLIENT_ID', label: 'Client ID' },
                 { name: 'XERO_CLIENT_SECRET', label: 'Client secret', secret: true }],
        warning: 'A Custom Connection is a machine-to-machine app scoped to one Xero organization. It needs a paid Xero subscription.',
        body: '1. Click **Open Xero developer portal** above and sign in.\n2. Click **New app** > **Custom Connection**, name it *Wayland*, and select the scopes you need (e.g. accounting.transactions, accounting.contacts, accounting.reports.read).\n3. Open the app\'s **Configuration** tab, copy the **Client id** and generate a **Client secret**.\n4. Paste both above, then click **Install** at the top of this page and toggle the connector on.' },
    ],
  },
];

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
const existing = new Set(catalog.entries.map((e) => e.id));
let added = 0;
for (const d of DEFS) {
  if (existing.has(d.id)) { console.log('SKIP existing', d.id); continue; }
  const file = slug(d.id);
  const pkg = {
    registryType: d.pkg.registryType, identifier: d.pkg.identifier, version: d.pkg.version,
    runtimeHint: d.pkg.runtimeHint, transport: { type: 'stdio' },
    ...(d.pkg.runtimeArguments ? { runtimeArguments: d.pkg.runtimeArguments } : {}),
    ...(d.pkg.env ? { environmentVariables: d.pkg.env } : {}),
  };
  const entry = {
    $schema: '../schema/entry.schema.json', name: d.id, title: d.title, description: d.desc,
    version: d.pkg.version, websiteUrl: d.web, repository: { url: d.repo, source: 'github' },
    packages: [pkg], remotes: [],
    'x-wayland': {
      tier: d.tier, categories: d.cats, tags: d.tags, maintainerType: 'official', license: 'Proprietary',
      verifiedAt: TODAY, verifiedBy: 'Wayland', popularityRank: d.rank, installRate: 0.0,
      iconUrl: `icons/${file}.svg`, brand: { logoBackground: '#ffffff', logoForeground: d.brand },
      auth: d.auth,
      setupGuide: { path: `guides/${file}.md`, estimatedMinutes: 4, stepCount: d.steps.length },
      platforms: ['macos', 'windows', 'linux'], minWaylandVersion: '0.9.0',
    },
  };
  fs.writeFileSync(path.join(ROOT, 'entries', `${file}.json`), JSON.stringify(entry, null, 2) + '\n');

  // guide
  const y = ['---', 'guideVersion: 1.0.0', 'estimatedMinutes: 4', 'steps:'];
  for (const s of d.steps) {
    y.push(`  - id: ${s.id}`);
    y.push(`    title: ${JSON.stringify(s.title)}`);
    if (s.autoCompletedByInstall) y.push('    autoCompletedByInstall: true');
    if (s.externalAction) y.push(`    externalAction: { label: ${JSON.stringify(s.externalAction.label)}, url: ${JSON.stringify(s.externalAction.url)} }`);
    if (s.inputs) {
      y.push('    inputs:');
      for (const inp of s.inputs) y.push(`      - { name: ${inp.name}, label: ${JSON.stringify(inp.label)}${inp.secret ? ', secret: true' : ''} }`);
    }
    if (s.warning) { y.push('    warning: |'); for (const l of s.warning.split('\n')) y.push(`      ${l}`); }
    if (s.primaryAction) y.push(`    primaryAction: { label: ${JSON.stringify(s.primaryAction.label)}, action: ${JSON.stringify(s.primaryAction.action)} }`);
    y.push('    body: |');
    for (const l of s.body.split('\n')) y.push(`      ${l}`);
  }
  y.push('---', '', `# ${d.title} setup`, '', d.desc, '');
  fs.writeFileSync(path.join(ROOT, 'guides', `${file}.md`), y.join('\n'));

  catalog.entries.push({
    id: d.id, name: d.title, shortDescription: d.desc, iconUrl: `icons/${file}.svg`, tier: d.tier,
    categories: d.cats, maintainerType: 'official', verifiedByWayland: TODAY, popularityRank: d.rank,
    installRate: 0.0, entryUrl: `entries/${file}.json`, guideUrl: `guides/${file}.md`,
  });
  added++;
  console.log('added', d.id);
}
fs.writeFileSync(path.join(ROOT, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log(`Added ${added}. Catalog now ${catalog.entries.length}. Icon slugs:`, DEFS.map((d) => slug(d.id)).join(' '));
