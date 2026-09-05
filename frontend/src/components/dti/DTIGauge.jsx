import { zoneColor } from "@/lib/dti";

// Visual gauge with tick marks at threshold zones.
// scaleMax defaults to 60% to give visual context beyond warning zones.
export const DTIGauge = ({
  label,
  percent,
  zone,
  thresholds, // { safe: number, warn: number }
  testid,
  scaleMax = 60,
}) => {
  const clamped = Math.min(Math.max(percent, 0), scaleMax);
  const width = (clamped / scaleMax) * 100;
  const overflow = percent > scaleMax;
  const c = zoneColor[zone];

  const safePos = (thresholds.safe / scaleMax) * 100;
  const warnPos = (thresholds.warn / scaleMax) * 100;

  return (
    <div className="space-y-2" data-testid={testid}>
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className={`text-xs font-semibold ${c.text}`}>
          {c.label}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          data-testid={`${testid}-value`}
          className={`font-heading font-bold text-3xl tabular-nums ${c.text}`}
        >
          {percent.toFixed(2)}%
        </span>
        {overflow && (
          <span className="text-xs text-slate-400">of {scaleMax}% scale</span>
        )}
      </div>
      <div className="dti-gauge-track relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`dti-gauge-fill h-full rounded-full ${c.bar}`}
          style={{ width: `${width}%` }}
        />
        {/* Threshold tick marks */}
        <div
          className="absolute top-0 h-full w-px bg-slate-400/70"
          style={{ left: `${safePos}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 h-full w-px bg-slate-400/70"
          style={{ left: `${warnPos}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono-num text-slate-400 tabular-nums">
        <span>0%</span>
        <span style={{ marginLeft: `${safePos - 8}%` }}>
          ≤{thresholds.safe}%
        </span>
        <span style={{ marginLeft: `${warnPos - safePos - 8}%` }}>
          ≤{thresholds.warn}%
        </span>
        <span>{scaleMax}%+</span>
      </div>
    </div>
  );
};
