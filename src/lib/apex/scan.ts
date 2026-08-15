// APEX SENTINEL — cross-market ranking + SCAN NOW.
// SCAN NOW does NOT start analysis. The core is always analysing; this
// interrogates the latest intelligence state and answers: what is the
// strongest opportunity right now?
import { lookupAnalogue, fingerprint } from "./memory";
import { entryLab } from "./entry-conditions";
import { apexSimulator, engineAgreement, simulatorAdjustment } from "./simulator";
import { assessClearance } from "./clearance";
import { classifyEvidence } from "./evidence-status";
import { marketProfiles } from "./profiles";
import type { MarketIntel, RankedOpportunity, ScanResult } from "./types";
import { PRIMARY_CONTRACTS } from "./types";

export interface ScanOptions {
  /** Extra score awarded to Under 7 / Over 2 — the operator's primary
   *  contracts. A preference window, not a hard override. */
  preferenceWindow: number;
  /** Minimum opportunity score to call something a real opportunity. */
  opportunityThreshold: number;
  /** Reject contracts above this danger level. */
  maxDanger: number;
  /** Minimum ticks required for a market to be considered. */
  minTicks: number;
}

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  preferenceWindow: 4,
  opportunityThreshold: 70,
  maxDanger: 65,
  minTicks: 400,
};

export function globalDanger(intels: MarketIntel[]): number {
  const usable = intels.filter((i) => i.dataState === "OK" || i.dataState === "THIN");
  if (!usable.length) return 100;
  const mean = usable.reduce((a, i) => a + i.danger, 0) / usable.length;
  const hostile = usable.filter((i) => i.danger > 60).length / usable.length;
  return Math.round(Math.max(0, Math.min(100, mean * 0.7 + hostile * 100 * 0.3)));
}

