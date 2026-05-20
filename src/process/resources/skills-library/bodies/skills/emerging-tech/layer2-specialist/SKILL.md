---
name: layer2-specialist
description: |
  Ethereum Layer 2 scaling expertise covering optimistic rollups, ZK rollups, validiums, rollup architecture, bridge mechanics, L2 selection criteria, cost analysis, security assumptions, data availability, interoperability, and migration strategies for building and deploying on Layer 2 networks.
  Use when the user asks about layer2 specialist, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of layer2 specialist or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced blockchain checklist typescript testing automation analysis networking"
  category: "emerging-tech"
  subcategory: "blockchain-web3"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Layer 2 Specialist

You are an expert in Ethereum Layer 2 scaling solutions, covering the architecture, trade-offs, security properties, and practical deployment considerations for optimistic rollups, ZK rollups, and related scaling technologies.


## When to Use

**Use this skill when:**
- User asks about layer2 specialist techniques or best practices
- User needs guidance on layer2 specialist concepts
- User wants to implement or improve their approach to layer2 specialist

**Do NOT use when:**
- The request falls outside the scope of layer2 specialist
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Use case:** DeFi, gaming, NFTs, social, enterprise, or general-purpose dApp?
2. **Priority ranking:** Cost, speed, security, EVM compatibility, or ecosystem size?
3. **Current state:** Building new, or migrating existing Ethereum mainnet contracts?
4. **User base:** Expected transaction volume and user count?
5. **Composability needs:** Do you need to interact with protocols on a specific L2?
6. **Decentralization requirements:** How important is the rollup's decentralization stage?
7. **Withdrawal requirements:** How fast do users need to exit back to L1?

---

## Layer 2 Architecture Overview

### How Rollups Work

```
Rollup Architecture:

Layer 1 (Ethereum Mainnet)
├── Rollup Contract: Stores state roots and transaction data
├── Bridge Contract: Manages L1 <-> L2 asset transfers
└── Verifier: Validates L2 state transitions (fraud proof or validity proof)

Layer 2 (Rollup Chain)
├── Sequencer: Orders and executes transactions
├── Batch Submitter: Posts transaction batches to L1
├── State Commitment: Periodic state root posted to L1
└── Prover: Generates fraud proofs (optimistic) or validity proofs (ZK)

Transaction Lifecycle:
1. User submits tx to L2 sequencer
2. Sequencer orders and executes tx (instant soft confirmation)
3. Sequencer batches multiple txs together
4. Batch posted to L1 as calldata/blobs (data availability)
5. State root posted to L1 rollup contract
6. Verification:
   - Optimistic: Assume valid, challenge window (7 days)
   - ZK: Validity proof submitted and verified on L1 (minutes-hours)
```

### Rollup Type Comparison

| Property | Optimistic Rollup | ZK Rollup |
|----------|------------------|-----------|
| Verification method | Fraud proof (challenge-response) | Validity proof (mathematical) |
| Withdrawal to L1 | 7-day challenge period* | Minutes to hours (proof generation time) |
| EVM compatibility | Full EVM equivalence | Varies (zkEVM types 1-4) |
| Transaction cost | Lower calldata cost | Higher compute cost for proving |
| Finality | 7 days (L1 finality) or instant with bridges | Proof submission time (~1-12 hours) |
| Maturity | Production-ready, battle-tested | Rapidly maturing, some in production |
| Complexity | Simpler architecture | More complex (ZK circuits) |
| Examples | Arbitrum, Optimism, Base | zkSync Era, Starknet, Scroll, Polygon zkEVM |

*Optimistic rollup withdrawals can be accelerated using third-party bridges (fast bridges provide liquidity against pending withdrawals)

---

## L2 Network Selection

### Major L2 Comparison Matrix

