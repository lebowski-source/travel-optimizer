import { TripRequest } from "./types";
import { buildPrompt } from "./prompt";
import { ItineraryResult, SCHEMA_TEXT } from "./result-types";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type Phase = "research" | "structure";

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  opts: { grounded?: boolean; json?: boolean } = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 32768,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
    ...(opts.grounded ? { tools: [{ google_search: {} }] } : {}),
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 300_000);
  let res: Response;
  try {
    res = await fetch(`${BASE}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 400 && /API key/i.test(text))
      throw new Error("Gemini rejected the API key. Check it in Settings.");
    if (res.status === 429)
      throw new Error(
        "Rate/quota limit hit on the free tier. Wait a minute (10 requests/min) or try again tomorrow (daily cap)."
      );
    throw new Error(`Gemini API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts: { text?: string }[] =
    data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  if (!text.trim()) {
    const reason = data?.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`Gemini returned no text (finishReason: ${reason}).`);
  }
  return text;
}

function extractJson(text: string): ItineraryResult {
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) raw = fence[1].trim();
  if (!raw.startsWith("{")) {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) raw = raw.slice(start, end + 1);
  }
  const parsed = JSON.parse(raw) as ItineraryResult;
  if (!parsed.summary || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0)
    throw new Error("Result JSON missing summary or timeline nodes.");
  return parsed;
}

export async function runOptimization(
  trip: TripRequest,
  apiKey: string,
  model: string,
  onPhase: (phase: Phase) => void
): Promise<ItineraryResult> {
  onPhase("research");
  const researchPrompt =
    buildPrompt(trip) +
    `\n\n---\nIMPORTANT OVERRIDE: You are running inside an automated pipeline TODAY (${new Date().toISOString().slice(0, 10)}). ` +
    `Use Google Search extensively (real current prices, schedules, operators). Do NOT produce the HTML/PDF/XLSX deliverables. ` +
    `Instead output exhaustive RESEARCH NOTES in plain text covering: (1) chosen routing and why it beat alternatives on the primary metric; ` +
    `(2) every transport leg in order — mode, operator, service/flight number, date, depart/arrive times, class, duration, stops, price in USD, ` +
    `price basis (per person or total), and 1-2 real booking URLs (operator site, Google Flights/Booking/Trainline etc.); ` +
    `(3) lodging for each stop — property, room type, rooms, nightly & total USD, rating, cancellation policy, booking URLs; ` +
    `(4) local transport per stop with costs; (5) 4-6 activities and 4-6 restaurants per stop matching the interest profile, with price levels and est. costs; ` +
    `(6) 2-3 runner-up routings with total cost and why they lost; (7) warnings — constraints you could not meet, volatile prices, assumptions. ` +
    `Every price must state USD amounts and where you found it. Be exhaustive and concrete; no placeholders.`;

  const notes = await callGemini(apiKey, model, researchPrompt, { grounded: true });

  onPhase("structure");
  const structurePrompt =
    `Convert the following travel research notes into a single JSON object that EXACTLY matches this schema ` +
    `(all dates ISO yyyy-mm-dd, all money in USD numbers, chronological node order, alternating transport/stay where natural):\n` +
    SCHEMA_TEXT +
    `\n\nRules: preserve every concrete detail (operators, numbers, times, prices, URLs). If a booking URL in the notes is generic or missing, ` +
    `construct a sensible search URL (e.g. https://www.google.com/travel/flights?q=Flights+from+DEN+to+LIS+2026-09-10 or a Booking.com search URL for the property and dates). ` +
    `Set summary.searchedAt to "${new Date().toISOString()}". Output ONLY the JSON object.\n\nRESEARCH NOTES:\n` +
    notes;

  const json = await callGemini(apiKey, model, structurePrompt, { json: true });
  return extractJson(json);
}

/* ---------- settings persistence (guarded) ---------- */

export interface Settings {
  apiKey: string;
  model: string;
}

const KEY = "travel-optimizer-settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { model: "gemini-2.5-flash", ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return { apiKey: "", model: "gemini-2.5-flash" };
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}
