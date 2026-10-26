import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/auth")({
  head: () =>
    pageMeta(
      "Sign In or Register",
      "Sign in to ReviewCard to manage your smart review cards, NFC landing pages and print studio.",
    ),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        void navigate({ to: "/dashboard" });
      }
    });
  }, [navigate]);

  const done = async () => {
    await router.invalidate();
    toast.success("Welcome back! Redirecting to dashboard...");
    await navigate({ to: "/dashboard" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice("Check your email for a password reset link.");
        toast.success("Password reset email sent! Please check your inbox.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        if (data.session) {
          await done();
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
          toast.success("Account created! Check your email to verify.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await done();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 sm:px-6 py-8 sm:py-12 text-slate-900">
      <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <BrandLogo size="lg" to="/" className="mb-4" />
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {mode === "signup"
              ? "Create your account"
              : mode === "reset"
                ? "Reset your password"
                : "Welcome back"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {mode === "signup"
              ? "Start managing your contactless review cards in minutes."
              : mode === "reset"
                ? "Enter your email address and we'll send a recovery link."
                : "Sign in to access your business dashboard."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label
                htmlFor="authName"
                className="text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Display Name
              </label>
              <Input
                id="authName"
                aria-label="Display name"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="authEmail"
              className="text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Email Address
            </label>
            <Input
              id="authEmail"
              type="email"
              aria-label="Email address"
              placeholder="you@company.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {mode !== "reset" && (
            <div className="space-y-1.5">
              <label
                htmlFor="authPassword"
                className="text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="authPassword"
                  type={showPassword ? "text" : "password"}
                  aria-label="Password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
          )}

          <Button
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : mode === "signup"
                ? "Create Account"
                : mode === "reset"
                  ? "Send Reset Link"
                  : "Sign In"}
          </Button>
        </form>

        {notice && (
          <p
            role="status"
            className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs sm:text-sm text-blue-900"
          >
            {notice}
          </p>
        )}

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Button
            variant="link"
            className="px-0 h-auto text-xs font-medium text-blue-600 hover:underline"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup"
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
          <Button
            variant="link"
            className="px-0 h-auto text-xs text-slate-500 hover:text-slate-800"
            onClick={() => setMode(mode === "reset" ? "signin" : "reset")}
          >
            {mode === "reset" ? "Back to Sign In" : "Forgot Password?"}
          </Button>
        </div>
      </div>
    </main>
  );
}
