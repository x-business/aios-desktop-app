"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { FiHome, FiSettings, FiUser, FiDownload, FiCommand, FiCpu, FiDatabase, FiActivity, FiFilter, FiPlusCircle, FiInfo, FiExternalLink } from "react-icons/fi";
import { motion } from "framer-motion";

interface MCP {
  id: string;
  name: string;
  type: string;
  status: "Active" | "Inactive";
  description: string;
  permissions: string[];
  lastUsed: string;
  version: string;
}

export default function MCPs() {
  const router = useRouter();
  const [userName, setUserName] = useState("John Doe");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [mcps, setMcps] = useState<MCP[]>([]);

  // Load user data and MCPs
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserName("John Doe");
      setMcps([
        {
          id: "filesystem",
          name: "Filesystem Access",
          type: "Local",
          status: "Active",
          description: "Access and manage local files and directories with secure access controls.",
          permissions: ["Read files", "Write files", "List directories"],
          lastUsed: "5 mins ago",
          version: "1.2.0"
        },
        {
          id: "gws",
          name: "Google Workspace",
          type: "Cloud",
          status: "Active",
          description: "Connect to Gmail, Google Calendar, and other Google Workspace applications.",
          permissions: ["Read emails", "Send emails", "Manage calendar events"],
          lastUsed: "15 mins ago",
          version: "2.0.1"
        },
        {
          id: "cli",
          name: "Windows CLI",
          type: "System",
          status: "Active",
          description: "Execute terminal commands with controlled access to system resources.",
          permissions: ["Execute commands", "Access command history"],
          lastUsed: "1 hour ago",
          version: "1.1.3"
        },
        {
          id: "fetch",
          name: "Fetch",
          type: "Web",
          status: "Active",
          description: "Make HTTP requests to external APIs and web services with caching support.",
          permissions: ["Make GET requests", "Make POST requests", "Access cookies"],
          lastUsed: "3 hours ago",
          version: "1.3.0"
        },
        {
          id: "sequential",
          name: "Sequential Thinking",
          type: "Cognitive",
          status: "Inactive",
          description: "Enhance AI reasoning through structured, multi-step thinking processes.",
          permissions: ["Create thinking chains", "Access intermediate results"],
          lastUsed: "2 days ago",
          version: "0.9.5"
        },
        {
          id: "playwright",
          name: "Playwright",
          type: "Automation",
          status: "Inactive",
          description: "Automate browser actions for web testing and data collection.",
          permissions: ["Control browser", "Access page content", "Submit forms"],
          lastUsed: "Never",
          version: "1.0.0"
        },
      ]);
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Filter MCPs based on search and status filter
  const filteredMcps = mcps.filter(mcp => {
    const matchesSearch = mcp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          mcp.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || mcp.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const toggleMcpStatus = (id: string) => {
    setMcps(prev => prev.map(mcp => 
      mcp.id === id 
        ? { ...mcp, status: mcp.status === 'Active' ? 'Inactive' : 'Active' } 
        : mcp
    ));
  };

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
                  <Link href="/dashboard/models" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiCpu className="mr-3 h-4 w-4" />
                    <span className="text-sm">Models</span>
                  </Link>
                  <Link href="/dashboard/mcps" className="flex items-center text-secondary bg-secondary/10 px-3 py-2 rounded-md">
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
                    <p className="text-text-light">Loading MCPs...</p>
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
                        <h1 className="text-2xl font-bold text-text-default font-sora">Model Context Protocols</h1>
                        <p className="text-text-light mt-1">Manage your MCP extensions to connect with external systems</p>
                      </div>
                      <div className="mt-4 md:mt-0 space-x-2">
                        <Link href="/mcps" className="btn-secondary text-xs">
                          <FiInfo className="inline-block mr-1" /> Learn More
                        </Link>
                        <button className="btn-primary">
                          <FiPlusCircle className="inline-block mr-1" /> Install New MCP
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-grow">
                        <input
                          type="text"
                          placeholder="Search MCPs..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-primary-dark/50 border border-gray-800 rounded-md px-4 py-2 text-text-default focus:border-secondary focus:outline-none"
                        />
                      </div>
                      <div className="relative">
                        <button 
                          className="btn-secondary flex items-center"
                          onClick={() => setFilterStatus(status => status === "All" ? "Active" : status === "Active" ? "Inactive" : "All")}
                        >
                          <FiFilter className="mr-2" /> {filterStatus}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* What are MCPs? */}
                  <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6">
                    <div className="flex items-start">
                      <div className="bg-secondary/20 p-3 rounded-lg mr-4">
                        <FiCommand className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-default">What are Model Context Protocols?</h3>
                        <p className="text-text-light mt-1">
                          MCPs are standardized connections that enable AI models to interact with external systems. 
                          They provide a secure interface for accessing data sources, executing actions, and enhancing AI capabilities.
                        </p>
                        <Link href="/mcps" className="text-secondary text-sm hover:underline mt-2 inline-block">
                          <span>Learn more about MCPs</span>
                          <FiExternalLink className="inline-block ml-1 h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* MCPs list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredMcps.map((mcp) => (
                      <motion.div
                        key={mcp.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center">
                              <div className={`h-2 w-2 rounded-full ${mcp.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'} mr-2`}></div>
                              <h3 className="text-xl font-bold text-text-default">{mcp.name}</h3>
                            </div>
                            <div className="text-sm text-text-light mt-1">v{mcp.version} • {mcp.type}</div>
                          </div>
                          <div className="flex items-center">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              mcp.status === 'Active' 
                                ? 'bg-secondary/10 text-secondary' 
                                : 'bg-gray-500/10 text-gray-400'
                            }`}>
                              {mcp.status}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-text-light mb-4">
                          {mcp.description}
                        </p>
                        
                        <div className="mb-4">
                          <div className="text-xs text-text-light mb-2">Permissions</div>
                          <div className="flex flex-wrap gap-2">
                            {mcp.permissions.map((permission, index) => (
                              <span key={index} className="bg-primary-dark/50 text-text-light text-xs px-2 py-1 rounded">
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-text-light">
                            Last used: {mcp.lastUsed}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <button 
                              className="text-text-light text-sm hover:text-secondary"
                              onClick={() => router.push(`/dashboard/mcps/${mcp.id}`)}
                            >
                              Configure
                            </button>
                            
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={mcp.status === 'Active'} 
                                onChange={() => toggleMcpStatus(mcp.id)}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-primary-dark/50 rounded-full peer peer-focus:ring-1 peer-focus:ring-secondary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary/30 peer-checked:after:bg-secondary"></div>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {filteredMcps.length === 0 && (
                    <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6 text-center">
                      <p className="text-text-light">No MCPs found matching your criteria.</p>
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