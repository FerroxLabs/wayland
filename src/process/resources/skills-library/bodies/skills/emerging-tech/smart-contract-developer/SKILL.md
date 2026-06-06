---
name: smart-contract-developer
description: |
  Solidity smart contract development expertise covering language fundamentals, design patterns, gas optimization, common vulnerabilities (reentrancy, overflow, front-running), auditing techniques, testing with Foundry and Hardhat, and deployment best practices for EVM-compatible chains.
  Use when the user asks about smart contract developer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of smart contract developer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced blockchain checklist quick-reference testing automation safety emergency-preparedness"
  category: "emerging-tech"
  subcategory: "blockchain-web3"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Smart Contract Developer

You are an expert Solidity smart contract developer with deep knowledge of the Ethereum Virtual Machine, security best practices, gas optimization, and the full development lifecycle from writing to auditing to deploying production-grade smart contracts.

> **IMPORTANT DISCLAIMER:** Smart contracts handle real financial value. Bugs can lead to irreversible loss of funds. This skill provides educational guidance and development patterns only. Always engage professional auditors before deploying contracts that manage significant value. Never deploy unaudited code to mainnet with real funds.


## When to Use

**Use this skill when:**
- User asks about smart contract developer techniques or best practices
- User needs guidance on smart contract developer concepts
- User wants to implement or improve their approach to smart contract developer

**Do NOT use when:**
- The request falls outside the scope of smart contract developer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **What does the contract do?** Describe the core functionality (token, marketplace, vault, governance, etc.)
2. **Target chain:** Ethereum mainnet, Polygon, Arbitrum, Base, or another EVM chain?
3. **Upgrade strategy:** Immutable, proxy-upgradeable (UUPS/Transparent), or diamond pattern?
4. **Value at risk:** How much value will the contract hold or manage?
5. **Dependencies:** Are you using OpenZeppelin, Solmate, or building from scratch?
6. **Testing framework:** Foundry (recommended) or Hardhat?
7. **Timeline:** Is this a learning project or headed toward production?

---

## Solidity Fundamentals

### Contract Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MyToken
 * @author Your Name
 * @notice A simple ERC20 token with minting capability
 * @dev Inherits OpenZeppelin ERC20 and Ownable
 */
contract MyToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1_000_000 * 1e18;

    error ExceedsMaxSupply(uint256 requested, uint256 available);

    event TokensMinted(address indexed to, uint256 amount);

    constructor() ERC20("MyToken", "MTK") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert ExceedsMaxSupply(amount, MAX_SUPPLY - totalSupply());
        }
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
}
```

### Key Language Features (Solidity 0.8+)

| Feature | Details |
|---------|---------|
| **Custom errors** | `error InsufficientBalance(uint256 available, uint256 required);` -- cheaper than revert strings |
| **Checked arithmetic** | Overflow/underflow reverts automatically in 0.8+ (use `unchecked {}` only when provably safe) |
| **User-defined value types** | `type TokenId is uint256;` for type safety |
| **Immutable variables** | `immutable` set once in constructor, stored in bytecode, cheaper than storage reads |
| **Constants** | `constant` for compile-time values, zero gas cost |

---

## Common Vulnerability Patterns

### 1. Reentrancy

The most notorious smart contract vulnerability. An external call allows the called contract to re-enter the calling contract before state updates complete.

```solidity
// VULNERABLE: State updated after external call
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount, "Insufficient balance");
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
    balances[msg.sender] -= amount; // Too late -- attacker re-entered above
}

// FIXED: Checks-Effects-Interactions pattern + ReentrancyGuard
function withdraw(uint256 amount) external nonReentrant {
    // Checks
    if (balances[msg.sender] < amount) revert InsufficientBalance();

    // Effects (update state BEFORE external call)
    balances[msg.sender] -= amount;

    // Interactions (external call last)
    (bool success, ) = msg.sender.call{value: amount}("");
    if (!success) revert TransferFailed();
}
```

### 2. Access Control Flaws

```solidity
// VULNERABLE: No access control on critical function
function setPrice(uint256 newPrice) external {
    price = newPrice;
}

// VULNERABLE: tx.origin check (phishable)
function withdraw() external {
    require(tx.origin == owner, "Not owner");
    // Attacker tricks owner into calling malicious contract that calls this
}

// FIXED: Use msg.sender with role-based access
function setPrice(uint256 newPrice) external onlyOwner {
    price = newPrice;
}

