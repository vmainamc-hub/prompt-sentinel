import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { apexCore } from "@/lib/apex/core";
import { startApexCloudSync, stopApexCloudSync } from "@/lib/apex/cloud";

// Auth gate disabled — app is publicly accessible.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AppShell,
});

/**
 * Sentinel's intelligence core and per-market contract simulators are retained
 * at the application level: they keep observing ticks, evaluating entry gates
 * and resolving paper contracts even when the Sentinel page is not mounted.
 */
function AppShell() {
  useEffect(() => {
    apexCore.retain();
    // Durable, per-market persistence of everything Sentinel learns. Falls back
    // to local-only learning (and reports it) when nobody is signed in.
    void startApexCloudSync();
    return () => stopApexCloudSync();
  }, []);
  return <Outlet />;
}