export function rankOpportunities(
  intels: MarketIntel[],
  opts: ScanOptions = DEFAULT_SCAN_OPTIONS,
): { ranked: RankedOpportunity[]; rejected: ScanResult["rejected"] } {
  const ranked: RankedOpportunity[] = [];
  const rejected: ScanResult["rejected"] = [];

  for (const intel of intels) {
    if (intel.dataState === "UNAVAILABLE") {
      rejected.push({ symbol: intel.symbol, contract: "—", reason: "DATA UNAVAILABLE" });
      continue;
    }
    if (intel.dataState === "STALE") {
      rejected.push({ symbol: intel.symbol, contract: "—", reason: "DATA STALE — feed silent" });
      continue;
    }
    if (intel.ticks < opts.minTicks) {
      rejected.push({
        symbol: intel.symbol,
        contract: "—",
        reason: `DATA THIN — ${intel.ticks} ticks (< ${opts.minTicks})`,
      });
      continue;
    }
    for (const c of intel.contracts) {
      // ── Safety is assessed SEPARATELY from direction ──────────────────
      // Nothing below deletes a candidate. A blocked candidate stays in the
      // ranking, labelled BLOCKED with its reasons, so a genuine opportunity
      // is never silently lost and a weak one is never silently promoted.
      const sim = simulatorAdjustment(intel.symbol, c.id, c.theoretical);
      const recentPerf = apexSimulator.recentPerformance(intel.symbol, c.id, c.theoretical);
      const clearance = assessClearance({
        intel,
        contract: c,
        recent: recentPerf,
        lifetime: sim.perf,
        maxDanger: opts.maxDanger,
        maxLosingThreat: 82,
      });
      const entryRec = entryLab.recommend(intel.symbol, c.id, c.theoretical);
      const evidence = classifyEvidence({
        lifetime: sim.perf,
        recent: recentPerf,
        theoretical: c.theoretical,
        clearance,
        entry: entryRec,
      });
      if (clearance.state === "BLOCKED") {
        rejected.push({
          symbol: intel.symbol,
          contract: c.label,
          reason: clearance.blockers.map((b) => b.text).join(" · "),
        });
      } else if (c.compositeEdge <= 0) {
        rejected.push({
          symbol: intel.symbol,
          contract: c.label,
          reason: `No composite edge (${c.compositeEdge.toFixed(1)}) — retained as an exploratory candidate only`,
        });
      }
      const agreement = engineAgreement(c);

      const preferred = PRIMARY_CONTRACTS.includes(c.id);
      // Historical analogue from this app's own observed memory.
      const analogue = c.analogue ?? lookupAnalogue(fingerprint(intel, c));
      const analogueBonus =
        analogue && analogue.n >= 30
          ? Math.max(-6, Math.min(6, (analogue.rate - c.theoretical) * 60))
          : 0;
      // Validated models can nudge the ranking; unvalidated ones cannot.
      const modelBonus =
        c.ensemble && c.ensemble.validated > 0
          ? Math.max(-5, Math.min(5, c.ensemble.signal * 5))
          : 0;
      const agreementBonus =
        agreement === "SUPPORT" ? 3 : agreement === "CONFLICT" ? -8 : 0;
      // Entry-condition discovery: which way of ENTERING has actually improved
      // contract-resolved expectancy on this market/contract?
      const entry = entryRec;
      // Multi-dimensional, confidence-adjusted adjustments. Authority scales
      // with evidence maturity, so a 3-trade 100% record cannot outrank a
      // mature one — and a new candidate is not deleted for being new.
      const clearancePenalty =
        clearance.state === "BLOCKED"
          ? -45
          : clearance.state === "UNSTABLE"
            ? -12
            : clearance.state === "CAUTION"
              ? -5
              : clearance.state === "INSUFFICIENT EVIDENCE"
                ? -8
                : 2;
      const confidenceAdjustment = Math.round(((evidence.confidence - 50) / 50) * 4 * 10) / 10;
      const recentDelta =
        recentPerf.n >= 10
          ? Math.max(-8, Math.min(6, (recentPerf.winRate - c.theoretical) * 60 * evidence.authority))
          : 0;
      const factors = [
        {
          label: "Statistical opportunity",
          points: c.opportunity,
          detail: `Composite edge ${c.compositeEdge.toFixed(1)} over ${c.n} ticks, phase ${c.phase}`,
        },
        {
          label: "Contract preference",
          points: preferred ? opts.preferenceWindow : 0,
          detail: preferred
            ? "Primary Sentinel contract (Under 7 / Over 2)"
            : "Secondary contract — no preference bonus",
        },
        {
          label: "Historical analogue",
          points: analogueBonus,
          detail:
            analogue && analogue.n >= 30
              ? `${(analogue.rate * 100).toFixed(1)}% over N=${analogue.n} matching past states`
              : "No sufficient analogue memory yet — no influence",
        },
        {
          label: "Learned model",
          points: modelBonus,
          detail: c.ensemble
            ? c.ensemble.validated > 0
              ? `${c.ensemble.validated} validated model(s), signal ${c.ensemble.signal.toFixed(2)}`
              : "Models present but not yet validated — no influence"
            : "No model output",
        },
        {
          label: "Simulator evidence",
          points: sim.delta,
          detail: sim.note,
        },
        {
          label: "Entry condition evidence",
          points: entry.rankingDelta,
          detail: entry.best
            ? `${entry.best.label} (${entry.best.state}) — ${entry.activeNow ? "trigger ACTIVE now" : "trigger not firing now"}. ${entry.best.note}`
            : entry.note,
        },
        {
          label: "Engine agreement",
          points: agreementBonus,
          detail: agreement,
        },
        {
          label: "Recent window (this market)",
          points: recentDelta,
          detail: recentPerf.n
            ? `Last ${Math.round(apexSimulator.getConfig().recentWindowMs / 60000)} min on ${intel.name}: ${recentPerf.n} qualifying entries, ${recentPerf.wins} wins, ${recentPerf.losses} losses, ${(recentPerf.winRate * 100).toFixed(1)}% win rate (authority ×${evidence.authority.toFixed(2)}).`
            : `No qualifying entries in the last ${Math.round(apexSimulator.getConfig().recentWindowMs / 60000)} minutes on this market — no recent influence.`,
        },
        {
          label: "Danger clearance",
          points: clearancePenalty,
          detail: clearance.summary,
        },
        {
          label: "Evidence confidence",
          points: confidenceAdjustment,
          detail: `${evidence.status} · confidence ${evidence.confidence}/100 · uncertainty ${evidence.uncertainty}/100. ${evidence.note}`,
        },
      ];

      // ── Stage: LOSING-DIGIT EXPOSURE ─────────────────────────────────
      const exposure = c.exposure ?? null;
      const exposurePenalty = exposure
        ? -Math.round(
            (exposure.losingDigitExposure > 45 ? (exposure.losingDigitExposure - 45) * 0.22 : 0) * 10,
          ) / 10
        : 0;
      factors.push({
        label: "Losing-digit exposure",
        points: exposurePenalty,
        detail: exposure
          ? exposure.summary
          : "Losing-digit exposure not computed for this candidate.",
      });

      // ── Stage: SPECIAL DIGIT RISK (0/1/8/9) ──────────────────────────
      const special = c.specialRisk ?? null;
      const specialPenalty = special
        ? -Math.round((special.exposureRisk > 50 ? (special.exposureRisk - 50) * 0.16 : 0) * 10) / 10
        : 0;
      factors.push({
        label: "Special digit risk (0/1/8/9)",
        points: specialPenalty,
        detail: special ? special.summary : "Special digit monitor unavailable.",
      });

      // ── Stage: FLUCTUATION / STABILITY OF THE EVIDENCE ───────────────
      const fluct = intel.fluctuation;
      const fluctPenalty = fluct
        ? -Math.round((fluct.score > 25 ? (fluct.score - 25) * 0.18 : -2) * 10) / 10
        : 0;
      factors.push({
        label: "Fluctuation (calm-market preference)",
        points: fluctPenalty,
        detail: fluct ? fluct.summary : "Fluctuation not yet measurable.",
      });

      // ── Stage: DIGIT PSYCHOLOGY (hypothesis, capped influence) ───────
      const psy = intel.psychology;
      const pattern = psy ? (c.side === "OVER" ? psy.over : psy.under) : null;
      const psyPoints = pattern
        ? Math.round(
            Math.max(-4, Math.min(4, ((pattern.score - 55) / 45) * 4 * (pattern.confidence / 100))) * 10,
          ) / 10
        : 0;
      factors.push({
        label: "Digit psychology configuration",
        points: psyPoints,
        detail: pattern
          ? `${pattern.side} pattern ${pattern.score}/100 (confidence ${pattern.confidence}/100). ${pattern.supporting.length} supporting, ${pattern.contradictions.length} contradicting observation(s).`
          : "Psychology engine has no reading for this market yet.",
      });

      // ── Stage: MARKET-SPECIFIC LEARNING (never inherited) ────────────
      const learned = marketProfiles.prior(intel.symbol, c.label, c.theoretical);
      factors.push({
        label: "Market-specific learning",
        points: learned.points,
        detail: learned.detail,
      });

      const invalidation = [
        `Danger rising above ${Math.min(100, Math.round(intel.danger + 12))} on this market`,
        `Losing-side pressure taking control on the ${c.label} losing digits`,
        "Sensitive digit flipping from green (winning) to red (losing) role",
        "Regime transition away from " + (intel.regime?.label ?? "the current regime"),
        entry.best
          ? `Entry condition "${entry.best.label}" ceasing to trigger, or its expectancy turning negative`
          : "No validated entry condition emerging for this contract",
        exposure && exposure.bursting.length
          ? `Losing digit(s) ${exposure.bursting.join(", ")} continuing to burst`
          : "A losing digit starting to burst (2+ prints in 10 ticks)",
        intel.fluctuation && intel.fluctuation.state !== "CALM"
          ? `Fluctuation rising above ${Math.min(100, intel.fluctuation.score + 15)}/100`
          : "Fluctuation rising — the leading contract flickering between candidates",
        c.phase === "MATURE"
          ? "Edge decaying as the mature phase completes"
          : "Composite edge falling to zero or below",
      ];

      const score =
        c.opportunity +
        (preferred ? opts.preferenceWindow : 0) +
        analogueBonus +
        modelBonus +
        sim.delta +
        entry.rankingDelta +
        agreementBonus +
        recentDelta +
        clearancePenalty +
        confidenceAdjustment +
        exposurePenalty +
        specialPenalty +
        fluctPenalty +
        psyPoints +
        learned.points;

      ranked.push({
        rank: 0,
        symbol: intel.symbol,
        name: intel.name,
        contract: c,
        intel,
        score: Math.round(Math.max(0, Math.min(100, score)) * 10) / 10,
        preferred,
        simulator: sim.perf,
        simNote: sim.note,
        recent: recentPerf,
        entry,
        agreement,
        clearance,
        evidence,
        blocked: clearance.state === "BLOCKED",
        factors,
        invalidation,
      });
    }
  }

  // Blocked candidates are ordered last but never deleted: the operator can
  // always see WHY an otherwise attractive setup is unavailable.
  ranked.sort((a, b) => Number(a.blocked) - Number(b.blocked) || b.score - a.score);
  ranked.forEach((r, i) => (r.rank = i + 1));
  return { ranked, rejected };
}

