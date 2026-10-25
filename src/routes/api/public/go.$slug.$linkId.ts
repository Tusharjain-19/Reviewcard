import { createFileRoute } from "@tanstack/react-router";
import {
  buildLinkUrl,
  reviewUrlFromInput,
  REVIEW_BUTTON_ID,
  type Business,
} from "@/lib/reviewcard";
export const Route = createFileRoute("/api/public/go/$slug/$linkId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("businesses")
          .select("id,data")
          .eq("slug", params.slug)
          .eq("status", "published")
          .maybeSingle();
        if (!row) return new Response("Business unavailable", { status: 404 });
        const b = row.data as unknown as Business;
        const review = params.linkId === REVIEW_BUTTON_ID;
        const link = b.links.find((l) => l.id === params.linkId && !l.hidden);
        const url = review ? reviewUrlFromInput(b.reviewUrl) : link ? buildLinkUrl(link) : null;
        if (!url) return new Response("Link unavailable", { status: 404 });
        const input = new URL(request.url).searchParams.get("s") ?? "direct";
        const source = /^[a-zA-Z0-9_-]{1,40}$/.test(input) ? input : "direct";
        await supabaseAdmin.from("scan_events").insert({
          business_id: row.id,
          kind: review ? "review" : "click",
          source,
          link_id: params.linkId,
        });
        return new Response(null, {
          status: 302,
          headers: { Location: url, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
