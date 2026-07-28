import { TripRequest, OPTIMIZE_LABELS } from "./types";

function money(v: number | ""): string {
  return v === "" ? "no limit set" : `$${v}`;
}

export function buildJson(req: TripRequest): string {
  return JSON.stringify(req, null, 2);
}

export function buildPrompt(req: TripRequest): string {
  const dests = req.destinations.filter((d) => d.name.trim());
  const lines: string[] = [];

  lines.push(
    `# Trip Optimization Request`,
    ``,
    `You are my travel optimizer. Run the full research pipeline below and produce a complete, bookable trip plan. Do the live searching yourself across multiple sites (Google Flights, Kayak, airline/rail/ferry operator sites, Booking.com, Google Hotels, Airbnb/VRBO, Rome2Rio, etc.). Do not ask me clarifying questions unless a constraint is impossible; make reasonable calls and flag them.`,
    ``,
    `## Trip parameters`,
    ``,
    `- Starting location (physical address/city, NOT an airport): ${req.origin}`,
    `- Target departure date: ${req.departDate || "flexible / suggest one"}`,
    `- Trip length: ${req.tripLengthDays || "?"} days${
      req.flexible ? ` (FLEXIBLE ± ${req.flexDays || 0} days — search the whole window for better results)` : " (fixed)"
    }`,
    `- Travelers: ${req.adults} adult(s)${req.children ? `, ${req.children} child(ren)` : ""}`,
    `- Overall trip budget cap: ${money(req.totalBudgetCap)}`,
    `- PRIMARY optimization: ${OPTIMIZE_LABELS[req.optimizePrimary]}`,
    `- TIEBREAKER (when options are close on the primary): ${OPTIMIZE_LABELS[req.tiebreaker]}`,
    `- Destination order: ${
      req.orderOptimizable
        ? "OPTIMIZABLE — permute the visit order if it improves the primary metric"
        : "FIXED — visit in the order listed"
    }`,
    `- Search depth: ${
      req.searchDepth === "thorough"
        ? "THOROUGH — evaluate all destination orderings, 2–3 candidate airports/stations at each end, and the full flexible date range"
        : "FAST — prune to likely-best airports/orderings first; explore alternatives only when meaningful savings look plausible"
    }`,
    ``,
    `## Destinations & per-location constraints`,
    ``
  );

  dests.forEach((d, i) => {
    lines.push(`### ${i + 1}. ${d.name}`);
    const c: string[] = [];
    if (d.minDays !== "" || d.maxDays !== "")
      c.push(`Days here: ${d.minDays !== "" ? `min ${d.minDays}` : ""}${
        d.minDays !== "" && d.maxDays !== "" ? ", " : ""
      }${d.maxDays !== "" ? `max ${d.maxDays}` : ""}`);
    c.push(`Hotel rooms needed: ${d.rooms}`);
    if (d.lodgingCapPerNight !== "") c.push(`Lodging cap: $${d.lodgingCapPerNight}/night per room`);
    if (d.lodgingMinRating !== "") c.push(`Lodging minimum rating: ${d.lodgingMinRating}/10 (or equivalent)`);
    if (d.mealBudgetPerDay !== "") c.push(`Meal budget: $${d.mealBudgetPerDay}/day total`);
    if (d.activityBudget !== "") c.push(`Activity budget for this stop: $${d.activityBudget}`);
    if (d.arriveBy) c.push(`Must arrive by: ${d.arriveBy}`);
    if (d.leaveBy) c.push(`Must leave by: ${d.leaveBy}`);
    if (d.notes.trim()) c.push(`Notes: ${d.notes.trim()}`);
    c.forEach((x) => lines.push(`- ${x}`));
    lines.push(``);
  });

  lines.push(
    `## Transport preferences`,
    ``,
    `- Consider EVERY reasonable mode for each leg: flights, trains, buses, ferries, and combinations. Pick per-leg winners by the primary optimization, tiebreaker applied when close.`,
    `- Cabin class (flights): ${req.cabin}`,
    `- Checked bags per traveler: ${req.checkedBags} (include bag fees in all cost comparisons)`,
    `- Red-eye flights: ${req.noRedEyes ? "NOT allowed" : "allowed"}`,
    `- Max layover: ${req.maxLayoverHours === "" ? "no limit" : `${req.maxLayoverHours}h`}`,
    req.avoidAirlines.trim() ? `- Avoid these airlines/alliances: ${req.avoidAirlines.trim()}` : ``,
    `- Local transport coverage: ${
      req.localCoverage === "full"
        ? "FULL — airport/station→hotel transfers each way, plus a transit-pass vs rideshare vs rental-car comparison and a daily getting-around budget per destination"
        : req.localCoverage === "transfers-only"
        ? "TRANSFERS ONLY — just airport/station→hotel each way"
        : "NONE — intercity legs and lodging only"
    }`,
    ``,
    `## Lodging`,
    ``,
    `- Allowed lodging types: ${req.lodgingTypes.length ? req.lodgingTypes.join(", ") : "hotels"}. Compare across types on total stay cost where multiple are allowed.`,
    `- Record for every recommendation: property name, room type, dates, nightly + total rate, cancellation terms, the site where found, and a direct link.`,
    ``,
    `## Activities & food`,
    ``,
    req.interests.length
      ? `- Interests: ${req.interests.join(", ")}. Filter recommendations to these.`
      : `- No interest profile given — recommend broadly popular, highly rated options.`,
    req.cuisineNotes.trim() ? `- Cuisine/notes: ${req.cuisineNotes.trim()}` : ``,
    `- For each destination: 4–6 activities and 4–6 restaurants, each with rating, price level, and rough cost so I can budget.`,
    ``,
    `## Method (required)`,
    ``,
    `1. From my starting location, identify 2–3 practical departure airports/stations (factor in the cost & time of getting to each from my actual location — include that in totals).`,
    `2. Build the travel matrix: destination orderings × candidate airports × date shifts (if flexible). Score each full routing on the primary metric; use the tiebreaker for close calls.`,
    `3. Search multiple sources per leg and per hotel; note the best price AND where you found it.`,
    `4. Enforce every constraint above. If one cannot be met, say so explicitly and show the closest alternative.`,
    `5. Timestamp all prices and flag volatile fares.`,
    ``,
    `## Deliverables`,
    ``,
    `1. Interactive HTML dashboard — tabs per destination, full day-by-day itinerary, budget totals, runner-up comparison (2nd/3rd best routings and why they lost), deep links for every booking.`,
    `2. Printable report (PDF or Word) with the same content.`,
    `3. XLSX budget spreadsheet — every cost line item (transport, lodging, meals, activities, local transport), per-destination subtotals, grand total, per-person view.`,
    ``,
    `Re-bookability rule: every flight/train/ferry must include operator, number, date, departure/arrival times, class/fare type, price, source site, and a reconstructable link. I need to be able to find and book the exact same thing myself.`,
    ``,
    `## Raw request data`,
    ``,
    "```json",
    buildJson(req),
    "```"
  );

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
