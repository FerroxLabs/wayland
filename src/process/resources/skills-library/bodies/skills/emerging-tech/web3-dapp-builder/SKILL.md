---
name: web3-dapp-builder
description: |
  Decentralized application development expertise covering frontend-blockchain integration, wallet connection (RainbowKit, ConnectKit), transaction handling with viem and ethers.js, smart contract interaction patterns, state management for on-chain data, event indexing, error handling, testing strategies, and production deployment for web3 frontends.
  Use when the user asks about web3 dapp builder, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of web3 dapp builder or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced blockchain checklist javascript typescript api-design testing automation"
  category: "emerging-tech"
  subcategory: "blockchain-web3"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Web3 dApp Builder

You are an expert in building decentralized application frontends that interact with blockchain networks. You specialize in wallet connection, smart contract interaction, transaction management, on-chain data reading, and the full stack of tools needed to build production-quality web3 user experiences.


## When to Use

**Use this skill when:**
- User asks about web3 dapp builder techniques or best practices
- User needs guidance on web3 dapp builder concepts
- User wants to implement or improve their approach to web3 dapp builder

**Do NOT use when:**
- The request falls outside the scope of web3 dapp builder
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Framework:** React/Next.js, Vue/Nuxt, Svelte, or vanilla JavaScript?
2. **Target chains:** Ethereum mainnet, L2s (Arbitrum, Base, Optimism), or multi-chain?
3. **Smart contracts:** Do you have existing contracts, or building from scratch?
4. **Features needed:** Wallet connect, token transfers, NFT minting, DeFi interactions, governance?
5. **Library preference:** viem/wagmi (recommended) or ethers.js?
6. **User experience goals:** Crypto-native users, or onboarding non-crypto users?

---

## Library Selection

### viem + wagmi (Recommended)

The modern standard for React-based web3 development. Type-safe, modular, and well-maintained.

```
Stack:
  viem       -> Low-level blockchain interaction (replaces ethers.js)
  wagmi      -> React hooks for blockchain (built on viem + TanStack Query)
  RainbowKit -> Wallet connection UI component
```

### Comparison

| Feature | viem + wagmi | ethers.js v6 |
|---------|-------------|-------------|
| TypeScript | First-class, ABI type inference | Good, but less ABI inference |
| Bundle size | Smaller (tree-shakeable) | Larger |
| React integration | wagmi hooks (excellent) | Manual or third-party |
| Error handling | Detailed, typed errors | Generic error types |
| Documentation | Excellent (viem docs, wagmi docs) | Excellent (ethers docs) |
| Framework support | Any (viem) / React (wagmi) | Any framework |

Use ethers.js when: existing codebase uses ethers, non-React frameworks, simple backend scripts.

---

## Project Setup (Next.js + wagmi + RainbowKit)

```shell
npx create-wagmi@latest my-dapp  # Select: Next.js, RainbowKit

# Or manual setup:
add the package dependency wagmi viem@2.x @tanstack/react-query @rainbow-me/rainbowkit
```

```typescript
// wagmi.config.ts
import { http } from "wagmi";
import { mainnet, arbitrum, base, optimism } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "My dApp",
  projectId: CONFIG.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [mainnet, arbitrum, base, optimism],
  transports: {
    [mainnet.id]: http(CONFIG.NEXT_PUBLIC_RPC_MAINNET),
    [arbitrum.id]: http(CONFIG.NEXT_PUBLIC_RPC_ARBITRUM),
    [base.id]: http(CONFIG.NEXT_PUBLIC_RPC_BASE),
    [optimism.id]: http(CONFIG.NEXT_PUBLIC_RPC_OPTIMISM),
  },
});
```

```typescript
// app/providers.tsx -- Wrap your app with these providers
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { config } from "../wagmi.config";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

---

## Wallet Connection

```typescript
// Simple: Drop-in connect button
import { ConnectButton } from "@rainbow-me/rainbowkit";
export function Header() {
  return <header><ConnectButton /></header>;
}

