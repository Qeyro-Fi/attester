## What changed

<!-- Command or behaviour. -->

## Why

## Safety checklist

- [ ] The signing key never reaches logs, errors, JSON output or process arguments
- [ ] Every write still simulates first and still needs `--yes` to send
- [ ] The chain-id guard still runs before any transaction
- [ ] New failure modes produce a one-line, human-readable error naming the cause
- [ ] Tests cover the failure path
- [ ] `npm run typecheck`, `npm test` and `npm run build` pass
- [ ] Tried against a local Hardhat node (steps in CONTRIBUTING.md) if a command changed

## Output sample

<!-- Paste the command output with any keys or addresses you do not want public removed. -->
