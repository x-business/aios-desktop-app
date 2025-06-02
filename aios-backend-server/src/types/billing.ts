export interface PointsPackage {
  id: string;
  name: string;
  points: number;
  price: number; // in cents
  stripePriceId: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
} 