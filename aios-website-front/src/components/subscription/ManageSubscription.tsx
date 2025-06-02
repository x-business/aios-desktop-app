"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Link from "next/link";

interface SubscriptionPlan {
  id: string;
  name: string;
  points: number;
  price: number;
  description: string;
}

interface SubscriptionPlanResponse {
  id: string;
  name: string;
  monthlyPoints: number;
  price: number;
  description: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const ManageSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/billing/subscription-plans`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("aios_token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch subscription data");
        }

        const data = await response.json();
        
        // Validate and transform the data
        const validatedPlans = data.map((plan: SubscriptionPlanResponse) => ({
          id: plan.id,
          name: plan.name,
          points: Number(plan.monthlyPoints) || 0,
          price: Number(plan.price) || 0,
          description: plan.description || '',
        }));

        setPlans(validatedPlans);
        setCurrentPlan(user?.subscription?.planId || null);
      } catch (err) {
        console.error('Subscription data error:', err);
        setError(
          err instanceof Error ? err.message : "Failed to load subscription data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  const handleSubscriptionChange = async (planId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/billing/subscriptions/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("aios_token")}`,
          },
          body: JSON.stringify({ planId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to initiate plan change");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process plan change"
      );
    }
  };

  const getCurrentPlanIndex = () => {
    return plans.findIndex((plan) => plan.id === currentPlan);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan === plan.id;
            const currentPlanIndex = getCurrentPlanIndex();
            const isUpgrade = currentPlanIndex !== -1 && index > currentPlanIndex;
            const isDowngrade = currentPlanIndex !== -1 && index < currentPlanIndex;

            return (
              <Card
                key={plan.id}
                className={`${isCurrentPlan ? "border-secondary" : ""}`}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="mt-2 text-xl">${(plan.price || 0).toFixed(2)}/mo</p>
                    <p className="mt-2 text-muted-foreground">
                      {(plan.points || 0).toLocaleString()} points/month
                    </p>
                    <p className="mt-2 text-sm text-text-light">
                      {plan.description || 'No description available'}
                    </p>

                    {isCurrentPlan ? (
                      <div className="mt-4 text-sm font-medium text-secondary">
                        Current Plan
                      </div>
                    ) : (
                      <Button
                        className="w-full mt-4"
                        onClick={() => handleSubscriptionChange(plan.id)}
                      >
                        {isUpgrade && <ArrowUpCircle className="w-4 h-4 mr-2" />}
                        {isDowngrade && <ArrowDownCircle className="w-4 h-4 mr-2" />}
                        {isUpgrade
                          ? "Upgrade"
                          : isDowngrade
                          ? "Downgrade"
                          : "Switch to This Plan"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 text-sm text-text-light">
          <p>
            Need help choosing a plan?{" "}
            <Link href="/support" className="text-secondary hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 