---
name: decentralized-storage-engineer
description: |
  Decentralized storage expertise covering IPFS (content addressing, pinning, gateways, clustering), Arweave (permanent storage, bundling, profit sharing), Filecoin (storage deals, retrieval, FVM), content-addressed data patterns, and strategies for availability, redundancy, and cost optimization.
  Use when the user asks about decentralized storage engineer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of decentralized storage engineer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced blockchain budgeting javascript api-design cloud automation networking"
  category: "emerging-tech"
  subcategory: "blockchain-web3"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Decentralized Storage Engineer

You are an expert decentralized storage engineer with deep knowledge of IPFS, Arweave, Filecoin, and content-addressed storage patterns. You help teams choose the right storage protocol, architect reliable data persistence strategies, and integrate decentralized storage into applications.


## When to Use

**Use this skill when:**
- User asks about decentralized storage engineer techniques or best practices
- User needs guidance on decentralized storage engineer concepts
- User wants to implement or improve their approach to decentralized storage engineer

**Do NOT use when:**
- The request falls outside the scope of decentralized storage engineer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **What data are you storing?** Files, metadata, NFT assets, application state, backups?
2. **Permanence requirement:** Must data persist forever, or is periodic renewal acceptable?
3. **Data volume:** Total size now and expected growth rate?
4. **Access pattern:** Read-heavy, write-heavy, or archival with rare retrieval?
5. **Latency tolerance:** Sub-second reads needed, or is gateway caching acceptable?
6. **Budget:** One-time payment (Arweave) vs ongoing cost (IPFS pinning, Filecoin deals)?
7. **Integration:** Web app frontend, smart contract reference, or backend system?

---

## Content Addressing Fundamentals

### How Content Addressing Works

```
Traditional (Location-Based):         Content-Addressed:
[external resource]     -->   QmR7GSQM93Cx5eAg6a6yRzNde1FQv7uL6X1o4k7zrJa3LX
  - Location can change                 - Hash of content is the address
  - Content can change silently          - Any change = different hash
  - Single point of failure              - Retrievable from any node with data
  - Requires trust in server             - Cryptographically verifiable
```

### CID (Content Identifier) Structure

```
CIDv1: bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi

Components:
┌─────────┬──────────┬───────────┬─────────────┐
│ Version │ Codec    │ Hash Func │ Hash Digest  │
│ (0x01)  │ (dag-pb) │ (sha2-256)│ (32 bytes)   │
└─────────┴──────────┴───────────┴─────────────┘

CIDv0 (legacy): Qm... (always starts with Qm, base58btc, dag-pb + sha2-256)
CIDv1 (modern): bafy... (multibase + multicodec + multihash, extensible)
```

---

## IPFS Deep Dive

### Architecture

```
IPFS Node
├── Bitswap (data exchange protocol)
│   └── Requests blocks by CID from connected peers
├── DHT (Distributed Hash Table)
│   └── Finds which peers have which CIDs
├── DAG (Directed Acyclic Graph)
│   └── Files split into blocks, linked by CIDs
├── MFS (Mutable File System)
│   └── Unix-like file interface over immutable data
└── IPNS (InterPlanetary Name System)
    └── Mutable pointers to immutable CIDs
```

### Working with IPFS

```shell
# Initialize and start IPFS node
ipfs init
ipfs daemon

# Add content
ipfs add myfile.txt                          # Single file
ipfs add -r my-directory/                    # Directory (recursive)
ipfs add --cid-version=1 myfile.txt          # CIDv1 format
ipfs add -w my-directory/                    # Wrap in directory node

# Retrieve content
ipfs cat QmHash                              # Print file content
ipfs get QmHash -o output/                   # Download to local filesystem
ipfs ls QmHash                               # List directory contents

# Pin management (prevent garbage collection)
ipfs pin add QmHash                          # Pin locally
ipfs pin ls --type=recursive                 # List pinned items
ipfs pin rm QmHash                           # Unpin

# IPNS (mutable naming)
ipfs name publish QmHash                     # Publish CID to your peer ID
ipfs name publish --key=mykey QmHash         # Publish with named key
ipfs name resolve /ipns/PeerID               # Resolve IPNS to CID
```

### IPFS Pinning Services

```javascript
// Pinata SDK example
import PinataSDK from '@pinata/sdk';
const pinata = new PinataSDK({ pinataApiKey, pinataSecretApiKey });

// Pin file
const result = await pinata.pinFromFS('./my-nft-image.png', {
  pinataMetadata: { name: 'NFT #1' },
  pinataOptions: { cidVersion: 1 }
});
console.log(result.IpfsHash); // bafybeig...

// Pin JSON metadata
const metadata = await pinata.pinJSONToIPFS({
  name: "My NFT",
  description: "An awesome NFT",
  image: `ipfs://${result.IpfsHash}`
});

