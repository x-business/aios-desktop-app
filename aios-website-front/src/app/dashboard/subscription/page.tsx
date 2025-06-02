"use client";

import Layout from "@/components/Layout";
import { ManageSubscription } from "@/components/subscription/ManageSubscription";

export default function SubscriptionPage() {
  return (
    <Layout>
      <section className="py-8">
        <div className="container-fluid">
          <h1 className="mb-6 text-3xl font-bold text-text-default">
            Subscription Management
          </h1>
          <ManageSubscription />
        </div>
      </section>
    </Layout>
  );
} 