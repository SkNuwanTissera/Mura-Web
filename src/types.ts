export type UserRole = 'PARENT' | 'PROVIDER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  parentId?: string;
  providerId?: string;
  token?: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  parentId?: string;
  providerId?: string;
  providerName?: string;
  createdAt?: string;
}

export interface Provider {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  address?: string;
  createdAt?: string;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  providerId?: string;
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
  child: Child;
  activity: Activity;
  availabilitySlot?: string;
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
  child?: Child;
  activity: Activity;
  availabilitySlot?: string;
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

export interface AdminActivityBooking extends ActivityBooking {
  parentId: string;
  parentName?: string;
  parentEmail?: string;
}

export interface AdminPaymentHistory extends PaymentHistory {
  parentId: string;
  parentName?: string;
  bookingCount: number;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  childId?: string;
  activities?: Activity[];
  createdAt?: string;
}

export interface ChildRecommendations {
  childId: string;
  childName: string;
  activities: Activity[];
}
