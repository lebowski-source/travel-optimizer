import { useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  Bus,
  CarFront,
  ChevronDown,
  ExternalLink,
  Plane,
  Ship,
  TrainFront,
  UtensilsCrossed,
  Compass,
  ArrowRightLeft,
} from "lucide-react";
import {
  ItineraryResult,
  StayNode,
  TransportNode,
  BookVia,
} from "./result-types";

const MODE_ICON: Record<TransportNode["mode"], typeof Plane> = {
  flight: Plane,
  train: TrainFront,
  bus: Bus,
  ferry: Ship,
  car: CarFront,
  transfer: ArrowRightLeft,
};

function usd(n?: number) {
  return n == null ? null : `$${Math.round(n).toLocaleString()}`;
}

function BookLinks({ links }: { links: BookVia[] }) {
  if (!links?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {links.map((b, i) => (
        <a
          key={i}
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          title={b.note}
          className="inline-flex items-center gap-1.5 bg-teal/20 hover:bg-teal/40 border border-teal/50 text-seafoam hover:text-cream px-2.5 py-1 rounded text-xs font-semibold transition-colors"
        >
          <ExternalLink size={12} /> Book: {b.site}
        </a>
      ))}
    </div>
  );
}

function PriceChip({ amount, basis }: { amount?: number; basis?: string }) {
  const v = usd(amount);
  if (!v) return null;
  return (
    <span className="shrink-0 bg-navy border border-teal/40 rounded px-2 py-0.5 text-sm font-semibold text-seafoam">
      {v}
      {basis ? <span className="text-cream/50 font-normal"> {basis}</span> : null}
    </span>
  );
}

function TransportCard({ n }: { n: TransportNode }) {
  const Icon = MODE_ICON[n.mode] ?? Plane;
  return (
    <div className="bg-panel border border-teal/25 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-teal font-semibold">
            <Icon size={14} /> {n.mode}
            {n.operator && <span className="text-cream/60 normal-case tracking-normal">· {n.operator} {n.number}</span>}
          </div>
          <div className="font-display text-lg text-cream mt-1">
            {n.from} <span className="text-teal">→</span> {n.to}
          </div>
          <div className="text-sm text-cream/70 mt-0.5">
            {n.date}
            {n.departTime && ` · ${n.departTime}`}
            {n.arriveTime && ` – ${n.arriveTime}`}
            {n.durationText && ` · ${n.durationText}`}
            {n.stops && ` · ${n.stops}`}
            {n.travelClass && ` · ${n.travelClass}`}
          </div>
          {n.details && <p className="text-sm text-cream/60 mt-1.5">{n.details}</p>}
        </div>
        <PriceChip amount={n.priceUSD} basis={n.priceBasis} />
      </div>
      <BookLinks links={n.bookVia} />
    </div>
  );
}

