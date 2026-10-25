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
  Archive,
  Palette,
  Radio,
  LogOut,
  Printer,
  Trash2,
  QrCode,
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
  head: () => pageMeta("Business dashboard", "Manage business pages, QR cards and scan activity."),
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

  const visibleList = list.filter((b) => !deletedIds.includes(b.id));

  return (
    <main className="mx-auto max-w-6xl px-6 py-7">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <h1 className="font-display text-3xl">ReviewCard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => setShowSignOutDialog(true)}
          >
            <LogOut />
          </Button>
          <Button
            variant="outline"
            asChild
            className="gap-2 border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100 shadow-xs"
          >
            <Link to="/activate">
              <QrCode className="h-4 w-4 text-blue-600" />
              Scan / Activate Card
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/cards/batch">
              <Printer className="h-4 w-4 text-blue-600" />
              Batch Print (4)
            </Link>
          </Button>
          <Button asChild>
            <Link to="/new">
              <Plus />
              Add business
            </Link>
          </Button>
        </div>
      </header>
      <div className="grid gap-5 border-b py-7 sm:grid-cols-3">
        {[
          ["Businesses", visibleList.length],
          ["Page views", stats.reduce((s, x) => s + Number(x.views), 0)],
          ["Review taps", stats.reduce((s, x) => s + Number(x.reviews), 0)],
        ].map(([label, n]) => (
          <div key={label}>
            <p className="text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-4xl">{n}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 py-6">
        <Input
          aria-label="Search businesses"
          placeholder="Search businesses"
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter status"
          className="rounded-md border bg-background px-3"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["all", "published", "draft", "paused"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {visibleList
          .filter(
            (b) =>
              b.name.toLowerCase().includes(search.toLowerCase()) &&
              (filter === "all" || b.status === filter),
          )
          .map((b) => (
            <article key={b.id} className="rounded-lg border bg-card p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{b.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {b.category || "Business"} · /r/{b.slug}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">{b.status}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/new" search={{ edit: b.slug }}>
                    Edit page
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/cards/$slug" params={{ slug: b.slug }}>
                    <Palette />
                    Cards
                  </Link>
                </Button>
                <Button asChild size="icon" variant="ghost">
                  <Link to="/r/$slug" params={{ slug: b.slug }} aria-label={`Open ${b.name}`}>
                    <ExternalLink />
                  </Link>
                </Button>
                <Button asChild size="icon" variant="ghost">
                  <Link to="/nfc/$slug" params={{ slug: b.slug }} aria-label={`NFC ${b.name}`}>
                    <Radio />
                  </Link>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Duplicate ${b.name}`}
                  title="Duplicate"
                  onClick={() =>
                    action(async () => {
                      const { id: _id, ...copy } = b;
                      await save({
                        data: {
                          ...copy,
                          name: `${b.name} copy`,
                          slug: `${b.slug.slice(0, 30)}-${Date.now().toString(36)}`,
                          status: "draft",
                        },
                      });
                    })
                  }
                >
                  <Copy />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`${b.status === "published" ? "Pause" : "Publish"} ${b.name}`}
                  onClick={() =>
                    action(() =>
                      save({
                        data: { ...b, status: b.status === "published" ? "paused" : "published" },
                      }),
                    )
                  }
                >
                  {b.status === "published" ? <Pause /> : <Play />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${b.name}`}
                  title="Delete Card"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (b.id) {
                      setDeleteTarget({ id: b.id, name: b.name });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
      </div>
      {visibleList.length === 0 && (
        <div className="py-14 text-center border rounded-2xl bg-slate-50/50 p-8 my-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-3 shadow-xs">
            <QrCode className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">No businesses yet</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
            Activate a pre-printed smart card by scanning its QR code or create a brand new business
            review page.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Link to="/activate">
                <QrCode className="h-4 w-4" />
                Scan / Activate Physical Card
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

      {/* ---------------- CUSTOM UI/UX DELETE CONFIRMATION MODAL ---------------- */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="sm:max-w-md">
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
                      toast.success(`${target.name} deleted successfully`);
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
        <AlertDialogContent className="sm:max-w-md">
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
    </main>
  );
}
