import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Plus,
  ExternalLink,
  Copy,
  Pause,
  Play,
  Palette,
  Radio,
  LogOut,
  Printer,
  Trash2,
  QrCode,
  Search,
  Check,
  Building2,
  Share2,
  Sparkles,
} from "lucide-react";
import { businessesQuery, statsQuery } from "@/lib/queries";
import { deleteBusiness, saveCloudBusiness } from "@/lib/businesses.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () =>
    pageMeta("Business Dashboard", "Manage your contactless business cards, QR reviews and pages."),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(businessesQuery),
      context.queryClient.ensureQueryData(statsQuery),
    ]);
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: list } = useSuspenseQuery(businessesQuery);
  const { data: stats } = useSuspenseQuery(statsQuery);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const save = useServerFn(saveCloudBusiness);
  const removeBusiness = useServerFn(deleteBusiness);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const reload = async () => {
    await qc.invalidateQueries({ queryKey: businessesQuery.queryKey });
    await qc.refetchQueries({ queryKey: businessesQuery.queryKey });
  };

  const action = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const handleSignOut = async () => {
    setShowSignOutDialog(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
    toast.success("Signed out successfully");
  };

  const handleCopyReviewUrl = async (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/r/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Review page link copied to clipboard!");
    } catch {
      toast.info(`Review link: ${url}`);
    }
  };

  const visibleList = list.filter((b) => !deletedIds.includes(b.id));

  const filteredList = visibleList.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || b.status === filter),
  );

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
      {/* ---------------- TOP MOBILE-RESPONSIVE APP HEADER ---------------- */}
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base shadow-sm">
              G
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">
              ReviewCard
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSignOutDialog(true)}
              className="h-9 px-2.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 gap-1.5"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 space-y-6">
        {/* ---------------- MOBILE-FIRST QUICK ACTIONS BAR ---------------- */}
        <section aria-label="Quick Actions" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Scan & Activate */}
          <Link
            to="/activate"
            className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 border-blue-500/20 bg-linear-to-r from-blue-50 to-indigo-50/40 hover:border-blue-500/50 hover:shadow-md transition-all group"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm group-hover:scale-105 transition-transform">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                Scan / Activate Card
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              </div>
              <p className="text-xs text-slate-600 mt-0.5">Scan QR or enter card ID</p>
            </div>
          </Link>

          {/* Action 2: Batch Print 4 */}
          <Link
            to="/cards/batch"
            className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition-colors">
              <Printer className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Batch Print (4+ Cards)</div>
              <p className="text-xs text-slate-600 mt-0.5">Multi-card A4 sheets</p>
            </div>
          </Link>

          {/* Action 3: Add Business Page */}
          <Link
            to="/new"
            className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Add New Business</div>
              <p className="text-xs text-slate-600 mt-0.5">Create custom review link</p>
            </div>
          </Link>
        </section>

        {/* ---------------- STATS COUNTERS ---------------- */}
        <section
          aria-label="Overview Stats"
          className="grid grid-cols-3 gap-2.5 sm:gap-4 rounded-2xl border bg-white p-4 shadow-xs"
        >
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Businesses
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
              {visibleList.length}
            </p>
          </div>
          <div className="text-center sm:text-left border-x px-2 sm:px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Page Views
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
              {stats.reduce((s, x) => s + Number(x.views), 0)}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Review Taps
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-600 mt-0.5">
              {stats.reduce((s, x) => s + Number(x.reviews), 0)}
            </p>
          </div>
        </section>

        {/* ---------------- SEARCH & FILTER PILLS ---------------- */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                aria-label="Search businesses"
                placeholder="Search business name or slug..."
                className="pl-9 h-10 text-sm bg-white border-slate-200 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: "all", label: "All" },
                { key: "published", label: "Published" },
                { key: "draft", label: "Draft" },
                { key: "paused", label: "Paused" },
              ].map((p) => {
                const count =
                  p.key === "all"
                    ? visibleList.length
                    : visibleList.filter((b) => b.status === p.key).length;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setFilter(p.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      filter === p.key
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {p.label}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        filter === p.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- BUSINESS CARDS LIST ---------------- */}
        <section aria-label="Businesses List" className="grid gap-4 md:grid-cols-2">
          {filteredList.map((b) => {
            const isPublished = b.status === "published";
            const isDraft = b.status === "draft";
            return (
              <article
                key={b.id}
                className="flex flex-col justify-between rounded-2xl border bg-white p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Top Info Row */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Business Avatar / Initial Badge */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-base shadow-xs">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display text-lg font-bold text-slate-900 truncate">
                          {b.name}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span>{b.category || "Local Business"}</span>
                          <span>·</span>
                          <span className="font-mono text-blue-600 truncate">/r/{b.slug}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0 ${
                        isPublished
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isDraft
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isPublished ? "bg-emerald-500" : isDraft ? "bg-amber-500" : "bg-slate-400"
                        }`}
                      />
                      {b.status}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Area: Formatted cleanly for both Mobile and Desktop */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  {/* Primary Touch Buttons Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs rounded-xl"
                    >
                      <Link to="/new" search={{ edit: b.slug }}>
                        Edit Details
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full h-10 font-semibold text-xs rounded-xl border-slate-300 gap-1.5 text-slate-700 hover:bg-slate-50"
                    >
                      <Link to="/cards/$slug" params={{ slug: b.slug }}>
                        <Palette className="h-3.5 w-3.5 text-blue-600" />
                        Print Cards
                      </Link>
                    </Button>
                  </div>

                  {/* Secondary Quick Utility Toolbar (Thumb-friendly buttons) */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {/* Live Review Page */}
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs gap-1 rounded-lg"
                      title="Open live review page"
                    >
                      <Link to="/r/$slug" params={{ slug: b.slug }} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Live Page</span>
                      </Link>
                    </Button>

                    {/* NFC Preview */}
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs gap-1 rounded-lg"
                      title="NFC Tag Configuration"
                    >
                      <Link to="/nfc/$slug" params={{ slug: b.slug }}>
                        <Radio className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">NFC</span>
                      </Link>
                    </Button>

                    {/* Copy Link */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyReviewUrl(b.slug)}
                      className="h-9 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs gap-1 rounded-lg"
                      title="Copy review link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Copy Link</span>
                    </Button>

                    {/* Pause / Play */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-500 hover:text-slate-800 rounded-lg"
                      title={b.status === "published" ? "Pause card" : "Publish card"}
                      onClick={() =>
                        action(() =>
                          save({
                            data: {
                              ...b,
                              status: b.status === "published" ? "paused" : "published",
                            },
                          }),
                        )
                      }
                    >
                      {b.status === "published" ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Delete Card */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      title="Delete card permanently"
                      onClick={() => {
                        if (b.id) {
                          setDeleteTarget({ id: b.id, name: b.name });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* ---------------- EMPTY STATE ---------------- */}
        {visibleList.length === 0 && (
          <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8 my-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
              <QrCode className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                No active cards yet
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                Scan a physical card with your camera or create a new business page to get started.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Link to="/activate">
                  <QrCode className="h-4 w-4" />
                  Scan Physical Card
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/new">
                  <Plus className="h-4 w-4" />
                  Add New Business
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ---------------- CUSTOM UI/UX DELETE CONFIRMATION MODAL ---------------- */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="sm:max-w-md mx-4">
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 sm:mx-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="font-display text-xl">
              Delete {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Are you sure you want to delete this card? This action cannot be undone and will
              permanently remove this business from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (deleteTarget?.id) {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  setDeletedIds((prev) => [...prev, target.id]);
                  void action(async () => {
                    try {
                      await removeBusiness({ data: { id: target.id } });
                      toast.success(`${target.name} permanently deleted`);
                    } catch (err) {
                      setDeletedIds((prev) => prev.filter((id) => id !== target.id));
                      throw err;
                    }
                  });
                }
              }}
            >
              Delete Card
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------------- CUSTOM UI/UX SIGN OUT CONFIRMATION MODAL ---------------- */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent className="sm:max-w-md mx-4">
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 sm:mx-0">
              <LogOut className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="font-display text-xl">
              Sign out of ReviewCard?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              You will be signed out of your account on this device. Your published review pages and
              card designs will remain online.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel onClick={() => setShowSignOutDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
