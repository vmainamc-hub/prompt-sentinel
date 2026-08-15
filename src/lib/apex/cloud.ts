/**
 * Durable, market-isolated persistence for Sentinel's learned state.
 *
 * Absolute market isolation is the contract of this module: every write is
 * keyed by (user, symbol, kind) and carries ONLY that market's records. Nothing
 * in here ever pools two markets, and a payload that contains a foreign symbol
 * is rejected on load by the simulator's own importer.
 *
 * Without a signed-in user Sentinel keeps learning in-session (RAM +
 * localStorage) and reports LOCAL so the UI never implies false durability.
 */
import { supabase } from "@/integrations/supabase/client";
import { apexSimulator, type SimTrade } from "./simulator";
import { exportMemory, importMemory } from "./memory";
import { isApexSymbol } from "./universe";

export type ApexCloudPhase = "IDLE" | "LOCAL" | "LOADING" | "SYNCED" | "ERROR";

export interface ApexCloudStatus {
  phase: ApexCloudPhase;
  /** Markets whose ledgers have been written at least once this session. */
  markets: number;
  restoredTrades: number;
  savedTrades: number;
  lastSyncAt: number | null;
  error: string | null;
}

const SAVE_INTERVAL_MS = 20_000;

let status: ApexCloudStatus = {
  phase: "IDLE",
  markets: 0,
  restoredTrades: 0,
  savedTrades: 0,
  lastSyncAt: null,
  error: null,
};
const listeners = new Set<() => void>();
let running = false;
let userId: string | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let unsubResolved: (() => void) | null = null;
/** Symbols with unflushed changes — one flush writes one row per symbol. */
const dirty = new Set<string>();
let memoryDirty = false;

function emit() {
  listeners.forEach((l) => l());
}

function patch(next: Partial<ApexCloudStatus>) {
  status = { ...status, ...next };
  emit();
}

export function apexCloudStatus(): ApexCloudStatus {
  return status;
}

export function subscribeApexCloud(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** One market's ledger row. */
async function saveMarket(symbol: string) {
  if (!userId) return;
  const trades = apexSimulator.exportMarket(symbol);
  if (!trades.length) return;
  const { error } = await supabase.from("apex_market_state").upsert(
    {
      user_id: userId,
      symbol,
      kind: "sim_ledger",
      payload: { symbol, trades } as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,symbol,kind" },
  );
  if (error) throw error;
  status.savedTrades += trades.length;
}

async function saveMemory() {
  if (!userId) return;
  const { error } = await supabase.from("apex_market_state").upsert(
    {
      user_id: userId,
      // Market memory rows are themselves keyed per market inside the payload;
      // the analogue keys embed the symbol so no market can read another's.
      symbol: "__memory",
      kind: "memory",
      payload: exportMemory() as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,symbol,kind" },
  );
  if (error) throw error;
}

async function flush() {
  if (!userId) return;
  const pending = [...dirty];
  dirty.clear();
  const wasMemoryDirty = memoryDirty;
  memoryDirty = false;
  try {
    for (const symbol of pending) await saveMarket(symbol);
    if (wasMemoryDirty) await saveMemory();
    patch({
      phase: "SYNCED",
      lastSyncAt: Date.now(),
      markets: Math.max(status.markets, pending.length),
      error: null,
    });
  } catch (e) {
    // Never lose evidence because of a transient write failure: put the
    // markets back in the queue and surface the degradation honestly.
    pending.forEach((s) => dirty.add(s));
    memoryDirty = memoryDirty || wasMemoryDirty;
    patch({ phase: "ERROR", error: e instanceof Error ? e.message : String(e) });
  }
}

async function restore() {
  if (!userId) return;
  patch({ phase: "LOADING", error: null });
  const { data, error } = await supabase
    .from("apex_market_state")
    .select("symbol, kind, payload")
    .eq("user_id", userId);
  if (error) {
    patch({ phase: "ERROR", error: error.message });
    return;
  }
  const books: Record<string, SimTrade[]> = {};
  for (const row of data ?? []) {
    if (row.kind === "memory") {
      importMemory(row.payload as never);
      continue;
    }
    if (row.kind !== "sim_ledger") continue;
    // Retired/excluded markets are never rehydrated, even if history exists.
    if (!isApexSymbol(row.symbol)) continue;
    const payload = row.payload as { trades?: SimTrade[] } | null;
    const trades = Array.isArray(payload?.trades) ? payload.trades : [];
    books[row.symbol] = trades.filter((t) => t && t.symbol === row.symbol);
  }
  const restored = apexSimulator.importBooks(books);
  patch({
    phase: "SYNCED",
    restoredTrades: restored,
    markets: Object.keys(books).length,
    lastSyncAt: Date.now(),
  });
}

/**
 * Start durable sync. Safe to call repeatedly; only the first call attaches.
 */
export async function startApexCloudSync(): Promise<void> {
  if (running || typeof window === "undefined") return;
  running = true;

  const { data } = await supabase.auth.getUser();
  userId = data.user?.id ?? null;
  if (!userId) {
    // Anonymous session: learning continues locally and says so.
    patch({ phase: "LOCAL", error: null });
    running = false;
    return;
  }

  await restore();

  unsubResolved = apexSimulator.onResolved((trade) => {
    dirty.add(trade.symbol);
    memoryDirty = true;
    void appendTrade(trade);
  });
  timer = setInterval(() => void flush(), SAVE_INTERVAL_MS);
}

/** Append one resolved contract as immutable, market-tagged evidence. */
async function appendTrade(trade: SimTrade) {
  if (!userId || trade.result === "OPEN") return;
  const { error } = await supabase.from("apex_sim_trades").insert({
    user_id: userId,
    symbol: trade.symbol,
    contract: trade.contract,
    entry_condition: trade.entryCondition,
    entry_at: new Date(trade.openedAt).toISOString(),
    entry_digit: trade.entryDigit,
    duration_ticks: trade.durationTicks,
    resolved_at: trade.resolvedAt ? new Date(trade.resolvedAt).toISOString() : null,
    resolution_digit: trade.expiryDigit,
    outcome: trade.result,
    stake: trade.stake,
    payout: trade.payout,
    pnl: trade.pnl,
    detail: {
      market: trade.market,
      side: trade.side,
      barrier: trade.barrier,
      winners: trade.winners,
      entryRule: trade.entryRule,
      state: trade.state,
    } as never,
  });
  if (error) patch({ phase: "ERROR", error: error.message });
}

export function stopApexCloudSync() {
  if (timer) clearInterval(timer);
  timer = null;
  unsubResolved?.();
  unsubResolved = null;
  running = false;
}