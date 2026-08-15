// APEX SENTINEL — journal, paper trading and execution policy.
// Analysis and execution are architecturally separate: this module never
// touches the intelligence engines, it only records what the operator (or
// paper engine) did with them.
import type { ApexContractId } from "./types";

export type ExecutionMode = "MANUAL" | "PAPER" | "DBOT" | "API";
export type Outcome = "PENDING" | "WIN" | "LOSS" | "VOID";

export interface JournalEntry {
  id: string;
  ts: number;
  mode: ExecutionMode;
  symbol: string;
  name: string;
  contract: ApexContractId;
  contractLabel: string;
  opportunity: number;
  confidence: number;
  edgePct: number;
  danger: number;
  quality: number;
  entryDigitIndex: number;
  outcome: Outcome;
  resolvedDigit?: number;
  note?: string;
}

const KEY = "apex.journal.v1";
const SETTINGS_KEY = "apex.exec.v1";
const MAX_ENTRIES = 500;

export interface ExecutionSettings {
  mode: ExecutionMode;
  maxOpenTrades: number;
  minOpportunity: number;
  paperStake: number;
}

export const DEFAULT_EXECUTION: ExecutionSettings = {
  mode: "MANUAL", // real execution is opt-in only
  maxOpenTrades: 1,
  minOpportunity: 70,
  paperStake: 1,
};

let entries: JournalEntry[] | null = null;
const listeners = new Set<() => void>();

function load(): JournalEntry[] {
  if (entries) return entries;
  entries = [];
  if (typeof window === "undefined") return entries;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) entries = JSON.parse(raw) as JournalEntry[];
  } catch {
    entries = [];
  }
  return entries;
}

function persist() {
  if (typeof window === "undefined" || !entries) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    /* ignore quota */
  }
  listeners.forEach((l) => l());
}

export function subscribeJournal(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function listJournal(): JournalEntry[] {
  return [...load()].reverse();
}

export function recordEntry(e: Omit<JournalEntry, "id" | "ts" | "outcome">): JournalEntry {
  const list = load();
  const entry: JournalEntry = {
    ...e,
    id: `${Date.now().toString(36)}-${list.length}`,
    ts: Date.now(),
    outcome: "PENDING",
  };
  list.push(entry);
  if (list.length > MAX_ENTRIES) list.splice(0, list.length - MAX_ENTRIES);
  persist();
  return entry;
}

export function resolveEntry(id: string, outcome: Outcome, resolvedDigit?: number) {
  const list = load();
  const e = list.find((x) => x.id === id);
  if (!e || e.outcome !== "PENDING") return;
  e.outcome = outcome;
  if (resolvedDigit !== undefined) e.resolvedDigit = resolvedDigit;
  persist();
}

export function openTrades(): JournalEntry[] {
  return load().filter((e) => e.outcome === "PENDING");
}

export function journalStats() {
  const list = load();
  const settled = list.filter((e) => e.outcome === "WIN" || e.outcome === "LOSS");
  const wins = settled.filter((e) => e.outcome === "WIN").length;
  return {
    total: list.length,
    settled: settled.length,
    wins,
    losses: settled.length - wins,
    winRate: settled.length ? wins / settled.length : 0,
    open: list.filter((e) => e.outcome === "PENDING").length,
  };
}

export function loadExecutionSettings(): ExecutionSettings {
  if (typeof window === "undefined") return DEFAULT_EXECUTION;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_EXECUTION, ...(JSON.parse(raw) as Partial<ExecutionSettings>) };
  } catch {
    /* ignore */
  }
  return DEFAULT_EXECUTION;
}

export function saveExecutionSettings(s: ExecutionSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  listeners.forEach((l) => l());
}

export function clearJournal() {
  entries = [];
  persist();
}
