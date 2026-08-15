// APEX SENTINEL — market memory, historical analogue & calibration.
// Everything in here is learned from ticks this app actually observed.
// Nothing is seeded, invented, or back-filled with fake outcomes.
import type { ApexContractId, ContractEval, MarketIntel } from "./types";

const KEY = "apex.memory.v1";
const SAVE_DEBOUNCE = 4000;

interface Bucket {
  n: number;
  wins: number;
}

interface MemoryShape {
  /** fingerprint -> outcome bucket (historical analogue) */
  analogue: Record<string, Bucket>;
  /** confidence decile -> outcome bucket (calibration) */
  calibration: Record<string, Bucket>;
  updatedAt: number;
}

let mem: MemoryShape = { analogue: {}, calibration: {}, updatedAt: 0 };
let loaded = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MemoryShape;
      if (parsed && parsed.analogue) mem = parsed;
    }
  } catch {
    /* corrupt storage — start clean rather than crash */
  }
}

function scheduleSave() {
  if (typeof window === "undefined" || saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    mem.updatedAt = Date.now();
    try {
      window.localStorage.setItem(KEY, JSON.stringify(mem));
    } catch {
      /* quota — memory stays in RAM for this session */
    }
  }, SAVE_DEBOUNCE);
}

function bucketOf(v: number, edges: number[]): number {
  let i = 0;
  while (i < edges.length && v >= edges[i]) i++;
  return i;
}

/**
 * Compact description of the current market/contract configuration. Two
 * moments with the same fingerprint are treated as analogous states.
 */
export function fingerprint(intel: MarketIntel, c: ContractEval): string {
  const regime = intel.regime?.label ?? "NA";
  const vol = intel.volatility ? bucketOf(intel.volatility.ratio, [0.8, 1.1, 1.5]) : 0;
  const ce = bucketOf(c.compositeEdge, [-20, -5, 5, 20, 40]);
  const pa = bucketOf(c.pressureAsymmetry, [-0.3, -0.05, 0.05, 0.3]);
  const ent = intel.entropy ? bucketOf(intel.entropy.entropy, [0.96, 0.975, 0.985]) : 0;
  return `${c.id}|${regime}|v${vol}|e${ce}|p${pa}|h${ent}`;
}

export function observeAnalogue(key: string, won: boolean) {
  load();
  const b = (mem.analogue[key] ??= { n: 0, wins: 0 });
  b.n++;
  if (won) b.wins++;
  scheduleSave();
}

export function lookupAnalogue(key: string): { n: number; rate: number } | null {
  load();
  const b = mem.analogue[key];
  if (!b || b.n < 30) return b ? { n: b.n, rate: b.wins / b.n } : null;
  return { n: b.n, rate: b.wins / b.n };
}

export function observeCalibration(confidence: number, won: boolean) {
  load();
  const decile = Math.min(9, Math.max(0, Math.floor(confidence / 10)));
  const b = (mem.calibration[String(decile)] ??= { n: 0, wins: 0 });
  b.n++;
  if (won) b.wins++;
  scheduleSave();
}

export function calibrationTable(): { decile: number; n: number; rate: number }[] {
  load();
  return Object.entries(mem.calibration)
    .map(([d, b]) => ({ decile: Number(d), n: b.n, rate: b.n ? b.wins / b.n : 0 }))
    .sort((a, b) => a.decile - b.decile);
}

export function memoryStats() {
  load();
  const states = Object.keys(mem.analogue).length;
  const observations = Object.values(mem.analogue).reduce((a, b) => a + b.n, 0);
  return { states, observations, updatedAt: mem.updatedAt };
}

export function resetMemory() {
  mem = { analogue: {}, calibration: {}, updatedAt: Date.now() };
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

export type { ApexContractId };
