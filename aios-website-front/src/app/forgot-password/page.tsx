"use client";

import Link from "next/link";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { FiAlertTriangle } from "react-icons/fi";

export default function ForgotPassword() {
  return (
    <Layout>
      <section className="py-20">
        <div className="container-fluid max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-primary-gradient-dark p-8 rounded-xl border border-gray-800"
          >
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 bg-primary-dark/90 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center p-8">
              <FiAlertTriangle className="text-secondary text-5xl mb-4" />
              <h2 className="text-2xl font-bold text-text-default mb-3 font-sora text-center">
                Password Reset Coming Soon
              </h2>
              <p className="text-text-light text-center mb-6">
                We're currently working on implementing our password reset system.
                This feature will be available soon. Thank you for your patience!
              </p>
              <Link href="/" className="btn-primary">
                Return to Home
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-text-default mb-6 font-sora text-center">
              Reset Password
            </h1>
            
            <p className="text-text-light mb-6">
              Enter your email address below and we'll send you instructions to reset your password.
            </p>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-text-light mb-2 text-sm">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full bg-primary-dark/50 border border-gray-700 rounded-md p-3 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full btn-primary py-3 flex justify-center"
                >
                  Reset Password
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-text-light text-sm">
                Remember your password?{" "}
                <Link href="/signin" className="text-secondary hover:text-secondary/80">
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