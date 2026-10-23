import { createPublicClient, createWalletClient, defineChain, http, type Account, type PublicClient, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Config } from "./config.js";

export interface Clients {
  publicClient: PublicClient;
  walletClient?: WalletClient;
  account?: Account;
  chainId: number;
}

/** Build clients for whatever chain the RPC serves, and verify it is the one you expect. */
export async function makeClients(cfg: Config): Promise<Clients> {
  const probe = createPublicClient({ transport: http(cfg.rpcUrl, { retryCount: 2, timeout: 15_000 }) });
  const chainId = await probe.getChainId();
  if (cfg.expectedChainId !== undefined && cfg.expectedChainId !== chainId) {
    throw new Error(`RPC reports chain ${chainId} but EXPECTED_CHAIN_ID is ${cfg.expectedChainId}; refusing to continue`);
  }
  const chain = defineChain({ id: chainId, name: `chain-${chainId}`, nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [cfg.rpcUrl] } } });
  const publicClient = createPublicClient({ chain, transport: http(cfg.rpcUrl, { retryCount: 2, timeout: 15_000 }) }) as PublicClient;
  if (!cfg.privateKey) return { publicClient, chainId };
  const account = privateKeyToAccount(cfg.privateKey);
  const walletClient = createWalletClient({ account, chain, transport: http(cfg.rpcUrl) });
  return { publicClient, walletClient, account, chainId };
}
