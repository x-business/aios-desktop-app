"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

type PointTransaction = {
  id: string;
  type: "purchase" | "usage" | "refund" | "bonus";
  amount: number;
  description: string;
  timestamp: string;
};

type PointsContextType = {
  balance: number;
  transactions: PointTransaction[];
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
};

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/points/balance`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("aios_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch points balance");
      }

      const data = await response.json();
      setBalance(data.pointsBalance || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching points balance:", err);
      setError("Failed to load points balance");
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/points/transactions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("aios_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();

      // Transform the data to match our frontend format
      const transformedTransactions = data.transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.transactionType.toLowerCase(),
        amount: tx.transactionType === "USAGE" ? -tx.points : tx.points,
        description: tx.description || "No description",
        timestamp: tx.createdAt,
      }));

      setTransactions(transformedTransactions);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([refreshBalance(), refreshTransactions()])
        .catch((err) => console.error("Error loading points data:", err))
        .finally(() => setLoading(false));
    } else {
      setBalance(0);
      setTransactions([]);
    }
  }, [isAuthenticated]);

  return (
    <PointsContext.Provider
      value={{
        balance,
        transactions,
        loading,
        error,
        refreshBalance,
        refreshTransactions,
      }}
    >
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error("usePoints must be used within a PointsProvider");
  }
  return context;
};
