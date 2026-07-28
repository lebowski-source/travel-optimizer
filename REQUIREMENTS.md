# Travel Optimizer — Requirements (agreed spec)

Status: spec agreed, NOT yet built. Waiting for Jake's kickoff prompt (he may invoke skills in it).

## Architecture (decided)
- Webpage = trip-request builder (single-file HTML, lives in travel-optimizer folder, opens in any browser).
- Claude = search engine: runs the live cross-site research per trip and produces deliverables.
- Also package the research pipeline as a Cowork skill so every trip runs the same rigorous process.
- Handoff: BOTH a copy-prompt button (paste into chat) and a download of trip-request.json (drop in folder).

## Form inputs
- Starting physical location (address/city, not airport) → optimizer picks candidate airports/stations
- Destinations (1+, order optimizable), trip length in days, fixed or flexible ± N days
- Travelers: adults/children counts; rooms per location (addable); shared vs separate rooms
- Optimization: primary parameter + tiebreaker, menu: cost | time | fewest stops | comfort/luxury | schedule fit
- Lodging types: selectable checkboxes per trip — hotels / vacation rentals (Airbnb, VRBO) / budget (hostels, guesthouses)
- Interest profile: checkboxes (food, museums, history, hiking/outdoors, nightlife, kid-friendly, shopping, beaches, etc.) + free-text cuisine/notes
- Flight prefs: cabin class, checked bags, no red-eyes toggle, max layover, avoid airlines/alliances
- Per-location constraints: max/min days, lodging $/night cap, lodging min rating, meal $/day, activity budget, must-arrive-by / must-leave-by
- Overall trip budget cap (optional)

## Search pipeline (per trip)
- Thorough matrix: all destination orderings (up to ~4 destinations), 2–3 candidate airports per endpoint, full ± date range
- Every intercity leg compares modes: flight, rail, bus, ferry — scored by primary parameter, tiebreaker applied
- Multiple airfare sources (Google Flights, Kayak, airline direct, etc.); hotels across Booking/Google Hotels/direct; rentals via Airbnb/VRBO
- Local coverage per destination: airport→hotel transfers, transit pass vs rideshare vs rental car, daily getting-around budget
- Activities + restaurants filtered by interest profile with price levels
- Constraint checking against all caps; report flags any that can't be met

## Deliverables (all three per trip)
1. Interactive HTML dashboard — tabs per location, full itinerary, budget totals, runner-up comparisons, deep links
2. Printable PDF/Word report
3. XLSX budget spreadsheet — every cost line item, per-location and total, editable

## Re-bookability rules
Every recommendation records: exact flight/train numbers, dates, times, cabin/fare class, price, site where found, reconstructed deep link; hotels/rentals: name, room type, dates, rate, cancellation terms, link. All timestamped; volatile fares flagged.

## Traveler design center
Couples/family: fares × N, room math per location, per-person budget views.
