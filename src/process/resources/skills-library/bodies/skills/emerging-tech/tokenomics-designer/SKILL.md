---
name: tokenomics-designer
description: |
  Token economic design expertise covering supply models (fixed, inflationary, deflationary, dual-token), distribution and allocation strategies, vesting schedules, incentive mechanism design, staking economics, burn mechanics, liquidity bootstrapping, and sustainability analysis for protocol token economies.
  Use when the user asks about tokenomics designer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of tokenomics designer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced blockchain stress-management checklist testing analysis networking contracts"
  category: "emerging-tech"
  subcategory: "blockchain-web3"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Tokenomics Designer

You are an expert in token economic design, covering the full spectrum of supply models, distribution strategies, incentive mechanisms, and sustainability analysis. You help projects design token economies that align stakeholder incentives and support long-term protocol health.

> **IMPORTANT DISCLAIMER:** This skill provides educational information about token economic design only. It is NOT financial or investment advice. Tokens may be classified as securities in many jurisdictions. Token economic models involve significant financial risk and regulatory uncertainty. Always consult qualified legal counsel regarding securities law compliance before launching any token. Past tokenomics designs do not predict future success.


## When to Use

**Use this skill when:**
- User asks about tokenomics designer techniques or best practices
- User needs guidance on tokenomics designer concepts
- User wants to implement or improve their approach to tokenomics designer

**Do NOT use when:**
- The request falls outside the scope of tokenomics designer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Protocol type:** What does your protocol do? (DeFi, infrastructure, gaming, social, etc.)
2. **Token purpose:** Governance, utility, payment, staking, or multiple functions?
3. **Revenue model:** How does the protocol generate revenue? (Fees, subscriptions, services)
4. **Launch stage:** Pre-launch design, or optimizing existing tokenomics?
5. **Target users:** Developers, end users, investors, validators, or a mix?
6. **Regulatory posture:** Which jurisdictions are you targeting? Have you consulted legal counsel?
7. **Benchmark protocols:** Are there existing projects with tokenomics you admire or want to avoid?

---

## Supply Model Selection

### Model Comparison

| Model | Mechanism | Examples | Best For |
|-------|-----------|----------|----------|
| Fixed supply | Predetermined max, no new minting | Bitcoin (21M) | Store of value, scarcity narratives |
| Inflationary | New tokens minted on schedule | Ethereum (PoS ~0.5%/yr) | Staking rewards, security incentives |
| Deflationary | Tokens burned from circulation | BNB (quarterly burn) | Value accrual to holders |
| Elastic/Rebase | Supply adjusts to target price | Ampleforth | Experimental, stablecoin attempts |
| Dual-token | Governance + utility separation | Axie (AXS + SLP) | Complex economies with distinct needs |
| veToken | Lock tokens for voting + revenue share | Curve (CRV -> veCRV) | Deep liquidity incentive alignment |

### Supply Model Decision Framework

```
Start with these questions:

1. Does your protocol need ongoing incentives for participants?
   YES -> Inflationary component (staking, mining rewards)
   NO  -> Fixed supply may work

2. Does your protocol generate revenue?
   YES -> Consider buy-back-and-burn or revenue distribution
   NO  -> Be very careful with deflationary mechanics (no value to burn)

3. Do you need separate functions for governance and utility?
   YES -> Dual-token model
   NO  -> Single token with combined function

4. Is long-term commitment from holders critical?
   YES -> veToken (lock for power) or staking with lockup
   NO  -> Liquid governance tokens

5. Is your economy primarily consumption-based?
   YES -> Burn-on-use model (token burned when service used)
   NO  -> Utility token with fee distribution
```

---

## Token Distribution Design

### Allocation Framework

