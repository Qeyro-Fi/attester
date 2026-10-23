# Security policy

QEYRO FI attester is pre-release software and has not been independently audited.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

1. Open a private advisory: https://github.com/Qeyro-Fi/qeyro-fi-attester/security/advisories/new
2. Describe what you found, how to reproduce it, and what you think the impact is.
3. If it affects deployed contracts, include the network and addresses.

You will get an acknowledgement within 7 days. We ask for a 90-day disclosure window by default so a fix can ship before details are public.

## In scope

Code in `src/` and the files in `deploy/`. This tool holds a signing key, so we especially want to hear about:

- Any path that prints, logs or persists the private key (output, errors, JSON mode, crash dumps)
- A way to send a transaction without `--yes`, or to skip simulation
- A bypass of `EXPECTED_CHAIN_ID` or of the key-file permission check
- A mismatch between the evidence file and the hash that is submitted
- Unsafe defaults in the Docker or systemd files

## Out of scope

- Compromise of the machine that holds the key
- Contract-level issues (report those in `qeyro-fi-contracts`)
- RPC provider outages

## What we promise (and do not)

- We will credit reporters who want credit.
- There is no bug bounty yet.
- We make no guarantee of protection against any attack. See the risk disclosures in the documentation.
