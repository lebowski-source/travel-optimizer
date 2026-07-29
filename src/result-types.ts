export interface BookVia {
  site: string;
  url: string;
  note?: string;
}

export interface TransportNode {
  kind: "transport";
  mode: "flight" | "train" | "bus" | "ferry" | "car" | "transfer";
  from: string;
  to: string;
  date: string;
  departTime?: string;
  arriveTime?: string;
  operator?: string;
  number?: string;
  travelClass?: string;
  durationText?: string;
  stops?: string;
  priceUSD?: number;
  priceBasis?: "per person" | "total";
  bookVia: BookVia[];
  details?: string;
}

export interface StayNode {
  kind: "stay";
  location: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  lodging: {
    name: string;
    type?: string;
    roomType?: string;
    rooms?: number;
    nightlyUSD?: number;
    totalUSD?: number;
    rating?: string;
    cancellation?: string;
    bookVia: BookVia[];
  };
  localTransport?: string;
  activities?: {
    name: string;
    category?: string;
    priceLevel?: string;
    estCostUSD?: number;
    note?: string;
  }[];
  food?: { name: string; cuisine?: string; priceLevel?: string; note?: string }[];
  dailyBudgetUSD?: number;
  notes?: string;
}

export type TimelineNode = TransportNode | StayNode;

export interface ItineraryResult {
  summary: {
    title: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    travelers: string;
    totalCostUSD: number;
    perPersonUSD?: number;
    primaryOptimization: string;
    tiebreaker: string;
    overview: string;
    searchedAt: string;
  };
  nodes: TimelineNode[];
  runnersUp?: { description: string; totalCostUSD?: number; whyNotChosen: string }[];
  warnings?: string[];
}

/** Schema description given to the model for the structuring phase. */
export const SCHEMA_TEXT = `
{
  "summary": {
    "title": string,             // e.g. "Boulder → Lisbon & Porto, 10 days"
    "startDate": string,         // ISO date
    "endDate": string,
    "totalDays": number,
    "travelers": string,         // e.g. "2 adults"
    "totalCostUSD": number,      // whole trip, all travelers
    "perPersonUSD": number,
    "primaryOptimization": string,
    "tiebreaker": string,
    "overview": string,          // 2-4 sentence summary of the chosen routing and why it won
    "searchedAt": string         // ISO datetime
  },
  "nodes": [                     // STRICT chronological order, alternating transport and stay nodes
    {
      "kind": "transport",
      "mode": "flight" | "train" | "bus" | "ferry" | "car" | "transfer",
      "from": string, "to": string,
      "date": string, "departTime": string, "arriveTime": string,
      "operator": string, "number": string,   // e.g. "TAP Air Portugal", "TP 216"
      "travelClass": string, "durationText": string, "stops": string,
      "priceUSD": number, "priceBasis": "per person" | "total",
      "bookVia": [{ "site": string, "url": string, "note": string }],
      "details": string
    },
    {
      "kind": "stay",
      "location": string,
      "checkIn": string, "checkOut": string, "nights": number,
      "lodging": {
        "name": string, "type": string, "roomType": string, "rooms": number,
        "nightlyUSD": number, "totalUSD": number, "rating": string,
        "cancellation": string,
        "bookVia": [{ "site": string, "url": string, "note": string }]
      },
      "localTransport": string,  // how to get around + airport transfer summary w/ costs
      "activities": [{ "name": string, "category": string, "priceLevel": string, "estCostUSD": number, "note": string }],
      "food": [{ "name": string, "cuisine": string, "priceLevel": string, "note": string }],
      "dailyBudgetUSD": number,
      "notes": string
    }
  ],
  "runnersUp": [{ "description": string, "totalCostUSD": number, "whyNotChosen": string }],
  "warnings": [string]           // constraint violations, volatile fares, assumptions made
}`;
