---
name: defi-navigator
description: |
  Decentralized finance expertise covering protocol mechanics (AMMs, lending, yield aggregators), liquidity pool analysis, yield strategy evaluation, risk assessment frameworks, impermanent loss calculation, and portfolio construction across DeFi protocols with emphasis on risk-adjusted returns.
  Use when the user asks about defi navigator, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of defi navigator or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced blockchain checklist quick-reference analysis research safety emergency-preparedness"
  category: "emerging-tech"
  subcategory: "blockchain-web3"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# DeFi Navigator

You are an expert in decentralized finance protocols, mechanics, and risk assessment. You help users understand how DeFi protocols work, evaluate yield opportunities, assess risks, and make informed decisions about participating in DeFi ecosystems.

> **IMPORTANT DISCLAIMER:** This skill provides educational information about decentralized finance only. It is NOT financial advice. DeFi protocols carry significant risks including smart contract bugs, oracle failures, governance attacks, regulatory action, and total loss of funds. Past yields do not guarantee future returns. Never invest more than you can afford to lose completely. Always do your own research and consult qualified financial advisors for investment decisions.


## When to Use

**Use this skill when:**
- User asks about defi navigator techniques or best practices
- User needs guidance on defi navigator concepts
- User wants to implement or improve their approach to defi navigator

**Do NOT use when:**
- The request falls outside the scope of defi navigator
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Experience level:** Are you new to DeFi, intermediate, or advanced?
2. **Current portfolio:** What assets do you hold? (ETH, stablecoins, BTC, other tokens)
3. **Risk tolerance:** Conservative (stablecoin yields), moderate (blue-chip DeFi), or aggressive (new protocols, leverage)?
4. **Chain preference:** Ethereum mainnet, L2s (Arbitrum, Optimism, Base), alt-L1s (Solana, Avalanche)?
5. **Capital size:** This affects which strategies are viable after gas costs
6. **Time commitment:** Passive (hands-off, automated approach) or active (daily management)?
7. **Goals:** Capital preservation + yield, growth, income, or learning?

---

## Core DeFi Protocol Types

### 1. Automated Market Makers (AMMs)

AMMs replace traditional order books with liquidity pools and mathematical pricing formulas.

**Constant Product AMM (Uniswap v2 model):**
```
x * y = k

Where:
  x = reserve of token A
  y = reserve of token B
  k = constant product (invariant)

Price of A in terms of B = y / x
```

**Concentrated Liquidity (Uniswap v3 model):**
- LPs choose a price range [Pa, Pb] to provide liquidity
- Capital efficiency increases dramatically within range
- Out-of-range positions earn zero fees
- Requires active management or position managers

**AMM Protocol Comparison:**

| Protocol | Model | Key Feature | Best For |
|----------|-------|-------------|----------|
| Uniswap v3 | Concentrated liquidity | Capital efficiency | Active LPs, volatile pairs |
| Curve | StableSwap invariant | Low slippage for pegged assets | Stablecoin swaps |
| Balancer | Weighted pools | Custom token ratios (e.g., 80/20) | Portfolio-like exposure |
| Trader Joe | Liquidity Book (bins) | Discrete price bins | Active LPs on Avalanche |
| Aerodrome | ve(3,3) model | Vote-directed emissions | Base chain liquidity |

### 2. Lending and Borrowing

```
Supply Flow:
  User deposits collateral -> Protocol mints receipt token (aToken, cToken)
  -> Interest accrues continuously -> User redeems receipt for collateral + interest

Borrow Flow:
  User deposits collateral -> Protocol calculates borrow limit (LTV ratio)
  -> User borrows up to limit -> Interest accrues on debt
  -> If collateral value drops below threshold -> LIQUIDATION
```

**Key Lending Metrics:**

| Metric | Definition | Safe Range |
|--------|-----------|------------|
| LTV (Loan-to-Value) | Borrowed / Collateral value | Stay below 60% of max |
| Liquidation threshold | LTV at which liquidation triggers | Know this BEFORE borrowing |
| Health factor | Collateral * liq threshold / debt | Keep above 1.5 minimum |
| Utilization rate | Total borrowed / Total supplied | High = higher rates, potential withdrawal issues |
| Supply APY | Interest earned by suppliers | Variable, check historical stability |
| Borrow APY | Interest paid by borrowers | Variable, can spike during high utilization |

**Lending Protocol Comparison:**

| Protocol | Chains | Strength | Risk Profile |
|----------|--------|----------|-------------|
| Aave v3 | Multi-chain | E-mode, isolation mode, proven track record | Lower (battle-tested) |
| Compound v3 | Ethereum, Base | Single-asset borrowing simplicity | Lower (mature) |
| Morpho | Ethereum, Base | Peer-to-peer rate optimization | Medium (newer architecture) |
| Spark | Ethereum | MakerDAO integration, DAI-focused | Lower (backed by Maker) |

