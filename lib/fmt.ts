export function fmtRM(amount: number): string {
  return "RM " + Math.abs(amount).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
