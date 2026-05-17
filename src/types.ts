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
  latitude?: number;
  longitude?: number;
  minAge: number;
  maxAge: number;
  availabilitySlots: string[];
  startTime?: string;
  endTime?: string;
  priceGbp?: number;
  contactPhone?: string;
}

export interface CartItem {
  id: string;
  activity: Activity;
  createdAt: string;
}

export interface CartCheckoutResult {
  checkedOutItems: CartItem[];
  totalPrice: number;
  count: number;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
}

export interface ActivityBooking {
  id: string;
  activity: Activity;
  paymentRecordId?: string;
  status: string;
  createdAt: string;
}

export interface PaymentHistory {
  id: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  amountGbp: number;
  currency: string;
  status: string;
  customerEmail?: string;
  billingName?: string;
  createdAt: string;
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
  postcode?: string;
  radiusMiles?: number;
  limit?: number;
  page?: number;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
