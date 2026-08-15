import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

// Sign-in is disabled during development — send everyone straight into the app.
const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  beforeLoad: ({ search }) => {
    throw redirect({ to: search.redirect ?? "/app/dashboard" });
  },
  component: () => null,
});
