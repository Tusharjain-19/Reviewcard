import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/media/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const kind =
          new URL(request.url).searchParams.get("kind") === "cover" ? "coverPath" : "logoPath";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: b } = await supabaseAdmin
          .from("businesses")
          .select("data")
          .eq("slug", params.slug)
          .eq("status", "published")
          .maybeSingle();
        if (!b || typeof b.data !== "object" || b.data === null || Array.isArray(b.data))
          return new Response(null, { status: 404 });
        const path = b.data[kind];
        if (typeof path !== "string") return new Response(null, { status: 404 });
        const { data: blob, error } = await supabaseAdmin.storage
          .from("business-media")
          .download(path);
        if (error || !blob) return new Response(null, { status: 404 });
        return new Response(blob, {
          headers: {
            "Content-Type": blob.type,
            "Cache-Control": "public,max-age=60",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
