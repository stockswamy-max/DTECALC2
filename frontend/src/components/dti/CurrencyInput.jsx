import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CurrencyInput = ({
  id,
  label,
  value,
  onChange,
  placeholder = "0.00",
  prefix = "$",
  testid,
  hint,
  step = "0.01",
}) => {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-slate-600"
      >
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono-num">
          {prefix}
        </span>
        <Input
          id={id}
          data-testid={testid}
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="pl-7 font-mono-num tabular-nums text-slate-900 bg-white border-slate-200 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
        />
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
};

export const PlainNumberInput = ({
  id,
  label,
  value,
  onChange,
  suffix,
  testid,
  step = "0.01",
  placeholder = "0",
  hint,
}) => {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-slate-600"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          data-testid={testid}
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${suffix ? "pr-10" : ""} font-mono-num tabular-nums text-slate-900 bg-white border-slate-200 focus-visible:ring-blue-500 focus-visible:ring-offset-0`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
};

export const TextInput = ({
  id,
  label,
  value,
  onChange,
  testid,
  placeholder = "",
  hint,
}) => {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-slate-600"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          data-testid={testid}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="text-slate-900 bg-white border-slate-200 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
        />
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
};
