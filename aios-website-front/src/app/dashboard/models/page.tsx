"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { FiHome, FiSettings, FiUser, FiDownload, FiCommand, FiCpu, FiDatabase, FiActivity, FiFilter, FiPlusCircle } from "react-icons/fi";
import { motion } from "framer-motion";

interface Model {
  id: string;
  name: string;
  provider: string;
  status: "Active" | "Available";
  type: string;
  tokenUsage: number;
  lastUsed: string;
  description: string;
}

export default function Models() {
  const router = useRouter();
  const [userName, setUserName] = useState("John Doe");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Available">("All");
  const [models, setModels] = useState<Model[]>([]);

  // Load user data and models
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserName("John Doe");
      setModels([
        {
          id: "gpt4",
          name: "GPT-4",
          provider: "OpenAI",
          status: "Active",
          type: "Large Language Model",
          tokenUsage: 12421,
          lastUsed: "2 mins ago",
          description: "Advanced reasoning capabilities with strong general knowledge and problem-solving abilities."
        },
        {
          id: "claude37",
          name: "Claude-3.7-sonnet",
          provider: "Anthropic",
          status: "Active",
          type: "Large Language Model",
          tokenUsage: 8754,
          lastUsed: "15 mins ago",
          description: "Advanced reasoning with exceptional instruction-following and nuanced understanding."
        },
        {
          id: "gemini25",
          name: "Gemini-2.5-Pro",
          provider: "Google",
          status: "Available",
          type: "Multimodal Model",
          tokenUsage: 0,
          lastUsed: "Never",
          description: "Google's multimodal model with strong capabilities across text, code, and reasoning tasks."
        },
        {
          id: "gpt4turbo",
          name: "GPT-4 Turbo",
          provider: "OpenAI",
          status: "Available",
          type: "Large Language Model",
          tokenUsage: 4325,
          lastUsed: "2 days ago",
          description: "Faster version of GPT-4 with improved context handling and more current knowledge."
        },
        {
          id: "o3",
          name: "o3",
          provider: "Open Source",
          status: "Available",
          type: "Large Language Model",
          tokenUsage: 0,
          lastUsed: "Never",
          description: "Pioneering open model with a balanced mix of efficiency and performance."
        },
        {
          id: "o4mini",
          name: "o4-Mini",
          provider: "Open Source",
          status: "Available",
          type: "Large Language Model",
          tokenUsage: 0,
          lastUsed: "Never",
          description: "Lightweight, efficient open model delivering impressive capabilities."
        },
      ]);
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Filter models based on search and status filter
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          model.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || model.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <section className="py-8">
        <div className="container-fluid">
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <div className="col-span-12 md:col-span-3 lg:col-span-2">
              <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-4 sticky top-24">
                <div className="flex items-center mb-6 p-2">
                  <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mr-3">
                    <FiUser className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-text-default">{userName}</div>
                    <div className="text-xs text-text-light">Pro User</div>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  <Link href="/dashboard" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiHome className="mr-3 h-4 w-4" />
                    <span className="text-sm">Dashboard</span>
                  </Link>
                  <Link href="/dashboard/models" className="flex items-center text-secondary bg-secondary/10 px-3 py-2 rounded-md">
                    <FiCpu className="mr-3 h-4 w-4" />
                    <span className="text-sm">Models</span>
                  </Link>
                  <Link href="/dashboard/mcps" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiCommand className="mr-3 h-4 w-4" />
                    <span className="text-sm">MCPs</span>
                  </Link>
                  <Link href="/dashboard/data" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiDatabase className="mr-3 h-4 w-4" />
                    <span className="text-sm">Data</span>
                  </Link>
                  <Link href="/dashboard/activity" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiActivity className="mr-3 h-4 w-4" />
                    <span className="text-sm">Activity</span>
                  </Link>
                  <Link href="/dashboard/settings" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiSettings className="mr-3 h-4 w-4" />
                    <span className="text-sm">Settings</span>
                  </Link>
                </nav>
                
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <Link href="/download" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiDownload className="mr-3 h-4 w-4" />
                    <span className="text-sm">Download Desktop App</span>
                  </Link>
                  <button 
                    onClick={() => router.push('/')}
                    className="w-full flex items-center text-red-400 hover:text-red-300 hover:bg-red-400/5 px-3 py-2 rounded-md mt-2"
                  >
                    <svg className="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="col-span-12 md:col-span-9 lg:col-span-10">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-text-light">Loading models...</p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Header and search */}
                  <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                      <div>
                        <h1 className="text-2xl font-bold text-text-default font-sora">AI Models</h1>
                        <p className="text-text-light mt-1">View and manage your AI model connections</p>
                      </div>
                      <div className="mt-4 md:mt-0 space-x-2">
                        <button className="btn-secondary">
                          <FiPlusCircle className="inline-block mr-1" /> Add New Model
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-grow">
                        <input
                          type="text"
                          placeholder="Search models..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-primary-dark/50 border border-gray-800 rounded-md px-4 py-2 text-text-default focus:border-secondary focus:outline-none"
                        />
                      </div>
                      <div className="relative">
                        <button 
                          className="btn-secondary flex items-center"
                          onClick={() => setFilterStatus(status => status === "All" ? "Active" : status === "Active" ? "Available" : "All")}
                        >
                          <FiFilter className="mr-2" /> {filterStatus}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Models list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredModels.map((model) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center">
                              <div className={`h-2 w-2 rounded-full ${model.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'} mr-2`}></div>
                              <h3 className="text-xl font-bold text-text-default">{model.name}</h3>
                            </div>
                            <div className="text-sm text-text-light mt-1">{model.provider}</div>
                          </div>
                          <div className="flex items-center">
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                              {model.status}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-text-light mb-4">
                          {model.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-text-light">Type</div>
                            <div className="text-sm text-text-default">{model.type}</div>
                          </div>
                          <div>
                            <div className="text-xs text-text-light">Last Used</div>
                            <div className="text-sm text-text-default">{model.lastUsed}</div>
                          </div>
                          <div>
                            <div className="text-xs text-text-light">Token Usage</div>
                            <div className="text-sm text-text-default">{model.tokenUsage.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <button 
                            className="text-text-light text-sm hover:text-secondary"
                            onClick={() => router.push(`/dashboard/models/${model.id}`)}
                          >
                            View Details
                          </button>
                          
                          {model.status === "Active" ? (
                            <button className="text-red-400 text-sm hover:text-red-300">
                              Disable
                            </button>
                          ) : (
                            <button className="text-green-400 text-sm hover:text-green-300">
                              Enable
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {filteredModels.length === 0 && (
                    <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6 text-center">
                      <p className="text-text-light">No models found matching your criteria.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 