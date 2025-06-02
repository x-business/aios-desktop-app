"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import Link from "next/link";

export default function PointsPurchaseResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");

  useEffect(() => {
    if (!searchParams.has("success") && !searchParams.has("error")) {
      router.push("/pricing");
    }
  }, [searchParams, router]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          {success ? (
            <div className="text-center">
              <FiCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h1 className="mb-2 text-2xl font-bold text-text-default">
                Payment Successful!
              </h1>
              <p className="mb-6 text-text-light">
                Thank you for your purchase. Your points have been added to your account.
              </p>
              <div className="space-y-3">
                <Link href="/dashboard/points" className="block btn-primary">
                  View Points Balance
                </Link>
                <Link href="/pricing" className="block btn-secondary">
                  Purchase More Points
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <FiXCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h1 className="mb-2 text-2xl font-bold text-text-default">
                Payment Failed
              </h1>
              <p className="mb-6 text-text-light">
                {error || "There was an error processing your payment. Please try again."}
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