---
name: nft-strategist
description: |
  Non-fungible token expertise covering creation workflows, metadata standards (ERC-721, ERC-1155), marketplace selection, smart contract design patterns, utility and roadmap design, IPFS and on-chain storage, royalty enforcement, community building, and launch strategy for digital collectibles and utility NFTs.
  Use when the user asks about nft strategist, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of nft strategist or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced blockchain budgeting checklist javascript analysis game-design performing-arts"
  category: "emerging-tech"
  subcategory: "blockchain-web3"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# NFT Strategist

You are an expert in non-fungible token strategy, covering the full lifecycle from concept and creation through smart contract development, marketplace selection, launch execution, and long-term utility design.

> **IMPORTANT DISCLAIMER:** This skill provides educational information about NFTs and digital assets only. It is NOT financial or investment advice. NFT markets are highly speculative and volatile. Most NFT projects lose significant value over time. Never invest more than you can afford to lose completely. This skill does not endorse any specific NFT project or marketplace.


## When to Use

**Use this skill when:**
- User asks about nft strategist techniques or best practices
- User needs guidance on nft strategist concepts
- User wants to implement or improve their approach to nft strategist

**Do NOT use when:**
- The request falls outside the scope of nft strategist
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Project type:** Art collection, utility/membership, gaming assets, music/media, or real-world asset tokenization?
2. **Collection size:** 1-of-1 art, small collection (100-1,000), large generative (5,000-10,000), or open edition?
3. **Target chain:** Ethereum (highest prestige, highest gas), Base/Arbitrum/Optimism (low gas, growing ecosystem), Polygon, Solana?
4. **Art/content ready?** Do you have artwork or need guidance on creation pipelines?
5. **Technical skill:** Can you write Solidity, or do you need no-code tools?
6. **Budget:** How much can you invest in development, art, and marketing?
7. **Goals:** Creative expression, community building, revenue generation, or utility delivery?

---

## NFT Token Standards

### ERC-721 (Standard NFT)

Each token is unique with its own token ID. Best for 1-of-1 art and collections where every item is distinct.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MyNFTCollection is ERC721, ERC2981, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 5000;
    uint256 public constant MINT_PRICE = 0.05 ether;
    uint256 public constant MAX_PER_WALLET = 3;

    uint256 private _nextTokenId;
    string private _baseTokenURI;
    bool public mintActive;

    mapping(address => uint256) public mintCount;

    error MintNotActive();
    error ExceedsMaxSupply();
    error ExceedsWalletLimit();
    error InsufficientPayment();
    error WithdrawFailed();

    constructor(
        string memory baseURI,
        address royaltyReceiver
    ) ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
        _setDefaultRoyalty(royaltyReceiver, 500); // 5% royalty
    }

    function mint(uint256 quantity) external payable {
        if (!mintActive) revert MintNotActive();
        if (_nextTokenId + quantity > MAX_SUPPLY) revert ExceedsMaxSupply();
        if (mintCount[msg.sender] + quantity > MAX_PER_WALLET) revert ExceedsWalletLimit();
        if (msg.value < MINT_PRICE * quantity) revert InsufficientPayment();

        mintCount[msg.sender] += quantity;
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(msg.sender, _nextTokenId++);
        }
    }

    function tokenURI(uint256 tokenId) public view supersede returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(_baseTokenURI, tokenId.toString(), ".json");
    }

    function setMintActive(bool active) external onlyOwner {
        mintActive = active;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        if (!success) revert WithdrawFailed();
    }

    // Required supersede for ERC2981 + ERC721
    function supportsInterface(bytes4 interfaceId)
        public view supersede(ERC721, ERC2981) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

### ERC-1155 (Multi-Token)

Supports both fungible and non-fungible tokens in a single contract. Best for gaming items, editions, and mixed collections.

```solidity
// Use cases for ERC-1155:
// - Gaming: 1000 copies of "Iron Sword" (semi-fungible)
// - Music: 500 edition prints of an album
// - Membership tiers: Gold (100 copies), Silver (500 copies), Bronze (unlimited)
// - Reduced gas for batch operations

// Key difference from ERC-721:
// ERC-721:  tokenId -> single owner
// ERC-1155: tokenId -> mapping(address -> balance)
//           Token ID 1 could have 500 copies across many wallets
```

### Standard Comparison

| Feature | ERC-721 | ERC-1155 |
|---------|---------|----------|
| Uniqueness | Each token unique | Tokens can have multiple copies |
| Gas (single transfer) | Higher | Lower |
| Gas (batch transfer) | N separate transactions | Single transaction |
| Marketplace support | Universal | Universal |
| Metadata | Per-token URI | Per-token-type URI |
| Best for | PFP collections, 1-of-1 art | Gaming, editions, multi-tier |

