import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, ArrowLeft, Radio, ExternalLink } from "lucide-react";
import { shortUrl } from "@/lib/reviewcard";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/nfc/$slug")({
  head: () => pageMeta("NFC Tag Setup", "Program and encode contactless NFC smart review cards."),
  component: NfcPage,
});

function NfcPage() {
  const { slug } = Route.useParams();
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(shortUrl(slug, "nfc"));
  }, [slug]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(url).then(() => {
      toast.success("NFC URL copied to clipboard!");
    });
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 flex flex-col text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 shadow-2xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <BrandLogo size="md" to="/dashboard" />
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600 hover:text-slate-900">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to</span> Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 sm:px-6 py-8 sm:py-12 flex-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <Radio className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
            <span>Contactless NFC Programming</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            NFC Setup · {slug}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Program your physical NFC smart card chip to route directly to your review page.
          </p>
        </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Encoded URL</label>
        <p className="break-all rounded-md border bg-muted/40 p-4 font-mono text-sm">{url}</p>
        <Button onClick={handleCopy} className="gap-2">
          <Copy className="h-4 w-4" />
          Copy URL
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Encoding Instructions</h2>
        <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
          <li>Open NFC Tools (or any NFC tag writer app) on an NFC-enabled smartphone.</li>
          <li>
            Choose <strong>Write → Add a record → URL / URI</strong>, then paste the copied address
            above.
          </li>
          <li>
            Write to an <strong>NTAG213</strong> or <strong>NTAG215</strong> tag and scan to test it
            before locking.
          </li>
          <li>
            Lock the tag after testing. Use an anti-metal / on-metal tag if placing on metallic
            surfaces.
          </li>
        </ol>
      </div>
    </main>
  </div>
);
}
