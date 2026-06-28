import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import logoAsset from "@/assets/tmobile-fiber-logo.png.asset.json";
import { APPS_SCRIPT_URL, MAPBOX_TOKEN } from "@/lib/signup-config";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "T-Mobile Fiber — Request Your Install" },
      {
        name: "description",
        content:
          "T-Mobile Fiber is available at your address. Choose a plan and request your free professional install in minutes.",
      },
      { property: "og:title", content: "T-Mobile Fiber — Request Your Install" },
      {
        property: "og:description",
        content:
          "Choose your plan and request an install time. First month free on 1 Gig & 2 Gig.",
      },
    ],
  }),
  component: SignupPage,
});

// ---------------- Types & data ----------------

type PlanId = "fiber-300" | "fiber-1gig" | "fiber-2gig";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  regular: string;
  speed: string;
  features: string;
  badge?: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "fiber-300",
    name: "Fiber 300",
    price: "$45",
    regular: "$55/mo",
    speed: "306 Mbps ↓ / 305 Mbps ↑",
    features:
      "Wi-Fi router, installation, unlimited data, and T-Mobile Tuesdays perks.",
  },
  {
    id: "fiber-1gig",
    name: "Fiber 1 Gig",
    price: "$60",
    regular: "$70/mo",
    speed: "1000 Mbps ↓ / 1000 Mbps ↑",
    badge: "Most Popular",
    features:
      "First month free. Wi-Fi router, mesh extender as needed, installation, unlimited data, T-Mobile Tuesdays perks.",
  },
  {
    id: "fiber-2gig",
    name: "Fiber 2 Gig",
    price: "$70",
    regular: "$80/mo",
    speed: "2000 Mbps ↓ / 1000 Mbps ↑",
    badge: "Best Promo",
    highlight: true,
    features:
      "First month free + $100 back. Wi-Fi router, mesh extender as needed, installation, unlimited data, T-Mobile Tuesdays perks.",
  },
];

const INSTALL_WINDOWS = [
  "8 AM–10 AM",
  "10 AM–12 PM",
  "12 PM–2 PM",
  "2 PM–5 PM",
  "First available",
];

// ---------------- Page ----------------

type Step = 0 | 1 | 2 | 3 | 4 | 5; // 0 = hero, 1-4 steps, 5 = success

interface FormState {
  plan: PlanId | "";
  fullAddress: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  apt: string;
  fullName: string;
  phone: string;
  email: string;
  dob: string;
  pin: string;
  installDate: string;
  installTime: string;
  consent: boolean;
}

const INITIAL: FormState = {
  plan: "",
  fullAddress: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  apt: "",
  fullName: "",
  phone: "",
  email: "",
  dob: "",
  pin: "",
  installDate: "",
  installTime: "",
  consent: false,
};

function SignupPage() {
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (step >= 1 && step <= 4) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const payload = {
      timestampEST: formatESTTimestamp(new Date()),
      planSelected: PLANS.find((p) => p.id === form.plan)?.name ?? "",
      fullName: form.fullName,
      fullFormattedAddress: form.fullAddress,
      streetAddress: form.street,
      aptUnit: form.apt,
      city: form.city,
      state: form.state,
      zip: form.zip,
      phone: form.phone,
      email: form.email,
      dob: form.dob,
      pin: form.pin,
      preferredInstallDate: form.installDate,
      preferredInstallTime: form.installTime,
      consent: form.consent ? "Yes" : "No",
    };

    try {
      if (!APPS_SCRIPT_URL) {
        // No endpoint configured — log so the developer can test the flow.
        console.warn("[signup] APPS_SCRIPT_URL not configured. Payload:", payload);
      } else {
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors", // Apps Script web apps require no-cors from browsers
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
      }
      setStep(5);
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {step === 0 && <Hero onStart={() => setStep(1)} />}

      {step >= 1 && step <= 4 && (
        <>
          <StepIndicator step={step} onJump={(s) => s < step && setStep(s as Step)} />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 lg:px-8 pb-32 lg:pb-12 pt-2">
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:items-start">
              <div className="w-full max-w-xl mx-auto lg:mx-0">
                {step === 1 && (
                  <StepPlan
                    value={form.plan}
                    onChange={(p) => update("plan", p)}
                    onNext={() => setStep(2)}
                  />
                )}
                {step === 2 && (
                  <StepAddress
                    form={form}
                    update={update}
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                  />
                )}
                {step === 3 && (
                  <StepCustomer
                    form={form}
                    update={update}
                    onBack={() => setStep(2)}
                    onNext={() => setStep(4)}
                  />
                )}
                {step === 4 && (
                  <StepInstall
                    form={form}
                    update={update}
                    onBack={() => setStep(3)}
                    onSubmit={submit}
                    submitting={submitting}
                    error={submitError}
                  />
                )}
              </div>
              <DesktopSummary step={step} form={form} />
            </div>
          </main>
        </>
      )}

      {step === 5 && <Success />}

      <Footer />
    </div>
  );
}

