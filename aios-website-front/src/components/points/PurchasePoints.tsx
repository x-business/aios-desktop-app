"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { usePoints } from "@/contexts/PointsContext";
import { useAuth } from "@/contexts/AuthContext";

// Use the same package IDs as the backend
const POINTS_PACKAGES = [
  { id: 'starter', points: 1000, price: 10, name: 'Starter Package' },
  { id: 'standard', points: 5000, price: 40, name: 'Standard Package' },
  { id: 'professional', points: 15000, price: 100, name: 'Professional Package' },
  { id: 'enterprise', points: 50000, price: 300, name: 'Enterprise Package' },
] as const;

export const PurchasePoints = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { refreshBalance } = usePoints();
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const packageParam = searchParams.get('package');
  const successParam = searchParams.get('success');
  const canceledParam = searchParams.get('canceled');
  
  useEffect(() => {
    // Handle success or canceled payment
    if (successParam === 'true' && packageParam) {
      const selectedPackage = POINTS_PACKAGES.find(pkg => pkg.id === packageParam);
      if (selectedPackage) {
        setSuccess(`Successfully purchased ${selectedPackage.points.toLocaleString()} points!`);
        refreshBalance();
      }
    } else if (canceledParam === 'true') {
      setError('Payment was canceled. Please try again.');
    }
  }, [successParam, canceledParam, packageParam, refreshBalance]);

  useEffect(() => {
    // If a package is specified in the URL, automatically select it
    if (packageParam && !successParam && !canceledParam) {
      handlePurchase(packageParam);
    }
  }, [packageParam, successParam, canceledParam]);

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Find the package details
      const selectedPackage = POINTS_PACKAGES.find(pkg => pkg.id === packageId);
      
      if (!selectedPackage) {
        setError(`Invalid package selected: ${packageId}`);
        return;
      }
      
      if (!isAuthenticated) {
        setError('You must be logged in to purchase points');
        return;
      }
      
      // Call the backend API to create a checkout session
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aios_token')}`
        },
        body: JSON.stringify({ packageId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Points</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 text-green-400 bg-green-500/10 border-green-500/30">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 md:grid-cols-3">
          {POINTS_PACKAGES.map((pkg) => (
            <Card key={pkg.id} className={packageParam === pkg.id ? 'border-secondary' : ''}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold">{pkg.points.toLocaleString()} Points</h3>
                  <p className="mt-2 text-xl">${pkg.price}</p>
                  <p className="mt-2 text-muted-foreground">{pkg.name}</p>
                  <Button
                    className="w-full mt-4"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading}
                  >
                    {loading && packageParam === pkg.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {loading && packageParam === pkg.id ? 'Processing...' : 'Purchase'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};