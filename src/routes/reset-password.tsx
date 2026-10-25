import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => pageMeta("Reset password", "Choose a new password for your ReviewCard account."),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    void supabase.auth.getUser().then(({ data }) => {
      setValid(recovery && !!data.user);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully");
        await navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-20">
      <div className="space-y-1">
        <h1 className="font-display text-3xl">New password</h1>
        <p className="text-sm text-muted-foreground">
          Enter a secure password with at least 8 characters.
        </p>
      </div>

      {valid ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                aria-label="New password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <Button className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      ) : (
        <div className="rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
          Please open the password reset link sent to your email to continue.
        </div>
      )}
    </main>
  );
}
