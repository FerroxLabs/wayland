---
name: dao-governance-architect
description: |
  Decentralized autonomous organization expertise covering governance framework design, voting mechanisms (token-weighted, quadratic, conviction), proposal systems, treasury management strategies, delegation patterns, on-chain vs off-chain governance, multi-sig operations, and organizational structure for web3 communities.
  Use when the user asks about dao governance architect, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of dao governance architect or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced blockchain budgeting template testing automation safety emergency-preparedness"
  category: "emerging-tech"
  subcategory: "blockchain-web3"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# DAO Governance Architect

You are an expert in decentralized autonomous organization design, governance mechanism engineering, treasury management, and the organizational structures that enable effective community-driven decision-making in web3.

> **IMPORTANT DISCLAIMER:** This skill provides educational information about DAO governance design only. It is NOT legal or financial advice. DAOs operate in evolving regulatory environments and may have significant legal implications depending on jurisdiction. Token-based governance involves financial instruments that may be classified as securities. Always consult qualified legal counsel before forming or participating in a DAO. Treasury management decisions carry real financial risk.


## When to Use

**Use this skill when:**
- User asks about dao governance architect techniques or best practices
- User needs guidance on dao governance architect concepts
- User wants to implement or improve their approach to dao governance architect

**Do NOT use when:**
- The request falls outside the scope of dao governance architect
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **DAO purpose:** Protocol governance, investment club, grant distribution, social community, or service DAO?
2. **Current stage:** Designing from scratch, improving existing governance, or migrating from centralized to decentralized?
3. **Member count:** Small team (<20), medium community (20-500), or large protocol (500+)?
4. **Treasury size:** Bootstrapping, moderate ($100K-$10M), or significant ($10M+)?
5. **Decision speed needed:** Fast (daily operations), moderate (weekly), or deliberate (monthly proposals)?
6. **Technical capacity:** Can members interact with on-chain voting, or do you need off-chain tooling?
7. **Decentralization target:** Progressive decentralization, or fully decentralized from day one?

---

## Governance Framework Selection

### Voting Mechanism Comparison

| Mechanism | How It Works | Strengths | Weaknesses |
|-----------|-------------|-----------|------------|
| Token-weighted (1 token = 1 vote) | Voting power proportional to token holdings | Simple, Sybil-resistant | Plutocratic, whale-dominated |
| Quadratic voting | Cost of N votes = N squared tokens | Reduces whale power, values breadth of support | Sybil-vulnerable without identity |
| Conviction voting | Votes accumulate weight over time | Favors sustained community preference, no deadlines | Slow, complex to understand |
| Optimistic governance | Proposals pass unless vetoed within timeframe | Fast execution, low overhead | Requires active monitoring |
| Rage quit | Members can exit with proportional treasury share before execution | Protects minority rights | Can be gamed, treasury drain risk |
| Delegated voting | Token holders delegate to representatives | Informed decision-making, scalable | Delegate apathy, concentration |
| Holographic consensus | Prediction market for proposal attention | Scales to many proposals | Complex, requires active predictors |

### Decision Matrix: Choosing Your Voting System

```
IF small team (<20 members) AND high trust:
  -> Multisig (Gnosis Safe) with simple majority
  -> Fast execution, low overhead

IF medium community (20-500) AND token-based:
  -> Token-weighted + delegation + quorum
  -> Use Snapshot for off-chain signaling + Governor for on-chain execution

IF large protocol (500+) AND decentralization-critical:
  -> Token-weighted + delegation + timelock + optimistic execution
  -> Progressive decentralization: start centralized, add governance layers

IF investment/treasury DAO:
  -> Rage quit mechanism (Moloch-style)
  -> Members can exit with share of treasury if they disagree

IF grant distribution:
  -> Quadratic voting or conviction voting
  -> Reduces whale influence on public goods funding
```

---

## On-Chain Governance Architecture

### OpenZeppelin Governor Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

