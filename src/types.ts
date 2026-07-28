export type OptimizeParam =
  | "cost"
  | "time"
  | "fewest-stops"
  | "comfort-luxury"
  | "schedule-fit";

export type Cabin = "economy" | "premium-economy" | "business" | "first";
export type SearchDepth = "thorough" | "fast";
export type LocalCoverage = "full" | "transfers-only" | "none";
export type LodgingType = "hotels" | "vacation-rentals" | "budget";

export interface Destination {
  id: string;
  name: string;
  minDays: number | "";
  maxDays: number | "";
  rooms: number;
  lodgingCapPerNight: number | "";
  lodgingMinRating: number | "";
  mealBudgetPerDay: number | "";
  activityBudget: number | "";
  arriveBy: string;
  leaveBy: string;
  notes: string;
}

export interface TripRequest {
  origin: string;
  departDate: string;
  tripLengthDays: number | "";
  flexible: boolean;
  flexDays: number | "";
  adults: number;
  children: number;
  totalBudgetCap: number | "";
  optimizePrimary: OptimizeParam;
  tiebreaker: OptimizeParam;
  orderOptimizable: boolean;
  searchDepth: SearchDepth;
  lodgingTypes: LodgingType[];
  cabin: Cabin;
  checkedBags: number;
  noRedEyes: boolean;
  maxLayoverHours: number | "";
  avoidAirlines: string;
  localCoverage: LocalCoverage;
  interests: string[];
  cuisineNotes: string;
  destinations: Destination[];
}

export const OPTIMIZE_LABELS: Record<OptimizeParam, string> = {
  cost: "Lowest cost",
  time: "Least travel time",
  "fewest-stops": "Fewest stops / transfers",
  "comfort-luxury": "Comfort & luxury",
  "schedule-fit": "Best schedule fit",
};

export const INTEREST_OPTIONS = [
  "Food & dining",
  "Museums & art",
  "History & culture",
  "Hiking & outdoors",
  "Nightlife",
  "Kid-friendly",
  "Shopping",
  "Beaches & water",
  "Architecture",
  "Live music & shows",
  "Sports & events",
  "Photography spots",
];

export function newDestination(): Destination {
  return {
    id: Math.random().toString(36).slice(2, 9),
    name: "",
    minDays: "",
    maxDays: "",
    rooms: 1,
    lodgingCapPerNight: "",
    lodgingMinRating: "",
    mealBudgetPerDay: "",
    activityBudget: "",
    arriveBy: "",
    leaveBy: "",
    notes: "",
  };
}

export function defaultTrip(): TripRequest {
  return {
    origin: "",
    departDate: "",
    tripLengthDays: "",
    flexible: false,
    flexDays: 2,
    adults: 2,
    children: 0,
    totalBudgetCap: "",
    optimizePrimary: "cost",
    tiebreaker: "time",
    orderOptimizable: true,
    searchDepth: "thorough",
    lodgingTypes: ["hotels"],
    cabin: "economy",
    checkedBags: 1,
    noRedEyes: false,
    maxLayoverHours: "",
    avoidAirlines: "",
    localCoverage: "full",
    interests: [],
    cuisineNotes: "",
    destinations: [newDestination()],
  };
}
