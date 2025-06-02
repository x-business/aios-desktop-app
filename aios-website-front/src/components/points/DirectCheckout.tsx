// src/components/points/DirectCheckout.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export const DirectCheckout = ({ packageId }: { packageId: string }) => {
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const initiateCheckout = async () => {
      try {
        if (!isAuthenticated) {
          // Redirect to login if not authenticated
          router.push(`/login?redirect=/pricing&package=${packageId}`);
          return;
        }
        console.log("packageId", "here");
        // Call the backend API to create a checkout session
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          }/api/billing/checkout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("aios_token")}`,
            },
            body: JSON.stringify({ packageId }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to create checkout session"
          );
        }

        const { url } = await response.json();

        // Redirect to Stripe Checkout
        if (url) {
          window.location.href = url;
        } else {
          throw new Error("No checkout URL returned from server");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initiate purchase"
        );
        // Redirect to points dashboard with error
        router.push(
          `/dashboard/points?error=${encodeURIComponent(
            err instanceof Error ? err.message : "Failed to initiate purchase"
          )}`
        );
      } finally {
        setLoading(false);
      }
    };

    initiateCheckout();
  }, [packageId, isAuthenticated, router]);

  // This component doesn't render anything visible
  // It just handles the checkout process
  return null;
};
