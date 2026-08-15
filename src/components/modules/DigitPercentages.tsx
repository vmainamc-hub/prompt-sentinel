import { useMemo } from "react";
import { Panel } from "../Panel";
import { lastDigit, type Tick } from "@/lib/analytics";
import { assignDigitRoles, digitRoleStats, isVetoedRoleDigit, VETOED_ROLE_DIGITS } from "@/lib/digit-roles";

// Neutral color for digits that have no special role
const NEUTRAL_COLOR = "#64748b"; // slate-500

// Role colors (override base)
const HOT_COLOR = "var(--bull)";        // green
const HOT2_COLOR = "#84cc16";           // lime - second hottest
const COLD_COLOR = "var(--bear)";       // red
const COLD2_COLOR = "#fb7185";          // rose - second coldest
const RISING_COLOR = "var(--accent)";   // magenta - most increasing

export function DigitPercentages({ ticks }: { ticks: Tick[] }) {
  const stats = useMemo(() => {
    const slice = ticks.slice(-1000);
    const digits = slice.map((t) => lastDigit(t.price));
    const { freq, pct, delta } = digitRoleStats(digits);

    // OPERATOR VETO: digits 2, 3, 6 and 7 can never hold one of the five
    // sensitive roles (hot, hot 2, cold, cold 2, rising).
    const roles = assignDigitRoles(pct, delta);

    return {
      freq,
      pct,
      total: slice.length,
      hot: roles.hot,
      hot2: roles.hot2,
      cold: roles.cold,
      cold2: roles.cold2,
      rising: roles.rising,
      vetoApplied: roles.vetoApplied,
      lastD: digits.length ? digits[digits.length - 1] : -1,
    };
  }, [ticks]);

  const { freq, pct, total, hot, hot2, cold, cold2, rising, vetoApplied, lastD } = stats;
  const maxP = Math.max(...pct, 1);

  function colorFor(d: number): string {
    if (isVetoedRoleDigit(d)) return NEUTRAL_COLOR;
    if (d === hot) return HOT_COLOR;
    if (d === cold) return COLD_COLOR;
    if (d === rising) return RISING_COLOR;
    if (d === hot2) return HOT2_COLOR;
    if (d === cold2) return COLD2_COLOR;
    return NEUTRAL_COLOR;
  }

  function roleFor(d: number): string | null {
    if (isVetoedRoleDigit(d)) return null;
    if (d === hot) return "HOT";
    if (d === cold) return "COLD";
    if (d === rising) return "RISING";
    if (d === hot2) return "HOT 2";
    if (d === cold2) return "COLD 2";
    return null;
  }

  return (
    <Panel title="Digits 0–9 Live Distribution" subtitle={`Last ${total} ticks · Expected 10% each`} accent="cyan">
      <div className="grid grid-cols-10 gap-2">
        {pct.map((p, d) => {
          const isLast = d === lastD;
          const barH = Math.max(4, (p / maxP) * 100);
          const tone = colorFor(d);
          const role = roleFor(d);
          const highlighted = role !== null;
          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <div className="tabular text-[11px] font-semibold" style={{ color: tone }}>
                {p.toFixed(1)}%
              </div>
              <div className="relative w-full h-24 rounded-md border border-border/40 bg-secondary/30 overflow-hidden flex items-end">
                <div
                  className="w-full transition-all duration-300"
                  style={{
                    height: `${barH}%`,
                    background: `linear-gradient(to top, ${tone}, color-mix(in oklab, ${tone} 40%, transparent))`,
                    boxShadow: highlighted ? `0 0 12px ${tone}` : undefined,
                  }}
                />
              </div>
              <div
                className={`tabular text-sm font-bold w-7 h-7 flex items-center justify-center rounded ${
                  isLast ? "ring-1 ring-[var(--accent)]" : ""
                }`}
                style={{ color: tone }}
              >
                {d}
              </div>
              <div
                className="tabular text-[8px] uppercase tracking-wider font-semibold leading-none h-3"
                style={{ color: role ? tone : "transparent" }}
              >
                {role ?? "·"}
              </div>
              <div className="tabular text-[9px] text-muted-foreground">{freq[d]}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Hot <span className="font-semibold" style={{ color: HOT_COLOR }}>{hot}</span></span>
        <span>Hot 2 <span className="font-semibold" style={{ color: HOT2_COLOR }}>{hot2}</span></span>
        <span>Cold <span className="font-semibold" style={{ color: COLD_COLOR }}>{cold}</span></span>
        <span>Cold 2 <span className="font-semibold" style={{ color: COLD2_COLOR }}>{cold2}</span></span>
        <span>Rising <span className="font-semibold" style={{ color: RISING_COLOR }}>{rising >= 0 ? rising : "—"}</span></span>
        <span className="text-muted-foreground/80">
          Veto{" "}
          <span className="font-semibold text-foreground">{VETOED_ROLE_DIGITS.join(" · ")}</span>{" "}
          never shaded{vetoApplied ? " (role reassigned)" : ""}
        </span>
        <span className="ml-auto">Last <span className="text-[var(--accent)] font-semibold">{lastD >= 0 ? lastD : "—"}</span></span>
      </div>
    </Panel>
  );
}
