import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageMeta("Reset Password", "Choose a new secure password for your ReviewCard account."),
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
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully! Welcome back.");
        await navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 sm:px-6 py-12 text-slate-900">
      <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <BrandLogo size="lg" to="/auth" className="mb-4" />
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Set New Password
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        {valid ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="newPassword"
                className="text-xs font-bold uppercase tracking-wider text-slate-700"
              >
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
                  placeholder="At least 8 characters"
                  className="pr-10 h-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
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
            <Button
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-800 space-y-2">
            <p className="font-semibold">Reset Link Expired or Invalid</p>
            <p>
              Please open the reset link directly from your email inbox, or request a new one from
              the sign-in page.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link
            to="/auth"
            className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
          <Link to="/" className="text-slate-500 hover:text-slate-800">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