| Stakeholder | Typical Range | Purpose | Vesting |
|------------|--------------|---------|---------|
| Community/Ecosystem | 30-50% | User incentives, airdrops, grants, liquidity mining | 3-5 year distribution schedule |
| Team and Founders | 15-25% | Align team incentives with long-term success | 1 year cliff + 3-4 year linear vest |
| Investors (Seed) | 5-15% | Early capital and strategic support | 6-12 month cliff + 2-3 year vest |
| Investors (Series A+) | 5-15% | Growth capital | 6-12 month cliff + 1.5-2.5 year vest |
| Treasury/DAO | 10-20% | Protocol development, partnerships, emergencies | Governance-controlled release |
| Advisors | 2-5% | Strategic guidance, network, credibility | 1 year cliff + 2 year vest |
| Liquidity | 3-10% | Initial DEX/CEX liquidity | Partially locked in LP |
| Airdrop | 5-15% | User acquisition, community building | Immediate or with claim period |

### Allocation Red Flags

- [ ] Team allocation >25% (misaligned with community)
- [ ] Investor allocation >30% (too much VC influence)
- [ ] No vesting for team or investors (dump risk)
- [ ] Community allocation <25% (not enough for sustainable incentives)
- [ ] No treasury reserve (no funding for future development)
- [ ] Unclear "Other" or "Reserve" category >15% (lack of transparency)

### Example Distribution (Well-Balanced)

```
Total Supply: 1,000,000,000 tokens

Community Ecosystem Fund:  35%  (350M) -- 5 year distribution
  - Liquidity mining:      15%  (150M) -- Decreasing schedule over 4 years
  - Airdrop:               10%  (100M) -- Launch + retroactive
  - Ecosystem grants:      10%  (100M) -- DAO-controlled

Team & Founders:           20%  (200M) -- 1 year cliff, 4 year vest
Early Investors:           15%  (150M) -- 6 month cliff, 3 year vest
DAO Treasury:              15%  (150M) -- Governance-controlled
Initial Liquidity:          5%  (50M)  -- Locked in LP for 2 years
Advisors:                   3%  (30M)  -- 1 year cliff, 2 year vest
Public Sale:                7%  (70M)  -- Unlocked at TGE
```

---

## Vesting Schedule Design

### Vesting Mechanics

```
Key Parameters:
  - TGE Unlock: Percentage available at Token Generation Event (0-25%)
  - Cliff: Period before any tokens unlock (0-18 months)
  - Vesting Duration: Total time to full unlock (1-5 years)
  - Vesting Type: Linear, step (monthly/quarterly), or milestone-based

Example: Team vesting with 1-year cliff and 4-year linear vest
  Month 0 (TGE):    0% unlocked
  Month 1-11:       0% unlocked (cliff period)
  Month 12:         25% unlocked (cliff release)
  Month 13-48:      ~2.08% per month (linear)
  Month 48:         100% fully vested

Token Unlock Schedule (annualized):
  Year 1:  25% (at cliff)
  Year 2:  +25% (linear monthly)
  Year 3:  +25% (linear monthly)
  Year 4:  +25% (linear monthly)
```

### Vesting Implementation

```solidity
// Using OpenZeppelin VestingWallet
import {VestingWallet} from "@openzeppelin/contracts/finance/VestingWallet.sol";

// Deploy one per beneficiary
VestingWallet teamVesting = new VestingWallet(
    teamMultisig,          // beneficiary address
    block.timestamp + 365 days, // cliff: 1 year from now
    3 * 365 days           // duration after cliff: 3 years
);

// Transfer team allocation to vesting contract
token.transfer(address(teamVesting), teamAllocation);

// Beneficiary calls release() to claim vested tokens:
// teamVesting.release(address(token));

// For streaming vesting, consider:
// - Sablier (sablier.com) -- token streaming protocol
// - Hedgey (hedgey.finance) -- token vesting and lockup
// - Superfluid -- real-time finance streaming
```

### Vesting Best Practices

| Practice | Details |
|----------|---------|
| Team cliff >= 1 year | Shows long-term commitment; aligns with community |
| Total vest >= 3 years | Prevents short-term extraction |
| TGE unlock for team: 0% | Team should earn tokens over time |
| TGE unlock for community: 0-50% | Some immediate utility needed |
| Investor cliff >= 6 months | Prevents immediate dumping |
| Advisory vest >= 2 years | Ensures ongoing involvement |
| Vesting contracts audited | Lock cannot be bypassed |
| Transparent unlock schedule | Published and on-chain verifiable |

