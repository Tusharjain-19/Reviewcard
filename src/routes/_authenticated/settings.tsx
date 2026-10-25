import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageMeta("Account settings", "Update your ReviewCard profile."),
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
      ...result.data,
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const data = Route.useLoaderData();
  const [name, setName] = useState(data.display_name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name })
        .eq("id", data.id);

      if (error) {
        toast.error("Could not save profile");
      } else {
        toast.success("Profile saved");
      }
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
      <div className="space-y-1">
        <h1 className="font-display text-3xl">Your profile</h1>
        <p className="text-sm text-muted-foreground">Manage your public account details.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium">
            Display name
          </label>
          <Input
            id="displayName"
            aria-label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name or company"
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </main>
  );
}
