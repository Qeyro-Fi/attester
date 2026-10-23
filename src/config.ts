import { readFileSync, statSync } from "node:fs";
import { isAddress, isHex, type Address, type Hex } from "viem";

export interface Config {
  rpcUrl: string;
  oracle: Address;
  privateKey?: Hex;
  expectedChainId?: number;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const KEY_RE = /^0x[0-9a-fA-F]{64}$/;

/** Read a one-line key file. Refuses files readable by group or others on POSIX systems. */
export function readKeyFile(path: string): Hex {
  let st;
  try {
    st = statSync(path);
  } catch {
    throw new ConfigError(`PRIVATE_KEY_FILE ${path} cannot be read`);
  }
  if (process.platform !== "win32" && (st.mode & 0o077) !== 0) {
    throw new ConfigError(`PRIVATE_KEY_FILE ${path} is accessible by other users; run: chmod 600 ${path}`);
  }
  const key = readFileSync(path, "utf8").trim();
  if (!KEY_RE.test(key)) throw new ConfigError("PRIVATE_KEY_FILE must contain a single 0x-prefixed 32-byte hex key");
  return key as Hex;
}

/** Parse configuration from an environment-like object. Needs a key only when `needKey` is true. */
export function loadConfig(env: Record<string, string | undefined>, needKey: boolean): Config {
  const rpcUrl = env.RPC_URL?.trim();
  if (!rpcUrl || !/^https?:\/\//.test(rpcUrl)) throw new ConfigError("RPC_URL must be an http(s) URL");

  const oracle = env.ORACLE_ADDRESS?.trim();
  if (!oracle || !isAddress(oracle)) throw new ConfigError("ORACLE_ADDRESS must be a valid address");

  let privateKey: Hex | undefined;
  if (env.PRIVATE_KEY_FILE) privateKey = readKeyFile(env.PRIVATE_KEY_FILE.trim());
  else if (env.PRIVATE_KEY) {
    const k = env.PRIVATE_KEY.trim();
    if (!KEY_RE.test(k) || !isHex(k)) throw new ConfigError("PRIVATE_KEY must be a 0x-prefixed 32-byte hex key");
    privateKey = k as Hex;
  }
  if (needKey && !privateKey) throw new ConfigError("This command signs a transaction: set PRIVATE_KEY_FILE (preferred) or PRIVATE_KEY");

  let expectedChainId: number | undefined;
  if (env.EXPECTED_CHAIN_ID) {
    expectedChainId = Number(env.EXPECTED_CHAIN_ID);
    if (!Number.isInteger(expectedChainId) || expectedChainId <= 0) throw new ConfigError("EXPECTED_CHAIN_ID must be a positive integer");
  }
  return { rpcUrl, oracle, privateKey, expectedChainId };
}
