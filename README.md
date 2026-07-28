# Travel Optimizer

A trip-request builder. Define your trip once — starting location, destinations,
optimization priorities, per-stop constraints — and it generates a structured
research prompt (plus a portable `trip-request.json`) that Claude turns into a
fully optimized, bookable itinerary: flights/rail/ferries compared per leg,
hotels, local transport, activities, and a complete budget.

## Stack

Vite + React 18 + TypeScript + Tailwind CSS. No backend — the live travel
searching is done by Claude from the generated prompt.

## Develop

```bash
npm install
npm run dev
```

## Deploy (Vercel)

Import the repo in Vercel — it auto-detects Vite. Build command `npm run build`,
output directory `dist`. No environment variables needed.