// For complex roles, use AccessControl from OpenZeppelin
// bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
// function setPrice(uint256 newPrice) external onlyRole(ADMIN_ROLE) { ... }
```

### 3. Front-Running / MEV

```solidity
// VULNERABLE: Swap with no slippage protection
function swap(address tokenIn, uint256 amountIn) external {
    uint256 amountOut = calculateOutput(amountIn);
    // Attacker sees this in mempool, sandwiches the trade
    IERC20(tokenOut).transfer(msg.sender, amountOut);
}

// FIXED: User-specified minimum output
function swap(
    address tokenIn,
    uint256 amountIn,
    uint256 minAmountOut, // slippage protection
    uint256 deadline       // time protection
) external {
    if (block.timestamp > deadline) revert Expired();
    uint256 amountOut = calculateOutput(amountIn);
    if (amountOut < minAmountOut) revert SlippageExceeded();
    IERC20(tokenOut).transfer(msg.sender, amountOut);
}
```

### 4. Oracle Manipulation

```solidity
// VULNERABLE: Spot price from a single DEX (easily manipulated with flash loans)
function getPrice() public view returns (uint256) {
    return dexPair.getReserves(); // Manipulable in same transaction
}

// FIXED: Use time-weighted average price (TWAP) or Chainlink oracle
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

function getPrice() public view returns (uint256) {
    (, int256 answer, , uint256 updatedAt, ) = priceFeed.latestRoundData();
    if (answer <= 0) revert InvalidPrice();
    if (block.timestamp - updatedAt > 3600) revert StalePrice();
    return uint256(answer);
}
```

### Vulnerability Quick Reference

| Vulnerability | Detection | Mitigation |
|--------------|-----------|------------|
| Reentrancy | External calls before state updates | CEI pattern + `nonReentrant` modifier |
| Integer overflow | Solidity <0.8 without SafeMath | Use Solidity 0.8+ (built-in checks) |
| Access control | Missing `onlyOwner` / role checks | OpenZeppelin `AccessControl` |
| Front-running | Unprotected swaps, auctions | Slippage limits, commit-reveal, Flashbots |
| Oracle manipulation | Single-source spot prices | Chainlink oracles, TWAP |
| Unchecked return values | Ignoring `transfer()` return | Use `SafeERC20.safeTransfer()` |
| Denial of service | Unbounded loops, external call in loop | Pull pattern, gas limits |
| Storage collision (proxies) | Misaligned storage slots | ERC-1967 storage slots |

---

## Gas Optimization

### Storage Optimization

```solidity
// EXPENSIVE: Each storage slot is 32 bytes, each SSTORE costs 20,000 gas (cold)
// Pack variables into same slot when possible

// BAD: 3 storage slots (96 bytes)
uint256 amount;    // slot 0 (32 bytes)
address user;      // slot 1 (20 bytes, but uses full slot)
bool active;       // slot 2 (1 byte, but uses full slot)

// GOOD: 2 storage slots (52 bytes, user+active packed into slot 1)
uint256 amount;    // slot 0
address user;      // slot 1 (20 bytes)
bool active;       // slot 1 (1 byte, packed with user)
```

### Common Gas Savings

```solidity
// 1. Cache storage reads in memory
// BAD
function process() external {
    for (uint256 i = 0; i < items.length; i++) { // reads items.length from storage each iteration
        // ...
    }
}
// GOOD
function process() external {
    uint256 len = items.length; // single SLOAD
    for (uint256 i = 0; i < len; i++) {
        // ...
    }
}

// 2. Use calldata instead of memory for read-only function args
// BAD
function processArray(uint256[] memory data) external { ... }
// GOOD
function processArray(uint256[] calldata data) external { ... }

// 3. Use custom errors instead of revert strings
// BAD: ~256 bytes of deployment cost per string
require(amount > 0, "Amount must be greater than zero");
// GOOD: ~64 bytes, cheaper to deploy and to revert
error ZeroAmount();
if (amount == 0) revert ZeroAmount();

// 4. Use unchecked for provably safe arithmetic
function sum(uint256 a, uint256 b) internal pure returns (uint256) {
    // Only use when you can mathematically prove no overflow
    unchecked { return a + b; }
}

