#!/usr/bin/env node
import { parseArgs, parseId, parseLevel } from "./args.js";
import { makeClients } from "./clients.js";
import * as cmd from "./commands.js";
import { loadConfig } from "./config.js";
import { describeError } from "./errors.js";
import { fail, setJson } from "./log.js";

const HELP = `qeyro-attester: tool for Threat Oracle attesters

Usage: qeyro-attester <command> [options]

Read-only (no key needed)
  status                         Current level, freshness, quorum, evidence
  proposals [--limit N]          Recent proposals and their state (default 10)
  watch                          Print oracle events as they happen

Signing (needs PRIVATE_KEY_FILE or PRIVATE_KEY)
  propose <level> --evidence <file|0xhash> --uri <url>
  attest <id>
  execute <id>
  refresh <id>
  balance                        Signer address and ETH balance

Options
  --yes        Send the transaction (otherwise only the simulation runs)
  --dry-run    Simulate and print, never send
  --json       Machine-readable output
  --help       Show this help

Environment: RPC_URL, ORACLE_ADDRESS, PRIVATE_KEY_FILE | PRIVATE_KEY, EXPECTED_CHAIN_ID (optional)
`;

const SIGNING = new Set(["propose", "attest", "execute", "refresh", "balance"]);

async function main() {
  const p = parseArgs(process.argv.slice(2), ["evidence", "uri", "limit"]);
  setJson(Boolean(p.flags.json));
  if (p.command === "help" || p.flags.help) return void console.log(HELP);

  const cfg = loadConfig(process.env, SIGNING.has(p.command));
  const c = await makeClients(cfg);
  const o = { yes: Boolean(p.flags.yes), dryRun: Boolean(p.flags["dry-run"]) };

  switch (p.command) {
    case "status":
      return cmd.status(cfg, c);
    case "proposals":
      return cmd.listProposals(cfg, c, p.flags.limit ? Number(p.flags.limit) : 10);
    case "watch":
      return cmd.watch(cfg, c);
    case "balance":
      return cmd.balance(c);
    case "propose": {
      const level = parseLevel(p.positionals[0]);
      if (typeof p.flags.evidence !== "string") throw new Error("--evidence <file|0xhash> is required");
      if (typeof p.flags.uri !== "string") throw new Error("--uri <url> is required");
      return cmd.propose(cfg, c, level, p.flags.evidence, p.flags.uri, o);
    }
    case "attest":
      return cmd.attest(cfg, c, parseId(p.positionals[0]), o);
    case "execute":
      return cmd.execute(cfg, c, parseId(p.positionals[0]), o);
    case "refresh":
      return cmd.refresh(cfg, c, parseId(p.positionals[0]), o);
    default:
      throw new Error(`unknown command "${p.command}". Run with --help.`);
  }
}

main().catch((e: unknown) => fail(describeError(e)));
