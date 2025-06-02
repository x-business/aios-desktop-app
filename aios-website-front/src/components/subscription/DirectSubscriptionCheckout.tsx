"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export const DirectSubscriptionCheckout = ({ planId }: { planId: string }) => {
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const initiateCheckout = async () => {
      try {
        if (!isAuthenticated) {
          router.push(`/login?redirect=/checkout/subscription/${planId}`);
          return;
        }

        console.log("Initiating checkout for plan:", planId); // Debug log

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/billing/subscriptions/checkout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("aios_token")}`,
            },
            body: JSON.stringify({ planId }),
          }
        );

        console.log("Response status:", response.status); // Debug log

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText); // Debug log
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || "Failed to create checkout session");
          } catch (e) {
            console.error("Error parsing JSON:", e); // Debug log
            throw new Error("Failed to create checkout session");
          }
        }

        const data = await response.json();
        console.log("Checkout data:", data); // Debug log

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned from server");
        }
      } catch (err) {
        console.error("Checkout error:", err); // Debug log
        const errorMessage = err instanceof Error ? err.message : "Failed to initiate subscription";
        setError(errorMessage);
        router.push(`/pricing?error=${encodeURIComponent(errorMessage)}`);
      } finally {
        setLoading(false);
      }
    };

    initiateCheckout();
  }, [planId, isAuthenticated, router]);

  if (error) {
    return (
      <div className="text-red-500">
        Error: {error}
      </div>
    );
  }

  return null;
}; 