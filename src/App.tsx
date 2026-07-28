import { useRef, useState } from "react";
import clsx from "clsx";
import {
  Anchor,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  MapPin,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Destination,
  INTEREST_OPTIONS,
  LodgingType,
  OPTIMIZE_LABELS,
  OptimizeParam,
  TripRequest,
  defaultTrip,
  newDestination,
} from "./types";
import { buildJson, buildPrompt } from "./prompt";

/* ---------- small building blocks ---------- */

function Section(props: {
  n: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-panel border border-teal/25 rounded-lg p-5 md:p-6">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-display text-teal text-lg font-semibold">
          {String(props.n).padStart(2, "0")}
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-seafoam">
            {props.title}
          </h2>
          {props.subtitle && (
            <p className="text-sm text-cream/60 mt-0.5">{props.subtitle}</p>
          )}
        </div>
      </div>
      {props.children}
    </section>
  );
}

function Field(props: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={clsx("flex flex-col gap-1", props.className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-seafoam/80">
        {props.label}
      </span>
      {props.children}
      {props.hint && <span className="text-xs text-cream/45">{props.hint}</span>}
    </label>
  );
}

function Num(props: {
  value: number | "";
  onChange: (v: number | "") => void;
  min?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      min={props.min ?? 0}
      value={props.value}
      placeholder={props.placeholder}
      onChange={(e) =>
        props.onChange(e.target.value === "" ? "" : Number(e.target.value))
      }
    />
  );
}

function Toggle(props: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      {props.label}
    </label>
  );
}

function Chip(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={clsx(
        "px-3 py-1.5 rounded-full text-sm border transition-colors",
        props.active
          ? "bg-teal border-teal text-cream"
          : "bg-transparent border-teal/40 text-seafoam hover:border-teal"
      )}
    >
      {props.children}
    </button>
  );
}

const OPT_KEYS = Object.keys(OPTIMIZE_LABELS) as OptimizeParam[];

/* ---------- destination card ---------- */

function DestCard(props: {
  d: Destination;
  index: number;
  count: number;
  update: (patch: Partial<Destination>) => void;
  remove: () => void;
  move: (dir: -1 | 1) => void;
}) {
  const { d } = props;
  return (
    <div className="bg-panel2/60 border border-teal/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-teal shrink-0" />
        <input
          className="flex-1 font-semibold"
          placeholder={`Destination ${props.index + 1} — city, region, or country`}
          value={d.name}
          onChange={(e) => props.update({ name: e.target.value })}
        />
        <button
          type="button"
          title="Move up"
          disabled={props.index === 0}
          onClick={() => props.move(-1)}
          className="p-1.5 text-seafoam/70 hover:text-cream disabled:opacity-25"
        >
          <ArrowUp size={16} />
        </button>
        <button
          type="button"
          title="Move down"
          disabled={props.index === props.count - 1}
          onClick={() => props.move(1)}
          className="p-1.5 text-seafoam/70 hover:text-cream disabled:opacity-25"
        >
          <ArrowDown size={16} />
        </button>
        <button
          type="button"
          title="Remove destination"
          disabled={props.count === 1}
          onClick={props.remove}
          className="p-1.5 text-seafoam/70 hover:text-red-300 disabled:opacity-25"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Min days">
          <Num value={d.minDays} onChange={(v) => props.update({ minDays: v })} placeholder="any" />
        </Field>
        <Field label="Max days">
          <Num value={d.maxDays} onChange={(v) => props.update({ maxDays: v })} placeholder="any" />
        </Field>
        <Field label="Hotel rooms">
          <Num
            value={d.rooms}
            min={1}
            onChange={(v) => props.update({ rooms: v === "" ? 1 : v })}
          />
        </Field>
        <Field label="Lodging $/night cap">
          <Num
            value={d.lodgingCapPerNight}
            onChange={(v) => props.update({ lodgingCapPerNight: v })}
            placeholder="no cap"
          />
        </Field>
        <Field label="Lodging min rating" hint="0–10">
          <Num
            value={d.lodgingMinRating}
            onChange={(v) => props.update({ lodgingMinRating: v })}
            placeholder="any"
          />
        </Field>
        <Field label="Meals $/day">
          <Num
            value={d.mealBudgetPerDay}
            onChange={(v) => props.update({ mealBudgetPerDay: v })}
            placeholder="no cap"
          />
        </Field>
        <Field label="Activity budget $">
          <Num
            value={d.activityBudget}
            onChange={(v) => props.update({ activityBudget: v })}
            placeholder="no cap"
          />
        </Field>
        <Field label="Arrive by / leave by" className="col-span-2 md:col-span-1">
          <div className="flex gap-1.5">
            <input
              type="date"
              className="flex-1 min-w-0"
              value={d.arriveBy}
              onChange={(e) => props.update({ arriveBy: e.target.value })}
            />
            <input
              type="date"
              className="flex-1 min-w-0"
              value={d.leaveBy}
              onChange={(e) => props.update({ leaveBy: e.target.value })}
            />
          </div>
        </Field>
      </div>
      <Field label="Notes for this stop" className="mt-3">
        <input
          placeholder="e.g. staying near the old town, visiting friends on the 12th…"
          value={d.notes}
          onChange={(e) => props.update({ notes: e.target.value })}
        />
      </Field>
    </div>
  );
}