| L2 | Type | EVM | TVL Tier | Ecosystem | Unique Strength |
|----|------|-----|----------|-----------|----------------|
| Arbitrum One | Optimistic | Full EVM | Top tier | Largest DeFi ecosystem on L2 | Stylus (Rust/C++ smart contracts) |
| Optimism (OP Mainnet) | Optimistic | Full EVM | Top tier | Superchain ecosystem | OP Stack (fork-friendly L2 framework) |
| Base | Optimistic (OP Stack) | Full EVM | Top tier | Coinbase-backed, growing fast | Onchain consumer apps, institutional backing |
| zkSync Era | ZK | zkEVM (Type 4) | Upper mid | Growing DeFi, native AA | Native account abstraction, zkPorter DA |
| Starknet | ZK | Cairo (not EVM) | Mid | Unique ecosystem | Cairo language, STARK proofs, gaming focus |
| Scroll | ZK | zkEVM (Type 2) | Mid | Growing | Closest to EVM equivalence (Type 2 zkEVM) |
| Polygon zkEVM | ZK | zkEVM (Type 2) | Mid | Polygon ecosystem | Polygon CDK, enterprise connections |
| Linea | ZK | zkEVM (Type 2) | Mid | Consensys ecosystem | MetaMask integration, Consensys backing |
| Blast | Optimistic | Full EVM | Mid | DeFi-focused | Native yield on ETH and stablecoins |
| Mantle | Optimistic | Full EVM | Mid | BitDAO-backed | Modular DA (EigenDA integration) |

### Selection Decision Framework

```
Choose based on your PRIMARY requirement:

Lowest cost + largest ecosystem?
  -> Arbitrum One or Base

Fastest growing consumer ecosystem?
  -> Base

Maximum EVM compatibility + ZK security?
  -> Scroll or Polygon zkEVM

Custom execution environment + cutting edge?
  -> Starknet (Cairo)

Building your own L2/L3 chain?
  -> OP Stack (Optimism) or Arbitrum Orbit

Enterprise/institutional focus?
  -> Polygon zkEVM or Base

Gaming with high throughput needs?
  -> Starknet, Arbitrum Orbit (app-chain), or Immutable zkEVM
```

### zkEVM Type Classification

| Type | EVM Compatibility | Performance | Examples |
|------|-------------------|-------------|---------|
| Type 1 | Fully Ethereum-equivalent | Slowest proving | Taiko (targeting) |
| Type 2 | EVM-equivalent (minor differences) | Moderate proving | Scroll, Polygon zkEVM |
| Type 3 | Almost EVM-equivalent (some opcodes differ) | Faster proving | (transitional stage) |
| Type 4 | High-level language compatible (compiles differently) | Fastest proving | zkSync Era |

```
Compatibility vs. Performance Trade-off:

Type 1: Any Ethereum tool works, proving is expensive
  <------------------------------------------------------>
Type 4: Some tools need adaptation, proving is efficient

Rule of thumb:
  - Migrating existing Ethereum contracts? Prefer Type 1/2
  - Building new contracts from scratch? Type 3/4 is fine
  - Need maximum Ethereum tooling compatibility? Choose Type 1/2
```

---

## Cost Analysis

### Transaction Cost Components

```
L2 Transaction Cost = L2 Execution Fee + L1 Data Fee

L2 Execution Fee:
  Similar to L1 gas but with much lower gas price
  Typically 0.01-0.1 gwei on most L2s
  Determined by L2 sequencer and network congestion

L1 Data Fee (dominant cost):
  Cost of posting transaction data to Ethereum L1
  Scales with L1 gas prices and transaction data size
  EIP-4844 (blobs) reduced this by ~90% for rollups that support it

Post-EIP-4844 cost comparison (approximate, varies with L1 gas):
  Simple ETH transfer:
    Ethereum L1:   $0.50 - $5.00
    Optimistic L2:  $0.001 - $0.05
    ZK L2:          $0.005 - $0.10

  Token swap:
    Ethereum L1:   $2.00 - $20.00
    Optimistic L2:  $0.005 - $0.20
    ZK L2:          $0.01 - $0.30

  NFT mint:
    Ethereum L1:   $5.00 - $50.00
    Optimistic L2:  $0.01 - $0.30
    ZK L2:          $0.02 - $0.50
```

### Data Availability Options

| DA Layer | Security | Cost | Used By |
|----------|----------|------|---------|
| Ethereum calldata | Highest (L1 security) | Highest | Pre-EIP-4844 rollups |
| Ethereum blobs (EIP-4844) | Highest (L1 security) | Much lower | Most modern rollups |
| Celestia | Moderate (separate consensus) | Very low | Eclipse, Manta, some OP chains |
| EigenDA | Moderate (restaked security) | Low | Mantle, various OP chains |
| DAC (Data Availability Committee) | Lowest (trusted committee) | Lowest | Validiums, some app-chains |

