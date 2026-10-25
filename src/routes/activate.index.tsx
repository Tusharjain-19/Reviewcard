import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { QrCode, ArrowRight, Camera, Keyboard, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";
import { CardQrScanner } from "@/components/CardQrScanner";

export const Route = createFileRoute("/activate/")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  head: () =>
    pageMeta(
      "Scan & Activate ReviewCard",
      "Scan your physical Google Review smart card with your camera or enter code to activate it.",
    ),
  component: ActivateIndexPage,
});

function ActivateIndexPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  // If search param ?id= or ?code= is provided in URL, navigate directly
  useEffect(() => {
    const rawCode = search.id || search.code;
    if (rawCode) {
      const clean = rawCode
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "");
      if (clean) {
        void navigate({ to: `/activate/${clean}` });
      }
    }
  }, [search.id, search.code, navigate]);

  const [activeTab, setActiveTab] = useState<"scan" | "manual">("scan");
  const [code, setCode] = useState("");

  const handleScanSuccess = (scannedCode: string) => {
    const clean = scannedCode
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    if (clean) {
      void navigate({ to: `/activate/${clean}` });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    if (!clean || clean.length < 3) {
      toast.error("Please enter a valid Card ID (at least 3 characters)");
      return;
    }
    void navigate({ to: `/activate/${clean}` });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base shadow-sm">
              G
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              ReviewCard
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/cards/batch">Batch Print (4)</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Activation Area */}
      <main className="mx-auto w-full max-w-lg px-4 py-8 md:py-12">
        <div className="rounded-2xl border bg-white p-6 md:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <QrCode className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Scan or Enter Card to Activate
            </h1>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              Scan the QR code on your physical card with your camera or type in the printed Card
              ID.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("scan")}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "scan"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Camera className="h-4 w-4" />
              Scan Card Camera
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "manual"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Keyboard className="h-4 w-4" />
              Enter Code Manually
            </button>
          </div>

          {/* TAB 1: Camera Scanner */}
          {activeTab === "scan" && (
            <div className="space-y-4">
              <CardQrScanner onScanSuccess={handleScanSuccess} />
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Camera not working? Enter code manually <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Manual Code Input */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="cardIdInput"
                  className="text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Physical Card ID / Code
                </label>
                <div className="relative">
                  <Input
                    id="cardIdInput"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. RC-4821 or GC-7102"
                    className="h-12 text-base font-mono uppercase tracking-wider text-center font-bold border-slate-300 focus-visible:ring-blue-600"
                    autoFocus
                    maxLength={30}
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Look for the code printed directly under the QR code on your card.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm gap-2 shadow-sm"
              >
                Continue to Business Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* 3 Step Guide */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              How Activation Works
            </h2>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  1
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">Scan Card or Enter Code:</span> Use
                  your web camera or type the code printed on the physical card.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  2
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">Add Business Details:</span> Enter
                  business name, Google Review link, and choose your color.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                  3
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">Show in Dashboard:</span> Instantly
                  saved to your database and live on your dashboard for taps and scans.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Want to print a fresh batch of 4 cards on A4 paper?{" "}
          <Link to="/cards/batch" className="font-semibold text-blue-600 hover:underline">
            Open Batch Card Studio
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-4 text-center text-xs text-slate-500">
        ReviewCard · Contactless Smart Cards for Local Businesses
      </footer>
    </div>
  );
}
