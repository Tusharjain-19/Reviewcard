import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";
import { BrandLogo } from "@/components/BrandLogo";

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
    <main className="flex min-h-screen max-w-full overflow-x-hidden items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandLogo size="xl" to="/auth" />
        <p className="text-muted-foreground text-sm">Redirecting to your account...</p>
        <Button
          asChild
          className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
        >
          <Link to="/auth">Open ReviewCard</Link>
        </Button>
      </div>
    </main>
  );
}