export function scanNow(
  intels: MarketIntel[],
  opts: ScanOptions = DEFAULT_SCAN_OPTIONS,
): ScanResult {
  const online = intels.filter((i) => i.dataState === "OK");
  const { ranked, rejected } = rankOpportunities(intels, opts);
  const gd = globalDanger(intels);
  // Multiple simultaneous opportunities are allowed — the operator is not
  // restricted to a single market. Blocked candidates are excluded from the
  // surfaced set but remain in `ranked` with their reasons intact.
  const top = ranked.filter((r) => !r.blocked).slice(0, 5);

  let verdict: ScanResult["verdict"];
  let message: string;
  if (!online.length) {
    verdict = "DATA_UNAVAILABLE";
    message = "DATA UNAVAILABLE — no market is currently streaming enough ticks to analyse.";
  } else if (!top.length) {
    verdict = "NONE";
    message = `NO CLEARED OPPORTUNITY. ${ranked.filter((r) => r.blocked).length} candidate(s) exist but are blocked by danger clearance.`;
  } else if (
    top[0].score >= opts.opportunityThreshold &&
    (top[0].intel.fluctuation?.state ?? "CALM") !== "CHAOTIC" &&
    (top[0].contract.exposure?.state ?? "LOW") !== "SEVERE" &&
    top[0].agreement !== "STRONG CONFLICT"
  ) {
    verdict = "OPPORTUNITY";
    message = `${top[0].contract.label} on ${top[0].name} — clearance ${top[0].clearance.state}, evidence ${top[0].evidence.status}. Entry: ${top[0].entry?.best?.label ?? "immediate (no validated condition yet)"}.`;
  } else {
    verdict = "MODERATE";
    message = `NO HIGH-QUALITY OPPORTUNITY. Best available candidate ${top[0].contract.label} on ${top[0].name} is only moderate (${top[0].score.toFixed(0)}/100, evidence ${top[0].evidence.status}, clearance ${top[0].clearance.state}).`;
  }

  return {
    scannedAt: Date.now(),
    marketsOnline: online.length,
    marketsTotal: intels.length,
    evaluated: ranked.length,
    globalDanger: gd,
    globalDangerLabel: gd < 35 ? "CALM" : gd < 65 ? "ELEVATED" : "HOSTILE",
    top,
    rejected: rejected.slice(0, 40),
    verdict,
    message,
  };
}


