// Supabase client with graceful fallback when Lovable Cloud is not connected.
// The Precision Edge app can run in read-only mode against live Deriv WebSockets
// without a Supabase backend. When SUPABASE env vars are missing, this module
// exports a stub client so `import { supabase } from ".../client"` never crashes
// at module load. Feature routes that need auth/journal/bot storage will fail
// gracefully at call time instead of blocking the entire router.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function hasCreds() {
  const url =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    (typeof process !== "undefined" ? process.env?.SUPABASE_URL : undefined);
  const key =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    (typeof process !== "undefined" ? process.env?.SUPABASE_PUBLISHABLE_KEY : undefined);
  return Boolean(url && key);
}

function createRealClient(): SupabaseClient<Database> {
  const url =
    ((import.meta as any).env?.VITE_SUPABASE_URL as string) ||
    (process.env?.SUPABASE_URL as string);
  const key =
    ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
    (process.env?.SUPABASE_PUBLISHABLE_KEY as string);
  return createClient<Database>(url, key, {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Stub used when Lovable Cloud is not connected. Returns benign values so the
// module graph loads and top-level imports (e.g. auth listener in __root.tsx)
// do not crash on first render.
function createStubClient(): SupabaseClient<Database> {
  const subscription = { unsubscribe() {} };
  const unavailable = () => Promise.resolve({ data: null, error: { message: "Supabase not connected" } as any });
  const queryBuilder: any = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") {
        return (resolve: any) => resolve({ data: null, error: null });
      }
      return () => queryBuilder;
    },
    apply() {
      return queryBuilder;
    },
  });
  const auth = {
    onAuthStateChange: () => ({ data: { subscription } }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: unavailable,
    signInWithOAuth: unavailable,
    signUp: unavailable,
    signOut: () => Promise.resolve({ error: null }),
    exchangeCodeForSession: unavailable,
  };
  const storage = {
    from: () => ({
      upload: unavailable,
      download: unavailable,
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      remove: unavailable,
      list: unavailable,
    }),
  };
  const functions = { invoke: unavailable };
  return {
    auth,
    storage,
    functions,
    from: () => queryBuilder,
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe() {} }) }), subscribe: () => ({ unsubscribe() {} }) }),
    removeChannel: () => {},
    rpc: () => queryBuilder,
  } as unknown as SupabaseClient<Database>;
}

let _client: SupabaseClient<Database> | undefined;

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_t, prop, receiver) {
    if (!_client) {
      _client = hasCreds() ? createRealClient() : createStubClient();
    }
    return Reflect.get(_client, prop, receiver);
  },
});

export const isSupabaseConnected = hasCreds;
