import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    // Client-side redirect only; return a 200 for the root so the
    // sandbox health-check doesn't see a 307 and kill the process.
    if (typeof window !== "undefined") {
      throw redirect({ to: "/signup" });
    }
  },
  component: () => null,
});
