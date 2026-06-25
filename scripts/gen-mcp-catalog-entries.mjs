/**
 * One-off generator: emit catalog entry JSON + setup-guide MD + catalog.json
 * index rows for the 2026-06-13 MCP catalog expansion. Data is hand-verified
 * from vendor docs / official repos (see .planning/MCP-CATALOG-CANDIDATES-2026-06-13.md).
 *
 * Run: node scripts/gen-mcp-catalog-entries.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/renderer/mcp-catalog');
const ENTRIES = path.join(ROOT, 'entries');
const GUIDES = path.join(ROOT, 'guides');
const CATALOG = path.join(ROOT, 'catalog.json');
const TODAY = '2026-06-13';

const slug = (id) => id.replace(/[^A-Za-z0-9_.-]/g, '-');

// transport: 'remote' (url + rtype) | 'stdio' (pkg + runtime + registry + env)
// auth: 'none' | 'api-key' | 'oauth'
// header: custom api-key header name (default Authorization/Bearer)
// envName: env var the token/key is entered as (api-key); for remote it just carries the token
const DATA = [
  // ── Media creation ─────────────────────────────────────────────
  { id: 'ai.fal/fal-mcp', title: 'fal.ai', tier: 'core', cats: ['media', 'automation'], tags: ['fal', 'image', 'video', 'audio', 'generation'], maint: 'official', brand: '#0099FF',
    desc: "One gateway to 1,000+ generative media models - image, video, audio, and voice - through fal's hosted MCP. Search models, run inference, upload files.",
    web: 'https://fal.ai/docs/documentation/setting-up/mcp', repo: 'https://github.com/fal-ai/fal-mcp',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.fal.ai/mcp',
    auth: 'api-key', provider: 'fal.ai', signup: 'https://fal.ai/dashboard/keys', envName: 'FAL_KEY' },
  { id: 'com.replicate/replicate-mcp', title: 'Replicate', tier: 'core', cats: ['media', 'developer'], tags: ['replicate', 'image', 'video', 'models'], maint: 'official', brand: '#000000',
    desc: 'Run, search, and compare thousands of community models for image, video, audio, and 3D generation - Replicate’s official hosted MCP.',
    web: 'https://replicate.com/docs/reference/mcp', repo: 'https://github.com/replicate/replicate-mcp',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.replicate.com', auth: 'oauth', provider: 'Replicate', signup: 'https://replicate.com' },
  { id: 'ai.higgsfield/higgsfield-mcp', title: 'Higgsfield', tier: 'core', cats: ['media'], tags: ['higgsfield', 'video', 'image', 'cinematic'], maint: 'official', brand: '#000000',
    desc: 'Generate cinematic video and images from 30+ models (Soul, Cinema Studio, Seedance, Kling, Veo) - Higgsfield’s official hosted MCP.',
    web: 'https://higgsfield.ai/mcp', repo: 'https://higgsfield.ai/mcp',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.higgsfield.ai/mcp', auth: 'oauth', provider: 'Higgsfield', signup: 'https://higgsfield.ai' },
  { id: 'ai.bfl/flux-mcp', title: 'Black Forest Labs (FLUX)', tier: 'worker', cats: ['media'], tags: ['flux', 'bfl', 'image', 'generation'], maint: 'official', brand: '#000000',
    desc: 'Generate, edit, and vary images with FLUX.2 - text-to-image, inpainting, style transfer, and multi-reference composition. Official Black Forest Labs MCP.',
    web: 'https://docs.bfl.ai/api_integration/mcp_integration', repo: 'https://github.com/black-forest-labs/flux-mcp',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.bfl.ai', auth: 'oauth', provider: 'Black Forest Labs', signup: 'https://bfl.ai' },
  { id: 'io.elevenlabs/elevenlabs-mcp', title: 'ElevenLabs', tier: 'core', cats: ['media'], tags: ['elevenlabs', 'voice', 'tts', 'audio'], maint: 'official', brand: '#000000',
    desc: 'Text-to-speech, voice cloning, voice design, audio isolation, transcription, and sound effects - ElevenLabs’ official MCP.',
    web: 'https://elevenlabs.io/docs/mcp', repo: 'https://github.com/elevenlabs/elevenlabs-mcp',
    transport: 'stdio', registry: 'pypi', pkg: 'elevenlabs-mcp', runtime: 'uvx', auth: 'api-key', provider: 'ElevenLabs', signup: 'https://elevenlabs.io/app/settings/api-keys', envName: 'ELEVENLABS_API_KEY' },
  { id: 'ai.minimax/minimax-mcp', title: 'MiniMax (Hailuo)', tier: 'worker', cats: ['media'], tags: ['minimax', 'hailuo', 'video', 'audio', 'voice'], maint: 'official', brand: '#F23030',
    desc: 'Hailuo video generation, music, text-to-speech, voice cloning, and image generation - MiniMax’s official MCP.',
    web: 'https://github.com/MiniMax-AI/MiniMax-MCP', repo: 'https://github.com/MiniMax-AI/MiniMax-MCP',
    transport: 'stdio', registry: 'pypi', pkg: 'minimax-mcp', runtime: 'uvx', auth: 'api-key', provider: 'MiniMax', signup: 'https://www.minimax.io/platform', envName: 'MINIMAX_API_KEY' },
  { id: 'ai.recraft/recraft-mcp', title: 'Recraft', tier: 'worker', cats: ['media', 'design'], tags: ['recraft', 'image', 'vector', 'svg'], maint: 'official', brand: '#000000',
    desc: 'Generate and edit raster and vector (SVG) images, custom styles, vectorization, background removal, and upscaling - Recraft’s official hosted MCP.',
    web: 'https://www.recraft.ai/docs/mcp-reference/getting-started', repo: 'https://github.com/recraft-ai/mcp-recraft-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.recraft.ai/mcp', auth: 'oauth', provider: 'Recraft', signup: 'https://www.recraft.ai' },

  // ── Search / research / knowledge ──────────────────────────────
  { id: 'com.tavily/tavily-mcp', title: 'Tavily', tier: 'core', cats: ['search', 'research'], tags: ['tavily', 'search', 'extract'], maint: 'official', brand: '#0EA5A4',
    desc: 'AI-native web search plus page extraction, mapping, and crawling - Tavily’s official hosted MCP.',
    web: 'https://docs.tavily.com/documentation/mcp', repo: 'https://github.com/tavily-ai/tavily-mcp',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.tavily.com/mcp/', auth: 'oauth', provider: 'Tavily', signup: 'https://app.tavily.com' },
  { id: 'ai.jina/jina-mcp', title: 'Jina AI', tier: 'worker', cats: ['search', 'research'], tags: ['jina', 'reader', 'search', 'extract'], maint: 'official', brand: '#EB1C24',
    desc: 'Read any URL as clean markdown, search the web and arXiv, capture screenshots, and extract PDFs - Jina AI’s official hosted MCP.',
    web: 'https://github.com/jina-ai/MCP', repo: 'https://github.com/jina-ai/MCP',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.jina.ai/v1', auth: 'api-key', provider: 'Jina AI', signup: 'https://jina.ai/api-dashboard/', envName: 'JINA_API_KEY' },
  { id: 'com.apify/apify-mcp', title: 'Apify', tier: 'worker', cats: ['automation', 'search', 'data'], tags: ['apify', 'scraping', 'actors'], maint: 'official', brand: '#3083ED',
    desc: 'Run thousands of ready-made scrapers and automation Actors - social, maps, e-commerce, any site - through Apify’s official hosted MCP.',
    web: 'https://github.com/apify/apify-mcp-server', repo: 'https://github.com/apify/apify-mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.apify.com', auth: 'oauth', provider: 'Apify', signup: 'https://console.apify.com' },
  { id: 'com.ref/ref-tools-mcp', title: 'Ref', tier: 'worker', cats: ['developer', 'search'], tags: ['ref', 'docs', 'documentation'], maint: 'official', brand: '#4F46E5',
    desc: 'Token-efficient documentation search and reading across public and private docs - Ref’s official hosted MCP.',
    web: 'https://ref.tools', repo: 'https://github.com/ref-tools/ref-tools-mcp',
    transport: 'remote', rtype: 'streamable-http', url: 'https://api.ref.tools/mcp', auth: 'api-key', header: 'x-ref-api-key', provider: 'Ref', signup: 'https://ref.tools', envName: 'REF_API_KEY' },
  { id: 'com.you/you-mcp', title: 'You.com', tier: 'worker', cats: ['search', 'research'], tags: ['you', 'search', 'news', 'research'], maint: 'official', brand: '#7C3AED',
    desc: 'Web and news search plus multi-step research with citations - You.com’s official hosted MCP, with a free no-key tier.',
    web: 'https://you.com/docs/build-with-agents/mcp-server', repo: 'https://you.com/docs/build-with-agents/mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://api.you.com/mcp', auth: 'oauth', provider: 'You.com', signup: 'https://you.com' },
  { id: 'so.linkup/linkup-mcp', title: 'Linkup', tier: 'worker', cats: ['search', 'research'], tags: ['linkup', 'search', 'research'], maint: 'official', brand: '#1A56DB',
    desc: 'Real-time web search, autonomous research, and page fetch - Linkup’s official hosted MCP.',
    web: 'https://github.com/LinkupPlatform/linkup-mcp-server', repo: 'https://github.com/LinkupPlatform/linkup-mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.linkup.so/mcp', auth: 'api-key', provider: 'Linkup', signup: 'https://app.linkup.so', envName: 'LINKUP_API_KEY' },
  { id: 'ai.perplexity/perplexity-mcp', title: 'Perplexity', tier: 'core', cats: ['search', 'research'], tags: ['perplexity', 'sonar', 'search', 'research'], maint: 'official', brand: '#20808D',
    desc: 'Real-time search plus deep research and reasoning powered by Sonar - Perplexity’s official MCP.',
    web: 'https://docs.perplexity.ai/guides/mcp-server', repo: 'https://github.com/perplexityai/modelcontextprotocol',
    transport: 'stdio', registry: 'npm', pkg: '@perplexity-ai/mcp-server', runtime: 'npx', auth: 'api-key', provider: 'Perplexity', signup: 'https://www.perplexity.ai/settings/api', envName: 'PERPLEXITY_API_KEY' },
  { id: 'io.tinyfish/agentql-mcp', title: 'AgentQL', tier: 'builder', cats: ['automation', 'data'], tags: ['agentql', 'extraction', 'scraping'], maint: 'official', brand: '#2D7FF9',
    desc: 'Turn a natural-language prompt into structured data from any web page - AgentQL’s official MCP.',
    web: 'https://github.com/tinyfish-io/agentql-mcp', repo: 'https://github.com/tinyfish-io/agentql-mcp',
    transport: 'stdio', registry: 'npm', pkg: 'agentql-mcp', runtime: 'npx', auth: 'api-key', provider: 'AgentQL', signup: 'https://dev.agentql.com', envName: 'AGENTQL_API_KEY' },
  { id: 'org.wikipedia/wikipedia-mcp', title: 'Wikipedia', tier: 'worker', cats: ['knowledge', 'research'], tags: ['wikipedia', 'reference'], maint: 'community', brand: '#000000',
    desc: 'Search Wikipedia and read articles, summaries, and key facts. No account needed.',
    web: 'https://github.com/Rudra-ravi/wikipedia-mcp', repo: 'https://github.com/Rudra-ravi/wikipedia-mcp',
    transport: 'stdio', registry: 'pypi', pkg: 'wikipedia-mcp', runtime: 'uvx', auth: 'none' },
  { id: 'org.arxiv/arxiv-mcp-server', title: 'arXiv', tier: 'worker', cats: ['knowledge', 'research'], tags: ['arxiv', 'papers', 'science'], maint: 'community', brand: '#B31B1B',
    desc: 'Search, download, and read arXiv research papers. No account needed.',
    web: 'https://github.com/blazickjp/arxiv-mcp-server', repo: 'https://github.com/blazickjp/arxiv-mcp-server',
    transport: 'stdio', registry: 'pypi', pkg: 'arxiv-mcp-server', runtime: 'uvx', auth: 'none' },
  { id: 'com.duckduckgo/duckduckgo-mcp-server', title: 'DuckDuckGo', tier: 'worker', cats: ['search'], tags: ['duckduckgo', 'search', 'privacy'], maint: 'community', brand: '#DE5833',
    desc: 'Privacy-friendly web search and content fetch. No account needed.',
    web: 'https://github.com/nickclyde/duckduckgo-mcp-server', repo: 'https://github.com/nickclyde/duckduckgo-mcp-server',
    transport: 'stdio', registry: 'pypi', pkg: 'duckduckgo-mcp-server', runtime: 'uvx', auth: 'none' },

  // ── Dev / infra / databases / AI-infra ─────────────────────────
  { id: 'com.grafana/grafana-mcp', title: 'Grafana', tier: 'builder', cats: ['observability', 'devops'], tags: ['grafana', 'dashboards', 'monitoring'], maint: 'official', brand: '#F46800',
    desc: 'Query dashboards, datasources, and alerting across Prometheus, Loki, and Tempo - Grafana’s official MCP.',
    web: 'https://github.com/grafana/mcp-grafana', repo: 'https://github.com/grafana/mcp-grafana',
    transport: 'stdio', registry: 'pypi', pkg: 'mcp-grafana', runtime: 'uvx', auth: 'api-key', provider: 'Grafana', signup: 'https://grafana.com', envName: 'GRAFANA_SERVICE_ACCOUNT_TOKEN' },
  { id: 'com.railway/railway-mcp', title: 'Railway', tier: 'builder', cats: ['infrastructure', 'devops'], tags: ['railway', 'deploy', 'hosting'], maint: 'official', brand: '#0B0D0E',
    desc: 'Manage projects, deployments, environment variables, and logs in natural language - Railway’s official hosted MCP.',
    web: 'https://docs.railway.com/ai/mcp-server', repo: 'https://docs.railway.com/ai/mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.railway.com', auth: 'oauth', provider: 'Railway', signup: 'https://railway.com' },
  { id: 'com.airtable/airtable-mcp', title: 'Airtable', tier: 'worker', cats: ['productivity', 'database'], tags: ['airtable', 'records', 'database'], maint: 'official', brand: '#FFBF00',
    desc: 'Read and write bases, tables, fields, and records, and discover schema - Airtable’s official hosted MCP.',
    web: 'https://support.airtable.com/docs/using-the-airtable-mcp-server', repo: 'https://support.airtable.com/docs/using-the-airtable-mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.airtable.com/mcp', auth: 'oauth', provider: 'Airtable', signup: 'https://airtable.com/create/tokens' },
  { id: 'com.newrelic/newrelic-mcp', title: 'New Relic', tier: 'builder', cats: ['observability', 'devops'], tags: ['newrelic', 'monitoring', 'nrql'], maint: 'official', brand: '#1CE783',
    desc: 'Run NRQL, inspect alerts, entities, deployments, and golden metrics - New Relic’s official hosted MCP.',
    web: 'https://docs.newrelic.com/docs/agentic-ai/mcp/overview', repo: 'https://docs.newrelic.com/docs/agentic-ai/mcp/overview',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.newrelic.com/mcp/', auth: 'api-key', header: 'Api-Key', provider: 'New Relic', signup: 'https://one.newrelic.com/api-keys', envName: 'NEW_RELIC_API_KEY' },
  { id: 'com.digitalocean/digitalocean-mcp', title: 'DigitalOcean', tier: 'builder', cats: ['infrastructure', 'devops'], tags: ['digitalocean', 'cloud', 'hosting'], maint: 'official', brand: '#0080FF',
    desc: 'Manage App Platform, droplets, managed databases, Kubernetes, and the container registry - DigitalOcean’s official MCP.',
    web: 'https://docs.digitalocean.com/reference/mcp', repo: 'https://github.com/digitalocean/digitalocean-mcp',
    transport: 'stdio', registry: 'npm', pkg: '@digitalocean/mcp', runtime: 'npx', auth: 'api-key', provider: 'DigitalOcean', signup: 'https://cloud.digitalocean.com/account/api/tokens', envName: 'DIGITALOCEAN_API_TOKEN' },
  { id: 'com.render/render-mcp', title: 'Render', tier: 'builder', cats: ['infrastructure', 'devops'], tags: ['render', 'deploy', 'hosting'], maint: 'official', brand: '#5E5BFF',
    desc: 'Manage services, Postgres, key-value stores, metrics, and logs - Render’s official hosted MCP.',
    web: 'https://render.com/docs/mcp-server', repo: 'https://github.com/render-oss/render-mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.render.com/mcp', auth: 'api-key', provider: 'Render', signup: 'https://dashboard.render.com/u/settings/api-keys', envName: 'RENDER_API_KEY' },
  { id: 'com.heroku/heroku-mcp', title: 'Heroku', tier: 'builder', cats: ['infrastructure', 'devops'], tags: ['heroku', 'deploy', 'hosting'], maint: 'official', brand: '#430098',
    desc: 'Manage apps, dynos, add-ons, pipelines, Postgres, and logs - Heroku’s official hosted MCP.',
    web: 'https://github.com/heroku/heroku-mcp-server', repo: 'https://github.com/heroku/heroku-mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.heroku.com/mcp', auth: 'oauth', provider: 'Heroku', signup: 'https://heroku.com' },
  { id: 'com.netlify/netlify-mcp', title: 'Netlify', tier: 'builder', cats: ['infrastructure', 'devops'], tags: ['netlify', 'deploy', 'hosting'], maint: 'official', brand: '#00AD9F',
    desc: 'Create, build, deploy, and manage projects, environment variables, and forms - Netlify’s official MCP.',
    web: 'https://github.com/netlify/netlify-mcp', repo: 'https://github.com/netlify/netlify-mcp',
    transport: 'stdio', registry: 'npm', pkg: '@netlify/mcp', runtime: 'npx', auth: 'api-key', provider: 'Netlify', signup: 'https://app.netlify.com/user/applications', envName: 'NETLIFY_PERSONAL_ACCESS_TOKEN' },
  { id: 'io.prisma/prisma-mcp', title: 'Prisma', tier: 'builder', cats: ['database', 'developer'], tags: ['prisma', 'orm', 'postgres'], maint: 'official', brand: '#2D3748',
    desc: 'Run migrations and manage Prisma Postgres databases - create, list, query, and back up - Prisma’s official hosted MCP.',
    web: 'https://www.prisma.io/docs/cli/mcp', repo: 'https://www.prisma.io/docs/cli/mcp',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.prisma.io/mcp', auth: 'oauth', provider: 'Prisma', signup: 'https://console.prisma.io' },
  { id: 'com.planetscale/planetscale-mcp', title: 'PlanetScale', tier: 'builder', cats: ['database', 'developer'], tags: ['planetscale', 'mysql', 'database'], maint: 'official', brand: '#000000',
    desc: 'Manage organizations, databases, branches, schema, and Insights with destructive-SQL guards - PlanetScale’s official hosted MCP.',
    web: 'https://planetscale.com/docs/connect/mcp', repo: 'https://planetscale.com/docs/connect/mcp',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.pscale.dev/mcp/planetscale', auth: 'oauth', provider: 'PlanetScale', signup: 'https://planetscale.com' },
  { id: 'com.clickhouse/clickhouse-mcp', title: 'ClickHouse', tier: 'builder', cats: ['database', 'data'], tags: ['clickhouse', 'analytics', 'sql'], maint: 'official', brand: '#FFCC00',
    desc: 'Read-only SQL and schema exploration over ClickHouse and chDB - ClickHouse’s official MCP.',
    web: 'https://github.com/ClickHouse/mcp-clickhouse', repo: 'https://github.com/ClickHouse/mcp-clickhouse',
    transport: 'stdio', registry: 'pypi', pkg: 'mcp-clickhouse', runtime: 'uvx', auth: 'api-key', provider: 'ClickHouse', signup: 'https://clickhouse.com/cloud', envName: 'CLICKHOUSE_PASSWORD' },
  { id: 'com.redis/redis-mcp', title: 'Redis', tier: 'builder', cats: ['database', 'data'], tags: ['redis', 'cache', 'vector'], maint: 'official', brand: '#FF4438',
    desc: 'A natural-language interface over Redis strings, hashes, lists, sets, streams, JSON, and vector search - Redis’ official MCP.',
    web: 'https://github.com/redis/mcp-redis', repo: 'https://github.com/redis/mcp-redis',
    transport: 'stdio', registry: 'pypi', pkg: 'redis-mcp-server', runtime: 'uvx', auth: 'api-key', provider: 'Redis', signup: 'https://redis.io/try-free/', envName: 'REDIS_PWD' },
  { id: 'dev.convex/convex-mcp', title: 'Convex', tier: 'builder', cats: ['database', 'developer'], tags: ['convex', 'backend', 'database'], maint: 'official', brand: '#EE342F',
    desc: 'Introspect your deployment, run functions, and read or write data - Convex’s official MCP.',
    web: 'https://docs.convex.dev/ai/convex-mcp-server', repo: 'https://docs.convex.dev/ai/convex-mcp-server',
    transport: 'stdio', registry: 'npm', pkg: 'convex', runtime: 'npx', npmArgs: ['mcp', 'start'], auth: 'none', provider: 'Convex' },
  { id: 'io.pinecone/pinecone-mcp', title: 'Pinecone', tier: 'builder', cats: ['ml', 'database'], tags: ['pinecone', 'vector', 'rag'], maint: 'official', brand: '#1B17F5',
    desc: 'Manage indexes, upsert records, run cascading vector search, and rerank - Pinecone’s official MCP.',
    web: 'https://github.com/pinecone-io/pinecone-mcp', repo: 'https://github.com/pinecone-io/pinecone-mcp',
    transport: 'stdio', registry: 'npm', pkg: '@pinecone-database/mcp', runtime: 'npx', auth: 'api-key', provider: 'Pinecone', signup: 'https://app.pinecone.io', envName: 'PINECONE_API_KEY' },
  { id: 'tech.qdrant/qdrant-mcp', title: 'Qdrant', tier: 'builder', cats: ['ml', 'database'], tags: ['qdrant', 'vector', 'memory'], maint: 'official', brand: '#DC244C',
    desc: 'A semantic-memory layer over Qdrant - store and find by meaning - Qdrant’s official MCP.',
    web: 'https://github.com/qdrant/mcp-server-qdrant', repo: 'https://github.com/qdrant/mcp-server-qdrant',
    transport: 'stdio', registry: 'pypi', pkg: 'mcp-server-qdrant', runtime: 'uvx', auth: 'api-key', provider: 'Qdrant', signup: 'https://cloud.qdrant.io', envName: 'QDRANT_API_KEY' },
  { id: 'ai.trychroma/chroma-mcp', title: 'Chroma', tier: 'builder', cats: ['ml', 'database'], tags: ['chroma', 'vector', 'embeddings'], maint: 'official', brand: '#327EFF',
    desc: 'Collection management plus vector and full-text search over Chroma - the official chroma-mcp server.',
    web: 'https://github.com/chroma-core/chroma-mcp', repo: 'https://github.com/chroma-core/chroma-mcp',
    transport: 'stdio', registry: 'pypi', pkg: 'chroma-mcp', runtime: 'uvx', auth: 'api-key', provider: 'Chroma', signup: 'https://trychroma.com', envName: 'CHROMA_API_KEY' },
  { id: 'com.browserbase/browserbase-mcp', title: 'Browserbase', tier: 'builder', cats: ['automation', 'browser'], tags: ['browserbase', 'browser', 'automation'], maint: 'official', brand: '#FF5A1F',
    desc: 'Drive a cloud headless browser - navigate, act, observe, and extract - via Stagehand. Browserbase’s official hosted MCP.',
    web: 'https://docs.browserbase.com/integrations/mcp/setup', repo: 'https://github.com/browserbase/mcp-server-browserbase',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.browserbase.com/mcp', auth: 'api-key', provider: 'Browserbase', signup: 'https://www.browserbase.com', envName: 'BROWSERBASE_API_KEY' },
  { id: 'io.daytona/daytona-mcp', title: 'Daytona', tier: 'builder', cats: ['developer', 'automation'], tags: ['daytona', 'sandbox', 'code-exec'], maint: 'official', brand: '#3FB950',
    desc: 'Drive Daytona sandboxes - filesystem, git, processes, and code execution - Daytona’s official MCP.',
    web: 'https://www.daytona.io/docs/en/mcp', repo: 'https://www.daytona.io/docs/en/mcp',
    transport: 'stdio', registry: 'npm', pkg: '@daytonaio/cli', runtime: 'npx', npmArgs: ['mcp', 'start'], auth: 'api-key', provider: 'Daytona', signup: 'https://app.daytona.io', envName: 'DAYTONA_API_KEY' },
  { id: 'com.circleci/circleci-mcp', title: 'CircleCI', tier: 'builder', cats: ['devops', 'developer'], tags: ['circleci', 'ci', 'pipelines'], maint: 'official', brand: '#000000',
    desc: 'Analyze build failures, run pipelines, and detect flaky tests - CircleCI’s official MCP.',
    web: 'https://github.com/CircleCI-Public/mcp-server-circleci', repo: 'https://github.com/CircleCI-Public/mcp-server-circleci',
    transport: 'stdio', registry: 'npm', pkg: '@circleci/mcp-server-circleci', runtime: 'npx', auth: 'api-key', provider: 'CircleCI', signup: 'https://app.circleci.com/settings/user/tokens', envName: 'CIRCLECI_TOKEN' },
  { id: 'com.buildkite/buildkite-mcp', title: 'Buildkite', tier: 'builder', cats: ['devops', 'developer'], tags: ['buildkite', 'ci', 'pipelines'], maint: 'official', brand: '#14CC80',
    desc: 'Inspect pipelines, builds, jobs, and test runs - Buildkite’s official hosted MCP.',
    web: 'https://buildkite.com/docs/apis/mcp-server', repo: 'https://buildkite.com/docs/apis/mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.buildkite.com/mcp', auth: 'oauth', provider: 'Buildkite', signup: 'https://buildkite.com' },
  { id: 'co.axiom/axiom-mcp', title: 'Axiom', tier: 'builder', cats: ['observability', 'data'], tags: ['axiom', 'logs', 'apl'], maint: 'official', brand: '#000000',
    desc: 'Query and analyze logs and events with APL - Axiom’s official hosted MCP.',
    web: 'https://axiom.co/docs/console/intelligence/mcp-server', repo: 'https://axiom.co/docs/console/intelligence/mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.axiom.co/mcp', auth: 'oauth', provider: 'Axiom', signup: 'https://app.axiom.co' },
  { id: 'com.upstash/upstash-mcp', title: 'Upstash', tier: 'builder', cats: ['database', 'infrastructure'], tags: ['upstash', 'redis', 'qstash'], maint: 'official', brand: '#00E9A3',
    desc: 'Manage Upstash Redis, QStash, and Workflow resources in natural language - Upstash’s official MCP.',
    web: 'https://github.com/upstash/mcp-server', repo: 'https://github.com/upstash/mcp-server',
    transport: 'stdio', registry: 'npm', pkg: '@upstash/mcp-server', runtime: 'npx', auth: 'api-key', provider: 'Upstash', signup: 'https://console.upstash.com/account/api', envName: 'UPSTASH_API_KEY' },
  { id: 'dev.jam/jam-mcp', title: 'Jam.dev', tier: 'builder', cats: ['developer', 'devops'], tags: ['jam', 'debugging', 'bug-reports'], maint: 'official', brand: '#FF6213',
    desc: 'Pull bug-recording context - console logs, network requests, errors, and video - into your AI tools. Jam’s official hosted MCP.',
    web: 'https://jam.dev/docs/debug-a-jam/mcp', repo: 'https://jam.dev/docs/debug-a-jam/mcp',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.jam.dev/mcp', auth: 'oauth', provider: 'Jam.dev', signup: 'https://jam.dev' },

  // ── Business / fintech / marketing / productivity ──────────────
  { id: 'com.paypal/paypal-mcp', title: 'PayPal', tier: 'worker', cats: ['payments', 'sales'], tags: ['paypal', 'payments', 'invoices'], maint: 'official', brand: '#003087',
    desc: 'Create and manage invoices, transactions, subscriptions, disputes, and orders - PayPal’s official hosted MCP.',
    web: 'https://docs.paypal.ai/developer/tools/ai/mcp-quickstart', repo: 'https://docs.paypal.ai/developer/tools/ai/mcp-quickstart',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.paypal.com/mcp', auth: 'oauth', provider: 'PayPal', signup: 'https://www.paypal.com' },
  { id: 'com.squareup/square-mcp', title: 'Square', tier: 'worker', cats: ['payments', 'sales'], tags: ['square', 'payments', 'pos'], maint: 'official', brand: '#000000',
    desc: 'Payments, customers, inventory, bookings, and catalog across the full Square API - Square’s official hosted MCP.',
    web: 'https://github.com/square/square-mcp-server', repo: 'https://github.com/square/square-mcp-server',
    transport: 'remote', rtype: 'sse', url: 'https://mcp.squareup.com/sse', auth: 'oauth', provider: 'Square', signup: 'https://squareup.com' },
  { id: 'com.canva/canva-mcp', title: 'Canva', tier: 'worker', cats: ['design', 'media'], tags: ['canva', 'design', 'templates'], maint: 'official', brand: '#00C4CC',
    desc: 'Create and edit designs with Canva AI, autofill brand templates, manage assets, and export to PDF, image, or video - Canva’s official hosted MCP.',
    web: 'https://www.canva.dev/docs/mcp/', repo: 'https://www.canva.dev/docs/mcp/',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.canva.com/mcp', auth: 'oauth', provider: 'Canva', signup: 'https://www.canva.com' },
  { id: 'com.plaid/plaid-mcp', title: 'Plaid', tier: 'builder', cats: ['payments', 'data'], tags: ['plaid', 'fintech', 'diagnostics'], maint: 'official', brand: '#000000',
    desc: 'Debug Items, inspect Item health and Link conversion, and read usage analytics - Plaid’s official Dashboard MCP.',
    web: 'https://plaid.com/docs/resources/mcp/', repo: 'https://plaid.com/docs/resources/mcp/',
    transport: 'remote', rtype: 'streamable-http', url: 'https://api.dashboard.plaid.com/mcp', auth: 'oauth', provider: 'Plaid', signup: 'https://dashboard.plaid.com' },
  { id: 'com.webflow/webflow-mcp', title: 'Webflow', tier: 'worker', cats: ['design', 'productivity'], tags: ['webflow', 'cms', 'website'], maint: 'official', brand: '#146EF5',
    desc: 'Read and write site data, CMS collections and schemas, and generate code - Webflow’s official hosted MCP.',
    web: 'https://developers.webflow.com/mcp/reference/getting-started', repo: 'https://github.com/webflow/mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.webflow.com/mcp', auth: 'oauth', provider: 'Webflow', signup: 'https://webflow.com' },
  { id: 'com.resend/resend-mcp', title: 'Resend', tier: 'worker', cats: ['communication', 'productivity'], tags: ['resend', 'email', 'transactional'], maint: 'official', brand: '#000000',
    desc: 'Send emails and manage contacts, broadcasts, domains, and webhooks - Resend’s official MCP.',
    web: 'https://resend.com/docs/mcp-server', repo: 'https://github.com/resend/resend-mcp',
    transport: 'stdio', registry: 'npm', pkg: 'resend-mcp', runtime: 'npx', auth: 'api-key', provider: 'Resend', signup: 'https://resend.com/api-keys', envName: 'RESEND_API_KEY' },
  { id: 'com.customerio/customerio-mcp', title: 'Customer.io', tier: 'worker', cats: ['communication', 'sales'], tags: ['customerio', 'marketing', 'segments'], maint: 'official', brand: '#7131FF',
    desc: 'Build segments from real customer data, inspect profiles and journeys, and search campaigns - Customer.io’s official hosted MCP.',
    web: 'https://docs.customer.io/ai/mcp/get-started/', repo: 'https://docs.customer.io/ai/mcp/get-started/',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.customer.io/mcp', auth: 'oauth', provider: 'Customer.io', signup: 'https://fly.customer.io' },
  { id: 'com.twilio/twilio-mcp', title: 'Twilio', tier: 'worker', cats: ['communication'], tags: ['twilio', 'sms', 'voice'], maint: 'official', brand: '#F22F46',
    desc: 'Send SMS, place calls, and reach the full Twilio API surface - Twilio Alpha’s official MCP.',
    web: 'https://github.com/twilio-labs/mcp', repo: 'https://github.com/twilio-labs/mcp',
    transport: 'stdio', registry: 'npm', pkg: '@twilio-alpha/mcp', runtime: 'npx', auth: 'api-key', provider: 'Twilio', signup: 'https://console.twilio.com', envName: 'TWILIO_CREDENTIALS' },
  { id: 'com.dropbox/dropbox-mcp', title: 'Dropbox', tier: 'worker', cats: ['files-and-docs', 'productivity'], tags: ['dropbox', 'files', 'storage'], maint: 'official', brand: '#0061FF',
    desc: 'Browse, search, and read your Dropbox files and folders - Dropbox’s official hosted MCP (beta).',
    web: 'https://help.dropbox.com/integrations/connect-dropbox-mcp-server', repo: 'https://help.dropbox.com/integrations/connect-dropbox-mcp-server',
    transport: 'remote', rtype: 'streamable-http', url: 'https://mcp.dropbox.com/mcp', auth: 'oauth', provider: 'Dropbox', signup: 'https://www.dropbox.com' },
  { id: 'com.typeform/typeform-mcp', title: 'Typeform', tier: 'worker', cats: ['productivity', 'sales'], tags: ['typeform', 'forms', 'surveys'], maint: 'official', brand: '#262627',
    desc: 'Read your forms and read or write contacts - Typeform’s official hosted MCP (beta).',
    web: 'https://www.typeform.com/developers/get-started/mcp/', repo: 'https://www.typeform.com/developers/get-started/mcp/',
    transport: 'remote', rtype: 'streamable-http', url: 'https://api.typeform.com/mcp', auth: 'api-key', provider: 'Typeform', signup: 'https://admin.typeform.com/account#/section/tokens', envName: 'TYPEFORM_TOKEN' },
  { id: 'io.coda/coda-mcp', title: 'Coda', tier: 'worker', cats: ['productivity', 'knowledge'], tags: ['coda', 'docs', 'tables'], maint: 'official', brand: '#F46A54',
    desc: 'Read and write Coda docs, tables, rows, and formulas in natural language - Coda’s official hosted MCP (beta).',
    web: 'https://help.coda.io/hc/en-us/articles/44722661982989', repo: 'https://help.coda.io/hc/en-us/articles/44722661982989',
    transport: 'remote', rtype: 'streamable-http', url: 'https://coda.io/apis/mcp', auth: 'api-key', provider: 'Coda', signup: 'https://coda.io/account', envName: 'CODA_API_TOKEN' },
];

// ---- emitters -------------------------------------------------------------
function buildEntry(d) {
  const file = slug(d.id);
  const isRemote = d.transport === 'remote';
  const packages = [];
  const remotes = [];
  if (isRemote) {
    remotes.push({ type: d.rtype, url: d.url });
  } else {
    const env = [];
    if (d.auth === 'api-key' && d.envName) {
      env.push({ name: d.envName, description: `${d.provider} API key`, isRequired: true, isSecret: true });
    }
    packages.push({
      registryType: d.registry,
      identifier: d.pkg,
      version: 'latest',
      runtimeHint: d.runtime,
      transport: { type: 'stdio' },
      ...(env.length ? { environmentVariables: env } : {}),
    });
  }
  const authMethod = d.auth === 'oauth' ? 'oauth2-byo' : d.auth; // none | api-key | oauth2-byo
  const auth = { method: authMethod };
  if (d.provider) auth.providerName = d.provider;
  if (d.signup) auth.providerSignupUrl = d.signup;
  if (d.header) auth.header = d.header;

  const stepCount = d.auth === 'none' ? 1 : 2;
  const estMin = d.auth === 'none' ? 1 : 2;

  const entry = {
    $schema: '../schema/entry.schema.json',
    name: d.id,
    title: d.title,
    description: d.desc,
    version: '1.0.0',
    websiteUrl: d.web,
    repository: { url: d.repo, source: d.repo.includes('github.com') ? 'github' : 'other' },
    packages,
    remotes,
    'x-wayland': {
      tier: d.tier,
      categories: d.cats,
      tags: d.tags,
      maintainerType: d.maint,
      license: d.maint === 'official' ? 'Proprietary' : 'MIT',
      verifiedAt: TODAY,
      verifiedBy: 'Wayland',
      popularityRank: d._rank,
      installRate: 0.0,
      iconUrl: `icons/${file}.svg`,
      brand: { logoBackground: '#ffffff', logoForeground: d.brand },
      auth,
      setupGuide: { path: `guides/${file}.md`, estimatedMinutes: estMin, stepCount },
      platforms: ['macos', 'windows', 'linux'],
      minWaylandVersion: '0.9.0',
    },
  };
  return { file, entry };
}

function buildGuide(d, file) {
  const isRemote = d.transport === 'remote';
  const fence = '`';
  const target = isRemote ? `the hosted MCP at ${fence}${d.url}${fence}` : `${fence}${d.runtime} ${d.pkg}${fence} on first launch`;
  const steps = [];
  steps.push({
    id: 'install',
    title: isRemote ? 'Connect to the hosted MCP server' : 'Install the MCP server',
    autoCompletedByInstall: true,
    body: isRemote
      ? `Wayland connects to ${target} - nothing runs locally.${d.auth === 'none' ? ' No sign-in required.' : ''}`
      : `Wayland runs ${target} - no manual install needed.${d.auth === 'none' ? ' No key required.' : ''}`,
  });
  if (d.auth === 'oauth') {
    steps.push({
      id: 'oauth',
      title: `Sign in with ${d.provider}`,
      primaryAction: { label: `Sign in with ${d.provider}`, action: 'oauth-flow' },
      body: `Click **Sign in with ${d.provider}** and approve access. That is the whole setup - no app registration, no client secrets. Your tools come online as soon as it authorizes.`,
    });
  } else if (d.auth === 'api-key') {
    const headerNote = d.header
      ? `It is sent in the ${fence}${d.header}${fence} header.`
      : `It is sent as a ${fence}Bearer${fence} token.`;
    steps.push({
      id: 'api-key',
      title: `Paste your ${d.provider} ${isRemote ? 'API key' : 'key'}`,
      externalAction: { label: `Get a ${d.provider} key`, url: d.signup },
      inputs: [{ name: d.envName || 'API_KEY', label: `${d.provider} API key`, secret: true }],
      primaryAction: { label: 'Save & connect', action: 'api-key-save' },
      body: `1. Click **Get a ${d.provider} key** above and copy your key.\n2. Paste it in the field above and click **Save & connect**.\n\n${headerNote} Wayland tests the connection before enabling it.`,
    });
  }

  const yaml = [
    '---',
    'guideVersion: 1.0.0',
    `estimatedMinutes: ${d.auth === 'none' ? 1 : 2}`,
    'steps:',
  ];
  for (const s of steps) {
    yaml.push(`  - id: ${s.id}`);
    yaml.push(`    title: ${JSON.stringify(s.title)}`);
    if (s.autoCompletedByInstall) yaml.push('    autoCompletedByInstall: true');
    if (s.externalAction) yaml.push(`    externalAction: { label: ${JSON.stringify(s.externalAction.label)}, url: ${JSON.stringify(s.externalAction.url)} }`);
    if (s.inputs) yaml.push(`    inputs:\n      - { name: ${s.inputs[0].name}, label: ${JSON.stringify(s.inputs[0].label)}, secret: true }`);
    if (s.primaryAction) yaml.push(`    primaryAction: { label: ${JSON.stringify(s.primaryAction.label)}, action: ${JSON.stringify(s.primaryAction.action)} }`);
    yaml.push('    body: |');
    for (const line of s.body.split('\n')) yaml.push(`      ${line}`);
  }
  yaml.push('---', '', `# ${d.title} setup`, '', d.desc, '');
  return yaml.join('\n');
}

function buildCatalogRow(d, file) {
  return {
    id: d.id,
    name: d.title,
    shortDescription: d.desc,
    iconUrl: `icons/${file}.svg`,
    tier: d.tier,
    categories: d.cats,
    maintainerType: d.maint,
    verifiedByWayland: TODAY,
    popularityRank: d._rank,
    installRate: 0.0,
    entryUrl: `entries/${file}.json`,
    guideUrl: `guides/${file}.md`,
  };
}

// ---- run ------------------------------------------------------------------
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const existing = new Set(catalog.entries.map((e) => e.id));
// Twilio / Upstash / DigitalOcean were re-added via gen-mcp-held-connectors.mjs
// once PackageRef.runtimeArguments landed. Still held here:
//  - Convex: MCP runs against a local Convex PROJECT dir, not a global install.
//  - Daytona: needs an interactive `daytona login` before `mcp start`.
const EXCLUDE = new Set([
  'dev.convex/convex-mcp',
  'io.daytona/daytona-mcp',
]);
let rank = 100;
let added = 0;
const newRows = [];
for (const d of DATA) {
  if (EXCLUDE.has(d.id)) { console.log('EXCLUDE (needs runtime args)', d.id); continue; }
  if (existing.has(d.id)) { console.log('SKIP existing', d.id); continue; }
  d._rank = rank++;
  const { file, entry } = buildEntry(d);
  fs.writeFileSync(path.join(ENTRIES, `${file}.json`), JSON.stringify(entry, null, 2) + '\n');
  fs.writeFileSync(path.join(GUIDES, `${file}.md`), buildGuide(d, file));
  newRows.push(buildCatalogRow(d, file));
  added++;
}
catalog.entries.push(...newRows);
fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
console.log(`Added ${added} entries. Catalog now ${catalog.entries.length}.`);
console.log('Icon slugs needed:', DATA.map((d) => slug(d.id)).join(' '));
