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
          const supabaseUrl = process.env["SUPABASE_URL"] ?? "";
          const client = createClient<Database>(supabaseUrl, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const h = new Headers(init?.headers);
                if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
                  h.delete("Authorization");
                }
                h.set("apikey", key);
                return fetch(input, { ...init, headers: h });
              },
            },
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
                  "Cache-Control":
                    "public,max-age=86400,s-maxage=86400,stale-while-revalidate=604800",
                  "X-Content-Type-Options": "nosniff",
                },
              });
            }
          }

          // 3. Storage media retrieval (path exists in published business record)
          const path = bData[kind];
          if (typeof path !== "string") return new Response(null, { status: 404 });

          // 3a. Storage download via client (allowed by Supabase RLS policy `media_business_image_read`)
          try {
            const { data: blob, error } = await client.storage
              .from("business-media")
              .download(path);
            if (!error && blob) {
              const arrayBuffer = await blob.arrayBuffer();
              return new Response(arrayBuffer, {
                headers: {
                  "Content-Type": blob.type || "image/png",
                  "Cache-Control":
                    "public,max-age=86400,s-maxage=86400,stale-while-revalidate=604800",
                  "X-Content-Type-Options": "nosniff",
                },
              });
            }
          } catch {
            // Continue to signed URL fallback
          }

          // 3b. Fallback: generate signed URL and redirect
          try {
            const signed = await client.storage.from("business-media").createSignedUrl(path, 86400);
            if (signed.data?.signedUrl) {
              return Response.redirect(signed.data.signedUrl, 307);
            }
          } catch {
            // Continue to admin fallback
          }

          // 3c. Optional admin client fallback if service role key is configured
          if (process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { data: blob, error } = await supabaseAdmin.storage
                .from("business-media")
                .download(path);
              if (!error && blob) {
                const arrayBuffer = await blob.arrayBuffer();
                return new Response(arrayBuffer, {
                  headers: {
                    "Content-Type": blob.type || "image/png",
                    "Cache-Control": "public,max-age=86400,s-maxage=86400",
                    "X-Content-Type-Options": "nosniff",
                  },
                });
              }
            } catch {
              // Ignore admin fallback failure
            }
          }

          return new Response(null, { status: 404 });
        } catch {
          return new Response(null, { status: 404 });
        }
      },
    },
  },
});
