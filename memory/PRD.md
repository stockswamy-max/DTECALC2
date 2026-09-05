# LendClear DTI Calculator — PRD

## Original Problem Statement
Loan officer needs a fast tool to compute Debt-to-Income (DTI) ratios. Entry points for income (base, rental, bonus, other), loan program (loan amount, APR, years), housing (taxes, insurance, HOA, escrows), and other debts (car loans, credit cards, other).

## Architecture
- Single-page React app (client-side math only, no backend needed)
- FastAPI backend & MongoDB unchanged (template hello-world routes retained)
- Print/PDF export via browser `window.print()` + `@media print` CSS

## User Personas
- Loan officer / mortgage originator — needs fast, live DTI computation during client calls

## Core Requirements (static)
- Loan Amount + APR + Years → monthly P&I via amortization formula
- Monthly income aggregation (base + rental + bonus + other)
- Housing expenses (property tax + insurance + HOA + escrow) → PITI
- Other monthly debts (car + credit cards + other)
- Front-End DTI = PITI / income
- Back-End DTI = (PITI + other debts) / income
- Zone indicators: Safe / Caution / High Risk with conventional thresholds
- Printable / PDF report

## Implemented (2026-02-04)
- Full DTI calculator UI (Swiss / high-contrast design)
- Real-time computation with all input categories
- Front-end (28/35) and Back-end (36/43) gauge indicators with threshold ticks
- Sticky summary panel with live totals
- Print/PDF export with print-specific stylesheet
- Reset button + input validation via type=number
- Sonner toast notifications
- All inputs and outputs carry `data-testid` attributes

## Backlog / Next Phase
- P1: Save borrower scenarios (MongoDB) & scenario history
- P1: Side-by-side scenario comparison (what-if with APR changes)
- P2: Program-specific overlays (FHA/VA/USDA/Jumbo threshold presets)
- P2: Max qualifying loan calculator (given income + debts → max PITI)
- P2: Amortization schedule table
