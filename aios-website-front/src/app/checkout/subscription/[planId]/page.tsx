"use client";

import { DirectSubscriptionCheckout } from "@/components/subscription/DirectSubscriptionCheckout";
import { Loader2 } from "lucide-react";

export default function SubscriptionCheckoutPage({ 
  params 
}: { 
  params: { planId: string } 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-secondary" />
        <h1 className="text-2xl font-bold">Setting up your subscription...</h1>
        <p className="text-text-light">Please wait while we prepare your payment.</p>
      </div>
      <DirectSubscriptionCheckout planId={params.planId} />
    </div>
  );
} 