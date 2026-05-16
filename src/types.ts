export interface User {
  name: string;
  email: string;
  parentId?: string;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  providerName: string;
  locationName: string;
  address: string;
  city: string;
  minAge: number;
  maxAge: number;
  availabilitySlots: string[];
  startTime?: string;
  endTime?: string;
  priceGbp?: number;
  contactPhone?: string;
}

export interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
  age: number;
  preferredCity?: string;
  interests?: string;
  maxBudgetGbp?: number;
  availableTimes?: string;
  travelRadiusKm?: number;
  postcode?: string;
}

export interface ActivitySearchFilters {
  age?: number;
  category?: string;
  city?: string;
  locationName?: string;
  limit?: number;
}