---

## Incentive Mechanism Design

### Staking Economics

```
Staking Design Parameters:

1. Reward Source
   - Protocol revenue (sustainable, tied to real value)
   - Token inflation (unsustainable if revenue does not grow)
   - Combination (inflation early, transition to revenue)

2. Lock Duration
   - No lock: Maximum flexibility, minimum commitment
   - Fixed lock (30/90/180/365 days): Higher rewards for longer lock
   - Variable lock (veToken): Linearly increasing power with lock length

3. Reward Rate
   - Fixed APY: Predictable but may over/under-pay
   - Dynamic APY: Based on total staked (self-adjusting)
   - Revenue share: Proportional to protocol fees earned

4. Slashing (if applicable)
   - For validators/operators who misbehave
   - Percentage of stake slashed on provable misbehavior
   - Slashed tokens burned or distributed to reporters
```

### veToken Model

```
veToken Design (inspired by Curve's veCRV):

1. Users lock TOKEN for 1 week to 4 years
2. Receive veTOKEN proportional to lock time:
   Lock 1 TOKEN for 4 years -> 1.0 veTOKEN
   Lock 1 TOKEN for 2 years -> 0.5 veTOKEN
   Lock 1 TOKEN for 1 year  -> 0.25 veTOKEN

3. veToken power decays linearly to zero at unlock time
4. Users can extend lock to maintain/increase power

Benefits of veToken holders:
  - Governance voting power
  - Boosted staking/farming rewards (up to 2.5x)
  - Share of protocol revenue
  - Ability to direct liquidity incentives (gauges)

Trade-offs:
  + Deep alignment: Locked holders are committed
  + Reduced sell pressure: Tokens locked for years
  - Liquidity risk: Cannot access locked tokens
  - Complexity: Harder for casual users to understand
  - Potential for lock-in oligarchy over time
```

### Burn Mechanics

| Burn Type | Mechanism | Example |
|-----------|-----------|---------|
| Fee burn | Portion of transaction fees burned | Ethereum EIP-1559 (base fee burned) |
| Buy-back and burn | Protocol uses revenue to buy and burn tokens | BNB quarterly burn |
| Burn-on-use | Token burned when service is consumed | Helium (burn HNT to mint Data Credits) |
| Redemption burn | Token burned when redeemed for underlying asset | Backed NFTs, synthetic assets |
| Penalty burn | Slashed tokens burned | Validator misbehavior |

---

## Liquidity Bootstrapping

### Launch Mechanism Comparison

| Mechanism | How It Works | Best For |
|-----------|-------------|----------|
| Liquidity Bootstrapping Pool (LBP) | Starting high weight (e.g., 95/5 TOKEN/USDC), weights shift over time to 50/50, creating declining price pressure | Fair price discovery, reduces bots |
| Initial DEX Offering (IDO) | Fixed-price sale on launchpad platform | Broad distribution, platform audience |
| Airdrop + LP | Airdrop tokens, provide initial LP | Community-first, no fundraise |
| Protocol-Owned Liquidity (POL) | Protocol owns its LP positions permanently | Long-term stability, no mercenary LP |
| Bonds | Users trade LP tokens or assets for discounted protocol tokens | POL acquisition (popularized by OlympusDAO) |

### Liquidity Depth Guidelines

```
Minimum viable liquidity for a functional token market:

Price Impact Targets (for a $100K swap):
  Excellent: <0.5% price impact
  Good:      0.5-2% price impact
  Minimum:   2-5% price impact
  Unusable:  >5% price impact

Rule of Thumb:
  Initial LP should support at least 10x your expected
  average daily trading volume with <2% price impact.

  If you expect $500K daily volume, target $5M+ in LP depth.
```

---

## Sustainability Analysis

### The Sustainability Test

Every token economy must answer one question: **Where does the yield/value come from?**

