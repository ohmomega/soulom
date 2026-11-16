import { isPlainObject } from "./http";

export interface VerifiedSlip {
  transRef: string;
  amount: number | null;
  receiverNames: string[];
}

function readPath(source: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, segment) => (isPlainObject(current) ? current[segment] : undefined), source);
}

function firstString(source: unknown, paths: string[][]): string | null {
  for (const path of paths) {
    const value = readPath(source, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(source: unknown, paths: string[][]): number | null {
  for (const path of paths) {
    const value = readPath(source, path);
    const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
    if (typeof numeric === "number" && Number.isFinite(numeric)) return numeric;
  }
  return null;
}

/**
 * Normalizes the response shapes of common Thai slip-verification providers
 * (EasySlip: data.amount.amount, data.receiver.account.name.{th,en};
 *  SlipOK: data.amount, data.receiver.{displayName,name}).
 */
export function normalizeSlipResponse(payload: unknown): VerifiedSlip | null {
  const data = isPlainObject(payload) && isPlainObject(payload.data) ? payload.data : payload;

  const transRef = firstString(data, [["transRef"], ["transactionRef"], ["transactionId"]]);
  if (!transRef) return null;

  const amount = firstNumber(data, [["amount", "amount"], ["amount"], ["paidLocalAmount"]]);

  const receiverNames = [
    ["receiver", "displayName"],
    ["receiver", "name"],
    ["receiver", "account", "name", "th"],
    ["receiver", "account", "name", "en"],
  ]
    .map((path) => readPath(data, path))
    .filter((name): name is string => typeof name === "string" && name.trim().length > 0);

  return { transRef, amount, receiverNames };
}

export function receiverMatches(slip: VerifiedSlip, expectedName: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");
  const expected = normalize(expectedName);
  if (!expected) return true;
  return slip.receiverNames.some((name) => {
    const candidate = normalize(name);
    if (candidate.includes(expected)) return true;
    const visiblePrefix = candidate.split(/[x*]/)[0] ?? "";
    return visiblePrefix.length >= 6 && expected.startsWith(visiblePrefix);
  });
}