// Reading wallet state
import { useAccount, useBalance, useChainId, useEnsName } from "wagmi";

export function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });

  if (!isConnected) return <p>Not connected</p>;
  return <p>{ensName || address}: {balance?.formatted} {balance?.symbol}</p>;
}
```

---

## Reading Smart Contract Data

```typescript
import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";

// Define ABI fragments (only include functions you need)
const tokenAbi = [
  { name: "balanceOf", type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { name: "totalSupply", type: "function",
    inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
] as const;

// Single read
export function TokenBalance({ user }: { user: `0x${string}` }) {
  const { data, isLoading } = useReadContract({
    address: "0xToken...", abi: tokenAbi,
    functionName: "balanceOf", args: [user],
  });
  if (isLoading) return <span>Loading...</span>;
  return <span>{formatUnits(data ?? 0n, 18)} tokens</span>;
}

// Batched reads (single RPC call via multicall)
const { data } = useReadContracts({
  contracts: [
    { address: TOKEN, abi: tokenAbi, functionName: "balanceOf", args: [user] },
    { address: TOKEN, abi: tokenAbi, functionName: "totalSupply" },
  ],
});
```

### Using viem directly (non-React / backend)

```typescript
import { createPublicClient, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({ chain: mainnet, transport: http() });

const balance = await client.readContract({
  address: "0x...",
  abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
  functionName: "balanceOf",
  args: ["0xUser..."],
});
```

---

## Writing Transactions

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";

export function TransferToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleTransfer() {
    writeContract({
      address: "0xToken...",
      abi: [{ name: "transfer", type: "function",
        inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
        outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" }] as const,
      functionName: "transfer",
      args: ["0xRecipient...", parseUnits("100", 18)],
    });
  }

  return (
    <div>
      <button onClick={handleTransfer} disabled={isPending}>
        {isPending ? "Confirming in wallet..." : "Transfer 100 Tokens"}
      </button>
      {hash && <p>Tx: {hash}</p>}
      {isConfirming && <p>Waiting for confirmation...</p>}
      {isSuccess && <p>Confirmed!</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Approve + Execute Pattern

Many DeFi interactions require a two-step flow: approve token spending, then execute the action.

```typescript
// 1. Check existing allowance with useReadContract
// 2. If allowance < needed amount, call approve() first
// 3. Wait for approval confirmation
// 4. Then call the deposit/swap/stake function

// Security: Use exact amounts for approvals, not maxUint256
// approve(spender, exactAmount)  -- GOOD
// approve(spender, maxUint256)   -- RISKY (unlimited approval)
```

---

## Event Listening

```typescript
// Real-time events
import { useWatchContractEvent } from "wagmi";

useWatchContractEvent({
  address: "0xToken...",
  abi: [{ name: "Transfer", type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ]}] as const,
  eventName: "Transfer",
  onLogs(logs) { console.log("New transfers:", logs); },
});

// Historical events (viem)
const logs = await client.getLogs({
  address: "0xToken...",
  event: parseAbiItem("event Transfer(address indexed, address indexed, uint256)"),
  fromBlock: 18000000n,
  toBlock: "latest",
});
```

---

## Error Handling

```typescript
import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

function handleTransactionError(error: Error): string {
  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError))
      return "Transaction rejected by user.";

    const revertError = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const messages: Record<string, string> = {
        InsufficientBalance: "Not enough tokens.",
        ExceedsMaxSupply: "Max supply reached.",
        SlippageExceeded: "Price moved too much. Increase slippage.",
      };
      return messages[revertError.data?.errorName ?? ""] ?? `Contract error: ${revertError.data?.errorName}`;
    }

    if (error.message.includes("insufficient funds"))
      return "Insufficient ETH for gas.";
  }
  return "Unexpected error. Please try again.";
}
```

---

## Common Hooks Reference

| Pattern | Hook | Use Case |
|---------|------|----------|
| Connect wallet | `<ConnectButton />` | User authentication |
| Read balance | `useBalance()` | Display ETH/token balance |
| Read contract | `useReadContract()` | Any view/pure function call |
| Batch reads | `useReadContracts()` | Multiple reads in one RPC call |
| Write transaction | `useWriteContract()` | State-changing contract call |
| Wait for receipt | `useWaitForTransactionReceipt()` | Confirm tx in block |
| Watch events | `useWatchContractEvent()` | Real-time event feed |
| Send ETH | `useSendTransaction()` | Simple ETH transfer |
| Sign message | `useSignMessage()` | Off-chain signature (login) |
| Switch chain | `useSwitchChain()` | Change active network |
| ENS lookup | `useEnsName()` / `useEnsAddress()` | Resolve ENS names |
| Gas estimation | `useEstimateGas()` | Show estimated gas |

---

## Multi-Chain Architecture

```typescript
// config/contracts.ts -- Map contract addresses per chain
import { mainnet, arbitrum, base } from "wagmi/chains";

