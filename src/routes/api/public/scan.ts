import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
export const Route = createFileRoute("/api/public/scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin)
          return new Response("Forbidden", { status: 403 });
        try {
          const body = z
            .object({
              slug: z.string().max(40),
              source: z
                .string()
                .max(40)
                .regex(/^[a-zA-Z0-9_-]+$/),
              kind: z.enum(["view", "click", "review"]),
              linkId: z.string().max(100).optional(),
            })
            .parse(await request.json());
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: b } = await supabaseAdmin
            .from("businesses")
            .select("id,status")
            .eq("slug", body.slug)
            .eq("status", "published")
            .maybeSingle();
          if (!b) return new Response(null, { status: 404 });
          const { count } = await supabaseAdmin
            .from("scan_events")
            .select("id", { count: "exact", head: true })
            .eq("business_id", b.id)
            .gte("occurred_at", new Date(Date.now() - 60000).toISOString());
          if ((count ?? 0) > 300) return new Response(null, { status: 429 });
          await supabaseAdmin.from("scan_events").insert({
            business_id: b.id,
            source: body.source,
            kind: body.kind,
            link_id: body.linkId ?? null,
          });
          return new Response(null, { status: 204 });
        } catch {
          return new Response(null, { status: 400 });
        }
      },
    },
  },
});