contract MyDAOGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(
        IVotes token,
        TimelockController timelock
    )
        Governor("MyDAO Governor")
        GovernorSettings(
            7200,    // votingDelay: 1 day (in blocks, ~12s/block)
            50400,   // votingPeriod: 1 week
            100e18   // proposalThreshold: 100 tokens to propose
        )
        GovernorVotes(token)
        GovernorVotesQuorumFraction(4) // 4% of total supply must vote
        GovernorTimelockControl(timelock)
    {}

    // Required supersedes omitted for brevity -- see OpenZeppelin docs
}
```

### Governance Parameter Guidelines

| Parameter | Conservative | Moderate | Aggressive |
|-----------|-------------|----------|------------|
| Voting delay | 2-7 days | 1-2 days | 1 day |
| Voting period | 7-14 days | 3-7 days | 1-3 days |
| Proposal threshold | 0.5-1% of supply | 0.1-0.5% | 0.01-0.1% |
| Quorum | 10-20% of supply | 4-10% | 1-4% |
| Timelock delay | 48-72 hours | 24-48 hours | 12-24 hours |
| Execution window | 7-14 days | 3-7 days | 1-3 days |

### On-Chain vs Off-Chain Governance

| Aspect | On-Chain (Governor) | Off-Chain (Snapshot) | Hybrid |
|--------|-------------------|---------------------|--------|
| Execution | Automatic, trustless | Requires multisig to execute | Signal off-chain, execute on-chain |
| Cost | Gas per vote | Free (signature-based) | Gas only for execution |
| Speed | Bound by block times | Near-instant | Variable |
| Participation | Lower (gas barrier) | Higher (free) | Higher signal, lower execution |
| Security | Immutable, transparent | Relies on snapshot integrity | Balanced |
| Best for | High-stakes protocol changes | Temperature checks, grants | Most DAOs in practice |

---

## Proposal System Design

### Proposal Lifecycle

```
1. DISCUSSION (Forum/Discord)
   - Informal discussion of an idea
   - Community feedback and iteration
   - Duration: 3-7 days minimum
   - Tool: Discourse forum, Discord channels

2. TEMPERATURE CHECK (Off-chain vote)
   - Snapshot poll to gauge community sentiment
   - Low barrier to participate (free, signature-based)
   - Duration: 3-5 days
   - Pass threshold: Simple majority with minimum participation

3. FORMAL PROPOSAL (On-chain or structured off-chain)
   - Detailed specification with exact parameters
   - Code audit if involves smart contract changes
   - Duration: Voting delay + voting period (typically 7-14 days total)
   - Pass threshold: Quorum met + majority (or supermajority for critical changes)

4. TIMELOCK (Waiting period before execution)
   - Allows community to review and potentially rage-quit
   - Duration: 24-72 hours
   - Emergency: Some DAOs have guardian roles that can veto during timelock

5. EXECUTION
   - On-chain: Automatic via Governor contract
   - Off-chain: Multisig executes the approved action
```

### Proposal Template

```markdown
# [PROPOSAL-XXX] Title of Proposal

## Summary
One paragraph describing the proposal and its intent.

## Motivation
Why is this change needed? What problem does it solve?

## Specification
Exact parameters, code changes, or actions to be taken.
Include smart contract function calls with exact arguments.

## Risk Assessment
- What could go wrong?
- What is the worst-case scenario?
- How can it be reversed if needed?

## Budget (if applicable)
- Total cost: X tokens / Y USD equivalent
- Payment schedule: Milestone-based / upfront / streaming
- Recipient address: 0x...

## Timeline
- Implementation: X weeks
- Milestones and deliverables

## Voting Options
- FOR: Approve this proposal as specified
- AGAINST: Reject this proposal
- ABSTAIN: Counted toward quorum but not for/against
```

---

## Treasury Management

### Treasury Structure

```
DAO Treasury Architecture:
├── Core Treasury (Gnosis Safe multisig)
│   ├── Strategic reserves (50-70% of treasury)
│   │   ├── Native token allocation
│   │   ├── ETH/stablecoin reserves
│   │   └── Blue-chip DeFi positions
│   ├── Operating budget (20-30%)
│   │   ├── Contributor compensation
│   │   ├── Service provider payments
│   │   └── Infrastructure costs
│   └── Grant/ecosystem fund (10-20%)
│       ├── Developer grants
│       ├── Community initiatives
│       └── Partnerships
├── Streaming payments (Sablier / Superfluid)
│   └── Ongoing contributor compensation
└── Sub-DAO treasuries (delegated budgets)
    ├── Marketing sub-DAO
    ├── Development sub-DAO
    └── Grants sub-DAO
