"use client";

import { usePoints } from "@/contexts/PointsContext";
// import { Card, CardContent, Skeleton } from "@/components/ui/card"
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins } from "lucide-react";

export const PointsBalance = () => {
  const { balance, loading, error } = usePoints();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <Coins className="w-8 h-8 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Available Points</p>
          {loading ? (
            <Skeleton className="w-24 h-8" />
          ) : (
            <p className="text-2xl font-bold">{balance.toLocaleString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 