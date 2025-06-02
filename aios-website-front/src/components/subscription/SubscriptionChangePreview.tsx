import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PreviewData {
  immediatePayment: number;
  newPrice: number;
  currentPrice: number;
  nextBillingDate: string;
  proration: {
    prorated: boolean;
    amount: number;
    isCredit: boolean;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planId: string;
  planName: string;
}

export function SubscriptionChangePreview({
  isOpen,
  onClose,
  onConfirm,
  planId,
  planName,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/billing/subscriptions/preview-update`,
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
        throw new Error("Failed to get preview");
      }

      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPreview();
    }
  }, [isOpen, planId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Change Subscription to {planName}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Review your subscription change details
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="py-4 text-red-500">{error}</div>
        ) : (
          previewData && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <p className="font-medium">
                  New Monthly Price: ${previewData.newPrice}
                </p>

                {previewData.proration.prorated && (
                  <div className="text-sm">
                    <p>
                      {previewData.proration.isCredit
                        ? `You'll receive a credit of $${previewData.proration.amount}`
                        : `You'll be charged $${previewData.proration.amount} now`}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      This{" "}
                      {previewData.proration.isCredit ? "credit" : "charge"}{" "}
                      covers the remaining days in your current billing period
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Next billing date:{" "}
                  {new Date(previewData.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            Confirm Change
          </Button>
        </div>
      </div>
    </div>
  );
}
