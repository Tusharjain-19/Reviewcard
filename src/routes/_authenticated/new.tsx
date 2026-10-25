import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { getOwnedBusiness, saveCloudBusiness, checkSlug } from "@/lib/businesses.functions";
import { uploadBusinessMedia } from "@/lib/media";
import { ArrowLeft, Plus, Trash2, Download, Check, X, Crop } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LinkPage } from "@/components/LinkPage";
import { LogoCropper } from "@/components/LogoCropper";
import { ColorField } from "@/components/ColorField";
import { ButtonEditor } from "@/components/ButtonEditor";
import {
  LINK_LABELS,
  THEME_COLORS,
  logoSizeAllowed,
  reviewUrlFromInput,
  shortUrl,
  validSlug,
  slugify,
  type Business,
  type LinkType,
} from "@/lib/reviewcard";

export const Route = createFileRoute("/_authenticated/new")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } =>
    typeof s["edit"] === "string" ? { edit: s["edit"] } : {},
  head: () => ({
    meta: [
      { title: "Set up a business | ReviewCard" },
      {
        name: "description",
        content: "Create a review link page and QR code for a local business.",
      },
      { property: "og:title", content: "Set up a business | ReviewCard" },
      {
        property: "og:description",
        content: "Create a review link page and QR code for a local business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Builder,
});

const EMPTY: Business = {
  slug: "",
  name: "",
  tagline: "",
  category: "",
  reviewUrl: "",
  links: [],
  theme: { primary: THEME_COLORS[0] ?? "", buttonStyle: "pill" },
};

function Builder() {
  const { edit } = Route.useSearch();
  const [b, setB] = useState<Business>(EMPTY);
  const [cropSource, setCropSource] = useState("");
  const [pendingOriginal, setPendingOriginal] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [published, setPublished] = useState(false);
  const [qr, setQr] = useState("");
  const [slugOk, setSlugOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const save = useServerFn(saveCloudBusiness);
  const fetchBusiness = useServerFn(getOwnedBusiness);
  const available = useServerFn(checkSlug);
  const qc = useQueryClient();

  useEffect(() => {
    if (!edit) return;
    void fetchBusiness({ data: { slug: edit } })
      .then((found) => {
        setB(found);
        setSlugTouched(true);
        setPublished(found.status === "published");
        setAgreed(true);
      })
      .catch(() => toast.error("Could not load business"));
  }, [edit, fetchBusiness]);

  useEffect(() => {
    if (b.slug === edit) {
      setSlugOk(true);
      return;
    }
    setSlugOk(false);
    if (!validSlug(b.slug)) return;
    let active = true;
    const timer = setTimeout(() => {
      available({ data: { slug: b.slug } })
        .then((ok) => {
          if (active) setSlugOk(ok);
        })
        .catch(() => {});
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [b.slug, edit, available]);
  const reviewUrl = reviewUrlFromInput(b.reviewUrl);
  const canPublish = b.name.trim() && reviewUrl && slugOk && agreed;

  useEffect(() => {
    if (!published || !b.slug) return;
    QRCode.toDataURL(shortUrl(b.slug, "qr"), {
      errorCorrectionLevel: "Q",
      margin: 4,
      width: 1200,
    }).then(setQr);
  }, [published, b.slug]);

  const set = (p: Partial<Business>) => setB((x) => ({ ...x, ...p }));
  const addLink = (type: LinkType) =>
    set({
      links: [...b.links, { id: crypto.randomUUID(), type, label: LINK_LABELS[type], value: "" }],
    });

  const onLogo = (f?: File) => {
    if (!f) return;
    if (!logoSizeAllowed(f.size)) return void toast.error("Logo must be 5MB or smaller");
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(f.type))
      return void toast.error("Choose a PNG, JPG, WebP or SVG image");
    const img = new Image();
    const objectUrl = URL.createObjectURL(f);
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const original = c.toDataURL(f.type === "image/jpeg" ? "image/jpeg" : "image/png", 0.85);
        setPendingOriginal(original);
        setCropSource(original);
      } catch {
        toast.error("Couldn't read that image");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error("Couldn't read that image");
    };
    img.src = objectUrl;
  };

  const publish = async (status: NonNullable<Business["status"]> = "published") => {
    setBusy(true);
    try {
      const media = await uploadBusinessMedia({ ...b, reviewUrl, status });
      const final = await save({ data: media });
      setB(final);
      setPublished(status === "published");
      await qc.invalidateQueries();
      toast.success("Business saved!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save business");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b lg:border-b-0 bg-white lg:bg-transparent sticky top-0 lg:static z-20">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
        <h1 className="font-display text-xl sm:text-2xl font-bold">{edit ? "Edit Business" : "New Business"}</h1>
      </header>

      {/* Mobile Tab Switcher (< 1024px) */}
      <div className="lg:hidden p-2 bg-slate-100 border-b flex gap-2 sticky top-14.25 z-20">
        <button
          type="button"
          onClick={() => setMobileTab("form")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "form"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Form Details
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "preview"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Live Preview
        </button>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 pt-4 pb-20 lg:grid-cols-[1fr_380px]">
        <div className={`space-y-6 ${mobileTab === "preview" ? "hidden lg:block" : "block"}`}>
          <Section title="1. Basics">
            <Field label="Business name">
              <Input
                value={b.name}
                onChange={(e) =>
                  set({
                    name: e.target.value,
                    ...(slugTouched ? {} : { slug: slugify(e.target.value) }),
                  })
                }
                placeholder="Chai Corner"
              />
            </Field>
            <Field label="Category">
              <Input
                aria-label="Category"
                value={b.category}
                onChange={(e) => set({ category: e.target.value })}
                placeholder="Café, salon, clinic, retail…"
              />
            </Field>
            <Field label="Logo (png, jpg, webp, svg, max 5MB)">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Upload logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="max-w-64"
                  onChange={(e) => {
                    onLogo(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {b.logo && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const original = b.logoOriginal ?? b.logo ?? "";
                        setPendingOriginal(original);
                        setCropSource(original);
                      }}
                    >
                      <Crop /> Edit crop
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setB(({ logo: _logo, logoOriginal: _original, ...rest }) => rest)
                      }
                    >
                      <Trash2 /> Remove
                    </Button>
                  </>
                )}
              </div>
            </Field>
            <Field label="Logo shape">
              <div className="flex gap-2">
                {(["circle", "rounded", "square", "rectangle"] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={(b.logoShape ?? "circle") === s ? "default" : "outline"}
                    onClick={() => set({ logoShape: s })}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label="Tagline">
              <Input
                value={b.tagline}
                onChange={(e) => set({ tagline: e.target.value })}
                placeholder="Fresh chai since 1998"
              />
            </Field>
            <Field label="Cover image · max 5MB">
              <Input
                aria-label="Upload cover"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!logoSizeAllowed(file.size)) {
                    toast.error("Cover must be 5MB or smaller");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") set({ cover: reader.result });
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {b.cover && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setB(({ cover: _cover, coverPath: _path, ...rest }) => rest)}
                >
                  Remove cover
                </Button>
              )}
            </Field>
          </Section>

          <Section title="2. Google review link">
            <Field label="Google Place ID">
              <Input
                aria-label="Google Place ID"
                value={b.placeId ?? ""}
                placeholder="ChIJ…"
                onChange={(e) => {
                  const placeId = e.target.value;
                  set({ placeId, reviewUrl: reviewUrlFromInput(placeId) });
                }}
              />
            </Field>
            <Field label="Google Place ID or review link (g.page/…)">
              <Input
                aria-label="Google review link"
                value={b.reviewUrl}
                onChange={(e) => set({ reviewUrl: e.target.value })}
                placeholder="ChIJ… or https://g.page/r/…/review"
              />
            </Field>
            {b.reviewUrl && !reviewUrl && (
              <p className="text-sm text-destructive">Enter a valid Place ID or https link.</p>
            )}
            {reviewUrl && (
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
              >
                Test review link
              </a>
            )}
          </Section>

          <Section title="3. Buttons & order">
            <ButtonEditor b={{ ...b, reviewUrl: b.reviewUrl }} onChange={set} />
            <div className="flex flex-wrap gap-2">
              {(Object.keys(LINK_LABELS) as LinkType[]).map((t) => (
                <Button key={t} variant="outline" size="sm" onClick={() => addLink(t)}>
                  <Plus /> {LINK_LABELS[t]}
                </Button>
              ))}
            </div>
          </Section>

          <Section title="4. Page address">
            <Field label="Slug">
              <Input
                value={b.slug}
                disabled={!!edit}
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: slugify(e.target.value) });
                }}
              />
            </Field>
            <p
              className={`flex items-center gap-1 text-sm ${slugOk ? "text-success" : "text-destructive"}`}
            >
              {slugOk ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} /r/
              {b.slug || "…"} {slugOk ? "is available" : "is taken or not allowed"}
            </p>
          </Section>

          <Section title="5. Theme">
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map((c) => (
                <Button
                  key={c}
                  size="icon"
                  variant="outline"
                  title={c}
                  aria-label={`Color ${c}`}
                  onClick={() => set({ theme: { ...b.theme, primary: c } })}
                  className={`theme-swatch h-9 w-9 rounded-full ring-offset-2 ${b.theme.primary === c ? "ring-2 ring-ring" : ""}`}
                  style={{ ["--swatch" as string]: c }}
                />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                label="Accent colour"
                value={b.theme.primary}
                onChange={(primary) => set({ theme: { ...b.theme, primary } })}
              />
              <ColorField
                label="Background colour"
                value={b.theme.background ?? "#f9f7f1"}
                onChange={(background) => set({ theme: { ...b.theme, background } })}
              />
              <ColorField
                label="Text colour"
                value={b.theme.text ?? "#24372c"}
                onChange={(text) => set({ theme: { ...b.theme, text } })}
              />
              <ColorField
                label="Button background"
                value={b.theme.buttonBackground ?? "#ffffff"}
                onChange={(buttonBackground) => set({ theme: { ...b.theme, buttonBackground } })}
              />
              <ColorField
                label="Button text"
                value={b.theme.buttonText ?? "#24372c"}
                onChange={(buttonText) => set({ theme: { ...b.theme, buttonText } })}
              />
              <ColorField
                label="Review button text"
                value={b.theme.reviewText ?? "#ffffff"}
                onChange={(reviewText) => set({ theme: { ...b.theme, reviewText } })}
              />
            </div>
            <div className="flex gap-2">
              {(["pill", "rounded", "square"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={b.theme.buttonStyle === s ? "default" : "outline"}
                  onClick={() => set({ theme: { ...b.theme, buttonStyle: s } })}
                >
                  {s}
                </Button>
              ))}
            </div>
            <Field label="Font">
              <div className="flex gap-2">
                {(["sans", "serif"] as const).map((font) => (
                  <Button
                    key={font}
                    variant={(b.theme.font ?? "sans") === font ? "default" : "outline"}
                    size="sm"
                    onClick={() => set({ theme: { ...b.theme, font } })}
                  >
                    {font === "sans" ? "Modern" : "Classic"}
                  </Button>
                ))}
              </div>
            </Field>
            <Field label={`Logo size · ${b.theme.logoSize ?? 96}px`}>
              <Input
                aria-label="Logo size"
                type="range"
                min="48"
                max="160"
                step="4"
                value={b.theme.logoSize ?? 96}
                onChange={(e) => set({ theme: { ...b.theme, logoSize: Number(e.target.value) } })}
              />
            </Field>
            <Field label={`Button spacing · ${b.theme.spacing ?? 12}px`}>
              <Input
                aria-label="Button spacing"
                type="range"
                min="4"
                max="28"
                step="2"
                value={b.theme.spacing ?? 12}
                onChange={(e) => set({ theme: { ...b.theme, spacing: Number(e.target.value) } })}
              />
            </Field>
          </Section>

          <Section title="6. Publish">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />I understand
              reviews must not be gated or incentivized.
            </label>
            <div className="flex gap-3">
              <Button size="lg" disabled={!canPublish || busy} onClick={() => publish()}>
                {busy ? "Saving…" : edit ? "Save changes" : "Publish"}
              </Button>
              <Button
                variant="outline"
                disabled={!b.name.trim() || !slugOk || busy}
                onClick={() => publish("draft")}
              >
                Save draft
              </Button>
            </div>
            {published && b.slug && (
              <div className="flex flex-wrap items-center gap-5 rounded-xl bg-muted p-4">
                {qr && <img src={qr} alt="QR code" className="h-32 w-32 rounded-md bg-card" />}
                <div className="space-y-2 text-sm">
                  <p className="font-mono">{shortUrl(b.slug)}</p>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <a href={qr} download={`${b.slug}-qr.png`}>
                        <Download /> QR
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/r/$slug" params={{ slug: b.slug }}>
                        Open page
                      </Link>
                    </Button>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/cards/$slug" params={{ slug: b.slug }}>
                      Design card
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const svg = await QRCode.toString(shortUrl(b.slug, "qr"), {
                        type: "svg",
                        errorCorrectionLevel: "Q",
                        margin: 4,
                      });
                      const { downloadBlob } = await import("@/lib/print");
                      downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${b.slug}-qr.svg`);
                    }}
                  >
                    SVG QR
                  </Button>
                  <p className="text-muted-foreground">
                    Print at least 2.5 × 2.5 cm and test-scan first.
                  </p>
                </div>
              </div>
            )}
          </Section>
        </div>

        <aside
          className={`lg:sticky lg:top-6 lg:self-start ${
            mobileTab === "form" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="mx-auto h-175 w-85 max-w-full overflow-y-auto rounded-[2.5rem] border-8 border-foreground bg-background shadow-lift">
            <LinkPage b={{ ...b, reviewUrl }} preview />
          </div>
        </aside>
      </div>
      {cropSource && (
        <LogoCropper
          source={cropSource}
          onClose={() => {
            setCropSource("");
            setPendingOriginal("");
          }}
          onSave={(logo) => {
            set({ logo, logoOriginal: pendingOriginal });
            setCropSource("");
            setPendingOriginal("");
          }}
        />
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-4 border-b py-5">
      <h2 className="font-display text-xl">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
