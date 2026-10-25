import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Home, QrCode, AlertTriangle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { BrandLogo } from "@/components/BrandLogo";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="md" to="/" />
        </div>

        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
          <span className="font-display text-4xl font-black">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            The page, smart card, or review link you are looking for doesn't exist, has expired, or
            has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            to="/activate"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
          >
            <QrCode className="h-4 w-4 text-blue-600" />
            Activate Card
          </Link>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="md" to="/" />
        </div>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-inner">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Something Went Wrong
          </h1>
          <p className="text-sm text-slate-600">
            An unexpected error occurred while loading this page. Please try refreshing or return to
            the dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <button
            type="button"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
          >
            Try Again
          </button>
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "ReviewCard — Smart Contactless Google Review Cards & Pages" },
      {
        name: "description",
        content:
          "Create contactless Google review smart cards, NFC landing pages, and batch print sheets for local businesses.",
      },
      { name: "author", content: "ReviewCard" },
      { property: "og:site_name", content: "ReviewCard" },
      { property: "og:title", content: "ReviewCard — Smart Contactless Google Review Cards & Pages" },
      {
        property: "og:description",
        content:
          "Create contactless Google review smart cards, NFC landing pages, and batch print sheets for local businesses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#1a73e8" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden max-w-full">
      <head>
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className="overflow-x-hidden max-w-full min-h-screen antialiased bg-slate-50 text-slate-900"
      >
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full max-w-full overflow-x-hidden min-h-screen flex flex-col">
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
