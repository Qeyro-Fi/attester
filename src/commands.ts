import { formatEther, type Hex } from "viem";
import { oracleAbi } from "./abi.js";
import type { Clients } from "./clients.js";
import type { Config } from "./config.js";
import { resolveEvidence, validateSourceUri } from "./evidence.js";
import { out, warn } from "./log.js";
import { isAttester, proposalStatus, readProposal, readStatus } from "./oracle.js";

const fmtTime = (s: number) => new Date(s * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";

export async function status(cfg: Config, c: Clients) {
  const s = await readStatus(c.publicClient, cfg.oracle);
  const human = [
    `Oracle        ${cfg.oracle} (chain ${c.chainId})`,
    `Level         ${s.level} ${s.levelName}`,
    `Fresh         ${s.fresh ? "yes" : "NO (stale)"}`,
    `Last update   ${fmtTime(s.lastUpdate)}`,
    `Quorum        ${s.threshold} of ${s.attesters}`,
    `Cooldown      ${s.downgradeCooldown}s before a downgrade`,
    `Proposals     ${s.proposals}`,
    `Evidence      ${s.evidenceHash}`,
    `Source        ${s.sourceURI || "-"}`,
  ].join("\n");
  out(human, { oracle: cfg.oracle, chainId: c.chainId, ...s });
}

export async function listProposals(cfg: Config, c: Clients, limit: number) {
  const s = await readStatus(c.publicClient, cfg.oracle);
  const now = Math.floor(Date.now() / 1000);
  const from = Math.max(1, s.proposals - limit + 1);
  const rows = [];
  for (let id = s.proposals; id >= from; id--) {
    const p = await readProposal(c.publicClient, cfg.oracle, id);
    rows.push({ ...p, status: proposalStatus(p, s.threshold, now) });
  }
  out(
    rows.length === 0
      ? "No proposals yet."
      : rows.map((r) => `#${r.id}  level ${r.level}  ${r.approvals}/${s.threshold}  ${r.status.padEnd(8)}  expires ${fmtTime(r.expiry)}  ${r.sourceURI}`).join("\n"),
    { threshold: s.threshold, proposals: rows },
  );
}

interface SendOpts {
  yes: boolean;
  dryRun: boolean;
}

async function send(cfg: Config, c: Clients, functionName: "propose" | "attest" | "execute" | "refresh", args: readonly unknown[], plan: string, o: SendOpts): Promise<Hex | undefined> {
  if (!c.walletClient || !c.account) throw new Error("no signing key configured");
  const request = { address: cfg.oracle, abi: oracleAbi, functionName, args, account: c.account } as never;
  // Always simulate first: a revert here costs nothing and gives the real reason.
  const sim = await c.publicClient.simulateContract(request);
  out(`Plan: ${plan}\nFrom: ${c.account.address}\nSimulation: passed`, { plan, from: c.account.address, simulation: "passed" });
  if (o.dryRun) {
    out("Dry run: nothing was sent.", { sent: false });
    return undefined;
  }
  if (!o.yes) {
    warn("Not sending: pass --yes to confirm (or --dry-run to only simulate).");
    process.exitCode = 2;
    return undefined;
  }
  const hash = await c.walletClient.writeContract(sim.request as never);
  out(`Submitted ${hash}`, { hash });
  const r = await c.publicClient.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`transaction ${hash} was mined but reverted`);
  out(`Confirmed in block ${r.blockNumber}`, { confirmed: true, block: Number(r.blockNumber), hash });
  return hash;
}

export async function propose(cfg: Config, c: Clients, level: number, evidenceInput: string, uri: string, o: SendOpts) {
  const evidence = resolveEvidence(evidenceInput);
  validateSourceUri(uri);
  if (!(await isAttester(c.publicClient, cfg.oracle, c.account!.address))) throw new Error(`${c.account!.address} does not hold ATTESTER_ROLE on this oracle`);
  const s = await readStatus(c.publicClient, cfg.oracle);
  if (level === s.level) warn(`level ${level} equals the current level: execute() will reject it; this is only useful with refresh`);
  if (level < s.level) warn(`downgrade ${s.level} -> ${level}: execute() waits ${s.downgradeCooldown}s after the last update`);
  await send(cfg, c, "propose", [level, evidence, uri], `propose level ${level} with evidence ${evidence}`, o);
}

export async function attest(cfg: Config, c: Clients, id: number, o: SendOpts) {
  if (!(await isAttester(c.publicClient, cfg.oracle, c.account!.address))) throw new Error(`${c.account!.address} does not hold ATTESTER_ROLE on this oracle`);
  const p = await readProposal(c.publicClient, cfg.oracle, id);
  out(`Proposal #${id}: level ${p.level}, ${p.approvals} approvals, evidence ${p.evidenceHash}\nSource: ${p.sourceURI}`, p);
  warn("Verify the evidence yourself before attesting. Your signature is part of the quorum.");
  await send(cfg, c, "attest", [BigInt(id)], `attest proposal #${id}`, o);
}

export async function execute(cfg: Config, c: Clients, id: number, o: SendOpts) {
  await send(cfg, c, "execute", [BigInt(id)], `execute proposal #${id}`, o);
}

export async function refresh(cfg: Config, c: Clients, id: number, o: SendOpts) {
  await send(cfg, c, "refresh", [BigInt(id)], `refresh with proposal #${id}`, o);
}

export async function watch(cfg: Config, c: Clients) {
  out(`Watching ${cfg.oracle} on chain ${c.chainId}. Ctrl+C to stop.`);
  c.publicClient.watchContractEvent({
    address: cfg.oracle,
    abi: oracleAbi,
    onLogs: (logs) => {
      for (const l of logs as unknown as { eventName: string; args: Record<string, unknown>; transactionHash: string }[]) {
        out(`${l.eventName} ${JSON.stringify(l.args, (_k, v) => (typeof v === "bigint" ? v.toString() : v))} tx ${l.transactionHash}`, { event: l.eventName, tx: l.transactionHash });
      }
    },
  });
  await new Promise(() => {});
}

export async function balance(c: Clients) {
  if (!c.account) throw new Error("no signing key configured");
  const b = await c.publicClient.getBalance({ address: c.account.address });
  out(`${c.account.address}  ${formatEther(b)} ETH`, { address: c.account.address, wei: b.toString() });
}
