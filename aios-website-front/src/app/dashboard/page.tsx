"use client";

import {  useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { FiCpu, FiCommand, FiActivity, FiPlusCircle, FiBox, FiDatabase, FiZap, FiCheckCircle } from "react-icons/fi";
import Link from "next/link";

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
      details: `Generated ${Math.floor(Math.random() * 500) + 100} tokens`
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
      details: `Connected to ${user?.email || 'your account'}`
    });

    setActionMessage(`Successfully connected to ${mcpName}!`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Simulate data access
  const simulateDataAccess = (dataSource: string) => {
    addActivity({
      type: "data_access",
      description: `Accessed ${dataSource} data source`,
      details: `Retrieved data for analysis`
    });

    setActionMessage(`Successfully accessed ${dataSource}!`);
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
                This is your personal AIOS dashboard. You are currently on the {user?.plan} plan.
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
                  onClick={() => router.push('/dashboard/activity')}
                  className="flex items-center p-4 transition-all border border-gray-700 bg-primary-dark/70 hover:bg-primary-dark/90 rounded-xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-secondary/20 text-secondary">
                    <FiActivity className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-text-default">View Activity</div>
                    <div className="text-xs text-text-light">See your recent actions</div>
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
                    <div className="font-medium text-text-default">Use GPT-4</div>
                    <div className="text-xs text-text-light">Simulate model usage</div>
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
                    <div className="font-medium text-text-default">Connect MCP</div>
                    <div className="text-xs text-text-light">Add Google Workspace</div>
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
                    <div className="font-medium text-text-default">Access Data</div>
                    <div className="text-xs text-text-light">Document Library</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 border border-gray-800 bg-primary-gradient-dark rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-default font-sora">
                  Recent Activity
                </h2>
                <Link href="/dashboard/activity" className="text-sm text-secondary hover:underline">
                  View All
                </Link>
              </div>
              
              <div className="space-y-3">
                {user?.activities?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="p-3 border border-gray-800 rounded-lg bg-primary-dark/50">
                    <div className="flex items-start">
                      <div className="flex items-center justify-center w-8 h-8 mt-1 mr-3 rounded-full bg-secondary/10 text-secondary">
                        {activity.type === "login" && <FiZap className="w-4 h-4" />}
                        {activity.type === "model_usage" && <FiCpu className="w-4 h-4" />}
                        {activity.type === "mcp_usage" && <FiCommand className="w-4 h-4" />}
                        {activity.type === "data_access" && <FiDatabase className="w-4 h-4" />}
                        {activity.type === "settings_change" && <FiBox className="w-4 h-4" />}
                        {activity.type === "system" && <FiPlusCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-text-default">{activity.description}</div>
                        <div className="mt-1 text-xs text-text-light">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                        {activity.details && (
                          <div className="mt-1 text-xs text-text-light">{activity.details}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!user?.activities || user.activities.length === 0) && (
                  <div className="py-6 text-center text-text-light">
                    No activity recorded yet. Start using AIOS to see your activity here.
                  </div>
                )}
              </div>
            </div>

            {/* Dashboard Navigation */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Link href="/dashboard/models" className="p-6 transition-colors border border-gray-800 bg-primary-gradient-dark rounded-xl hover:border-secondary/30">
                <div className="flex items-center justify-center w-12 h-12 mb-4 text-purple-400 rounded-full bg-purple-500/20">
                  <FiCpu className="w-6 h-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-text-default font-sora">AI Models</h3>
                <p className="text-sm text-text-light">
                  Configure and manage your AI model connections and preferences.
                </p>
              </Link>
              
              <Link href="/dashboard/mcps" className="p-6 transition-colors border border-gray-800 bg-primary-gradient-dark rounded-xl hover:border-secondary/30">
                <div className="flex items-center justify-center w-12 h-12 mb-4 text-green-400 rounded-full bg-green-500/20">
                  <FiCommand className="w-6 h-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-text-default font-sora">MCPs</h3>
                <p className="text-sm text-text-light">
                  Manage your Model Context Protocols and integrations.
                </p>
              </Link>
              
              <Link href="/dashboard/data" className="p-6 transition-colors border border-gray-800 bg-primary-gradient-dark rounded-xl hover:border-secondary/30">
                <div className="flex items-center justify-center w-12 h-12 mb-4 text-yellow-400 rounded-full bg-yellow-500/20">
                  <FiDatabase className="w-6 h-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-text-default font-sora">Data Sources</h3>
                <p className="text-sm text-text-light">
                  Connect and manage your data sources for AI processing.
                </p>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
} 