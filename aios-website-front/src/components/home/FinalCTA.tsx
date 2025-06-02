"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FinalCTA = () => {
  return (
    <section className="py-20 bg-primary-dark">
      <div className="container-fluid">
        <div className="rounded-2xl bg-gradient-to-r from-primary-gradient-dark to-primary-gradient-light/30 p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-default mb-4 font-sora">
              Ready to get started?
            </h2>
            <p className="text-text-light max-w-2xl mx-auto mb-8">
              Download AIOS today and experience the next generation of AI integration.
              Connect your favorite AI models with real-world systems for powerful cognitive extension.
            </p>
            <Link href="/download" className="btn-primary px-8 py-4 text-lg">
              Download Now
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA; 