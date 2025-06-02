"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { FiTrash2, FiCheck, FiAlertTriangle } from "react-icons/fi";

export default function ResetPage() {
  const [isResetting, setIsResetting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { resetMockData } = useAuth();
  const router = useRouter();

  const handleReset = () => {
    setIsResetting(true);
    
    // Add a slight delay to simulate processing
    setTimeout(() => {
      // Clear all mock data
      resetMockData();
      setIsComplete(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }, 1000);
  };

  return (
    <Layout>
      <section className="py-20">
        <div className="container-fluid max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-primary-gradient-dark p-8 rounded-xl border border-gray-800"
          >
            <h1 className="text-2xl font-bold text-text-default mb-6 font-sora text-center">
              Reset Demo Data
            </h1>
            
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-md flex items-start">
              <FiAlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Warning: This will reset all demo data</p>
                <p className="text-sm">
                  This action will clear all mock user accounts and activity data except for the default demo account.
                  Any custom accounts you've created will be removed.
                </p>
              </div>
            </div>
            
            {isComplete ? (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-md flex items-center">
                <FiCheck className="h-5 w-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium">Data reset complete!</p>
                  <p className="text-sm">Redirecting to home page...</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-md py-3 font-medium flex items-center justify-center"
              >
                {isResetting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full mr-2"></div>
                    Resetting Data...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="mr-2" />
                    Reset All Demo Data
                  </>
                )}
              </button>
            )}
            
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-text-light text-sm hover:text-secondary"
                disabled={isResetting || isComplete}
              >
                Return to Home
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
} 