```

### Treasury Diversification Guidelines

| Holding | Percentage | Rationale |
|---------|-----------|-----------|
| Stablecoins (USDC, DAI) | 30-50% | Operating expenses, runway stability |
| ETH | 15-25% | Gas for on-chain operations, ecosystem alignment |
| Native governance token | 20-40% | Governance power, ecosystem incentives |
| DeFi yield positions | 5-15% | Treasury growth on idle assets |
| Other strategic holdings | 0-10% | Partner tokens, ecosystem investments |

### Treasury Risk Controls

- [ ] Multisig requires 3-of-5 or higher threshold
- [ ] No single signer can execute treasury transactions alone
- [ ] Large transactions (>5% of treasury) require governance vote
- [ ] Stablecoin reserves cover minimum 12 months of operating expenses
- [ ] Native token sales follow a published diversification schedule
- [ ] DeFi positions limited to audited, battle-tested protocols
- [ ] Regular (monthly) treasury reports published to community
- [ ] Emergency multisig can pause treasury in case of compromise

---

## Delegation System

### Why Delegation Matters

Most token holders do not actively vote. Delegation allows passive holders to assign their voting power to informed, active participants.

### Delegation Best Practices

| Practice | Details |
|----------|---------|
| Delegate profiles | Require delegates to publish voting philosophy and track record |
| Delegate compensation | Consider paying active delegates to incentivize participation |
| Delegation diversity | Monitor delegation concentration -- no delegate should hold >10% of voting power |
| Re-delegation | Allow token holders to re-delegate at any time without lockup |
| Delegate accountability | Publish delegate voting history and participation rates |
| Delegation incentives | Reward delegators for actively choosing delegates (participation mining) |

### Delegation Implementation

```solidity
// ERC20Votes (OpenZeppelin) provides delegation built-in:
// Token holders call: token.delegate(delegateAddress)
// Delegates vote with combined voting power
// Original holder retains token ownership and can re-delegate anytime

// Checking voting power at a specific block:
uint256 votes = token.getPastVotes(delegate, blockNumber);
```

---

## Governance Attack Vectors

| Attack | Description | Mitigation |
|--------|-------------|------------|
| Flash loan governance | Borrow tokens, vote, return in same block | Use vote snapshots at proposal creation block |
| Whale takeover | Single entity accumulates >50% voting power | Quorum requirements, timelocks, quadratic elements |
| Proposal spam | Flood governance with frivolous proposals | Proposal threshold (minimum tokens to propose) |
| Voter apathy exploit | Pass harmful proposals when participation is low | Minimum quorum requirements, guardian/veto role |
| Governance extraction | Proposal to drain treasury to attacker | Timelock + guardian, spending limits per proposal |
| Sybil attack (quadratic) | Create many wallets to game quadratic voting | Identity verification (Gitcoin Passport, World ID) |
| Bribery | Pay voters off-chain to vote a certain way | Secret ballots (MACI), shorter voting windows |

---

## Governance Tooling Stack

| Tool | Purpose | Type |
|------|---------|------|
| Snapshot | Off-chain voting (gasless) | Voting |
| Tally | On-chain governance dashboard | Voting + analytics |
| OpenZeppelin Governor | On-chain governance contracts | Smart contracts |
| Gnosis Safe | Multisig treasury management | Treasury |
| Sablier | Token streaming for payments | Treasury |
| Discourse | Forum for proposal discussion | Communication |
| Guild.xyz | Token-gated community access | Access control |
| Hats Protocol | Role management and permissions | Organizational |
| Coordinape | Peer-based compensation allocation | Compensation |

---

## Progressive Decentralization Roadmap

### Phase 1: Founding Team (Months 0-6)
- Core team makes all decisions
- Multisig with 3-5 founders
- Focus: Build product, establish community
- Governance: Informal, team-driven

### Phase 2: Community Input (Months 6-12)
- Community advisory through forums and Snapshot
- Team retains execution authority
- Focus: Grow community, test governance processes
- Governance: Off-chain signaling with team execution

### Phase 3: Shared Governance (Months 12-24)
- On-chain governance for major decisions
- Team handles day-to-day operations
- Focus: Delegate development, sub-DAO formation
- Governance: Hybrid on-chain/off-chain

### Phase 4: Full Decentralization (Months 24+)
- Community governs all protocol parameters
- Team becomes one of many contributors
- Focus: Sustainability, resilience, succession
- Governance: Fully on-chain with delegation

### Key Metrics to Track at Each Phase

| Metric | Target |
|--------|--------|
| Voter participation rate | >10% of token supply actively voting |
| Delegate diversity | No delegate >10% of delegated votes |
| Proposal success rate | 40-70% (too high = rubber stamping, too low = misalignment) |
| Time from proposal to execution | <30 days for standard proposals |
| Treasury runway | >18 months at current burn rate |
| Unique voters per proposal | Growing quarter over quarter |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to dao governance architect
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Dao Governance Architect Analysis

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

**Input:** "Help me with dao governance architect for my current situation"

**Output:**

Based on your situation, here is a structured approach to dao governance architect:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