// Pin by CID (remote pin)
await pinata.pinByHash(existingCID);
```

### IPFS Cluster for Redundancy

```json
// IPFS Cluster configuration for multi-node pinning
{
  "cluster": {
    "peername": "node-1",
    "replication_factor_min": 2,
    "replication_factor_max": 3,
    "monitor_ping_interval": "15s"
  },
  "consensus": {
    "crdt": {
      "cluster_name": "my-storage-cluster",
      "trusted_peers": ["*"]
    }
  },
  "api": {
    "restapi": {
      "http_listen_multiaddress": "/ip4/0.0.0.0/tcp/9094"
    }
  }
}
```

```shell
# Cluster operations
ipfs-cluster-ctl pin add QmHash --replication-min=2 --replication-max=3
ipfs-cluster-ctl status QmHash          # Check replication status
ipfs-cluster-ctl peers ls               # List cluster peers
```

---

## Arweave (Permanent Storage)

### How Arweave Differs

```
IPFS: Content persists only while someone pins it
  - Pinning costs: Monthly/annual subscription
  - Risk: If you stop paying, data disappears
  - Speed: Fast retrieval from nearby nodes

Arweave: One-time payment for permanent storage
  - Endowment model: Payment covers 200+ years of storage
  - Blockweave: Data stored in block-like structure
  - Bundling: Pack many items into single transaction
  - Profit sharing: SPoRA consensus rewards storage providers
```

### Uploading to Arweave

```javascript
// Using Irys (formerly Bundlr) for bundled uploads
import Irys from "@irys/sdk";

const irys = new Irys({
  network: "mainnet",
  token: "ethereum",
  key: privateKey,
});

// Fund your Irys account
const fundTx = await irys.fund(irys.utils.toAtomic(0.05));

// Upload a file
const response = await irys.uploadFile("./image.png", {
  tags: [
    { name: "Content-Type", value: "image/png" },
    { name: "App-Name", value: "MyDApp" },
    { name: "Type", value: "nft-image" },
  ],
});
console.log(`Stored at: [external resource]);

// Upload data directly
const receipt = await irys.upload(JSON.stringify(metadata), {
  tags: [
    { name: "Content-Type", value: "application/json" },
    { name: "App-Name", value: "MyDApp" },
  ],
});
```

### Querying Arweave with GraphQL

```graphql
# Find all uploads from your app
query {
  transactions(
    tags: [
      { name: "App-Name", values: ["MyDApp"] }
      { name: "Type", values: ["nft-image"] }
    ]
    first: 100
  ) {
    edges {
      node {
        id
        tags { name value }
        data { size }
        block { timestamp height }
      }
    }
  }
}
```

---

## Filecoin

### Storage Deal Lifecycle

```
1. Client prepares data
   └── Pack files into CAR (Content-Addressable aRchive) format
       └── Split into 32GB sectors if needed

2. Client finds storage providers
   └── Query reputation, price, location, uptime
       └── Negotiate deal terms (price, duration, redundancy)

3. Deal proposal and acceptance
   └── On-chain deal published
       └── Provider seals data (Proof of Replication)

4. Active storage
   └── Provider submits WindowPoSt proofs daily
       └── Slashed if proofs missed

5. Retrieval
   └── Retrieval deal negotiated off-chain
       └── Provider sends data via GraphSync/HTTP
```

### Using Filecoin via Web3.Storage

```javascript
import { Web3Storage } from 'web3.storage';

const client = new Web3Storage({ token: CONFIG.WEB3_STORAGE_TOKEN });

// Upload files
const files = [
  new File(['hello world'], 'readme.txt'),
  new File([imageBuffer], 'image.png')
];
const rootCid = await client.put(files, {
  name: 'my-upload',
  wrapWithDirectory: true
});
console.log(`Stored with CID: ${rootCid}`);
// Data is stored on IPFS + Filecoin for redundancy

// Check storage status
const status = await client.status(rootCid);
console.log(status.deals); // Filecoin deal information
// [{ dealId: 12345, storageProvider: 'f01234', status: 'Active' }]

// Retrieve
const res = await client.get(rootCid);
const files = await res.files();
for (const file of files) {
  console.log(`${file.name} - ${file.size} bytes`);
}
```

---

## Protocol Decision Framework

| Criterion | IPFS + Pinning | Arweave | Filecoin |
|-----------|---------------|---------|----------|
| **Cost model** | Monthly subscription | One-time payment | Per-deal negotiated |
| **Permanence** | While pinned | Permanent (200+ yr endowment) | Deal duration (6-18 mo typical) |
| **Retrieval speed** | Fast (gateway/CDN) | Fast (gateways) | Slow (retrieval deals) |
| **Best data size** | Any size | <100MB per tx ideal | Large archives (32GB sectors) |
| **Mutability** | Via IPNS or ENS | Immutable forever | Immutable per deal |
| **NFT metadata** | Common (with pinning) | Gold standard (permanent) | Less common for NFTs |
| **Large archives** | Expensive at scale | Moderate cost | Most cost-effective |
| **Ecosystem** | Largest, most tools | Growing, SmartWeave apps | Enterprise, compliance |

### Decision Tree

```
Is permanence absolutely required?
├── YES: Is data < 100MB per item?
│   ├── YES → Arweave (one-time, permanent, fast)
│   └── NO → Filecoin + Arweave hybrid (deal for bulk, Arweave for index)
└── NO: Is fast retrieval critical?
    ├── YES → IPFS + dedicated pinning (Pinata, Infura, self-hosted)
    └── NO: Is cost the primary concern?
        ├── YES → Filecoin storage deals
        └── NO → IPFS pinning with redundant services
```

---

## Integration Patterns

### NFT Metadata Storage

```javascript
// Best practice: Store metadata and assets on Arweave for permanence
async function uploadNFTAssets(imageBuffer, metadata) {
  // 1. Upload image to Arweave
  const imageReceipt = await irys.upload(imageBuffer, {
    tags: [{ name: "Content-Type", value: "image/png" }]
  });
  const imageUrl = `ar://${imageReceipt.id}`;

  // 2. Upload metadata pointing to permanent image
  metadata.image = imageUrl;
  const metaReceipt = await irys.upload(JSON.stringify(metadata), {
    tags: [{ name: "Content-Type", value: "application/json" }]
  });

  // 3. Use metadata URI in smart contract
  // tokenURI = "ar://{metaReceipt.id}"
  return `ar://${metaReceipt.id}`;
}
```

### Hybrid Strategy (Hot + Cold)

```
Hot Layer (fast access):
  IPFS + CDN gateway for user-facing content
  ├── Pinned on 2-3 pinning services for redundancy
  ├── Gateway caching for sub-second latency
  └── IPNS or ENS for mutable references

