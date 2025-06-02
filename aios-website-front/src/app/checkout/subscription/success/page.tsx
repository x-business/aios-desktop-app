"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success") === "true";
  const planId = searchParams.get("plan");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const { user, refreshUserData } = useAuth();

  const subscription = user?.subscription;
  console.log("subscription", subscription);

  useEffect(() => {
    if (!searchParams.has("success") && !searchParams.has("error")) {
      router.push("/pricing");
      return;
    }

    if (!verificationAttempted) {
      const checkSubscription = async () => {
        try {
          await refreshUserData();
        } catch (err) {
          console.error("Error checking subscription:", err);
          setError("Failed to verify subscription status");
        } finally {
          setIsLoading(false);
          setVerificationAttempted(true);
        }
      };
      checkSubscription();
    }
  }, [searchParams, router, refreshUserData, verificationAttempted]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-12 h-12 mx-auto border-b-2 rounded-full animate-spin border-primary"></div>
            </div>
            <p className="text-text-light">Verifying your subscription...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md px-4">
          {success && subscription && subscription.planName === planId ? (
            <div className="text-center">
              <FiCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h1 className="mb-2 text-2xl font-bold text-text-default">
                Subscription Activated!
              </h1>
              <p className="mb-2 text-lg font-semibold text-text-default">
                {subscription.planName}
              </p>
              <p className="mb-6 text-text-light">
                Your subscription has been successfully activated. You now have
                access to all the features and benefits of your plan, including
                your monthly points allocation.
              </p>
              <div className="space-y-3">
                <Link href="/dashboard" className="block btn-primary">
                  Go to Dashboard
                </Link>
                <Link href="/dashboard/points" className="block btn-secondary">
                  View Points Balance
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <FiXCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h1 className="mb-2 text-2xl font-bold text-text-default">
                Subscription Failed
              </h1>
              <p className="mb-6 text-text-light">
                {error ||
                  "There was an error processing your subscription. Please try again."}
              </p>
              <div className="space-y-3">
                <Link href="/pricing" className="block btn-primary">
                  Return to Pricing
                </Link>
                <Link href="/support" className="block btn-secondary">
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
