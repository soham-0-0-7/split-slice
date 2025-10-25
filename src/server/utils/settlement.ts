export type Debt = [string, string, number];

const EPS = 1e-9;

/**
 * Computes optimized settlements by netting all debts within a group.
 * Input: array of [payer, receiver, amount]
 * Output: array of minimal [payer, receiver, amount] to settle all.
 */
export function computeOptimizedSettlements(debts: Debt[]): Debt[] {
  // Build net balances for everyone in the input (payer -> -amount, receiver -> +amount)
  const net: Record<string, number> = {};
  for (const [payer, receiver, amt] of debts) {
    if (!payer || !receiver) continue;
    if (payer === receiver) continue; // ignore self-debts
    const amount = Number(amt) || 0;
    if (Math.abs(amount) < EPS) continue;
    net[payer] = (net[payer] ?? 0) - amount;
    net[receiver] = (net[receiver] ?? 0) + amount;
  }

  // Separate into creditors (positive) and debtors (negative)
  const creditors: { id: string; bal: number }[] = [];
  const debtors: { id: string; bal: number }[] = [];

  for (const [id, balRaw] of Object.entries(net)) {
    const bal = Math.round(balRaw * 100) / 100; // cents precision
    if (Math.abs(bal) < EPS) continue;
    if (bal > 0) creditors.push({ id, bal });
    else debtors.push({ id, bal });
  }

  // Sort creditors desc (largest creditor first), debtors asc (most negative first)
  creditors.sort((a, b) => b.bal - a.bal);
  debtors.sort((a, b) => a.bal - b.bal);

  // Greedy match largest creditor with largest debtor
  const matches: Debt[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const cred = creditors[ci];
    const debt = debtors[di];
    const payAmt = Math.min(cred.bal, Math.abs(debt.bal));
    if (payAmt <= EPS) break;

    // debtor pays creditor
    matches.push([debt.id, cred.id, Math.round(payAmt * 100) / 100]);

    cred.bal = Math.round((cred.bal - payAmt) * 100) / 100;
    debt.bal = Math.round((debt.bal + payAmt) * 100) / 100; // debt.bal is negative

    if (cred.bal <= EPS) ci++;
    if (Math.abs(debt.bal) <= EPS) di++;
  }

  // Consolidate multiple matches between same pair
  const consolidated: Record<string, number> = {};
  for (const [payer, receiver, amount] of matches) {
    const key = `${payer}=>${receiver}`;
    consolidated[key] = (consolidated[key] ?? 0) + amount;
  }

  const result: Debt[] = [];
  for (const [key, val] of Object.entries(consolidated)) {
    const [payer, receiver] = key.split("=>");
    const amt = Math.round(val * 100) / 100;
    if (amt > EPS) result.push([payer, receiver, amt]);
  }

  return result;
}
