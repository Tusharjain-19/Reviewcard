import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/privacy")({
  head: () =>
    pageMeta("Privacy", "How ReviewCard handles account information and anonymous scan counts."),
  component: () => (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-16">
      <h1 className="font-display text-3xl">Privacy</h1>
      <p>
        ReviewCard stores account details, business pages, uploaded images and saved print designs
        to provide this service.
      </p>
      <p>
        Public page activity records page views, button taps, source tags and event times. These
        records do not include customer names, phone numbers or exact IP addresses. We do not use
        tracking cookies or claim to count unique visitors.
      </p>
      <p>
        External buttons open third-party services, which have their own privacy policies. Account
        holders can archive business pages; printed page addresses remain reserved.
      </p>
    </main>
  ),
});