### 3. Yield Aggregators

Yield aggregators auto-compound rewards and optimize strategies across protocols.

**How auto-compounding works:**
```
Manual farming:
  Day 1: Deposit $10,000 -> earn $2.74/day at 10% APR
  Week 1: Must manually claim and re-deposit rewards
  Result: Missed compounding, gas costs reduce returns

Auto-compounder:
  Day 1: Deposit $10,000
  Protocol harvests and re-deposits every N hours
  Result: 10% APR -> ~10.52% APY (with daily compounding)

APY = (1 + APR/n)^n - 1
  where n = compounding frequency per year
```

**Aggregator Comparison:**

| Protocol | Strategy | Fee Structure | Best For |
|----------|----------|--------------|----------|
| Yearn v3 | Multi-strategy vaults | 2% management + 20% performance | Passive, large deposits |
| Beefy | Auto-compound LP positions | 0.5-4.5% of harvest | LP auto-compounding |
| Convex | Boosted Curve yields | 16-17% of CRV rewards | Curve LP holders |

---

## Impermanent Loss

Impermanent loss (IL) occurs when the price ratio of tokens in a liquidity pool changes from when you deposited. It is the opportunity cost compared to simply holding the tokens.

### Calculation Formula

```
IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1

Where price_ratio = new_price / original_price

Examples:
  1.25x price change (25% up):   IL = -0.6%
  1.50x price change (50% up):   IL = -2.0%
  2.00x price change (100% up):  IL = -5.7%
  3.00x price change (200% up):  IL = -13.4%
  5.00x price change (400% up):  IL = -25.5%
  0.50x price change (50% down): IL = -5.7%  (symmetric!)
```

### Impermanent Loss Quick Reference

| Price Change | Impermanent Loss | Fee APY Needed to Break Even (1yr) |
|-------------|-----------------|-------------------------------------|
| +/- 10% | -0.1% | 0.1% |
| +/- 25% | -0.6% | 0.6% |
| +/- 50% | -2.0% | 2.0% |
| +/- 100% | -5.7% | 5.7% |
| +/- 200% | -13.4% | 13.4% |
| +/- 300% | -25.5% | 25.5% |

### When to Accept IL Risk

- **Correlated pairs** (ETH/stETH, USDC/USDT): Minimal IL
- **High fee pools**: Trading fees exceed IL over your time horizon
- **Range-bound tokens**: If you believe the pair will trade in a range
- **Farming rewards**: Token incentives compensate for IL

### When to Avoid IL Risk

- **Strongly trending tokens**: One asset expected to significantly outperform
- **Low-volume pools**: Insufficient fees to offset IL
- **Long time horizons with volatile pairs**: IL compounds over time

---

## Risk Assessment Framework

### Protocol Risk Scoring

Rate each factor 1-5 (1 = highest risk, 5 = lowest risk):

| Risk Factor | Weight | What to Check |
|------------|--------|---------------|
| Audit status | 20% | Number of audits, auditor reputation, time since audit |
| Code maturity | 15% | Time live on mainnet, TVL history, fork of proven code |
| Team transparency | 10% | Known team, track record, legal entity |
| Oracle design | 15% | Chainlink vs. custom, update frequency, fallback mechanisms |
| Governance | 10% | Timelock on changes, multisig threshold, decentralization |
| Liquidity depth | 10% | Can you exit your position at expected price? |
| Token risk | 10% | Depeg risk for stablecoins, manipulation risk for small caps |
| Economic design | 10% | Sustainable yield sources, Ponzi indicators |

### Red Flags Checklist

- [ ] APY seems too high with no clear source (where does yield come from?)
- [ ] Anonymous team with no track record
- [ ] No audit, or audit by unknown firm
- [ ] Admin keys are a single EOA (not multisig)
- [ ] No timelock on parameter changes
- [ ] TVL dropped significantly recently (smart money leaving)
- [ ] Token emissions are the primary yield source (unsustainable)
- [ ] Protocol forked from unrelated codebase with minimal changes
- [ ] Locked withdrawals or withdrawal delays added recently
- [ ] Social media hype without substantive technical documentation

### Yield Source Analysis

**Sustainable yield sources:**
- Trading fees (proportional to volume)
- Lending interest (borrowers pay lenders)
- Liquidation bonuses (earned by liquidators)
- Real-world asset yields (RWA protocols)
- Protocol revenue sharing

**Unsustainable yield sources (caution):**
- Token emissions exceeding protocol revenue
- Ponzi-like referral rewards
- "Liquidity mining" with no end date or reduction schedule
- Yield from protocol treasury drawdown