function DesktopSummary({ step, form }: { step: number; form: FormState }) {
  const plan = PLANS.find((p) => p.id === form.plan);
  return (
    <aside className="hidden lg:block sticky top-32 mt-4">
      <div className="rounded-3xl border-2 border-border bg-card overflow-hidden shadow-sm">
        <div className="bg-magenta text-white px-6 py-5">
          <div className="text-[11px] font-bold uppercase tracking-widest opacity-90">
            Your install request
          </div>
          <div className="mt-1 text-lg font-extrabold">
            {plan ? plan.name : "Choose a plan to begin"}
          </div>
          {plan && (
            <div className="mt-1 text-sm text-white/90">
              {plan.price}/mo · {plan.speed}
            </div>
          )}
        </div>
        <div className="p-6 space-y-4 text-sm">
          <SummaryRow label="Plan" value={plan?.name ?? "—"} active={step >= 1} />
          <SummaryRow
            label="Address"
            value={form.fullAddress || "—"}
            active={step >= 2 && !!form.fullAddress}
            truncate
          />
          <SummaryRow
            label="Contact"
            value={form.fullName || "—"}
            active={step >= 3 && !!form.fullName}
          />
          <SummaryRow
            label="Install"
            value={
              form.installDate && form.installTime
                ? `${form.installDate} · ${form.installTime}`
                : "—"
            }
            active={step >= 4 && !!form.installDate}
          />
        </div>
        <div className="border-t bg-secondary/50 px-6 py-4 space-y-2">
          {[
            "Free professional installation",
            "No payment collected today",
            "Cancel anytime before install",
          ].map((t) => (
            <div key={t} className="flex items-start gap-2 text-xs text-foreground/80">
              <CheckIcon className="h-4 w-4 text-magenta shrink-0 mt-0.5" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  active,
  truncate,
}: {
  label: string;
  value: string;
  active: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <span
        className={`text-right text-sm font-semibold ${
          active ? "text-foreground" : "text-muted-foreground"
        } ${truncate ? "truncate max-w-[200px]" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------- Layout pieces ----------------

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
        <img
          src={logoAsset.url}
          alt="T-Mobile Fiber"
          className="h-8 lg:h-10 w-auto"
          width={140}
          height={40}
        />
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-sm text-muted-foreground">
            Need help?
          </span>
          <a
            href="sms:8886438620?&body=FIBER"
            className="text-xs lg:text-sm font-semibold text-magenta hover:underline"
          >
            Text FIBER to 888-643-8620
          </a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-secondary/40 mt-auto">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 text-[11px] leading-relaxed text-muted-foreground">
        Pricing shown with AutoPay. AutoPay discount requires debit card or linked
        bank account. First month free applies to qualifying 1 Gig and 2 Gig
        plans. $100 back applies to qualifying 2 Gig plan. Offers subject to
        eligibility and availability. No payment is collected on this page.
      </div>
    </footer>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex-1">
      <section className="relative bg-magenta text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.45), transparent 45%), radial-gradient(circle at 85% 80%, rgba(0,0,0,0.35), transparent 50%), radial-gradient(circle at 70% 10%, rgba(255,255,255,0.25), transparent 40%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-5 lg:px-8 pt-8 lg:pt-20 pb-10 lg:pb-24 grid lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold tracking-wide">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              AVAILABLE AT YOUR ADDRESS
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-6xl font-black leading-[1.05] tracking-tight">
              Great news! T-Mobile Fiber is available at your address.
            </h1>
            <p className="mt-3 lg:mt-5 text-base sm:text-lg lg:text-xl text-white/90 max-w-lg">
              Choose your plan and request an install time. Takes about 2 minutes.
            </p>

            <ul className="mt-6 lg:mt-8 grid sm:grid-cols-2 gap-2.5 lg:gap-3 max-w-xl">
              {[
                "First month free on 1 Gig & 2 Gig",
                "2 Gig includes $100 back",
                "Free professional installation",
                "No payment collected today",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 text-[15px] lg:text-base font-medium"
                >
                  <CheckIcon className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 lg:mt-10 flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                onClick={onStart}
                className="w-full sm:w-auto bg-white text-magenta font-bold text-base lg:text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99] transition"
              >
                Start Request →
              </button>
              <p className="text-xs lg:text-sm text-white/80 text-center sm:text-left">
                Takes about 2 minutes
                <br className="hidden sm:block" />
                <span className="sm:hidden"> · </span>No payment today
              </p>
            </div>
          </div>

          {/* Desktop preview card */}
          <div className="hidden lg:block relative">
            <div className="absolute -inset-6 bg-white/10 rounded-[2rem] blur-2xl" />
            <div className="relative rounded-3xl bg-white text-ink shadow-2xl p-7 rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-magenta">
                  Most Popular
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  AutoPay
                </span>
              </div>
              <div className="mt-2 text-2xl font-black">Fiber 1 Gig</div>
              <div className="text-sm text-muted-foreground">
                1000 Mbps ↓ / 1000 Mbps ↑
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight">$60</span>
                <span className="text-base font-semibold text-muted-foreground">
                  /mo
                </span>
                <span className="text-sm text-muted-foreground line-through ml-1">
                  $70
                </span>
              </div>
              <div className="mt-1 text-xs font-bold text-magenta">
                First month free
              </div>
              <div className="mt-5 h-px bg-border" />
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  "Wi-Fi router included",
                  "Mesh extender as needed",
                  "Unlimited data, no caps",
                  "T-Mobile Tuesdays perks",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckIcon className="h-4 w-4 text-magenta mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-ink text-white px-4 py-3 shadow-xl text-sm font-semibold">
              <span className="text-magenta">●</span> 2 Gig: $100 back
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 lg:px-8 py-8 lg:py-14 grid grid-cols-3 gap-3 lg:gap-6 text-center">
        <Stat label="Fiber speeds" value="Up to 2 Gig" />
        <Stat label="Pro install" value="Free" />
        <Stat label="Data caps" value="None" />
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl lg:rounded-2xl border bg-card p-3 lg:p-6">
      <div className="text-sm lg:text-2xl font-bold lg:font-black text-foreground">
        {value}
      </div>
      <div className="text-[11px] lg:text-sm text-muted-foreground mt-0.5 lg:mt-1">
        {label}
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  onJump,
}: {
  step: number;
  onJump: (s: number) => void;
}) {
  const labels = ["Plan", "Address", "Info", "Install"];
  return (
    <div className="sticky top-[57px] lg:top-[65px] z-30 bg-background/95 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 lg:py-4">
        <div className="flex items-center justify-between mb-1.5 lg:mb-2">
          <span className="text-xs lg:text-sm font-semibold text-muted-foreground">
            Step {step} of 4
          </span>
          <span className="text-xs lg:text-sm font-semibold text-magenta">
            {labels[step - 1]}
          </span>
        </div>
        <div className="flex gap-1.5 lg:gap-2">
          {labels.map((l, i) => {
            const idx = i + 1;
            const done = idx < step;
            const active = idx === step;
            return (
              <button
                key={l}
                onClick={() => onJump(idx)}
                disabled={!done}
                className={`flex-1 h-1.5 lg:h-2 rounded-full transition-all ${
                  active
                    ? "bg-magenta"
                    : done
                      ? "bg-magenta/60 cursor-pointer"
                      : "bg-border cursor-default"
                }`}
                aria-label={`Go to step ${idx}: ${l}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------- Step 1: Plan ----------------

function StepPlan({
  value,
  onChange,
  onNext,
}: {
  value: PlanId | "";
  onChange: (p: PlanId) => void;
  onNext: () => void;
}) {
  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold tracking-tight">Pick your plan</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        All plans include free pro install and unlimited data.
      </p>

      <div className="mt-5 space-y-3">
        {PLANS.map((plan) => {
          const selected = value === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => {
                onChange(plan.id);
                // Auto-advance shortly so the user sees the selection
                setTimeout(onNext, 350);
              }}
              className={`w-full text-left rounded-2xl border-2 p-4 transition-all relative ${
                selected
                  ? "border-magenta bg-accent shadow-lg scale-[1.01]"
                  : plan.highlight
                    ? "border-magenta/40 bg-card hover:border-magenta"
                    : "border-border bg-card hover:border-foreground/30"
              }`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    plan.highlight
                      ? "bg-ink text-white"
                      : "bg-magenta text-white"
                  }`}
                >
                  {plan.badge}
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-extrabold text-lg leading-tight">
                    {plan.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {plan.speed}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black leading-none">
                    {plan.price}
                    <span className="text-sm font-semibold">/mo</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground line-through mt-0.5">
                    {plan.regular}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[13px] text-foreground/80 leading-relaxed">
                {plan.features}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  With AutoPay
                </span>
                <span
                  className={`h-6 w-6 rounded-full grid place-items-center border-2 ${
                    selected
                      ? "border-magenta bg-magenta text-white"
                      : "border-border"
                  }`}
                >
                  {selected && <CheckIcon className="h-3.5 w-3.5" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {value && (
        <StickyCta onClick={onNext}>Continue →</StickyCta>
      )}
    </div>
  );
}

// ---------------- Step 2: Address ----------------

interface MapboxFeature {
  place_name: string;
  text: string;
  address?: string;
  context?: { id: string; text: string; short_code?: string }[];
}

function StepAddress({
  form,
  update,
  onBack,
  onNext,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState(form.fullAddress);
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<boolean>(!!form.fullAddress);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!query || query === form.fullAddress) return;
    setPicked(false);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query,
        )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=US&types=address&limit=6`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.features ?? []);
        setOpen(true);
      } catch (e) {
        console.error(e);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, form.fullAddress]);

  const pick = (f: MapboxFeature) => {
    const ctx = f.context ?? [];
    const get = (prefix: string) =>
      ctx.find((c) => c.id.startsWith(prefix));
    const city = get("place")?.text ?? "";
    const stateObj = get("region");
    const stateCode = stateObj?.short_code?.replace("US-", "") ?? stateObj?.text ?? "";
    const zip = get("postcode")?.text ?? "";
    const street = `${f.address ? f.address + " " : ""}${f.text}`.trim();

    update("fullAddress", f.place_name);
    update("street", street);
    update("city", city);
    update("state", stateCode);
    update("zip", zip);
    setQuery(f.place_name);
    setPicked(true);
    setOpen(false);
    setError(null);
  };

  const handleNext = () => {
    if (!picked || !form.fullAddress) {
      setError("Please select your address from the list.");
      return;
    }
    onNext();
  };

  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold tracking-tight">Service address</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Where do you want T-Mobile Fiber installed?
      </p>

      <div className="mt-5 space-y-4">
        <div className="relative">
          <Label>Service address</Label>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Start typing your address…"
            className={inputCls(!!error && !picked)}
          />
          {open && results.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl max-h-72 overflow-auto">
              {results.map((f, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => pick(f)}
                    className="w-full text-left px-4 py-3 hover:bg-accent text-sm border-b last:border-b-0"
                  >
                    {f.place_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <FieldError>{error}</FieldError>}
          {picked && (
            <p className="mt-2 text-xs text-success font-medium flex items-center gap-1">
              <CheckIcon className="h-3.5 w-3.5" /> Address confirmed
            </p>
          )}
        </div>

        <div>
          <Label optional>Apt / Unit</Label>
          <input
            type="text"
            value={form.apt}
            onChange={(e) => update("apt", e.target.value)}
            placeholder="Apt 4B (optional)"
            className={inputCls(false)}
          />
        </div>
      </div>

      <NavRow onBack={onBack} onNext={handleNext} nextDisabled={!picked} />
    </div>
  );
}

// ---------------- Step 3: Customer Info ----------------

function StepCustomer({
  form,
  update,
  onBack,
  onNext,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().split(/\s+/).length < 2) {
      e.fullName = "Enter your first and last name.";
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) e.phone = "Enter a 10-digit phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email.";
    if (!form.dob) e.dob = "Enter your date of birth.";
    else {
      const d = new Date(form.dob);
      const age = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 18) e.dob = "You must be 18 or older.";
      if (age > 120) e.dob = "Enter a valid date of birth.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) onNext();
  };

  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold tracking-tight">Your info</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll only use this to confirm your install.
      </p>

      <div className="mt-5 space-y-4">
        <Field
          label="Full name"
          error={errors.fullName}
          value={form.fullName}
          onChange={(v) => update("fullName", v)}
          placeholder="Jane Smith"
          autoComplete="name"
        />
        <Field
          label="Phone number"
          error={errors.phone}
          value={form.phone}
          onChange={(v) => update("phone", formatPhone(v))}
          placeholder="(555) 123-4567"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
        />
        <Field
          label="Email address"
          error={errors.email}
          value={form.email}
          onChange={(v) => update("email", v)}
          placeholder="you@example.com"
          type="email"
          inputMode="email"
          autoComplete="email"
        />
        <Field
          label="Date of birth"
          error={errors.dob}
          value={form.dob}
          onChange={(v) => update("dob", v)}
          type="date"
          autoComplete="bday"
        />
      </div>

      <NavRow onBack={onBack} onNext={next} />
    </div>
  );
}

// ---------------- Step 4: Install ----------------

function StepInstall({
  form,
  update,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    // PIN
    if (!/^\d{6}$/.test(form.pin)) e.pin = "PIN must be exactly 6 digits.";
    else if (/^(\d)\1{5}$/.test(form.pin))
      e.pin = "PIN can't be all the same digit.";
    else if (form.pin === "123456" || form.pin === "654321")
      e.pin = "That sequence isn't allowed.";
    else if (form.dob) {
      const dobDigits = form.dob.replace(/\D/g, "");
      if (dobDigits.includes(form.pin)) e.pin = "PIN can't match your birthday.";
    }

    if (!form.installDate) e.installDate = "Pick a preferred date.";
    else if (form.installDate < minDate)
      e.installDate = "Date must be at least 2 days from today.";

    if (!form.installTime) e.installTime = "Pick a preferred time window.";
    if (!form.consent) e.consent = "Consent is required to submit.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = () => {
    if (validate()) onSubmit();
  };

  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold tracking-tight">Install request</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Almost done — pick your install window.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <Label>6-digit account PIN</Label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            value={form.pin}
            onChange={(e) => update("pin", e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className={`${inputCls(!!errors.pin)} tracking-[0.5em] text-center font-bold text-lg`}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Create a 6-digit account PIN for account access. Do not use your
            birthday or a simple sequence.
          </p>
          {errors.pin && <FieldError>{errors.pin}</FieldError>}
        </div>

        <div>
          <Label>Preferred install date</Label>
          <input
            type="date"
            min={minDate}
            value={form.installDate}
            onChange={(e) => update("installDate", e.target.value)}
            className={inputCls(!!errors.installDate)}
          />
          {errors.installDate && <FieldError>{errors.installDate}</FieldError>}
        </div>

        <div>
          <Label>Preferred install time</Label>
          <div className="grid grid-cols-2 gap-2">
            {INSTALL_WINDOWS.map((w) => {
              const active = form.installTime === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => update("installTime", w)}
                  className={`py-3 px-2 rounded-xl border-2 text-sm font-semibold transition ${
                    active
                      ? "border-magenta bg-accent text-magenta"
                      : "border-border bg-card hover:border-foreground/30"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
          {errors.installTime && <FieldError>{errors.installTime}</FieldError>}
        </div>

        <label className="flex gap-3 items-start cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
            className="mt-1 h-5 w-5 accent-magenta shrink-0"
          />
          <span className="text-[13px] leading-relaxed text-foreground/85">
            I agree to be contacted by call, text, or email about T-Mobile Fiber
            options for this address. Message/data rates may apply. Reply STOP
            to opt out.
          </span>
        </label>
        {errors.consent && <FieldError>{errors.consent}</FieldError>}

        <p className="text-center text-xs text-muted-foreground pt-1">
          No payment is collected on this page.
        </p>

        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}
      </div>

      <NavRow
        onBack={onBack}
        onNext={handle}
        nextLabel={submitting ? "Submitting…" : "Submit Install Request"}
        nextDisabled={submitting}
      />
    </div>
  );
}

// ---------------- Success ----------------

function Success() {
  return (
    <main className="flex-1 max-w-xl mx-auto w-full px-5 py-10">
      <div className="rounded-3xl bg-card border p-8 text-center shadow-sm">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/15 grid place-items-center">
          <CheckIcon className="h-8 w-8 text-success" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
          Request received
        </h2>
        <p className="mt-3 text-[15px] text-foreground/80 leading-relaxed">
          Your request has been received. A representative will review your
          information and follow up to confirm available install options.
        </p>
        <div className="mt-6 rounded-xl bg-secondary p-4 text-sm">
          <span className="font-semibold">Prefer texting?</span> Text{" "}
          <span className="font-bold text-magenta">FIBER</span> to{" "}
          <a
            href="sms:8886438620?&body=FIBER"
            className="font-bold text-magenta underline"
          >
            888-643-8620
          </a>
          .
        </div>
      </div>
    </main>
  );
}

// ---------------- Reusable bits ----------------

function Label({
  children,
  optional,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold mb-1.5">
      {children}
      {optional && (
        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
      )}
    </label>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-xs font-medium text-destructive">{children}</p>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls(!!error)}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-xl border-2 bg-card px-4 py-3.5 text-base outline-none transition focus:border-magenta ${
    hasError ? "border-destructive" : "border-border"
  }`;
}

function NavRow({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <>
      {/* Sticky mobile bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur p-3 sm:hidden">
        <div className="max-w-xl mx-auto flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-3.5 rounded-xl border-2 border-border font-semibold text-sm"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex-1 bg-magenta text-white font-bold rounded-xl py-3.5 shadow-md disabled:opacity-50 active:scale-[0.99] transition"
          >
            {nextLabel}
          </button>
        </div>
      </div>
      {/* Desktop inline */}
      <div className="hidden sm:flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl border-2 border-border font-semibold"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 bg-magenta text-white font-bold rounded-xl py-3 shadow-md disabled:opacity-50"
        >
          {nextLabel}
        </button>
      </div>
    </>
  );
}

function StickyCta({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur p-3">
      <button
        onClick={onClick}
        className="w-full max-w-xl mx-auto block bg-magenta text-white font-bold rounded-xl py-4 shadow-md"
      >
        {children}
      </button>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ---------------- Utils ----------------

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function formatESTTimestamp(d: Date) {
  // MM/DD/YYYY HH:MM AM/PM in America/New_York
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("month")}/${get("day")}/${get("year")} ${get("hour")}:${get("minute")} ${get("dayPeriod").toUpperCase()}`;
}