---

## Metadata Standards

NFT metadata follows a JSON schema that marketplaces use to display your NFTs.

### Standard Metadata Schema

```json
{
  "name": "My NFT #1",
  "description": "A detailed description of this specific NFT.",
  "image": "ipfs://QmXxx.../1.png",
  "external_url": "[external resource]",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    },
    {
      "trait_type": "Power Level",
      "display_type": "number",
      "value": 85
    },
    {
      "trait_type": "Generation",
      "display_type": "number",
      "value": 1,
      "max_value": 5
    },
  ]
}
```

### Metadata Storage Options

| Storage Method | Permanence | Cost | Speed | Best For |
|---------------|------------|------|-------|----------|
| IPFS + Pinning (Pinata, nft.storage) | Semi-permanent (depends on pinning) | Low ($0-20/month) | Fast | Most projects |
| Arweave | Permanent (200+ year guarantee) | One-time payment (~$0.01/KB) | Moderate | High-value, permanent collections |
| On-chain (SVG/base64) | Permanent (lives on blockchain) | High gas cost | Fastest | Small files, generative art |
| Centralized server | Impermanent (server dependent) | Varies | Fastest | NOT recommended for valuable NFTs |

### IPFS Upload Workflow

```javascript
// Using Pinata SDK for IPFS uploads
import PinataSDK from "@pinata/sdk";

const pinata = new PinataSDK({
  pinataApiKey: CONFIG.PINATA_API_KEY,
  pinataSecretApiKey: CONFIG.PINATA_SECRET_KEY,
});

// 1. Upload images first
async function uploadImages(imageDir) {
  const result = await pinata.pinFromFS(imageDir, {
    pinataMetadata: { name: "my-nft-images" },
  });
  return result.IpfsHash; // e.g., "QmXxx..."
}

// 2. Generate metadata JSONs pointing to image CIDs
function generateMetadata(tokenId, imageCID, attributes) {
  return {
    name: `My NFT #${tokenId}`,
    description: "Collection description here.",
    image: `ipfs://${imageCID}/${tokenId}.png`,
    attributes: attributes,
  };
}

// 3. Upload metadata directory
async function uploadMetadata(metadataDir) {
  const result = await pinata.pinFromFS(metadataDir, {
    pinataMetadata: { name: "my-nft-metadata" },
  });
  // Use this CID as your baseURI in the contract
  // baseURI = "ipfs://QmYyy.../"
  return result.IpfsHash;
}
```

---

## Marketplace Selection

### Marketplace Comparison

| Marketplace | Chains | Fee | Royalty Enforcement | Best For |
|------------|--------|-----|-------------------|----------|
| OpenSea | ETH, Polygon, Base, more | 2.5% | Optional (creator control) | Largest audience, general collections |
| Blur | Ethereum | 0% | Optional (0% default) | Trading/flipping, pro traders |
| Magic Eden | ETH, Solana, Bitcoin, Polygon | 2% | Enforced on Solana | Multi-chain, Solana ecosystem |
| Foundation | Ethereum | 5% | Enforced | Curated art, 1-of-1 pieces |
| Zora | ETH, Base, Optimism | 0% (protocol rewards) | Protocol-level | Creator-first, open editions |
| Rarible | ETH, Polygon, more | 2.5% | Varies | Multi-chain, aggregation |

### Royalty Enforcement Strategy

Since marketplace-level royalty enforcement is inconsistent, consider on-chain enforcement:

```solidity
// Operator filter approach (restrict transfers to royalty-honoring marketplaces)
// Note: This approach has trade-offs -- reduces composability

// ERC-2981 approach (standard royalty info -- marketplaces SHOULD honor but CAN ignore)
// Set in constructor:
_setDefaultRoyalty(royaltyReceiver, 500); // 5% = 500 basis points

// Per-token supersede:
_setTokenRoyalty(tokenId, artistAddress, 750); // 7.5% for special tokens

// Realistic expectation: Set ERC-2981 royalties, accept that not all
// secondary sales will honor them. Price your mint accordingly.
```

---

## Collection Design Framework

### Generative Art Pipeline

```
1. Create trait layers (PNG with transparency)
   ├── backgrounds/   (10-15 variations)
   ├── bodies/         (5-8 variations)
   ├── clothing/       (15-25 variations)
   ├── accessories/    (20-30 variations)
   ├── heads/          (10-15 variations)
   └── special/        (3-5 rare 1-of-1 supersedes)

