# QEYRO FI attester

A small command-line tool for people who operate an **attester key** on the QEYRO FI Threat Oracle.
It lets you read the oracle, open a proposal with evidence, add your attestation, and apply a proposal once the quorum has signed.

> Pre-release. The oracle contracts are unaudited and not deployed. Use throwaway keys on a test network until that changes.

## Why a CLI

An attestation is a security decision, so the tool is deliberately cautious:

- **Simulate first.** Every transaction is simulated; a revert is explained in plain words before anything is signed.
- **Nothing is sent without `--yes`.** Without it you get the plan and the simulation result, with a non-zero exit code.
- **Evidence is hashed from the file you point at.** Anyone who has the file can recompute the hash.
- **The key never appears in output or errors**, and key files readable by other users are refused.
- **Chain guard.** Set `EXPECTED_CHAIN_ID` and the tool refuses to run against any other network.

## Install

```bash
npm install
npm run build
node dist/cli.js --help
```

Or run from source: `npm run dev -- status`.

## Configure

Copy `.env.example` and export the variables (the tool reads the process environment, not a file):

```bash
export RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
export ORACLE_ADDRESS=0x...
export EXPECTED_CHAIN_ID=11155111
export PRIVATE_KEY_FILE=$HOME/.qeyro/attester.key   # chmod 600
```

## Commands

```text
status                          Current level, freshness, quorum, evidence
proposals [--limit N]           Recent proposals with open / ready / expired / executed
watch                           Print oracle events as they happen
propose <level> --evidence <file|0xhash> --uri <url>
attest <id>
execute <id>
refresh <id>
balance                         Signer address and ETH balance
```

Options: `--yes` (send), `--dry-run` (never send), `--json` (machine-readable).

## A typical round

```bash
# Alice opens a proposal and attaches the evidence she verified
qeyro-attester propose 3 --evidence ./report.pdf --uri ipfs://bafy... --yes

# Bob reads it, checks the evidence himself, and attests
qeyro-attester attest 7 --yes

# Anyone can apply it once the threshold is met
qeyro-attester proposals          # shows "ready"
qeyro-attester execute 7 --yes
```

## What the oracle enforces (and the CLI mirrors)

- A level changes only when `threshold` distinct attesters back the same proposal.
- Proposals expire after 3 days.
- Upgrades apply immediately; downgrades wait `downgradeCooldown` after the last update.
- A proposal for the current level can only be used with `refresh`, which keeps the oracle fresh without changing the level.

## Run as a service

`deploy/` has a systemd unit for `watch` and a Dockerfile + compose file. See `docs/OPERATIONS.md`.

## Docs

- `docs/KEY_MANAGEMENT.md`: how to hold the key
- `docs/OPERATIONS.md`: monitoring and routine tasks
- `docs/RUNBOOK.md`: what to do when things go wrong

## License

MIT
