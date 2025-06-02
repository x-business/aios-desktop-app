"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { FiCheckCircle } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function SubscriptionCancelSuccessPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/pricing");
    }
  }, [user, router]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md px-4">
          <div className="text-center">
            <FiCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="mb-2 text-2xl font-bold text-text-default">
              Subscription Cancelled Successfully
            </h1>
            <p className="mb-6 text-text-light">
              Your subscription has been cancelled. You will continue to have access to your current plan until the end of your billing period.
            </p>
            <div className="space-y-3">
              <Link href="/dashboard" className="block btn-primary">
                Go to Dashboard
              </Link>
              <Link href="/pricing" className="block btn-secondary">
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 