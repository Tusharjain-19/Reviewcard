import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/media/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const kind =
            new URL(request.url).searchParams.get("kind") === "cover" ? "coverPath" : "logoPath";

          // 1. Fetch published business record using publishable key (always available)
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
          const client = createClient<Database>(process.env["SUPABASE_URL"] ?? "", key, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: b } = await client
            .from("businesses")
            .select("data")
            .eq("slug", params.slug)
            .eq("status", "published")
            .maybeSingle();

          if (!b || typeof b.data !== "object" || b.data === null || Array.isArray(b.data)) {
            return new Response(null, { status: 404 });
          }

          const bData = b.data as Record<string, unknown>;

          // 2. Check for inline compressed logo data URL (instant, zero-storage-dependency fallback)
          if (
            kind === "logoPath" &&
            typeof bData["logo"] === "string" &&
            bData["logo"].startsWith("data:")
          ) {
            const dataUrl = bData["logo"];
            const commaIdx = dataUrl.indexOf(",");
            if (commaIdx !== -1) {
              const mime = dataUrl.slice(5, dataUrl.indexOf(";")) || "image/webp";
              const b64 = dataUrl.slice(commaIdx + 1);
              const buffer = Buffer.from(b64, "base64");
              return new Response(buffer, {
                headers: {
                  "Content-Type": mime,
                  "Cache-Control": "public,max-age=300",
                  "X-Content-Type-Options": "nosniff",
                },
              });
            }
          }

          // 3. Otherwise attempt storage download via admin client if path exists
          const path = bData[kind];
          if (typeof path !== "string") return new Response(null, { status: 404 });

          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: blob, error } = await supabaseAdmin.storage
              .from("business-media")
              .download(path);
            if (!error && blob) {
              return new Response(blob, {
                headers: {
                  "Content-Type": blob.type || "image/png",
                  "Cache-Control": "public,max-age=120",
                  "X-Content-Type-Options": "nosniff",
                },
              });
            }
          } catch {
            // Silently fall through to 404 if storage download fails
          }

          return new Response(null, { status: 404 });
        } catch {
          return new Response(null, { status: 404 });
        }
      },
    },
  },
});
