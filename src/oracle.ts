import type { Address, Hex, PublicClient } from "viem";
import { oracleAbi } from "./abi.js";

export const LEVEL_NAMES = ["Nominal", "Early Warning", "Elevated", "High", "Critical", "Emergency"] as const;

export async function readStatus(client: PublicClient, oracle: Address) {
  const c = { address: oracle, abi: oracleAbi } as const;
  const [level, lastUpdate, maxAge, cooldown, threshold, attesters, proposals, fresh, evidence, uri] = await Promise.all([
    client.readContract({ ...c, functionName: "threatLevel" }),
    client.readContract({ ...c, functionName: "lastUpdate" }),
    client.readContract({ ...c, functionName: "maxAge" }),
    client.readContract({ ...c, functionName: "downgradeCooldown" }),
    client.readContract({ ...c, functionName: "threshold" }),
    client.readContract({ ...c, functionName: "attesterCount" }),
    client.readContract({ ...c, functionName: "proposalCount" }),
    client.readContract({ ...c, functionName: "isFresh" }),
    client.readContract({ ...c, functionName: "evidenceHash" }),
    client.readContract({ ...c, functionName: "sourceURI" }),
  ]);
  return {
    level,
    levelName: LEVEL_NAMES[level] ?? "Unknown",
    lastUpdate: Number(lastUpdate),
    maxAge: Number(maxAge),
    downgradeCooldown: Number(cooldown),
    threshold,
    attesters,
    proposals: Number(proposals),
    fresh,
    evidenceHash: evidence as Hex,
    sourceURI: uri,
  };
}

export async function isAttester(client: PublicClient, oracle: Address, who: Address): Promise<boolean> {
  const role = await client.readContract({ address: oracle, abi: oracleAbi, functionName: "ATTESTER_ROLE" });
  return client.readContract({ address: oracle, abi: oracleAbi, functionName: "hasRole", args: [role, who] });
}

export async function readProposal(client: PublicClient, oracle: Address, id: number) {
  const p = await client.readContract({ address: oracle, abi: oracleAbi, functionName: "getProposal", args: [BigInt(id)] });
  return { id, level: p.level, executed: p.executed, approvals: p.approvals, expiry: Number(p.expiry), evidenceHash: p.evidenceHash as Hex, sourceURI: p.sourceURI };
}

export type ProposalStatus = "executed" | "expired" | "open" | "ready";

/** `ready` means approvals reached the threshold and the proposal can be executed. */
export function proposalStatus(p: { executed: boolean; approvals: number; expiry: number }, threshold: number, nowSeconds: number): ProposalStatus {
  if (p.executed) return "executed";
  if (nowSeconds > p.expiry) return "expired";
  return p.approvals >= threshold ? "ready" : "open";
}
