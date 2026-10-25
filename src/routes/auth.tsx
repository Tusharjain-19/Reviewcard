import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => pageMeta("Sign in", "Manage your businesses, review pages and print designs."),
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="font-display text-4xl">ReviewCard</h1>
        <h2 className="mt-3 text-xl text-muted-foreground">
          {mode === "signup"
            ? "Create an account"
            : mode === "reset"
              ? "Reset your password"
              : "Welcome back"}
        </h2>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <Input
            aria-label="Display name"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <Input
          type="email"
          aria-label="Email address"
          placeholder="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {mode !== "reset" && (
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              aria-label="Password"
              placeholder="Password"
              minLength={8}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        )}

        <Button className="w-full" disabled={busy}>
          {busy
            ? "Please wait..."
            : mode === "signup"
              ? "Create account"
              : mode === "reset"
                ? "Send reset link"
                : "Sign in"}
        </Button>
      </form>

      {notice && (
        <p role="status" className="rounded-md bg-muted p-3 text-sm text-foreground">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Button
          variant="link"
          className="px-0"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </Button>
        <Button
          variant="link"
          className="px-0 text-muted-foreground"
          onClick={() => setMode(mode === "reset" ? "signin" : "reset")}
        >
          {mode === "reset" ? "Back to sign in" : "Forgot password?"}
        </Button>
      </div>
    </main>
  );
}