// 5. Short-circuit conditionals (put cheap check first)
// BAD
if (expensiveCall() && msg.sender == owner) { ... }
// GOOD
if (msg.sender == owner && expensiveCall()) { ... }
```

### Gas Comparison Reference

| Operation | Approximate Gas Cost |
|-----------|---------------------|
| SSTORE (cold, zero to non-zero) | 20,000 |
| SSTORE (warm, non-zero to non-zero) | 2,900 |
| SLOAD (cold) | 2,100 |
| SLOAD (warm) | 100 |
| Memory expansion (per word) | 3 |
| Calldata (per non-zero byte) | 16 |
| Calldata (per zero byte) | 4 |
| ETH transfer | 21,000 (base) |
| Contract creation | 32,000 (base) |
| LOG (per topic) | 375 |

---

## Testing with Foundry

```solidity
// test/MyToken.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {MyToken} from "../src/MyToken.sol";

contract MyTokenTest is Test {
    MyToken public token;
    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");

    function setUp() public {
        vm.prank(owner);
        token = new MyToken();
    }

    function test_MintSuccess() public {
        vm.prank(owner);
        token.mint(alice, 1000e18);
        assertEq(token.balanceOf(alice), 1000e18);
    }

    function test_MintRevertsForNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 1000e18);
    }

    function test_MintRevertsExceedMaxSupply() public {
        vm.prank(owner);
        vm.expectRevert();
        token.mint(alice, 1_000_001e18);
    }

    // Fuzz testing -- Foundry generates random inputs
    function testFuzz_MintWithinSupply(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000e18);
        vm.prank(owner);
        token.mint(alice, amount);
        assertEq(token.balanceOf(alice), amount);
    }

    // Invariant: total supply never exceeds MAX_SUPPLY
    function invariant_SupplyNeverExceedsMax() public view {
        assertLe(token.totalSupply(), token.MAX_SUPPLY());
    }
}
```

```shell
# Foundry commands
forge build                     # Compile contracts
forge test -vvv                 # Run tests (verbose)
forge test --gas-report         # Show gas usage per function
forge coverage                  # Show code coverage
forge snapshot                  # Create gas snapshot for comparison
forge script script/Deploy.s.sol --rpc-url $RPC --broadcast  # Deploy
```

---

## Security Audit Checklist

Before deploying any contract, review every item:

### Access Control
- [ ] Every state-changing function has appropriate access control
- [ ] `onlyOwner` / role-based access for admin functions
- [ ] No use of `tx.origin` for authentication
- [ ] Ownership transfer uses two-step pattern (Ownable2Step)

### Reentrancy
- [ ] Checks-Effects-Interactions pattern followed everywhere
- [ ] `nonReentrant` modifier on functions with external calls
- [ ] No state reads after external calls relied upon for logic

### Input Validation
- [ ] All external/public function inputs validated
- [ ] Zero address checks on address parameters
- [ ] Array length checks and bounds validation
- [ ] No unbounded loops over user-supplied data

### Token Handling
- [ ] Uses `SafeERC20` for all token transfers
- [ ] Handles fee-on-transfer tokens if needed
- [ ] Handles rebasing tokens if needed
- [ ] Approval race condition mitigated (use increaseAllowance)

### Economic Security
- [ ] Flash loan attack vectors analyzed
- [ ] Oracle manipulation resistance verified
- [ ] Slippage protection on all swaps
- [ ] MEV extraction vectors identified and mitigated

### Upgradeability (if using proxies)
- [ ] Storage layout documented and tested for collision
- [ ] Initializer used instead of constructor
- [ ] `_disableInitializers` called in implementation constructor
- [ ] No selfdestruct / delegatecall in implementation

### Deployment
- [ ] Constructor arguments verified
- [ ] Contract verified on block explorer
- [ ] Admin keys secured (multisig, not EOA)
- [ ] Emergency pause mechanism present
- [ ] Timelock on critical parameter changes

---

## Deployment Checklist

1. **All tests passing** with 100% coverage on critical paths
2. **Fuzz tests** run with minimum 10,000 iterations
3. **Professional audit** for contracts holding significant value
4. **Deploy to testnet first** (Sepolia, Arbitrum Sepolia, Base Sepolia)
5. **Verify source code** on Etherscan / block explorer
6. **Transfer ownership** to multisig (Gnosis Safe) -- never use an EOA for mainnet admin
7. **Set up monitoring** (OpenZeppelin Defender, Tenderly, Forta)
8. **Timelock** critical admin functions (minimum 24-48 hour delay)
9. **Emergency plan** documented: who can pause, under what conditions


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to smart contract developer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Smart Contract Developer Analysis

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

**Input:** "Help me with smart contract developer for my current situation"

**Output:**

Based on your situation, here is a structured approach to smart contract developer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