```
Security vs. Cost Spectrum:

Most Secure                                     Cheapest
[Ethereum calldata] -> [Blobs] -> [Celestia/EigenDA] -> [DAC]

Most rollups today use Ethereum blobs, which offer the best
balance of security and cost for general-purpose applications.
```

---

## Bridge Architecture and Security

### Bridge Types

| Bridge Type | Mechanism | Trust Model | Speed | Security |
|-------------|-----------|-------------|-------|----------|
| Canonical rollup bridge | L1 <-> L2 via rollup contracts | Trust rollup security | 7 days (optimistic) / hours (ZK) | Highest |
| Liquidity network | Market makers provide instant liquidity | Trust bridge operators | Minutes | Medium-High |
| Lock-and-mint | Lock on source, mint wrapped on destination | Trust bridge contract + validators | Minutes | Medium |
| Intent-based | Solvers fill user intents, settle later | Trust solver network | Seconds-minutes | Medium-High |

### Bridge Security Checklist

- [ ] Bridge has been audited by multiple reputable firms
- [ ] Bridge operator set is decentralized (not a single multisig)
- [ ] Bridge has a track record (>6 months live, no exploits)
- [ ] Monitor bridge TVL trends (declining TVL may indicate risk)
- [ ] Understand the bridge's failure mode (what happens if bridge is compromised?)
- [ ] Use canonical rollup bridges for large amounts (highest security)
- [ ] Use fast bridges (Across, Stargate, Hop) for smaller amounts when speed matters
- [ ] Never bridge more than you can afford to lose through a third-party bridge

### Bridge Exploit History (Lessons Learned)

| Incident | Loss | Root Cause | Lesson |
|----------|------|-----------|--------|
| Ronin Bridge (2022) | $624M | Compromised validator keys (5-of-9 multisig) | Distributed key management, higher thresholds |
| Wormhole (2022) | $320M | Signature verification bypass | Audit critical verification logic |
| Nomad (2022) | $190M | Initialization bug allowed arbitrary messages | Test initialization, formal verification |
| Multichain (2023) | $130M+ | Centralized key compromise | Decentralize bridge control, avoid single points of failure |

---

## Migration Strategy: L1 to L2

### Pre-Migration Checklist

- [ ] Verify all contracts deploy correctly on target L2 testnet
- [ ] Test all cross-chain interactions (bridging, messaging)
- [ ] Confirm all dependencies exist on target L2 (oracles, DEXs, lending)
- [ ] Gas cost analysis: ensure L2 costs meet your requirements
- [ ] Block time differences accounted for (L2 blocks are often faster/different)
- [ ] Timestamp behavior verified (some L2s have different timestamp semantics)
- [ ] Precompile support confirmed (some L2s lack certain precompiles)
- [ ] User experience: wallet configuration for L2 (chain ID, RPC)

### Contract Deployment Differences

```solidity
// Most L2s are EVM-compatible, but watch for:

// 1. Block properties may differ
block.number    // May not correspond to L2 block number on all chains
block.timestamp // Usually L2 timestamp, but verify behavior

// 2. L1 gas pricing / L1 data fee
// On Optimism/Base, tx.gasprice may not reflect true cost
// Use the L1 gas oracle for accurate cost estimation:
// OVM_gasPriceOracle.getL1Fee(txData)

// 3. Address derivation
// CREATE2 addresses are the same across EVM chains
// CREATE (nonce-based) addresses may differ if deployment order changes

// 4. msg.sender in cross-chain calls
// When receiving messages from L1, msg.sender is the bridge contract
// Use aliased addresses or authenticated messaging patterns

// 5. Sequencer dependency
// If the sequencer goes down, users may need to force-include
// transactions through L1 (escape hatch)
// Design contracts to function even during sequencer downtime
```

### Multi-Chain Deployment Strategy

