"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { FiAlertTriangle } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/contexts/AuthContext";

export default function SignIn() {
  const [email] = useState("");
  const [password] = useState("");
  const [error, setError] = useState("");
  const [, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get electron-specific params
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");
  const clientId = searchParams.get("client_id");
  const isElectron = searchParams.get("is_electron") === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(email, password, {
        isElectron,
        redirectUri: redirectUri || undefined,
        state: state || undefined,
        clientId: clientId || undefined,
      });

      if (result.success) {
        if (isElectron && redirectUri) {
          setSuccess("Successfully signed in. Returning to desktop app...");
          // Redirect back to Electron app with token
          window.location.href = `${redirectUri}?token=${result.token}&state=${state}`;
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(
          result.message || "Failed to sign in. Please check your credentials."
        );
      }
    } catch (err) {
      console.error("Signin error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const urlParams = new URLSearchParams(window.location.search);
      console.log("window.location.search", window.location.search);
      console.log("urlParams", urlParams);
      const isElectron = urlParams.get("is_electron") === "true";
      const redirectUri = urlParams.get("redirect_uri");
      const state = urlParams.get("state");
      const result = await loginWithGoogle({
        isElectron,
        redirectUri: redirectUri || undefined,
        state: state || undefined,
        clientId: clientId || undefined,
      });
      if (!result.success) {
        setError(result.message || "Failed to sign in with Google.");
      }
      // Redirect is handled by loginWithGoogle
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Layout>
      <section className="py-20">
        <div className="max-w-md mx-auto container-fluid">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 border border-gray-800 bg-primary-gradient-dark rounded-xl"
          >
            <h1 className="mb-6 text-3xl font-bold text-center text-text-default font-sora disable">
              Sign In
            </h1>

            {error && (
              <div className="flex items-center p-4 mb-6 text-red-400 border rounded-md bg-red-500/10 border-red-500/30">
                <FiAlertTriangle className="mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center p-4 mb-6 text-green-400 border rounded-md bg-green-500/10 border-green-500/30">
                {success}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between"></div>
            </form>

            <div className="mt-6">
              <p className="text-sm text-text-light">
                We&apos;re currently working on implementing email and password
                authentication. This feature will be available soon. For now,
                please use Google Sign In.
              </p>
            </div>

            <div className="mt-6">
              <div className="grid grid-cols-1 gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="inline-flex justify-center w-full px-4 py-3 border border-gray-700 rounded-md shadow-sm bg-primary-dark/50 text-text-default hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                >
                  <FcGoogle className="w-5 h-5 mr-2" />
                  Sign in with Google
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
