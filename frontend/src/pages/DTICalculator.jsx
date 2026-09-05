import { useMemo, useState } from "react";
import {
  Landmark,
  Wallet,
  Home,
  CreditCard,
  Printer,
  RotateCcw,
  Info,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CurrencyInput, PlainNumberInput, TextInput } from "@/components/dti/CurrencyInput";
import { DTIGauge } from "@/components/dti/DTIGauge";
import {
  toNum,
  monthlyPI,
  fmtUSD,
  fmtPct,
  frontEndZone,
  backEndZone,
  zoneColor,
} from "@/lib/dti";

const initialState = {
  borrowerName: "",
  // Loan
  loanAmount: "",
  apr: "",
  years: "30",
  // Income (monthly)
  baseIncome: "",
  rentalIncome: "",
  bonusIncome: "",
  otherIncome: "",
  // Housing (monthly)
  propertyTax: "",
  insurance: "",
  hoa: "",
  escrow: "",
  // Other debts (monthly)
  carLoans: "",
  creditCards: "",
  otherDebts: "",
};

const SectionCard = ({ icon: Icon, title, description, children, testid }) => (
  <Card
    data-testid={testid}
    className="print-card border-slate-200 bg-white shadow-sm"
  >
    <CardHeader className="pb-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div>
          <CardTitle className="font-heading text-base font-semibold text-slate-900">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-slate-500">
              {description}
            </CardDescription>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const StatRow = ({ label, value, bold, testid, muted }) => (
  <div className="flex items-baseline justify-between py-1.5">
    <span
      className={`text-sm ${
        muted ? "text-slate-500" : "text-slate-700"
      } ${bold ? "font-semibold text-slate-900" : ""}`}
    >
      {label}
    </span>
    <span
      data-testid={testid}
      className={`font-mono-num tabular-nums text-sm ${
        bold ? "font-semibold text-slate-900" : "text-slate-800"
      }`}
    >
      {value}
    </span>
  </div>
);

export default function DTICalculator() {
  const [f, setF] = useState(initialState);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const c = useMemo(() => {
    const pi = monthlyPI(f.loanAmount, f.apr, f.years);
    const housing =
      toNum(f.propertyTax) +
      toNum(f.insurance) +
      toNum(f.hoa) +
      toNum(f.escrow);
    const piti = pi + housing;

    const income =
      toNum(f.baseIncome) +
      toNum(f.rentalIncome) +
      toNum(f.bonusIncome) +
      toNum(f.otherIncome);

    const otherDebt =
      toNum(f.carLoans) + toNum(f.creditCards) + toNum(f.otherDebts);
    const totalMonthlyDebt = piti + otherDebt;

    const frontPct = income > 0 ? (piti / income) * 100 : 0;
    const backPct = income > 0 ? (totalMonthlyDebt / income) * 100 : 0;

    return {
      pi,
      housing,
      piti,
      income,
      otherDebt,
      totalMonthlyDebt,
      frontPct,
      backPct,
      frontZone: frontEndZone(frontPct),
      backZone: backEndZone(backPct),
    };
  }, [f]);

  const handleReset = () => {
    setF(initialState);
    toast.success("All fields cleared", { duration: 1500 });
  };

  const handlePrint = () => {
    if (c.income <= 0) {
      toast.error("Enter monthly income before printing", { duration: 2000 });
      return;
    }
    window.print();
  };

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header
        className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md"
        data-testid="app-header"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
              <Landmark className="h-4.5 w-4.5" strokeWidth={2.25} />
            </div>
            <div>
              <div className="font-heading text-base font-bold tracking-tight text-slate-900">
                LendClear
              </div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                DTI Calculator
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <Calculator className="h-3.5 w-3.5" />
            <span className="font-medium">
              Live front-end &amp; back-end debt-to-income
            </span>
          </div>
        </div>
      </header>

      {/* Print header (only visible on print) */}
      <div className="print-only px-2 py-4">
        <div className="flex items-baseline justify-between border-b border-black pb-2">
          <div>
            <div className="text-xl font-bold">DTI Analysis Report</div>
            <div className="text-sm">
              Borrower: {f.borrowerName || "—"}
            </div>
          </div>
          <div className="text-sm">Prepared: {dateStr}</div>
        </div>
      </div>

      <main className="print-container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="print-grid grid grid-cols-12 gap-6">
          {/* LEFT: Input sections */}
          <div className="col-span-12 space-y-6 lg:col-span-8">
            {/* Borrower */}
            <Card
              data-testid="section-borrower"
              className="print-card border-slate-200 bg-white shadow-sm"
            >
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextInput
                    id="borrower-name"
                    label="Borrower Name (optional)"
                    testid="input-borrower-name"
                    value={f.borrowerName}
                    onChange={(v) => set("borrowerName")(v)}
                    placeholder="e.g. John Smith"
                  />
                </div>
              </CardContent>
            </Card>

            <SectionCard
              icon={Landmark}
              title="Loan Details"
              description="Loan program used for the P&I calculation"
              testid="section-loan"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <CurrencyInput
                  id="loan-amount"
                  testid="input-loan-amount"
                  label="Loan Amount"
                  value={f.loanAmount}
                  onChange={set("loanAmount")}
                  placeholder="350000"
                  step="1"
                />
                <PlainNumberInput
                  id="apr"
                  testid="input-apr"
                  label="APR"
                  suffix="%"
                  value={f.apr}
                  onChange={set("apr")}
                  placeholder="6.75"
                  step="0.001"
                />
                <PlainNumberInput
                  id="years"
                  testid="input-years"
                  label="Term (years)"
                  suffix="yrs"
                  value={f.years}
                  onChange={set("years")}
                  placeholder="30"
                  step="1"
                />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Info className="h-3.5 w-3.5" />
                  <span>Estimated monthly Principal &amp; Interest</span>
                </div>
                <span
                  data-testid="calc-monthly-pi"
                  className="font-mono-num tabular-nums text-base font-semibold text-slate-900"
                >
                  {fmtUSD(c.pi)}
                </span>
              </div>
            </SectionCard>

            <SectionCard
              icon={Wallet}
              title="Monthly Income"
              description="Gross monthly qualifying income"
              testid="section-income"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CurrencyInput
                  id="base-income"
                  testid="input-base-income"
                  label="Base Income"
                  value={f.baseIncome}
                  onChange={set("baseIncome")}
                />
                <CurrencyInput
                  id="rental-income"
                  testid="input-rental-income"
                  label="Rental Income"
                  value={f.rentalIncome}
                  onChange={set("rentalIncome")}
                />
                <CurrencyInput
                  id="bonus-income"
                  testid="input-bonus-income"
                  label="Bonus / Commission"
                  value={f.bonusIncome}
                  onChange={set("bonusIncome")}
                />
                <CurrencyInput
                  id="other-income"
                  testid="input-other-income"
                  label="Other Income"
                  value={f.otherIncome}
                  onChange={set("otherIncome")}
                />
              </div>
              <Separator className="my-4" />
              <StatRow
                label="Total Monthly Income"
                value={fmtUSD(c.income)}
                bold
                testid="calc-total-income"
              />
            </SectionCard>

            <SectionCard
              icon={Home}
              title="Housing Expenses (Monthly)"
              description="Taxes, insurance, HOA & escrows for front-end DTI"
              testid="section-housing"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CurrencyInput
                  id="property-tax"
                  testid="input-property-tax"
                  label="Property Tax"
                  value={f.propertyTax}
                  onChange={set("propertyTax")}
                  hint="Monthly amount"
                />
                <CurrencyInput
                  id="insurance"
                  testid="input-insurance"
                  label="Homeowner's Insurance"
                  value={f.insurance}
                  onChange={set("insurance")}
                  hint="Monthly amount"
                />
                <CurrencyInput
                  id="hoa"
                  testid="input-hoa"
                  label="HOA Dues"
                  value={f.hoa}
                  onChange={set("hoa")}
                />
                <CurrencyInput
                  id="escrow"
                  testid="input-escrow"
                  label="Other Escrows (MI, flood, etc.)"
                  value={f.escrow}
                  onChange={set("escrow")}
                />
              </div>
              <Separator className="my-4" />
              <StatRow
                label="Housing Expenses"
                value={fmtUSD(c.housing)}
                testid="calc-total-housing"
              />
              <StatRow
                label="PITI (P&I + Housing)"
                value={fmtUSD(c.piti)}
                bold
                testid="calc-piti"
              />
            </SectionCard>

            <SectionCard
              icon={CreditCard}
              title="Other Monthly Debts"
              description="Recurring obligations used for back-end DTI"
              testid="section-debts"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <CurrencyInput
                  id="car-loans"
                  testid="input-car-loans"
                  label="Car Loans"
                  value={f.carLoans}
                  onChange={set("carLoans")}
                />
                <CurrencyInput
                  id="credit-cards"
                  testid="input-credit-cards"
                  label="Credit Cards (min pmt)"
                  value={f.creditCards}
                  onChange={set("creditCards")}
                />
                <CurrencyInput
                  id="other-debts"
                  testid="input-other-debts"
                  label="Other Debts"
                  value={f.otherDebts}
                  onChange={set("otherDebts")}
                  hint="Student loans, alimony, etc."
                />
              </div>
              <Separator className="my-4" />
              <StatRow
                label="Total Other Debts"
                value={fmtUSD(c.otherDebt)}
                testid="calc-total-other-debts"
              />
              <StatRow
                label="Total Monthly Obligations"
                value={fmtUSD(c.totalMonthlyDebt)}
                bold
                testid="calc-total-monthly-debt"
              />
            </SectionCard>
          </div>

          {/* RIGHT: Sticky summary */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <Card
                data-testid="summary-panel"
                className="print-card border-slate-200 bg-white shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-base font-bold text-slate-900">
                      DTI Summary
                    </CardTitle>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Live
                    </span>
                  </div>
                  <CardDescription className="text-xs text-slate-500">
                    Ratios update as you type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <DTIGauge
                    testid="dti-frontend"
                    label="Front-End (Housing) DTI"
                    percent={c.frontPct}
                    zone={c.frontZone}
                    thresholds={{ safe: 28, warn: 35 }}
                  />
                  <DTIGauge
                    testid="dti-backend"
                    label="Back-End (Total) DTI"
                    percent={c.backPct}
                    zone={c.backZone}
                    thresholds={{ safe: 36, warn: 43 }}
                  />

                  <Separator />

                  <div>
                    <StatRow
                      label="Monthly Income"
                      value={fmtUSD(c.income)}
                      muted
                    />
                    <StatRow
                      label="Monthly P&I"
                      value={fmtUSD(c.pi)}
                      muted
                    />
                    <StatRow
                      label="Housing (Tax+Ins+HOA+Esc)"
                      value={fmtUSD(c.housing)}
                      muted
                    />
                    <StatRow
                      label="PITI"
                      value={fmtUSD(c.piti)}
                      bold
                    />
                    <StatRow
                      label="Other Debts"
                      value={fmtUSD(c.otherDebt)}
                      muted
                    />
                    <StatRow
                      label="Total Obligations"
                      value={fmtUSD(c.totalMonthlyDebt)}
                      bold
                    />
                  </div>

                  <div className="no-print flex gap-2 pt-1">
                    <Button
                      data-testid="btn-print"
                      onClick={handlePrint}
                      className="flex-1 bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print / PDF
                    </Button>
                    <Button
                      data-testid="btn-reset"
                      onClick={handleReset}
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Guideline legend */}
              <Card
                data-testid="legend-panel"
                className="print-card border-slate-200 bg-white shadow-sm"
              >
                <CardContent className="pt-6">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    Guideline Thresholds
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 h-2 w-2 rounded-full ${zoneColor.safe.bar}`} />
                      <div className="text-slate-700">
                        <b>Safe</b> — Front-end ≤ 28% • Back-end ≤ 36%
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 h-2 w-2 rounded-full ${zoneColor.warn.bar}`} />
                      <div className="text-slate-700">
                        <b>Caution</b> — Front-end ≤ 35% • Back-end ≤ 43%
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 h-2 w-2 rounded-full ${zoneColor.danger.bar}`} />
                      <div className="text-slate-700">
                        <b>High Risk</b> — Above the QM 43% back-end limit
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                    Thresholds are general conventional / QM guidelines. Overlays vary by program (FHA, VA, USDA, jumbo).
                  </p>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>

        {/* Print footer */}
        <div className="print-only mt-6 border-t border-black pt-3 text-[10px]">
          Front-End DTI: {fmtPct(c.frontPct)} ({zoneColor[c.frontZone].label})
          &nbsp;|&nbsp;
          Back-End DTI: {fmtPct(c.backPct)} ({zoneColor[c.backZone].label})
          &nbsp;|&nbsp; Generated by LendClear DTI Calculator
        </div>
      </main>
    </div>
  );
}