2. Define rarity weights
   Common:     60-70% of supply
   Uncommon:   20-25% of supply
   Rare:       5-10% of supply
   Legendary:  1-3% of supply

3. Generate combinations (HashLips Art Engine or custom script)
   - Remove conflicting trait combinations
   - Ensure no exact duplicates
   - Reserve specific combinations for team/giveaways

4. Generate metadata JSON files matching token IDs

5. Upload images to IPFS -> Get CID
6. Update metadata with image CIDs -> Upload metadata to IPFS
7. Set baseURI in contract to metadata CID
```

### Rarity Design Principles

- **No single trait should be >80% of supply** (feels lazy)
- **Rare traits should be visually distinctive** (collectors want to show off)
- **Consider trait synergies** -- some trait combinations create emergent rarity

---

## Launch Strategy

### Pre-Launch Checklist

- [ ] Smart contract audited (at minimum peer-reviewed)
- [ ] Metadata uploaded to permanent storage (IPFS/Arweave)
- [ ] Contract deployed to testnet and all functions tested
- [ ] Mint page tested with multiple wallets and edge cases
- [ ] Royalty configuration verified (ERC-2981)
- [ ] Team allocation minted or reserved
- [ ] Community built (Discord, Twitter/X, relevant forums)
- [ ] Allowlist/whitelist mechanism configured if using phased mint
- [ ] Reveal mechanism tested (if doing delayed reveal)

### Mint Phase Strategy

| Phase | Audience | Price | Duration | Purpose |
|-------|----------|-------|----------|---------|
| 1. Allowlist | Core community, early supporters | Discounted or free | 24-48 hours | Reward loyalty, reduce gas wars |
| 2. Public mint | Everyone | Full price | Until sold out or time limit | Broad access |
| 3. Dutch auction (alternative) | Everyone | Starts high, decreases over time | 2-6 hours | Price discovery, reduces gas wars |

### Post-Launch Priorities

1. **Reveal** (if delayed): Trigger metadata reveal within 24-48 hours
2. **Secondary market**: List collection on major marketplaces, verify collection
3. **Rarity tools**: Submit to rarity ranking tools for trait analysis
4. **Community**: Maintain engagement, share roadmap progress
5. **Utility delivery**: Execute on promised utility (access, airdrops, experiences)

---

## Utility Design Patterns

| Utility Type | Implementation | Complexity | Value Driver |
|-------------|---------------|------------|-------------|
| Token-gated access | Verify ownership via wallet signature | Low | Exclusive content/community |
| Staking for rewards | Staking contract distributes ERC-20 tokens | Medium | Ongoing engagement |
| Governance voting | Snapshot.org integration (off-chain voting) | Low | Community ownership |
| Physical goods | Burn-to-redeem mechanism | Medium | Tangible value |
| Metaverse/gaming | In-game asset integration | High | Experiential value |
| Revenue sharing | On-chain distribution to holders | Medium | Direct financial value |
| Breeding/evolution | New tokens minted by combining existing ones | High | Collection expansion |

### Token-Gated Access Example

```javascript
// Server-side verification that a user owns an NFT
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

async function verifyNFTOwnership(walletAddress, contractAddress, tokenId) {
  const owner = await client.readContract({
    address: contractAddress,
    abi: [
      {
        name: "ownerOf",
        type: "function",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
      },
    ],
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });

  return owner.toLowerCase() === walletAddress.toLowerCase();
}

// For checking any token in collection (ERC-721):
async function holdsAnyToken(walletAddress, contractAddress) {
  const balance = await client.readContract({
    address: contractAddress,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
    ],
    functionName: "balanceOf",
    args: [walletAddress],
  });

  return balance > 0n;
}
```

---

## Common Pitfalls to Avoid

1. **No utility beyond speculation** -- Pure PFP projects without utility struggle long-term
2. **Over-promising roadmaps** -- Under-promise, over-deliver; failed promises destroy trust
3. **Ignoring gas costs** -- Mints on high-gas days can cost more in gas than the mint price
4. **Centralized metadata** -- If images are on your server, they can disappear
5. **No royalty strategy** -- Do not depend on secondary royalties as primary revenue
6. **Bot-friendly mints** -- Without allowlists or bot protection, bots dominate public mints
7. **Ignoring legal** -- NFTs may be securities in some jurisdictions; consult legal counsel


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to nft strategist
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Nft Strategist Analysis

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

**Input:** "Help me with nft strategist for my current situation"

**Output:**

Based on your situation, here is a structured approach to nft strategist:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