function StayCard({ n }: { n: StayNode }) {
  const [open, setOpen] = useState(true);
  const l = n.lodging;
  return (
    <div className="bg-panel border-l-4 border border-teal/25 border-l-teal rounded-lg p-4">
      <button
        type="button"
        className="w-full flex items-start justify-between gap-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-teal font-semibold">
            <BedDouble size={14} /> stay · {n.nights} night{n.nights === 1 ? "" : "s"}
          </div>
          <div className="font-display text-xl text-cream mt-1">{n.location}</div>
          <div className="text-sm text-cream/70">{n.checkIn} → {n.checkOut}</div>
        </div>
        <div className="flex items-center gap-2">
          <PriceChip amount={l?.totalUSD} basis="lodging" />
          <ChevronDown
            size={18}
            className={`text-seafoam/70 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {l && (
            <div className="bg-panel2/60 rounded p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-cream">{l.name}</div>
                  <div className="text-sm text-cream/65">
                    {[l.type, l.roomType, l.rooms ? `${l.rooms} room(s)` : null, l.rating, l.cancellation]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {l.nightlyUSD != null && (
                  <span className="text-sm text-seafoam shrink-0">{usd(l.nightlyUSD)}/night</span>
                )}
              </div>
              <BookLinks links={l.bookVia} />
            </div>
          )}

          {n.localTransport && (
            <p className="text-sm text-cream/70">
              <span className="text-seafoam font-semibold">Getting around: </span>
              {n.localTransport}
            </p>
          )}

          {!!n.activities?.length && (
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-teal font-semibold mb-1.5">
                <Compass size={13} /> Things to do
              </div>
              <ul className="grid md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {n.activities.map((a, i) => (
                  <li key={i} className="text-cream/80">
                    {a.name}
                    <span className="text-cream/50">
                      {" "}{[a.priceLevel, a.estCostUSD != null ? `~${usd(a.estCostUSD)}` : null]
                        .filter(Boolean).join(" · ")}
                    </span>
                    {a.note && <span className="text-cream/45"> — {a.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!!n.food?.length && (
            <div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-teal font-semibold mb-1.5">
                <UtensilsCrossed size={13} /> Where to eat
              </div>
              <ul className="grid md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {n.food.map((f, i) => (
                  <li key={i} className="text-cream/80">
                    {f.name}
                    <span className="text-cream/50">
                      {" "}{[f.cuisine, f.priceLevel].filter(Boolean).join(" · ")}
                    </span>
                    {f.note && <span className="text-cream/45"> — {f.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(n.dailyBudgetUSD != null || n.notes) && (
            <p className="text-sm text-cream/60">
              {n.dailyBudgetUSD != null && (
                <span className="text-seafoam font-semibold">
                  Daily budget here: {usd(n.dailyBudgetUSD)}.{" "}
                </span>
              )}
              {n.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Results({ result }: { result: ItineraryResult }) {
  const s = result.summary;
  return (
    <div className="mt-8">
      {/* summary banner */}
      <div className="bg-gradient-to-r from-panel to-panel2 border border-teal/40 rounded-lg p-5 md:p-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-cream">{s.title}</h2>
        <p className="text-cream/70 mt-2 max-w-3xl">{s.overview}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
          <span><span className="text-seafoam font-semibold">{usd(s.totalCostUSD)}</span> total{s.perPersonUSD != null && <span className="text-cream/60"> · {usd(s.perPersonUSD)}/person</span>}</span>
          <span className="text-cream/70">{s.startDate} → {s.endDate} · {s.totalDays} days</span>
          <span className="text-cream/70">{s.travelers}</span>
          <span className="text-cream/70">Optimized: {s.primaryOptimization} → {s.tiebreaker}</span>
        </div>
        <p className="text-xs text-cream/40 mt-2">
          Prices found {new Date(s.searchedAt).toLocaleString()} — point-in-time; confirm at booking.
        </p>
      </div>

      {!!result.warnings?.length && (
        <div className="mt-4 bg-amber-950/40 border border-amber-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm mb-1.5">
            <AlertTriangle size={15} /> Heads up
          </div>
          <ul className="list-disc pl-5 text-sm text-amber-100/80 space-y-1">
            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* timeline */}
      <div className="relative mt-6 pl-6 md:pl-8">
        <div className="absolute left-2 md:left-3 top-2 bottom-2 w-px bg-teal/40" />
        <div className="space-y-4">
          {result.nodes.map((n, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[1.15rem] md:-left-[1.4rem] top-5 w-3 h-3 rounded-full bg-teal border-2 border-navy" />
              {n.kind === "transport" ? <TransportCard n={n} /> : <StayCard n={n} />}
            </div>
          ))}
        </div>
      </div>

      {!!result.runnersUp?.length && (
        <details className="mt-6 bg-panel border border-teal/25 rounded-lg p-4">
          <summary className="cursor-pointer font-display font-semibold text-seafoam">
            Runner-up routings ({result.runnersUp.length}) — and why they lost
          </summary>
          <ul className="mt-3 space-y-2 text-sm">
            {result.runnersUp.map((r, i) => (
              <li key={i} className="text-cream/75">
                <span className="text-cream">{r.description}</span>
                {r.totalCostUSD != null && <span className="text-seafoam"> · {usd(r.totalCostUSD)}</span>}
                <span className="text-cream/55"> — {r.whyNotChosen}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
