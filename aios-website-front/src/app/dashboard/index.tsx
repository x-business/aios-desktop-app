"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiCpu,
  FiCommand,
  FiActivity,
  FiPlusCircle,
  FiBox,
  FiDatabase,
  FiZap,
  FiCheckCircle,
} from "react-icons/fi";

export default function Dashboard() {
  const router = useRouter();
  const { user, addActivity } = useAuth();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Simulate using a model
  const simulateModelUsage = (modelName: string) => {
    addActivity({
      type: "model_usage",
      description: `Used ${modelName} model for text generation`,
      model: modelName,
      details: `Generated ${Math.floor(Math.random() * 500) + 100} tokens`,
    });

    setActionMessage(`Successfully used ${modelName}!`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Simulate connecting an MCP
  const simulateConnectMCP = (mcpName: string) => {
    addActivity({
      type: "mcp_usage",
      description: `Connected ${mcpName} MCP`,
      mcp: mcpName,
      details: `Connected to ${user?.email || "your account"}`,
    });

    setActionMessage(`Successfully connected to ${mcpName}!`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Simulate data access
  const simulateDataAccess = (dataSource: string) => {
    addActivity({
      type: "data_access",
      description: `Accessed ${dataSource} data source`,
      details: `Retrieved data for analysis`,
    });

    setActionMessage(`Successfully accessed ${dataSource}!`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Simulate settings change
  const simulateSettingsChange = () => {
    addActivity({
      type: "settings_change",
      description: "Updated profile settings",
      details: "Changed notification preferences",
    });

    setActionMessage("Settings updated successfully!");
    setTimeout(() => setActionMessage(null), 3000);
  };

  return (
    <Layout>
      <section className="py-8">
        <div className="container-fluid">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Welcome Message */}
            <div className="p-6 border border-gray-800 bg-primary-gradient-dark rounded-xl">
              <h1 className="text-2xl font-bold text-text-default font-sora">
                Welcome, {user?.name}!
              </h1>
              <p className="mt-2 text-text-light">
                This is your personal AIOS dashboard. You are currently on the{" "}
                {user?.plan} plan.
              </p>

              {actionMessage && (
                <div className="flex items-center p-3 mt-4 text-green-400 border rounded-md bg-green-500/10 border-green-500/30">
                  <FiCheckCircle className="mr-2" />
                  {actionMessage}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-6 border border-gray-800 bg-primary-gradient-dark rounded-xl">
              <h2 className="mb-4 text-lg font-bold text-text-default font-sora">
                Quick Actions
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={() => router.push("/dashboard/activity")}
                  className="flex items-center p-4 transition-all border border-gray-700 bg-primary-dark/70 hover:bg-primary-dark/90 rounded-xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-secondary/20 text-secondary">
                    <FiActivity className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-text-default">
                      View Activity
                    </div>
                    <div className="text-xs text-text-light">
                      See your recent actions
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => simulateModelUsage("GPT-4")}
                  className="flex items-center p-4 transition-all border border-gray-700 bg-primary-dark/70 hover:bg-primary-dark/90 rounded-xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 mr-3 text-purple-400 rounded-full bg-purple-500/20">
                    <FiCpu className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-text-default">
                      Use GPT-4
                    </div>
                    <div className="text-xs text-text-light">
                      Simulate model usage
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => simulateConnectMCP("Google Workspace")}
                  className="flex items-center p-4 transition-all border border-gray-700 bg-primary-dark/70 hover:bg-primary-dark/90 rounded-xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 mr-3 text-green-400 rounded-full bg-green-500/20">
                    <FiCommand className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-text-default">
                      Connect MCP
                    </div>
                    <div className="text-xs text-text-light">
                      Add Google Workspace
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => simulateDataAccess("Document Library")}
                  className="flex items-center p-4 transition-all border border-gray-700 bg-primary-dark/70 hover:bg-primary-dark/90 rounded-xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 mr-3 text-yellow-400 rounded-full bg-yellow-500/20">
                    <FiDatabase className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-text-default">
                      Access Data
                    </div>
                    <div className="text-xs text-text-light">
                      Document Library
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Additional Quick Actions */}
            <div className="p-6 border border-gray-800 bg-primary-gradient-dark rounded-xl">
              <h2 className="mb-4 text-lg font-bold text-text-default font-sora">
                More Actions
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={() => simulateModelUsage("Claude-3.7-sonnet")}
                  className="flex items-center p-4 transition-all border border-gray-700 bg-primary-dark/70 hover:bg-primary-dark/90 rounded-xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 mr-3 text-blue-400 rounded-full bg-blue-500/20">
                    <FiZap className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-text-default">
                      Use Claude
                    </div>
                    <div className="text-xs text-text-light">
                      Simulate Claude usage
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => simulateConnectMCP("Filesystem Access")}
                  className="flex items-center p-4 transition-all border border-gray-700 bg-primary-dark/70 hover:bg-primary-dark/90 rounded-xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 mr-3 text-orange-400 rounded-full bg-orange-500/20">
                    <FiBox className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-text-default">
                      Connect MCP
                    </div>
                    <div className="text-xs text-text-light">
                      Filesystem Access
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => simulateSettingsChange()}
                  className="flex items-center p-4 transition-all border border-gray-700 bg-primary-dark/70 hover:bg-primary-dark/90 rounded-xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 mr-3 text-pink-400 rounded-full bg-pink-500/20">
                    <FiPlusCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-text-default">
                      Update Settings
                    </div>
                    <div className="text-xs text-text-light">
                      Change preferences
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