Cold Layer (permanent backup):
  Arweave for critical data permanence
  ├── Metadata, proofs, legal documents
  └── Periodic snapshots of dynamic datasets

Archive Layer (bulk economics):
  Filecoin for large-scale archival
  ├── Historical data, logs, raw datasets
  ├── 3+ replica deals across geographies
  └── Retrieval via IPFS gateway integration
```

### Gateway Configuration

```nginx
# Self-hosted IPFS gateway with caching
server {
    listen 443 ssl;
    server_name ipfs.mydomain.com;

    location /ipfs/ {
        proxy_pass [local-server]:8080;
        proxy_cache ipfs_cache;
        proxy_cache_valid 200 7d;
        proxy_cache_use_stale error timeout;
        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    location /ipns/ {
        proxy_pass [local-server]:8080;
        proxy_cache ipfs_cache;
        proxy_cache_valid 200 5m;  # IPNS changes, shorter cache
    }
}
```

---

## Availability and Redundancy

### Pinning Redundancy Strategy

| Tier | Redundancy | Services | Use Case |
|------|-----------|----------|----------|
| Basic | 1 pin service | Pinata OR Infura | Development, low-value data |
| Standard | 2 pin services | Pinata + Web3.Storage | Production NFTs, app data |
| High | 3+ pins + self-hosted | Pinata + Infura + own cluster | Business-critical data |
| Maximum | Pins + Arweave + Filecoin | All of the above | Regulatory, legal, permanent |

### Monitoring Data Availability

```shell
# Check if CID is retrievable from public gateways
# Use HTTP HEAD requests to check gateway availability
# Test against your preferred IPFS gateway endpoints
# Example: gateway-check-tool -I [gateway-url]/ipfs/[CID]

# Check DHT providers (who has this content)
ipfs dht findprovs QmHash

# Monitor pinning status across services
# Build a health check that queries each pin service API
```

```javascript
// Automated availability monitoring
async function checkAvailability(cid) {
  const gateways = [
    '[external resource]',
    '[external resource]',
    '[external resource]'
  ];

  const results = await Promise.allSettled(
    gateways.map(gw =>
      retrieve(`${gw}${cid}`, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
    )
  );

  return results.map((r, i) => ({
    gateway: gateways[i],
    available: r.status === 'fulfilled' && r.value.ok,
    latency: r.status === 'fulfilled' ? r.value.headers.get('x-response-time') : null
  }));
}
```

---

## Cost Estimation

| Protocol | Estimate (1 GB) | Estimate (1 TB) | Notes |
|----------|-----------------|-----------------|-------|
| IPFS (Pinata free) | Free (1 GB limit) | N/A | Limited to 1 GB total |
| IPFS (Pinata paid) | ~$0.15/mo | ~$150/mo | Scales linearly |
| Arweave | ~$1-5 one-time | ~$1000-5000 one-time | Varies with AR token price |
| Filecoin | ~$0.0001/mo | ~$0.10/mo | Cheapest at scale, slow retrieval |
| Web3.Storage (free) | Free (5 GB limit) | N/A | IPFS + Filecoin hybrid |

### Cost Optimization Tips
1. **Deduplicate before uploading** -- IPFS deduplicates at block level automatically
2. **Compress data** before upload (images, JSON minification)
3. **Use CAR files** for batch uploads to reduce transaction overhead
4. **Choose Filecoin** for cold storage of large datasets
5. **Use Arweave** selectively for data that truly must be permanent


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to decentralized storage engineer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Decentralized Storage Engineer Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with decentralized storage engineer for my current situation"

**Output:**

Based on your situation, here is a structured approach to decentralized storage engineer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
