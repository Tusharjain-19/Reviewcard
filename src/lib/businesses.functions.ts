import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";
import { validSlug, reviewUrlFromInput, buildLinkUrl, type Business } from "./reviewcard";

export const listBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("businesses")
      .select("id,slug,name,category,status,data")
      .eq("owner_id", context.userId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false });
    if (error) throw new Error("Could not load businesses");
    return (data ?? []).map((row) => ({
      ...(row.data as unknown as Business),
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      status: row.status as NonNullable<Business["status"]>,
    }));
  });

export const getOwnedBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("businesses")
      .select("id,slug,name,category,status,data")
      .eq("owner_id", context.userId)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error || !row) throw new Error("Business not found");
    const b: Business = {
      ...(row.data as unknown as Business),
      id: row.id,
      slug: row.slug,
      status: row.status as NonNullable<Business["status"]>,
    };
    for (const [field, path] of [
      ["logo", b.logoPath],
      ["logoOriginal", b.logoOriginalPath],
      ["cover", b.coverPath],
    ] as const) {
      if (path) {
        const signed = await context.supabase.storage
          .from("business-media")
          .createSignedUrl(path, 3600);
        if (signed.data) b[field] = signed.data.signedUrl;
      }
    }
    return b;
  });

export const saveCloudBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Business) => {
    if (!validSlug(input.slug) || !input.name.trim() || input.name.length > 120)
      throw new Error("Enter a name and a valid page address");
    if ((input.status ?? "published") === "published" && !reviewUrlFromInput(input.reviewUrl))
      throw new Error("Add a valid Google review link");
    if (input.links.some((l) => l.value && !buildLinkUrl(l)))
      throw new Error("Check your button destinations");
    return input;
  })
  .handler(async ({ data, context }) => {
    // Preserve lightweight compressed logo data URL (under 85 KB) so it is always available immediately
    const compressedLogo =
      typeof data.logo === "string" && data.logo.length < 85000 ? data.logo : undefined;
    const clean = {
      ...data,
      logo: compressedLogo,
      logoOriginal: undefined,
      cover: undefined,
    };
    const payload = {
      owner_id: context.userId,
      slug: data.slug,
      name: data.name.trim(),
      category: data.category,
      status: data.status ?? "published",
      data: JSON.parse(JSON.stringify(clean)) as Json,
    };
    const query = data.id
      ? context.supabase
          .from("businesses")
          .update(payload)
          .eq("id", data.id)
          .eq("owner_id", context.userId)
      : context.supabase.from("businesses").insert(payload);
    const { data: row, error } = await query.select("id").single();
    if (error)
      throw new Error(
        error.code === "23505"
          ? "That page address is already taken"
          : "Could not save the business",
      );
    return { ...data, id: row.id };
  });

export const archiveBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("businesses")
      .update({ status: "archived" })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error("Could not archive the business");
    return { ok: true };
  });

export const deleteBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // 1. Delete associated card designs
    await context.supabase
      .from("card_designs")
      .delete()
      .eq("business_id", data.id)
      .eq("owner_id", context.userId);

    // 2. Mark business as archived in database.
    // This is allowed by the RLS policy `business_owner_update` and
    // guarantees `listBusinesses` (.neq("status", "archived")) will NEVER return it on refresh.
    const { error: archiveError } = await context.supabase
      .from("businesses")
      .update({
        status: "archived",
        data: { status: "archived" } as unknown as Json,
      })
      .eq("id", data.id)
      .eq("owner_id", context.userId);

    if (archiveError) {
      console.error("Archive error during delete:", archiveError);
      throw new Error("Could not delete this card from database");
    }

    // 3. Also attempt hard delete (allowed by RLS `business_owner_delete_draft` if never published)
    await context.supabase
      .from("businesses")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);

    return { ok: true, id: data.id };
  });

export const checkSlug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data, context }) => {
    if (!validSlug(data.slug)) return false;
    const { data: available, error } = await context.supabase.rpc("reviewcard_slug_available", {
      candidate: data.slug,
    });
    if (error) throw new Error("Could not check the page address");
    return available;
  });

