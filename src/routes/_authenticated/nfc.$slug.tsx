import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, ArrowLeft } from "lucide-react";
import { shortUrl } from "@/lib/reviewcard";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/nfc/$slug")({
  head: () => pageMeta("NFC encoding", "Prepare NFC tags for your business review page."),
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
      toast.success("NFC URL copied to clipboard");
    });
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <Button asChild variant="ghost" className="gap-2">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="font-display text-3xl">NFC Setup · {slug}</h1>
        <p className="text-muted-foreground">
          Program your contactless NFC tag to route directly to your review page.
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
  );
}
