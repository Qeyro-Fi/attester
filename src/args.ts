export interface Parsed {
  command: string;
  positionals: string[];
  flags: Record<string, string | boolean>;
}

const BOOLEAN_FLAGS = new Set(["yes", "json", "help", "dry-run"]);

/** Minimal parser: `command [positionals] --flag value --bool`. Unknown flags are errors. */
export function parseArgs(argv: string[], known: string[]): Parsed {
  const [command = "help", ...rest] = argv;
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  const allowed = new Set([...known, ...BOOLEAN_FLAGS]);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith("--")) {
      const name = a.slice(2);
      if (!allowed.has(name)) throw new Error(`unknown option --${name}`);
      if (BOOLEAN_FLAGS.has(name)) flags[name] = true;
      else {
        const v = rest[++i];
        if (v === undefined || v.startsWith("--")) throw new Error(`--${name} needs a value`);
        flags[name] = v;
      }
    } else positionals.push(a);
  }
  return { command, positionals, flags };
}

export function parseLevel(s: string | undefined): number {
  const n = Number(s);
  if (s === undefined || !Number.isInteger(n) || n < 0 || n > 5) throw new Error("level must be an integer 0-5");
  return n;
}

export function parseId(s: string | undefined): number {
  const n = Number(s);
  if (s === undefined || !Number.isInteger(n) || n <= 0) throw new Error("proposal id must be a positive integer");
  return n;
}
