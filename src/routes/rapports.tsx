import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/rapports")({
  validateSearch: (s: Record<string, unknown>): { veille?: string } => (typeof s["veille"] === "string" ? { veille: s["veille"] } : {}),
  component: () => <Outlet />,
});

