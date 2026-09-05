// DTI calculation helpers — pure functions, no side effects.

export const toNum = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// Standard amortized monthly P&I payment.
// principal in dollars, apr in percent (e.g. 6.75), years integer
export const monthlyPI = (principal, apr, years) => {
  const P = toNum(principal);
  const r = toNum(apr) / 100 / 12;
  const n = Math.round(toNum(years) * 12);
  if (P <= 0 || n <= 0) return 0;
  if (r === 0) return P / n;
  const pmt = (P * r) / (1 - Math.pow(1 + r, -n));
  return pmt;
};

export const fmtUSD = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

export const fmtUSD0 = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export const fmtPct = (n, digits = 2) =>
  `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;

// DTI status zones (industry conventional thresholds)
// Round to 2 decimals to avoid IEEE-754 boundary misclassification (e.g. 28.000000000000004).
// Front-end: safe ≤ 28, warn ≤ 35, danger > 35
// Back-end:  safe ≤ 36, warn ≤ 43, danger > 43
const round2 = (n) => Math.round(n * 100) / 100;
export const frontEndZone = (pct) => {
  const p = round2(pct);
  if (p <= 28) return "safe";
  if (p <= 35) return "warn";
  return "danger";
};
export const backEndZone = (pct) => {
  const p = round2(pct);
  if (p <= 36) return "safe";
  if (p <= 43) return "warn";
  return "danger";
};

export const zoneColor = {
  safe: {
    bar: "bg-emerald-500",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Safe",
  },
  warn: {
    bar: "bg-amber-500",
    text: "text-amber-700",
    ring: "ring-amber-200",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    label: "Caution",
  },
  danger: {
    bar: "bg-red-500",
    text: "text-red-700",
    ring: "ring-red-200",
    badge: "bg-red-50 text-red-700 border-red-200",
    label: "High Risk",
  },
};
