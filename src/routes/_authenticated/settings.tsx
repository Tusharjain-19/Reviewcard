import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, User, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () =>
    pageMeta("Account Settings", "Manage your profile, public name and ReviewCard preferences."),
  loader: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw new Error("Sign in required");
    }
    const result = await supabase
      .from("profiles")
      .select("display_name,avatar_url")
      .eq("id", data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email,
      ...result.data,
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const data = Route.useLoaderData();
  const [name, setName] = useState(data.display_name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a valid display name");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", data.id);

      if (error) {
        toast.error(error.message || "Could not save profile");
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 flex flex-col text-slate-900">
      {/* Top Header with Clickable Brand Logo and Navigation */}
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 shadow-2xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <BrandLogo size="md" to="/dashboard" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to</span> Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12 space-y-6 flex-1">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Manage your personal profile and account credentials.
          </p>
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-2xl border bg-white p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="displayName"
              className="text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Display Name
            </label>
            <Input
              id="displayName"
              aria-label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="h-10 text-sm bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account Email
            </label>
            <p className="font-mono text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 break-all">
              {data.email || "No email associated"}
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
