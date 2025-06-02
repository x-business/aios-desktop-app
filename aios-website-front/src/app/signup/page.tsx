"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { FiAlertTriangle } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUp() {
  const [name] = useState("");
  const [email] = useState("");
  const [password] = useState("");
  const [confirmPassword] = useState("");
  const [agreeToTerms] = useState(false);
  const [error, setError] = useState("");
  const [, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signup(name, email, password);
      if (result.success) {
        setSuccess("Account created successfully!");
        router.push("/dashboard");
      } else {
        setError(
          result.message || "Failed to create account. Please try again."
        );
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.message || "Failed to sign up with Google.");
      }
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
            <h1 className="mb-6 text-3xl font-bold text-center text-text-default font-sora">
              Create Account
            </h1>

            {error && (
              <div className="flex items-center p-4 mb-6 text-red-400 border rounded-md bg-red-500/10 border-red-500/30">
                <FiAlertTriangle className="mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center p-4 mb-6 text-green-400 border rounded-md bg-green-500/10 border-green-500/30">
                <FiAlertTriangle className="mr-2" />
                {success}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* <div>
                <label htmlFor="name" className="block mb-2 text-sm text-text-light">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiUser className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-700 rounded-md bg-primary-dark/50 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block mb-2 text-sm text-text-light">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiMail className="text-gray-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-700 rounded-md bg-primary-dark/50 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block mb-2 text-sm text-text-light">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-700 rounded-md bg-primary-dark/50 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block mb-2 text-sm text-text-light">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-700 rounded-md bg-primary-dark/50 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 border-gray-600 rounded text-secondary focus:ring-secondary"
                  required
                />
                <label htmlFor="terms" className="block ml-2 text-sm text-text-light">
                  I agree to the <Link href="/legal/terms" className="text-secondary hover:text-secondary/80">Terms of Service</Link> and <Link href="/legal/privacy" className="text-secondary hover:text-secondary/80">Privacy Policy</Link>
                </label>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center w-full py-3 btn-primary"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 mr-2 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                  ) : null}
                  Create Account
                </button>
              </div> */}
            </form>

            <div className="mt-6">
              <p className="text-sm text-text-light">
                We&apos;re currently working on implementing email and password
                authentication. This feature will be available soon. For now,
                please use Google Sign Up.
              </p>
            </div>

            <div className="mt-6">
              <div className="grid grid-cols-1 gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className="inline-flex justify-center w-full px-4 py-3 border border-gray-700 rounded-md shadow-sm bg-primary-dark/50 text-text-default hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                >
                  <FcGoogle className="w-5 h-5 mr-2" />
                  Sign up with Google
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-light">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-secondary hover:text-secondary/80"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
