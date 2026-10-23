let json = false;

export function setJson(v: boolean) {
  json = v;
}

export function out(human: string, data?: unknown) {
  if (json) console.log(JSON.stringify(data ?? { message: human }));
  else console.log(human);
}

export function warn(message: string) {
  console.error(json ? JSON.stringify({ warning: message }) : `warning: ${message}`);
}

export function fail(message: string): never {
  console.error(json ? JSON.stringify({ error: message }) : `error: ${message}`);
  process.exit(1);
}
