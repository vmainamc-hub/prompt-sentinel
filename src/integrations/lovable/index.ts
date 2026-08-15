// Lovable auth integration — stubbed for Replit (auth is disabled; everyone goes straight to /app/dashboard).
export const lovable = {
  auth: {
    signInWithOAuth: async (_provider: string, _opts?: Record<string, unknown>) => {
      return { error: new Error('OAuth not configured in this environment') };
    },
  },
};
