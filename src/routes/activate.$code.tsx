import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Check,
  Radio,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Star,
  MapPin,
  HelpCircle,
  LayoutDashboard,
  QrCode,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCardActivationInfo, activatePreprintedCard } from "@/lib/businesses.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { toast } from "sonner";
import { reviewUrlFromInput } from "@/lib/reviewcard";

export const Route = createFileRoute("/activate/$code")({
  head: ({ params }) =>
    pageMeta(
      `Activate Card #${params.code}`,
      "Activate your physical Google Review smart card with your phone.",
    ),
  component: ActivateCardPage,
});

const QUICK_COLORS = [
  { name: "Google Blue", hex: "#1a73e8" },
  { name: "Luxury Onyx", hex: "#18181b" },
  { name: "Forest Emerald", hex: "#065f46" },
  { name: "Ruby Burgundy", hex: "#991b1b" },
  { name: "Warm Amber", hex: "#d97706" },
  { name: "Royal Indigo", hex: "#4338ca" },
];

function ActivateCardPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const getInfo = useServerFn(getCardActivationInfo);
  const activate = useServerFn(activatePreprintedCard);

  const [loading, setLoading] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [existingBiz, setExistingBiz] = useState<{ name: string; slug: string } | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [color, setColor] = useState("#1a73e8");

  // Auth State
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string | undefined } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string; slug: string } | null>(null);

  useEffect(() => {
    // 1. Check user session
    void supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser({ id: data.user.id, email: data.user.email });
      }
    });

    // 2. Check if card code is already activated
    void getInfo({ data: { code } })
      .then((info) => {
        if (info.isActivated && info.business) {
          setIsActivated(true);
          setExistingBiz(info.business);
        }
      })
      .catch((err) => console.error("Error loading activation info:", err))
      .finally(() => setLoading(false));
  }, [code, getInfo]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your business name");
      return;
    }
    const cleanReviewUrl = reviewUrlFromInput(reviewUrl);
    if (!cleanReviewUrl) {
      toast.error("Please enter a valid Google review link");
      return;
    }

    setSubmitting(true);
    try {
      // If user is not logged in, authenticate or sign up first
      if (!currentUser) {
        if (!email.trim() || !password.trim()) {
          toast.error("Enter an email & password so you can edit your links anytime");
          setSubmitting(false);
          return;
        }

        // Try signing in or signing up
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // If invalid login, try signup
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: name },
            },
          });
          if (signUpError) throw signUpError;
          if (!signUpData.session) {
            toast.info("Account created. Check your email or proceed to activate.");
          }
        }
      }

      // Execute activation
      const result = await activate({
        data: {
          code,
          name: name.trim(),
          category: category.trim() || "Local Business",
          reviewUrl: cleanReviewUrl,
          color,
        },
      });

      if (result.ok) {
        setSuccessData({ name: result.business.name, slug: result.slug });
        toast.success("Card activated successfully!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Activation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Checking card status...</p>
        </div>
      </div>
    );
  }

  // Already Activated Card Screen
  if (isActivated && existingBiz) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
            ReviewCard is Active
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This card is already linked to <strong>{existingBiz.name}</strong>.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Link to="/r/$slug" params={{ slug: existingBiz.slug }}>
                <ExternalLink className="h-4 w-4" />
                Open Live Review Page
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">Go to Business Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Success Celebration Screen
  if (successData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
            Card Successfully Activated!
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your physical card is now connected to <strong>{successData.name}</strong>. Every
            customer tap or scan will open your Google reviews directly.
          </p>

          <div className="my-6 rounded-xl border bg-slate-50 p-4 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Live Destination Link
            </div>
            <div className="mt-1 font-mono text-xs font-bold text-blue-600 break-all">
              {typeof window !== "undefined"
                ? `${window.location.origin}/r/${successData.slug}`
                : `/r/${successData.slug}`}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-sm"
            >
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard (View Your Card)
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full gap-2">
              <Link to="/r/$slug" params={{ slug: successData.slug }}>
                <ExternalLink className="h-4 w-4" />
                Test Live Review Page
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Card Activation Form Screen
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:py-14 text-slate-900">
      <div className="mx-auto max-w-lg">
        {/* Top Header Card */}
        <div className="rounded-2xl border bg-white p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 font-mono uppercase">
              <Radio className="h-3.5 w-3.5 animate-pulse text-blue-600" />
              Card ID: #{code.toUpperCase()}
            </span>
            <Link
              to="/activate"
              search={{}}
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
            >
              <QrCode className="h-3.5 w-3.5" />
              Scan Another Card
            </Link>
          </div>

          <h1 className="mt-4 font-display text-2xl md:text-3xl font-extrabold tracking-tight">
            Activate Your ReviewCard
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Link this card to your business in 60 seconds. You can change your Google link and
            update button destinations anytime.
          </p>

          <form onSubmit={handleActivate} className="mt-6 space-y-5">
            {/* Business Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="bizName"
                className="text-xs font-bold text-slate-700 uppercase tracking-wide"
              >
                Business Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="bizName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Night Watch Cafe"
                required
                className="h-10 text-sm"
              />
            </div>

            {/* Google Review URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reviewUrl"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wide"
                >
                  Google Review URL <span className="text-red-500">*</span>
                </label>
                <a
                  href="https://business.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="h-3 w-3" /> Find link
                </a>
              </div>
              <Input
                id="reviewUrl"
                value={reviewUrl}
                onChange={(e) => setReviewUrl(e.target.value)}
                placeholder="https://g.page/r/.../review or review link"
                required
                className="h-10 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Tip: Search your business on Google Maps &gt; Share &gt; Copy Link, or use your
                Google Business Profile review link.
              </p>
            </div>

            {/* Category / Subtitle */}
            <div className="space-y-1.5">
              <label
                htmlFor="category"
                className="text-xs font-bold text-slate-700 uppercase tracking-wide"
              >
                Category or Subtitle (Optional)
              </label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Specialty Coffee & Bakery"
                className="h-10 text-sm"
              />
            </div>

            {/* Accent Theme Color */}
            <div className="space-y-2 border-t pt-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Card Theme Color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    className="relative h-8 w-8 rounded-full border-2 border-white shadow-xs transition-transform hover:scale-110 focus:outline-none"
                  >
                    {color.toLowerCase() === c.hex.toLowerCase() && (
                      <Check className="mx-auto h-4 w-4 text-white drop-shadow-sm" />
                    )}
                  </button>
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-8 rounded-full cursor-pointer border border-slate-300 p-0"
                  title="Custom Color"
                />
              </div>
            </div>

            {/* Owner Account Section */}
            <div className="rounded-xl border bg-slate-50/80 p-4 space-y-3">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="text-xs text-slate-700">
                    Activating under your account:{" "}
                    <span className="font-semibold text-slate-900">{currentUser.email}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Owner Account Setup
                  </div>
                  <p className="text-xs text-slate-600">
                    Create your password to log in and update your links anytime from any computer
                    or phone.
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Your Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-9 text-xs bg-white"
                    />
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-9 text-xs bg-white pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md gap-2"
            >
              {submitting ? "Activating Card..." : "Activate Card & Go Live"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
