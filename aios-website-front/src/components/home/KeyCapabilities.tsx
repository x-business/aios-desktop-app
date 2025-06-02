"use client";

import { FiCommand, FiServer, FiLayers, FiMic } from "react-icons/fi";
import { motion } from "framer-motion";

const capabilities = [
  {
    title: "Model Context Protocol (MCP)",
    description: "Standardized connections between AI models and various data sources or tools, enabling powerful real-world interactions.",
    icon: <FiCommand className="h-6 w-6" />,
    delay: 0.1,
  },
  {
    title: "Computer Use Agent (CUA)",
    description: "AI-powered assistant that helps you interact with your computer through natural language commands and automated workflows.",
    icon: <FiServer className="h-6 w-6" />,
    delay: 0.2,
  },
  {
    title: "Multi-Provider AI",
    description: "Connect with various AI models from different providers like OpenAI, Anthropic, and more for specialized tasks.",
    icon: <FiLayers className="h-6 w-6" />,
    delay: 0.3,
  },
  {
    title: "Voice Interaction",
    description: "Interact with your AI assistant naturally using voice commands and receive audio responses for a hands-free experience.",
    icon: <FiMic className="h-6 w-6" />,
    delay: 0.4,
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

const KeyCapabilities = () => {
  return (
    <section className="py-20 bg-primary-dark">
      <div className="container-fluid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-text-default mb-4 font-sora">
            Key Capabilities
          </h2>
          <p className="text-text-light max-w-2xl mx-auto">
            Unlock powerful AI capabilities with standardized tools for seamless integration with your existing workflows.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="bg-primary-gradient-dark p-6 rounded-xl border border-gray-800 hover:border-secondary/50 transition-all duration-300"
            >
              <div className="bg-secondary/10 p-3 rounded-lg w-fit mb-4 text-secondary">
                {capability.icon}
              </div>
              <h3 className="text-xl font-bold text-text-default mb-2 font-sora">
                {capability.title}
              </h3>
              <p className="text-text-light text-sm">
                {capability.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyCapabilities; 