export const CONTRACTS = {
  token: {
    [mainnet.id]: "0xMainnet...",
    [arbitrum.id]: "0xArbitrum...",
    [base.id]: "0xBase...",
  },
} as const;

// hooks/useContractAddress.ts
import { useChainId } from "wagmi";

export function useContractAddress(name: keyof typeof CONTRACTS) {
  const chainId = useChainId();
  return CONTRACTS[name]?.[chainId as keyof (typeof CONTRACTS)[typeof name]];
}
```

```
Recommended Project Structure:

src/
├── abi/            # Contract ABIs (auto-generated from Foundry/Hardhat)
├── config/
│   ├── wagmi.ts    # Chain and transport configuration
│   └── contracts.ts # Contract addresses per chain
├── hooks/          # Domain-specific hooks wrapping wagmi
├── components/     # ConnectButton, TransactionButton, TokenInput
├── lib/
│   ├── formatters.ts  # Address truncation, number formatting
│   └── errors.ts      # Error parsing to user-friendly messages
└── app/
    ├── providers.tsx   # Wagmi + RainbowKit + QueryClient
    └── page.tsx
```

---

## Production Checklist

### Security
- [ ] Private RPC endpoints (Alchemy, Infura) -- never expose API keys in client code
- [ ] All sensitive config in environment variables, not committed to git
- [ ] Contract addresses verified against official sources
- [ ] ABIs match deployed contract versions
- [ ] Chain ID verification before every transaction
- [ ] Exact approval amounts, not unlimited
- [ ] Input validation on all user-provided values
- [ ] Transaction simulation before submission when possible

### User Experience
- [ ] Loading states for all async operations
- [ ] Human-readable error messages (not raw contract reverts)
- [ ] Transaction lifecycle feedback (pending, confirming, confirmed)
- [ ] Network switching prompts when user is on wrong chain
- [ ] Mobile wallet testing (WalletConnect, in-app browsers)
- [ ] Graceful disconnect handling
- [ ] ENS names displayed where available

### Performance
- [ ] RPC calls batched with multicall / useReadContracts
- [ ] TanStack Query caching (built into wagmi) with appropriate stale times
- [ ] Tree-shaken imports (unused ABIs and chains removed from bundle)
- [ ] The Graph or indexer for historical data (not getLogs for large ranges)
- [ ] WebSocket transport for real-time data instead of polling

### Testing
- [ ] Wagmi mock connector for unit tests
- [ ] Anvil (Foundry) for local forked blockchain testing
- [ ] E2E tests with Synpress or similar wallet automation
- [ ] Test on multiple wallets (MetaMask, Coinbase Wallet, WalletConnect)
- [ ] Test on multiple chains (mainnet behavior can differ from testnet)


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to web3 dapp builder
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Web3 Dapp Builder Analysis

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

**Input:** "Help me with web3 dapp builder for my current situation"

**Output:**

Based on your situation, here is a structured approach to web3 dapp builder:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
