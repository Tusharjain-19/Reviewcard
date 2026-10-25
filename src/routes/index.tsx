import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => pageMeta("ReviewCard", "Business review pages, QR cards and NFC tools."),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      void navigate({
        to: data.user ? "/dashboard" : "/auth",
        replace: true,
      });
    });
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="font-display text-4xl">ReviewCard</h1>
        <p className="text-muted-foreground">Redirecting you to your account...</p>
        <Button asChild>
          <Link to="/auth">Open ReviewCard</Link>
        </Button>
      </div>
    </main>
  );
}