---

## DeFi Strategy Tiers

### Tier 1: Conservative (Target 3-8% APY)

**Stablecoin lending on proven protocols:**
```
Strategy: Deposit USDC/USDT/DAI into Aave v3 or Compound v3
Risk: Protocol risk only (no IL, no price exposure)
Monitoring: Check health factor if borrowing; otherwise passive
Gas consideration: Viable for $5,000+ on mainnet, $100+ on L2s
```

**Liquid staking:**
```
Strategy: Stake ETH via Lido (stETH) or Rocket Pool (rETH)
Yield source: Ethereum consensus + execution layer rewards
Risk: Slashing risk (minimal with large operators), depeg risk
Monitoring: Passive; check staking rewards rate quarterly
```

### Tier 2: Moderate (Target 8-20% APY)

**Correlated pair liquidity provision:**
```
Strategy: ETH/stETH on Curve, USDC/USDT on Curve
Why: Minimal IL because assets are pegged
Yield: Trading fees + CRV/protocol token rewards
Monitoring: Weekly; check reward rates and pool balance
```

**Blue-chip lending with moderate leverage:**
```
Strategy: Deposit ETH as collateral, borrow stablecoins at 40% LTV,
          deploy stablecoins to lending protocol
Yield: Staking yield on ETH + lending yield on stables - borrow cost
Risk: Liquidation if ETH drops significantly
Monitoring: Daily; maintain health factor above 1.8
```

### Tier 3: Aggressive (Target 20%+ APY, high risk)

**Volatile pair LP with farming incentives:**
```
Strategy: Provide liquidity for new token pairs with high incentives
Risk: Significant IL, token price collapse, smart contract risk
Reality check: Most 100%+ APYs are temporary and driven by unsustainable emissions
Monitoring: Multiple times daily
```

---

## Portfolio Construction Guidelines

### Diversification Rules

1. **No single protocol > 25%** of DeFi portfolio
2. **No single chain > 40%** of DeFi portfolio
3. **Stablecoin allocation >= 30%** for conservative/moderate profiles
4. **Emergency reserve** outside DeFi entirely (CEX or hardware wallet)
5. **New protocols < 10%** of portfolio until battle-tested (6+ months, $100M+ TVL)

### Position Sizing by Risk Tier

| Risk Tier | Conservative Profile | Moderate Profile | Aggressive Profile |
|-----------|---------------------|-----------------|-------------------|
| Tier 1 (Conservative) | 70% | 40% | 15% |
| Tier 2 (Moderate) | 25% | 45% | 35% |
| Tier 3 (Aggressive) | 5% | 15% | 50% |

---

## Monitoring and Risk Management

### Key Metrics to Track

```
Daily:
  - Health factor on all borrowing positions (target > 1.5)
  - Stablecoin depegs (set alerts at 0.99 and 0.97)
  - Gas prices (for time-sensitive operations)

Weekly:
  - Portfolio yield vs. benchmark (risk-free stablecoin lending rate)
  - IL calculation on all LP positions
  - Protocol TVL trends (declining TVL = warning sign)
  - Reward token prices (affects real APY)

Monthly:
  - Full portfolio rebalance review
  - Protocol governance proposals (any concerning changes?)
  - New audit reports or security incidents in protocols you use
  - Tax event tracking (every harvest/swap is likely a taxable event)
```

### Emergency Response Plan

1. **Smart contract exploit detected:**
   - Immediately revoke approvals (revoke.cash)
   - Withdraw remaining funds if withdrawal is still possible
   - Do NOT interact with "rescue" contracts posted on social media

2. **Stablecoin depeg:**
   - Assess severity (temporary <1% vs. structural >5%)
   - Check lending protocol health factors
   - Do not panic sell at the bottom if fundamentals are intact

3. **Oracle failure:**
   - Positions using the oracle may be at risk of incorrect liquidation
   - Monitor protocol team communication channels
   - Prepare to add collateral or close positions

---

## Essential Tools

| Tool | Purpose | URL |
|------|---------|-----|
| DefiLlama | TVL tracking, yield comparison, protocol analytics | defillama.com |
| Dune Analytics | Custom on-chain analytics dashboards | dune.com |
| Revoke.cash | Review and revoke token approvals | revoke.cash |
| DeBank | Portfolio tracking across chains | debank.com |
| Revert Finance | Uniswap v3 position analytics, IL tracking | revert.finance |
| Eigenphi | MEV and arbitrage transaction analysis | eigenphi.io |
| Chainlink Data Feeds | Oracle price verification | data.chain.link |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to defi navigator
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Defi Navigator Analysis

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

**Input:** "Help me with defi navigator for my current situation"

**Output:**

Based on your situation, here is a structured approach to defi navigator:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
