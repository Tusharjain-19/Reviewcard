import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { LinkPage } from "@/components/LinkPage";
import { publicBusinessQuery } from "@/lib/queries";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/r/$slug")({
  validateSearch: (s: Record<string, unknown>): { s?: string } =>
    typeof s["s"] === "string" ? { s: s["s"] } : {},
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(publicBusinessQuery(params.slug)),
  head: ({ loaderData }) => {
    const b = loaderData;
    const head = pageMeta(
      b?.name ?? "Business unavailable",
      b?.tagline || "Leave a Google review and find this business's links.",
    );
    return {
      ...head,
      links: b?.logo ? [{ rel: "icon", href: b.logo }] : [],
    };
  },
  component: PublicPage,
});

function PublicPage() {
  const { slug } = Route.useParams();
  const { s } = Route.useSearch();
  const { data: b } = useSuspenseQuery(publicBusinessQuery(slug));

  useEffect(() => {
    if (b?.id) {
      void fetch("/api/public/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, source: s ?? "direct", kind: "view" }),
      }).catch(() => {
        // Silently catch scan analytics failure to not degrade UX
      });
    }
  }, [b?.id, slug, s]);

  if (!b) {
    return (
      <main className="flex min-h-screen max-w-full overflow-x-hidden flex-col items-center justify-center bg-slate-50 p-6 text-center text-slate-900">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
            >
              <path d="M5.5 9.4 A 3.2 3.2 0 0 1 5.5 14.6" />
              <path d="M9.2 7.2 A 6.2 6.2 0 0 1 9.2 16.8" />
              <path d="M13.0 5.0 A 9.5 9.5 0 0 1 13.0 19.0" />
              <path d="M16.8 2.8 A 13.0 13.0 0 0 1 16.8 21.2" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold">Activate This ReviewCard</h1>
          <p className="mt-2 text-sm text-slate-600">
            This card is ready to be linked to your business. Scan or click below to activate it in
            60 seconds and start collecting 5-star Google reviews.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/activate/$code"
              params={{ code: slug }}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700"
            >
              Activate Card Now
            </Link>
            <Link to="/" className="text-xs text-muted-foreground hover:underline">
              Learn More About ReviewCard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-full overflow-x-hidden min-h-screen">
      <LinkPage b={b} />
    </main>
  );
}
