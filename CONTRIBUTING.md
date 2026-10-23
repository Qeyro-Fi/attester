# Contributing to QEYRO FI attester

This tool holds a signing key that can move the threat level other people's accounts react to. Every change is reviewed with that in mind.

## Before you start

- Open an issue first, especially for anything that touches key handling, sending, or the chain-id guard.
- Found a way to leak a key or send without `--yes`? Do not open an issue. Follow `SECURITY.md`.

## Set up

```bash
git clone https://github.com/Qeyro-Fi/qeyro-fi-attester && cd qeyro-fi-attester
npm install
npm test                # 21 tests
npm run build && node dist/cli.js --help
```

## How a good change looks

1. A new error path gets a test, and the test checks that no key material appears in the message.
2. Writes still simulate first and still need `--yes` to send.
3. You tried it against a local node (steps below) when a command changed.

## Commit messages

Say which safety property you are protecting or adding:

```
Refuse key files readable by other users

A world-readable key file is a leaked key; fail with the chmod command.
```

## Attester-tool rules

- The key stays out of every output channel. Add a test when you add a new error path.
- Writes always simulate first. `--yes` is the only way to send.
- Keep error messages one line, naming the cause and (where possible) the fix.

## Trying a change against a local node

```bash
# terminal 1, in qeyro-fi-contracts
npx hardhat node

# terminal 2, in qeyro-fi-contracts: deploy an oracle with two attesters, threshold 2
ATTESTERS=<addr0>,<addr1> THRESHOLD=2 npx hardhat run scripts/deploy.js --network localhost

# terminal 3, here
npm run build
export RPC_URL=http://127.0.0.1:8545 ORACLE_ADDRESS=<oracle> EXPECTED_CHAIN_ID=31337
PRIVATE_KEY=<hardhat account 0 key> node dist/cli.js propose 3 --evidence ./note.txt --uri https://example.org/e --yes
```

Use only the well-known throwaway Hardhat keys. Never paste a real key into an issue or a PR.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

## Conduct

Be respectful and specific. See `CODE_OF_CONDUCT.md`.