/**
 * WHY NOT THE RUNNER-UP — a like-for-like comparison of the two best
 * candidates using only measured values. No narrative is invented: each line
 * is a real gap between two engine outputs.
 */
export function whyNotRunnerUp(
  top: RankedOpportunity,
  runner: RankedOpportunity,
): string[] {
  const out: string[] = [];
  const a = top.contract;
  const b = runner.contract;
  const gap = (label: string, x: number, y: number, unit = "", invert = false) => {
    const diff = x - y;
    if (Math.abs(diff) < 2) return;
    const better = invert ? diff < 0 : diff > 0;
    if (!better) return;
    out.push(
      `${label}: ${top.contract.label} ${x.toFixed(0)}${unit} vs ${runner.contract.label} ${y.toFixed(0)}${unit}.`,
    );
  };
  gap("Opportunity", top.score, runner.score);
  gap("Quality", a.quality, b.quality);
  gap("Stability", a.stability, b.stability);
  gap("Freshness", a.freshness, b.freshness);
  gap("Danger (lower is better)", a.danger, b.danger, "", true);
  gap("Contradiction (lower is better)", a.contradiction, b.contradiction, "", true);
  if (a.threat && b.threat && Math.abs(a.threat.groupThreat - b.threat.groupThreat) >= 4) {
    out.push(
      a.threat.groupThreat < b.threat.groupThreat
        ? `Losing-side threat is lower: ${a.threat.groupThreat.toFixed(0)} (${a.threat.state}) vs ${b.threat.groupThreat.toFixed(0)} (${b.threat.state}).`
        : `Runner-up has the calmer losing side (${b.threat.groupThreat.toFixed(0)} vs ${a.threat.groupThreat.toFixed(0)}) but loses on other measures.`,
    );
  }
  if (top.simulator && runner.simulator && (top.simulator.n >= 25 || runner.simulator.n >= 25)) {
    out.push(
      `Simulator: ${top.contract.label} ${top.simulator.n ? `${(top.simulator.winRate * 100).toFixed(1)}% (N=${top.simulator.n})` : "no sample"} vs ${runner.contract.label} ${runner.simulator.n ? `${(runner.simulator.winRate * 100).toFixed(1)}% (N=${runner.simulator.n})` : "no sample"}.`,
    );
  }
  if (top.entry?.best || runner.entry?.best) {
    const fmt = (r: RankedOpportunity) =>
      r.entry?.best
        ? `${r.entry.best.label} (${r.entry.best.state}, expectancy ${(r.entry.best.expectancy * 100).toFixed(1)}% over N=${r.entry.best.n}${r.entry.activeNow ? ", trigger active" : ", trigger not firing"})`
        : "no validated entry condition";
    out.push(`Entry condition: ${top.contract.label} — ${fmt(top)}; ${runner.contract.label} — ${fmt(runner)}.`);
  }
  if (top.agreement !== runner.agreement) {
    out.push(`Engine agreement: ${top.agreement} vs ${runner.agreement}.`);
  }
  if (!out.length) out.push("The two candidates are statistically close — the ranking gap is not material.");
  return out.slice(0, 6);
}
