import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, QrCode, ArrowLeft, Search } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/$")({
  head: () =>
    pageMeta(
      "404 Page Not Found",
      "The page, smart card, or review link you are looking for does not exist or has been moved.",
    ),
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md text-center bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
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
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            The page, smart card, or review link you are looking for doesn't exist, has expired, or
            has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <Button
            asChild
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs gap-2"
          >
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 gap-2"
          >
            <Link to="/activate">
              <QrCode className="h-4 w-4 text-blue-600" />
              Activate Card
            </Link>
          </Button>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-xs text-slate-500">
          <Link to="/" className="hover:text-blue-600 hover:underline">
            Home
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link to="/auth" className="hover:text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
