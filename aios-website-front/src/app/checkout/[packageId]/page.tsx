// src/app/checkout/[packageId]/page.tsx
"use client";

import { DirectCheckout } from "@/components/points/DirectCheckout";
import { Loader2 } from "lucide-react";
import { use } from "react";

export default function CheckoutPage({ params }: { params: Promise<{ packageId: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = use(params);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-secondary" />
        <h1 className="text-2xl font-bold">Redirecting to checkout...</h1>
        <p className="text-text-light">Please wait while we prepare your payment.</p>
      </div>
      <DirectCheckout packageId={unwrappedParams.packageId} />
    </div>
  );
}