/* ---------- app ---------- */

export default function App() {
  const [trip, setTrip] = useState<TripRequest>(defaultTrip);
  const [output, setOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  const up = (patch: Partial<TripRequest>) => setTrip((t) => ({ ...t, ...patch }));

  const updateDest = (id: string, patch: Partial<Destination>) =>
    setTrip((t) => ({
      ...t,
      destinations: t.destinations.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));

  const moveDest = (id: string, dir: -1 | 1) =>
    setTrip((t) => {
      const i = t.destinations.findIndex((d) => d.id === id);
      const j = i + dir;
      if (j < 0 || j >= t.destinations.length) return t;
      const ds = [...t.destinations];
      [ds[i], ds[j]] = [ds[j], ds[i]];
      return { ...t, destinations: ds };
    });

  const toggleIn = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const generate = () => {
    if (!trip.origin.trim()) return setError("Enter your starting location.");
    if (!trip.destinations.some((d) => d.name.trim()))
      return setError("Add at least one destination.");
    if (trip.tripLengthDays === "")
      return setError("Enter the trip length in days.");
    setError(null);
    setOutput(buildPrompt(trip));
    setCopied(false);
    setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([buildJson(trip)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trip-request.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const loadJson = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result));
        setTrip({ ...defaultTrip(), ...parsed });
        setError(null);
      } catch {
        setError("Couldn't parse that file — is it a trip-request.json?");
      }
    };
    r.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* header */}
      <header className="mb-8 border-b border-teal/25 pb-6">
        <div className="flex items-center gap-3">
          <Anchor className="text-teal" size={28} />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-cream">
            Travel Optimizer
          </h1>
        </div>
        <p className="text-cream/65 mt-2 max-w-2xl">
          Define your trip once. Get a structured research request that Claude
          turns into a fully optimized, bookable itinerary — flights, rail,
          ferries, hotels, budgets, and things to do.
        </p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-seafoam hover:text-cream underline underline-offset-4"
        >
          <Upload size={14} /> Load a saved trip-request.json
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && loadJson(e.target.files[0])}
        />
      </header>

      <div className="space-y-6">
        {/* 1 — basics */}
        <Section
          n={1}
          title="Trip basics"
          subtitle="Where you physically start — airports get chosen by the optimizer, not you."
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Starting location" className="md:col-span-2">
              <input
                placeholder="e.g. 1420 Maple St, Boulder, CO"
                value={trip.origin}
                onChange={(e) => up({ origin: e.target.value })}
              />
            </Field>
            <Field label="Target departure date" hint="Leave blank to have dates suggested">
              <input
                type="date"
                value={trip.departDate}
                onChange={(e) => up({ departDate: e.target.value })}
              />
            </Field>
            <Field label="Trip length (days)">
              <Num
                value={trip.tripLengthDays}
                min={1}
                onChange={(v) => up({ tripLengthDays: v })}
                placeholder="e.g. 10"
              />
            </Field>
            <div className="flex items-end gap-4">
              <Toggle
                checked={trip.flexible}
                onChange={(v) => up({ flexible: v })}
                label="Dates are flexible"
              />
              {trip.flexible && (
                <Field label="± days">
                  <Num
                    value={trip.flexDays}
                    min={1}
                    onChange={(v) => up({ flexDays: v })}
                  />
                </Field>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Adults">
                <Num
                  value={trip.adults}
                  min={1}
                  onChange={(v) => up({ adults: v === "" ? 1 : v })}
                />
              </Field>
              <Field label="Children">
                <Num
                  value={trip.children}
                  onChange={(v) => up({ children: v === "" ? 0 : v })}
                />
              </Field>
              <Field label="Budget cap $">
                <Num
                  value={trip.totalBudgetCap}
                  onChange={(v) => up({ totalBudgetCap: v })}
                  placeholder="none"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* 2 — optimization */}
        <Section
          n={2}
          title="Optimization"
          subtitle="What wins when routings compete — and what breaks ties."
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Optimize primarily for">
              <select
                value={trip.optimizePrimary}
                onChange={(e) => up({ optimizePrimary: e.target.value as OptimizeParam })}
              >
                {OPT_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {OPTIMIZE_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tiebreaker">
              <select
                value={trip.tiebreaker}
                onChange={(e) => up({ tiebreaker: e.target.value as OptimizeParam })}
              >
                {OPT_KEYS.filter((k) => k !== trip.optimizePrimary).map((k) => (
                  <option key={k} value={k}>
                    {OPTIMIZE_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Search depth">
              <select
                value={trip.searchDepth}
                onChange={(e) => up({ searchDepth: e.target.value as TripRequest["searchDepth"] })}
              >
                <option value="thorough">Thorough — full travel matrix</option>
                <option value="fast">Fast — prune early</option>
              </select>
            </Field>
            <div className="flex items-end pb-1">
              <Toggle
                checked={trip.orderOptimizable}
                onChange={(v) => up({ orderOptimizable: v })}
                label="Allow reordering destinations if it's better"
              />
            </div>
          </div>
        </Section>

        {/* 3 — destinations */}
        <Section
          n={3}
          title="Destinations & constraints"
          subtitle="Per-stop limits: days, lodging caps, meal budgets, hard dates."
        >
          <div className="space-y-4">
            {trip.destinations.map((d, i) => (
              <DestCard
                key={d.id}
                d={d}
                index={i}
                count={trip.destinations.length}
                update={(p) => updateDest(d.id, p)}
                remove={() =>
                  setTrip((t) => ({
                    ...t,
                    destinations: t.destinations.filter((x) => x.id !== d.id),
                  }))
                }
                move={(dir) => moveDest(d.id, dir)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setTrip((t) => ({ ...t, destinations: [...t.destinations, newDestination()] }))
            }
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-tealbright"
          >
            <Plus size={16} /> Add destination
          </button>
        </Section>

        {/* 4 — transport */}
        <Section
          n={4}
          title="Transport preferences"
          subtitle="Every leg compares flights, rail, bus, and ferry."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Cabin class">
              <select
                value={trip.cabin}
                onChange={(e) => up({ cabin: e.target.value as TripRequest["cabin"] })}
              >
                <option value="economy">Economy</option>
                <option value="premium-economy">Premium economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </Field>
            <Field label="Checked bags / person">
              <Num
                value={trip.checkedBags}
                onChange={(v) => up({ checkedBags: v === "" ? 0 : v })}
              />
            </Field>
            <Field label="Max layover (hours)">
              <Num
                value={trip.maxLayoverHours}
                onChange={(v) => up({ maxLayoverHours: v })}
                placeholder="none"
              />
            </Field>
            <div className="flex items-end pb-1">
              <Toggle
                checked={trip.noRedEyes}
                onChange={(v) => up({ noRedEyes: v })}
                label="No red-eyes"
              />
            </div>
            <Field label="Avoid airlines / alliances" className="col-span-2">
              <input
                placeholder="e.g. Spirit, Frontier"
                value={trip.avoidAirlines}
                onChange={(e) => up({ avoidAirlines: e.target.value })}
              />
            </Field>
            <Field label="Local transport coverage" className="col-span-2">
              <select
                value={trip.localCoverage}
                onChange={(e) =>
                  up({ localCoverage: e.target.value as TripRequest["localCoverage"] })
                }
              >
                <option value="full">Full — transfers + daily local transport plan</option>
                <option value="transfers-only">Transfers only (airport ↔ hotel)</option>
                <option value="none">Skip local transport</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* 5 — lodging & interests */}
        <Section
          n={5}
          title="Lodging & interests"
          subtitle="Lodging types to search, and what you actually like doing."
        >
          <Field label="Lodging types to include">
            <div className="flex flex-wrap gap-2 mt-1">
              {(
                [
                  ["hotels", "Hotels"],
                  ["vacation-rentals", "Vacation rentals (Airbnb / VRBO)"],
                  ["budget", "Budget (hostels, guesthouses)"],
                ] as [LodgingType, string][]
              ).map(([k, label]) => (
                <Chip
                  key={k}
                  active={trip.lodgingTypes.includes(k)}
                  onClick={() =>
                    up({ lodgingTypes: toggleIn(trip.lodgingTypes, k) as LodgingType[] })
                  }
                >
                  {label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Interests" className="mt-4">
            <div className="flex flex-wrap gap-2 mt-1">
              {INTEREST_OPTIONS.map((i) => (
                <Chip
                  key={i}
                  active={trip.interests.includes(i)}
                  onClick={() => up({ interests: toggleIn(trip.interests, i) })}
                >
                  {i}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Cuisine & other notes" className="mt-4">
            <input
              placeholder="e.g. love ramen and seafood, one traveler is vegetarian"
              value={trip.cuisineNotes}
              onChange={(e) => up({ cuisineNotes: e.target.value })}
            />
          </Field>
        </Section>
      </div>

      {/* generate */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          className="bg-teal hover:bg-tealbright text-cream font-semibold px-6 py-3 rounded-md transition-colors"
        >
          Generate trip request
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-1.5 border border-teal/50 hover:border-teal text-seafoam px-4 py-3 rounded-md text-sm transition-colors"
        >
          <Download size={15} /> Download trip-request.json
        </button>
        {error && <span className="text-red-300 text-sm">{error}</span>}
      </div>

      {/* output */}
      {output && (
        <div ref={outRef} className="mt-8 bg-panel border border-teal/40 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-panel2 border-b border-teal/25">
            <h3 className="font-display font-semibold text-seafoam">
              Your research prompt — paste this to Claude
            </h3>
            <button
              type="button"
              onClick={copy}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-colors",
                copied ? "bg-teal text-cream" : "bg-tealbright/90 hover:bg-tealbright text-cream"
              )}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy prompt"}
            </button>
          </div>
          <pre className="p-4 text-xs leading-relaxed text-cream/85 overflow-x-auto whitespace-pre-wrap max-h-[28rem] overflow-y-auto">
            {output}
          </pre>
        </div>
      )}

      <footer className="mt-10 pt-6 border-t border-teal/20 text-xs text-cream/40">
        Prices found by the optimizer are point-in-time — every result is
        timestamped and volatile fares are flagged so you can re-find and book
        them yourself.
      </footer>
    </div>
  );
}