export const publicBusiness = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
    const client = createClient<Database>(process.env["SUPABASE_URL"] ?? "", key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
            h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: row, error } = await client
      .from("businesses")
      .select("id,slug,name,category,data")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error("Could not load this business page");
    if (!row) return null;
    const b = {
      ...(row.data as unknown as Business),
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
    };
    delete b.logoOriginal;
    delete b.logoOriginalPath;
    // Deliver public logo via stable route if path exists, or directly via compressed data URL
    if (b.logoPath) {
      b.logo = `/api/public/media/${encodeURIComponent(b.slug)}?kind=logo`;
    }
    if (b.coverPath) b.cover = `/api/public/media/${encodeURIComponent(b.slug)}?kind=cover`;
    return b;
  });

export const listStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("reviewcard_stats");
    if (error) throw new Error("Could not load scan counts");
    return data;
  });

export const getCardActivationInfo = createServerFn({ method: "GET" })
  .inputValidator(z.object({ code: z.string() }))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
    const client = createClient<Database>(process.env["SUPABASE_URL"] ?? "", key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: row } = await client
      .from("businesses")
      .select("id,slug,name,category,status")
      .eq("slug", data.code.trim().toLowerCase())
      .maybeSingle();

    if (row && row.status === "published") {
      return {
        isActivated: true,
        business: { name: row.name, slug: row.slug, category: row.category },
      };
    }
    return {
      isActivated: false,
      code: data.code.trim().toLowerCase(),
    };
  });

export const activatePreprintedCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      code: z.string(),
      name: z.string().min(1).max(120),
      reviewUrl: z.string(),
      category: z.string().optional(),
      color: z.string().optional(),
      tagline: z.string().optional(),
      links: z.array(z.any()).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const slug = data.code.trim().toLowerCase();
    if (!validSlug(slug)) throw new Error("Invalid card activation code");
    if (!data.name.trim()) throw new Error("Enter a business name");
    const validUrl = reviewUrlFromInput(data.reviewUrl);
    if (!validUrl) throw new Error("Please enter a valid Google review link");

    const businessPayload: Business = {
      slug,
      name: data.name.trim(),
      category: data.category?.trim() || "Local Business",
      tagline: data.tagline?.trim() || "Thank you for supporting our business!",
      reviewUrl: validUrl,
      theme: { primary: data.color || "#1a73e8", buttonStyle: "pill" },
      links: data.links || [],
      status: "published",
    };

    const clean = {
      ...businessPayload,
      logo: undefined,
      logoOriginal: undefined,
      cover: undefined,
    };
    const payload = {
      owner_id: context.userId,
      slug,
      name: businessPayload.name,
      category: businessPayload.category,
      status: "published",
      data: JSON.parse(JSON.stringify(clean)) as Json,
    };

    const { data: existing } = await context.supabase
      .from("businesses")
      .select("id,owner_id,status")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      if (existing.status === "published" && existing.owner_id !== context.userId) {
        throw new Error("This card has already been claimed by another account");
      }
      const { error } = await context.supabase
        .from("businesses")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error("Could not update the card business");
      return { ok: true, slug, business: businessPayload };
    }

    const { error: insertError } = await context.supabase.from("businesses").insert(payload);

    if (insertError) {
      throw new Error(
        insertError.code === "23505"
          ? "This card code is already in use"
          : "Could not activate this card",
      );
    }

    return { ok: true, slug, business: businessPayload };
  });

export const saveBatchBlankCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      codes: z.array(z.string()).min(1).max(200),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      color: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    let createdCount = 0;
    for (const rawCode of data.codes) {
      const slug = rawCode.trim().toLowerCase();
      if (!validSlug(slug)) continue;

      const clean = {
        slug,
        name: data.title || "Pre-printed ReviewCard",
        category: data.subtitle || "Smart Card",
        tagline: "Scan or enter card ID to activate",
        reviewUrl: "",
        theme: { primary: data.color || "#1a73e8", buttonStyle: "pill" },
        links: [],
        status: "draft",
      };

      const payload = {
        owner_id: context.userId,
        slug,
        name: clean.name,
        category: clean.category,
        status: "draft",
        data: JSON.parse(JSON.stringify(clean)) as Json,
      };

      const { data: existing } = await context.supabase
        .from("businesses")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existing) {
        const { error } = await context.supabase.from("businesses").insert(payload);
        if (!error) createdCount++;
      }
    }
    return { ok: true, createdCount };
  });
