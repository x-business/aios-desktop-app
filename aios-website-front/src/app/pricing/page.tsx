"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import {
  FiKey,
  FiCreditCard,
  FiPieChart,
  FiHelpCircle,
  FiClock,
  FiSliders,
  FiRepeat,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubscriptionChangePreview } from "@/components/subscription/SubscriptionChangePreview";

interface PricingPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  description: string;
}

export default function Pricing() {
  const [pointsPackages, setPointsPackages] = useState<PricingPackage[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<PricingPackage[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUserData } = useAuth();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Get current plan index for upgrade/downgrade logic
  const getCurrentPlanIndex = () => {
    return subscriptionPlans.findIndex(
      (plan) => plan.id === user?.subscription?.planName
    );
  };

  const handleSubscriptionChange = async (planId: string, planName: string) => {
    // If user has no active subscription, redirect to checkout directly
    if (!user?.subscription?.planName) {
      try {
        setActionLoading(planId);
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          }/api/billing/subscriptions/checkout`,
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
          throw new Error("Failed to create checkout session");
        }

        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to process subscription"
        );
      } finally {
        setActionLoading(null);
      }
      return;
    }

    // If user has an active subscription, show the preview dialog
    setSelectedPlan({ id: planId, name: planName });
    setPreviewDialogOpen(true);
  };

  const handleChangeConfirm = async () => {
    if (!selectedPlan) return;

    setPreviewDialogOpen(false);
    setActionLoading(selectedPlan.id);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/billing/subscriptions/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("aios_token")}`,
          },
          body: JSON.stringify({ planId: selectedPlan.id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update subscription");
      }

      // Refresh user data
      await refreshUserData();
      
      // Force reload the pricing page data
      const pricingResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/billing/pricing`
      );

      if (pricingResponse.ok) {
        const data = await pricingResponse.json();
        setSubscriptionPlans(data.subscriptionPlans);
        setPointsPackages(data.pointsPackages);
      }

      // Show success message or notification if you have a notification system
      // You could add a toast notification here

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process plan change"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading("cancel");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/billing/subscriptions/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("aios_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      const data = await response.json();
      await refreshUserData();

      // Redirect to the success page
      router.push(data.redirectUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const fetchPricingInfo = async () => {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          }/api/billing/pricing`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pricing information");
        }

        const data = await response.json();
        setPointsPackages(data.pointsPackages);
        setSubscriptionPlans(data.subscriptionPlans);
      } catch (err) {
        setError("Failed to load pricing information. Please try again later.");
        console.error("Error fetching pricing:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPricingInfo();
    }
  }, [user]);

  // FAQ items
  const faqItems = [
    {
      question: "What are AIOS Points?",
      answer:
        "AIOS Points are our virtual currency that you can use to access AI models without managing your own API keys. Points are consumed based on the model used and the length of your inputs and outputs.",
    },
    {
      question: "How long do Points last?",
      answer:
        "Points do not expire and remain valid as long as your account is active. You can use them at your own pace.",
    },
    {
      question: "Can I use my own API keys instead?",
      answer:
        "Yes! AIOS allows you to use your own API keys from supported providers like OpenAI and Anthropic at no additional cost.",
    },
    {
      question:
        "What's the difference between one-time purchases and subscriptions?",
      answer:
        "One-time purchases give you a specific amount of points with no recurring charges. Subscriptions provide a monthly allocation of points at a discounted rate and renew automatically.",
    },
    {
      question: "How do I know how many points I need?",
      answer:
        "It depends on your usage. As a rough guide, 1,000 points is enough for approximately 200-300 average conversations with GPT-4 or Claude.",
    },
    {
      question: "Can I upgrade or downgrade my subscription?",
      answer:
        "Yes, you can change your subscription plan at any time. Changes will take effect at the start of your next billing cycle.",
    },
  ];

  // Update the subscription plan card rendering to include cancel button
  const renderSubscriptionCard = (plan: PricingPackage) => {
    const isCurrentPlan = plan.id === user?.subscription?.planName;
    const currentPlanIndex = getCurrentPlanIndex();
    const planIndex = subscriptionPlans.findIndex((p) => p.id === plan.id);
    const isUpgrade = planIndex > currentPlanIndex;
    const isDowngrade = planIndex < currentPlanIndex;

    // Format dates
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return (
      <Card key={plan.id} className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="mt-2 text-xl">${plan.price}/mo</p>
            <p className="mt-2 text-muted-foreground">
              {plan.points.toLocaleString()} points/month
            </p>
            <p className="mt-2 text-sm text-text-light">{plan.description}</p>

            {isCurrentPlan && user?.subscription && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium text-secondary">
                  Current Plan
                </div>
                <div className="text-sm text-text-light">
                  <p>
                    Next billing date:{" "}
                    {formatDate(user.subscription.currentPeriodEnd)}
                  </p>
                  {/* {user.subscription.currentPeriodEnd && (
                    <p className="mt-1 text-red-400">
                      Cancels on{" "}
                      {formatDate(user.subscription.currentPeriodEnd)}
                    </p>
                  )} */}
                </div>
                <Button
                  variant="destructive"
                  className="w-full bg-secondary text-primary-dark"
                  onClick={handleCancelSubscription}
                  disabled={actionLoading === "cancel"}
                >
                  {actionLoading === "cancel" ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-b-2 border-white rounded-full animate-spin"></div>
                      <span className="ml-2">Cancelling...</span>
                    </div>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              </div>
            )}

            {!isCurrentPlan && (
              <Button
                className="w-full mt-4 bg-secondary text-primary-dark"
                onClick={() => handleSubscriptionChange(plan.id, plan.name)}
                disabled={actionLoading === plan.id}
              >
                {actionLoading === plan.id ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-b-2 border-white rounded-full animate-spin"></div>
                    <span className="ml-2">Processing...</span>
                  </div>
                ) : (
                  <>
                    {user?.subscription ? (
                      <>
                        {isUpgrade && (
                          <ArrowUpCircle className="w-4 h-4 mr-2" />
                        )}
                        {isDowngrade && (
                          <ArrowDownCircle className="w-4 h-4 mr-2" />
                        )}
                        {isUpgrade
                          ? "Upgrade"
                          : isDowngrade
                          ? "Downgrade"
                          : "Switch Plan"}
                      </>
                    ) : (
                      "Select Plan"
                    )}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div>Loading pricing information...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="container-fluid">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl text-text-default font-sora">
            Simple, Transparent Pricing
          </h1>
          <p className="max-w-3xl mb-16 text-xl text-text-light">
            Choose the option that works best for you
          </p>

          {/* Main Pricing Options */}
          <div className="grid grid-cols-1 gap-8 mb-20 lg:grid-cols-2 lg:gap-16">
            {/* Free with Your Own API Keys */}
            <div className="overflow-hidden border border-gray-800 bg-primary-gradient-dark rounded-xl">
              <div className="p-8 md:p-10">
                <div className="flex items-center mb-6 text-secondary">
                  <FiKey className="w-6 h-6 mr-3" />
                  <h2 className="text-2xl font-bold font-sora">
                    Free with Your Own API Keys
                  </h2>
                </div>
                <p className="mb-8 text-text-light">
                  Use AIOS for free with your own API keys from OpenAI and other
                  providers
                </p>
                <ul className="mb-8 space-y-4">
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 text-secondary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-light">
                      No subscription fees
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 text-secondary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-light">
                      You control API usage and costs
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 text-secondary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-light">
                      Full access to all MCPs
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 text-secondary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-light">Community support</span>
                  </li>
                </ul>
                <div className="p-4 mb-8 rounded-lg bg-primary-dark">
                  <h3 className="mb-2 font-medium text-text-default">
                    Requirements
                  </h3>
                  <p className="text-sm text-text-light">
                    Valid API keys from supported providers (OpenAI, Anthropic,
                    etc.)
                  </p>
                </div>
                <Link
                  href="/download"
                  className="w-full text-center btn-primary"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* AIOS Points System */}
            <div className="relative overflow-hidden border bg-primary-gradient-dark rounded-xl border-secondary/30">
              <div className="absolute top-0 right-0 px-4 py-1 text-sm font-medium rounded-bl-lg bg-secondary text-primary-dark">
                Recommended
              </div>
              <div className="p-8 md:p-10">
                <div className="flex items-center mb-6 text-secondary">
                  <FiCreditCard className="w-6 h-6 mr-3" />
                  <h2 className="text-2xl font-bold font-sora">
                    AIOS Points System
                  </h2>
                </div>
                <p className="mb-8 text-text-light">
                  Purchase points and use AIOS without managing API keys
                </p>
                <ul className="mb-8 space-y-4">
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 text-secondary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-light">
                      No need to manage multiple API accounts
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 text-secondary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-light">
                      Pay only for what you use
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 text-secondary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-light">
                      Transparent usage tracking
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3 h-3 text-secondary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-text-light">Premium support</span>
                  </li>
                </ul>

                {/* Monthly Subscription Plans */}
                <div>
                  <h3 className="flex items-center mb-3 text-lg font-medium text-text-default">
                    <FiRepeat className="mr-2 text-secondary" />
                    Monthly Subscription Plans
                  </h3>
                  <div className="grid grid-cols-1 gap-3 mb-6">
                    {subscriptionPlans.map(renderSubscriptionCard)}
                  </div>
                </div>

                {/* One-time Packages */}
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-medium text-text-default">
                    One-time Packages
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {pointsPackages.map((pkg) => (
                      <Link
                        key={pkg.id}
                        href={`/checkout/${pkg.id}`}
                        className={`bg-primary-dark p-4 rounded-lg border ${
                          pkg.id === "standard"
                            ? "border-secondary/30"
                            : "border-gray-800"
                        } relative hover:bg-primary-dark/80 transition-colors cursor-pointer`}
                      >
                        {pkg.id === "standard" && (
                          <div className="absolute -top-2 -right-2 bg-secondary text-primary-dark px-2 py-0.5 text-xs font-medium rounded">
                            Popular
                          </div>
                        )}
                        <div className="mb-1 font-bold text-text-default">
                          {pkg.name}
                        </div>
                        <div className="mb-1 text-sm text-secondary">
                          {pkg.points.toLocaleString()} points
                        </div>
                        <div className="text-xs text-text-light">
                          ${pkg.price}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Transparency Section */}
          <div className="mb-20">
            <h2 className="mb-6 text-3xl font-bold text-center text-text-default font-sora">
              Complete Usage Transparency
            </h2>
            <p className="max-w-3xl mx-auto mb-12 text-center text-text-light">
              AIOS provides detailed usage tracking so you always know exactly
              how your points are being consumed. Monitor your usage patterns,
              optimize costs, and maintain complete control.
            </p>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="p-8 border border-gray-800 bg-primary-gradient-dark rounded-xl">
                <div className="mb-4 text-secondary">
                  <FiPieChart className="w-8 h-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-text-default font-sora">
                  Model Usage Breakdown
                </h3>
                <p className="text-text-light">
                  See exactly how many points you&apos;re using with each AI
                  model. Understand which models provide the best value for your
                  specific needs.
                </p>
              </div>

              <div className="p-8 border border-gray-800 bg-primary-gradient-dark rounded-xl">
                <div className="mb-4 text-secondary">
                  <FiClock className="w-8 h-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-text-default font-sora">
                  Usage History
                </h3>
                <p className="text-text-light">
                  Review your usage history over time with detailed logs of
                  conversations, model choices, and points spent. Export data
                  for your records.
                </p>
              </div>

              <div className="p-8 border border-gray-800 bg-primary-gradient-dark rounded-xl">
                <div className="mb-4 text-secondary">
                  <FiSliders className="w-8 h-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-text-default font-sora">
                  Usage Controls
                </h3>
                <p className="text-text-light">
                  Set daily or weekly usage limits, receive notifications, and
                  configure automatic fallback to your own API keys when points
                  run low.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-10">
            <h2 className="mb-10 text-3xl font-bold text-center text-text-default font-sora">
              Frequently Asked Questions
            </h2>

            <div className="w-full">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {faqItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-6 border border-gray-800 bg-primary-gradient-dark rounded-xl"
                  >
                    <h3 className="flex items-start mb-3 text-lg font-medium text-text-default font-sora">
                      <FiHelpCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5 mr-3" />
                      {item.question}
                    </h3>
                    <p className="pl-8 text-text-light">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-text-default font-sora">
              Ready to experience AIOS?
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-text-light">
              Download now and choose your preferred pricing option during
              setup.
            </p>
            <Link href="/download" className="px-8 py-4 btn-primary">
              Download AIOS
            </Link>
          </div>
        </div>
      </section>

      <SubscriptionChangePreview
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        onConfirm={handleChangeConfirm}
        planId={selectedPlan?.id ?? ""}
        planName={selectedPlan?.name ?? ""}
      />
    </Layout>
  );
}
