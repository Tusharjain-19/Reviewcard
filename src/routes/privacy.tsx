import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageMeta(
      "Privacy Policy",
      "How ReviewCard respects your data, protects business accounts and records scan events without tracking personal information.",
    ),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 flex flex-col text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 shadow-2xs">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <BrandLogo size="md" to="/" />
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600 hover:text-slate-900">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to</span> Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 space-y-6 flex-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <Shield className="h-3.5 w-3.5 text-blue-600" />
            <span>Privacy & Security</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Last updated: October 2026. How we protect your business information and customer privacy.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 sm:p-8 shadow-xs space-y-5 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-base font-bold text-slate-900">1. Account Data</h2>
            <p>
              ReviewCard stores account details, business profiles, uploaded logo images and saved print
              designs to provide this service. Your account is secured by Supabase authentication.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-bold text-slate-900">2. Customer Interactions & Analytics</h2>
            <p>
              When customers scan physical cards or visit your review page, we record aggregate page views,
              button taps, source parameters and timestamps. We never record customer names, phone numbers,
              cookies or exact IP addresses.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-bold text-slate-900">3. Third-Party Links</h2>
            <p>
              External buttons route customers directly to third-party services (such as Google Maps, WhatsApp,
              or Instagram) which operate under their own privacy policies. ReviewCard never intercepts or alters
              reviews left on Google.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-base font-bold text-slate-900">4. Business Slugs & Data Retention</h2>
            <p>
              Business addresses and print URLs are permanent to ensure existing printed cards always function.
              Account holders may archive cards or pause destination routing at any time from their dashboard.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link to="/" className="text-xs text-blue-600 font-semibold hover:underline">
              ← Return to Home
            </Link>
            <Link to="/auth" className="text-xs text-slate-500 hover:text-slate-800">
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