```
SUSTAINABLE sources of token value:
  1. Protocol revenue (fees from real usage)
  2. Cash flow distribution (revenue to stakers)
  3. Governance over valuable treasury/protocol
  4. Burn mechanics tied to real usage
  5. Network security (staking secures valuable network)

UNSUSTAINABLE sources of token value:
  1. Token emissions as primary "yield" (printing money)
  2. New user deposits paying old user yields (Ponzi structure)
  3. Reflexive loops with no external revenue
  4. Hype/narrative alone with no utility
```

### Token Value Accrual Mechanisms

| Mechanism | How Value Accrues | Sustainability |
|-----------|------------------|---------------|
| Fee switch (revenue to stakers) | Protocol fees distributed to token stakers | High -- tied to real revenue |
| Buy-back and burn | Protocol uses revenue to reduce supply | High -- tied to real revenue |
| Governance over treasury | Token governs allocation of real assets | Medium -- depends on treasury management |
| Utility demand (gas, access) | Token required to use protocol | Medium-High -- tied to usage |
| Speculative demand | Market expects future value | Low -- reflexive and fragile |

### Modeling Token Economy Health

```
Key Metrics to Monitor Post-Launch:

Token Velocity = Transaction Volume / Average Market Cap
  High velocity = tokens not being held (bad for price)
  Target: Design sinks that reduce velocity (staking, locking, burning)

Inflation-Adjusted Return = Staking APY - Inflation Rate
  If staking rewards are 15% but inflation is 20%, real return is -5%
  Stakers are losing purchasing power despite nominal yield

Revenue/Token = Annual Protocol Revenue / Circulating Supply
  This is the P/E equivalent for tokens
  Compare against similar protocols for relative valuation

Emission Schedule Sustainability:
  If emissions cost > protocol revenue, the model requires
  constant new demand to sustain price. This is a warning sign.
```

---

## Tokenomics Design Checklist

### Pre-Launch

- [ ] Clear value accrual mechanism defined (how does holding the token benefit?)
- [ ] Supply model chosen with justification
- [ ] Distribution allocations sum to 100% with no hidden reserves
- [ ] All stakeholder vesting schedules defined and published
- [ ] Circulating supply projections modeled for 1, 2, 3, and 5 years
- [ ] Inflation schedule published (if applicable)
- [ ] Utility/governance functions clearly defined
- [ ] Legal review completed for securities compliance
- [ ] Economic model stress-tested (what happens if price drops 90%?)
- [ ] Liquidity bootstrapping plan finalized

### Post-Launch Monitoring

- [ ] Circulating supply matches published schedule
- [ ] Token velocity within expected range
- [ ] Staking participation rate healthy (20-60% of supply)
- [ ] Governance participation active
- [ ] Protocol revenue growing relative to token emissions
- [ ] No single entity controls >10% of circulating supply (excluding locked)
- [ ] Liquidity depth sufficient for market participants
- [ ] Community sentiment and feedback regularly incorporated

---

## Common Tokenomics Mistakes

| Mistake | Why It Fails | Fix |
|---------|-------------|-----|
| 100% of value from emissions | Inflation destroys value for non-stakers | Tie rewards to protocol revenue |
| No vesting for insiders | Mass selling at TGE crashes price | Minimum 1 year cliff for team and investors |
| Over-complicated model | Users cannot understand value proposition | Keep core mechanics simple, complexity in edges |
| Governance without treasury | Voting on nothing meaningful | Ensure governance controls real parameters/funds |
| Fixed staking APY via inflation | Unsustainable, rewards exceed value creation | Dynamic rates tied to actual revenue |
| No demand sinks | High velocity, no reason to hold | Build utility that requires locking or burning |
| Copying another project's tokenomics | Every protocol has different needs | Design for YOUR specific use case and users |
| Launching token before product | No utility, pure speculation | Build product with real users first |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to tokenomics designer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Tokenomics Designer Analysis

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

**Input:** "Help me with tokenomics designer for my current situation"

**Output:**

Based on your situation, here is a structured approach to tokenomics designer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
