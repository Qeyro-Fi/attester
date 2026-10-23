import { readFileSync } from "node:fs";
import { keccak256, toBytes, type Hex } from "viem";

/** Hash the exact bytes of an evidence file. Anyone with the file can recompute this. */
export function hashEvidenceFile(path: string): Hex {
  return keccak256(readFileSync(path));
}

export function hashEvidenceText(text: string): Hex {
  return keccak256(toBytes(text));
}

const HEX32 = /^0x[0-9a-fA-F]{64}$/;

/** Accept either a file path (hashed) or an already computed 32-byte hash. */
export function resolveEvidence(input: string): Hex {
  if (HEX32.test(input)) return input as Hex;
  try {
    return hashEvidenceFile(input);
  } catch {
    throw new Error(`evidence "${input}" is neither a 32-byte hex hash nor a readable file`);
  }
}

const ALLOWED_SCHEMES = new Set(["https:", "http:", "ipfs:", "ar:"]);

/** The source URI is stored on-chain and shown to users, so keep it to well-known schemes. */
export function validateSourceUri(uri: string): string {
  if (uri.length === 0) throw new Error("source URI is required: attesters must say where the evidence can be found");
  if (uri.length > 512) throw new Error("source URI is longer than 512 characters");
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    throw new Error(`source URI "${uri}" is not a valid URL`);
  }
  if (!ALLOWED_SCHEMES.has(u.protocol)) throw new Error(`source URI scheme ${u.protocol} is not allowed (use https, http, ipfs or ar)`);
  return uri;
}
