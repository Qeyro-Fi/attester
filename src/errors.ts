import { ConfigError } from "./config.js";

interface WalkableError {
  shortMessage?: string;
  message?: string;
  walk?: (fn: (e: unknown) => boolean) => unknown;
}

const HINTS: Record<string, string> = {
  AlreadyAttested: "this key has already attested this proposal",
  ProposalExpired: "the proposal is older than 3 days; open a new one",
  ProposalAlreadyExecuted: "the proposal was already applied",
  NotEnoughAttestations: "not enough attesters have signed yet; check `proposals`",
  SameLevel: "the proposed level equals the current level; use `refresh` to re-confirm instead",
  UnknownProposal: "no proposal with that id exists",
  DowngradeCooldownActive: "downgrades must wait after the last update; try again later",
  AccessControlUnauthorizedAccount: "this key does not hold the required role",
  InvalidLevel: "level must be 0-5 (and `refresh` needs the current level)",
};

/** Turn a viem/contract error into one line that names the revert reason. */
export function describeError(e: unknown): string {
  if (e instanceof ConfigError) return e.message;
  const err = e as WalkableError;
  const base = err.shortMessage ?? err.message ?? String(e);
  const named = err.walk?.((x) => typeof (x as { data?: { errorName?: string } })?.data?.errorName === "string") as { data?: { errorName?: string } } | undefined;
  const name = named?.data?.errorName;
  if (!name) return base;
  const hint = HINTS[name];
  return hint ? `${base.replace(/\.$/, "")}: ${name} (${hint})` : `${base.replace(/\.$/, "")}: ${name}`;
}