```
Deployment Options:

1. SINGLE L2: Simplest; full composability; risk concentration
2. MULTI-L2: Reach users where they are; fragmented liquidity
3. HUB-AND-SPOKE: Concentrated liquidity on hub; cross-chain complexity
4. APP-CHAIN (L3): Full control via OP Stack / Orbit; bootstrapping challenge
```

---

## L2 Development Tooling

### Essential Tools

| Tool | Purpose | L2 Support |
|------|---------|------------|
| Foundry | Contract development and testing | All EVM L2s |
| Hardhat | Contract development with plugins | All EVM L2s |
| Alchemy / Infura / QuickNode | RPC node providers | Most major L2s |
| The Graph | Subgraph indexing | Arbitrum, Optimism, Base, Polygon, more |
| Tenderly | Simulation, debugging, monitoring | Most major L2s |
| Blockscout / Etherscan | Block explorers | Chain-specific instances |
| Safe (Gnosis) | Multisig wallet | All major L2s |
| Chainlink | Oracles, VRF, automation | Most major L2s |

### L2-Specific Development Considerations

```typescript
// Checking if you're on an L2 (useful for multi-chain contracts)
// Each L2 has a unique chain ID

const CHAIN_IDS = {
  ethereum: 1,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  zkSync: 324,
  scroll: 534352,
  polygon_zkevm: 1101,
  linea: 59144,
  starknet: "SN_MAIN", // Starknet uses different ID format
};

// Multi-chain deployment with viem
import { createPublicClient, http } from "viem";
import { arbitrum, optimism, base } from "viem/chains";

const clients = {
  arbitrum: createPublicClient({ chain: arbitrum, transport: http() }),
  optimism: createPublicClient({ chain: optimism, transport: http() }),
  base: createPublicClient({ chain: base, transport: http() }),
};

// Read contract on multiple chains
async function getBalanceAcrossChains(tokenAddress, userAddress) {
  const results = await Promise.all(
    Object.entries(clients).map(async ([chain, client]) => {
      const balance = await client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress],
      });
      return { chain, balance };
    })
  );
  return results;
}
```

---

## Rollup Maturity Assessment

### L2Beat Risk Framework

L2Beat (l2beat.com) categorizes rollup maturity across key dimensions. Before committing to an L2, evaluate:

| Dimension | What It Means | What to Look For |
|-----------|--------------|-----------------|
| State validation | How state transitions are verified | Fraud proofs (optimistic) or validity proofs (ZK) fully implemented |
| Data availability | Where transaction data is stored | On Ethereum (most secure) vs. off-chain DA |
| Sequencer failure | What happens if sequencer goes down | Users can force transactions through L1 |
| Proposer failure | What happens if proposer stops | Anyone can propose state roots (permissionless) |
| Exit window | Time to withdraw before an upgrade takes effect | Minimum 7 days for users to exit safely |
| Upgradeability | Who can upgrade contracts and how | Security council with timelock, not instant upgrades |

### Decentralization Stages

```
Stage 0: "Full Training Wheels"
  - Centralized sequencer
  - Upgradeable contracts without delay
  - No fraud/validity proofs (or proofs not enforced)
  - Essentially a trusted sidechain with L1 data posting

Stage 1: "Limited Training Wheels"
  - Proofs are enforced on-chain
  - Users can exit without operator cooperation
  - Security council can intervene but with limits
  - Most mature rollups are here or approaching

Stage 2: "No Training Wheels"
  - Fully decentralized sequencing
  - Permissionless proving/proposing
  - Security council can only act through governance with delay
  - No single party can censor or freeze user funds
  - The end goal; very few rollups have reached this stage
```

---

## Practical Recommendations

1. **Start on an established L2** (Arbitrum, Base, or Optimism) for maximum ecosystem support
2. **Design contracts to be chain-agnostic** where possible (avoid L2-specific assumptions)
3. **Monitor the rollup maturity** of your chosen L2 on L2Beat
4. **Plan for multi-chain** from the architecture level, even if you launch on one chain
5. **Use canonical bridges** for security-critical operations, fast bridges for UX


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to layer2 specialist
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Layer2 Specialist Analysis

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

**Input:** "Help me with layer2 specialist for my current situation"

**Output:**

Based on your situation, here is a structured approach to layer2 specialist:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
