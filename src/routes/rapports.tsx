import { createFileRoute, Outlet, useMatchRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rapports")({
  validateSearch: (s: Record<string, unknown>): { veille?: string } => (typeof s["veille"] === "string" ? { veille: s["veille"] } : {}),
  component: () => <Outlet />,
});

export function useIsReportDetail() {
  return !!useMatchRoute()({ to: "/rapports/$id" });
}
