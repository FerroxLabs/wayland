---
guideVersion: 1.1.0
estimatedMinutes: 3
steps:
  - id: install
    title: Install the MCP server
    estSeconds: 30
    autoCompletedByInstall: true
    body: |
      Wayland installs `@elastic/mcp-server-elasticsearch` from npm via `npx`
      on first launch - no manual install needed. If the server fails to
      start later, reinstall from this page.
  - id: credentials
    title: Paste your Elasticsearch URL and API key
    estSeconds: 150
    externalAction: { label: "Open Elastic Cloud", url: "https://cloud.elastic.co" }
    inputs:
      - { name: ES_URL, label: "Elasticsearch URL" }
      - { name: ES_API_KEY, label: "Elasticsearch API key", secret: true }
    warning: |
      Scope the API key to the **minimum index privileges** Wayland needs -
      typically `read` and `view_index_metadata`. Don't reuse a superuser key.
      For local dev clusters with self-signed certs, set
      `ES_SSL_SKIP_VERIFY=true` (development only).
    body: |
      Works with Elastic Cloud, self-hosted Elasticsearch, or a local
      `docker run elasticsearch`. You'll grab a deployment URL and create a
      scoped API key.

      **A. Get your Elasticsearch URL** (≈ 30 sec)

      1. Click **Open Elastic Cloud** above and sign in.
      2. Open your deployment from the **Deployments** list.
      3. On the deployment overview, copy the **Elasticsearch endpoint** -
         it looks like `https://<deployment>.es.<region>.gcp.cloud.es.io:9243`
         or `https://<deployment>.es.<region>.aws.elastic-cloud.com:9243`.
      4. Paste it as `ES_URL` above. Self-hosted? Use your own
         `https://host:9200` endpoint.

      **B. Create a scoped API key** (≈ 90 sec)

      1. From the deployment overview, click **Open Kibana**.
      2. In Kibana, open the global search (top bar) and search for
         **API keys**. Pick the **API keys** management page (under
         **Stack Management → Security → API keys**).
      3. Click **Create API key**. Name it `wayland-mcp`.
      4. Under **Restrict privileges**, paste a role descriptor like:
         ```json
         { "wayland": { "indices": [{ "names": ["*"], "privileges": ["read","view_index_metadata"] }] } }
         ```
         Tighten `names` to specific indices if you can.
      5. Click **Create API key**. Copy the **Encoded** value - Kibana shows
         it only once. Paste it as `ES_API_KEY` above.

         If you only have raw `id` and `api_key` (e.g. from the REST API),
         base64-encode `id:api_key` yourself and paste that.
---

# Elasticsearch setup

Connects Wayland to any Elasticsearch cluster - Elastic Cloud, self-hosted,
or local. Read-only API keys are strongly recommended.
