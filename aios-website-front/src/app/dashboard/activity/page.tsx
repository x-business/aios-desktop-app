"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { FiHome, FiSettings, FiUser, FiDownload, FiCommand, FiCpu, FiDatabase, FiActivity, FiCalendar, FiClock, FiFilter } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityItem {
  id: string;
  type: "login" | "model_usage" | "mcp_usage" | "data_access" | "settings_change" | "system";
  description: string;
  timestamp: string;
  details?: string;
  model?: string;
  mcp?: string;
}

export default function Activity() {
  const router = useRouter();
  const { user, logout, getUserActivities } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [filterType, setFilterType] = useState<"All" | "login" | "model_usage" | "mcp_usage" | "data_access" | "settings_change" | "system">("All");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("week");

  // Load user data and activity items
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get user activities from AuthContext
      const userActivities = getUserActivities();
      
      // If user has no activities yet, display an empty state by setting an empty array
      setActivityItems(userActivities);
      setIsLoading(false);
    };
    
    loadData();
  }, [getUserActivities]);

  // Filter activity items based on type and date range
  const filteredActivityItems = activityItems.filter(item => {
    // Filter by type
    const matchesType = filterType === "All" || item.type === filterType;
    
    // Filter by date range
    const itemDate = new Date(item.timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    let matchesDateRange = true;
    if (dateRange === "today") {
      matchesDateRange = itemDate >= today;
    } else if (dateRange === "week") {
      matchesDateRange = itemDate >= weekAgo;
    } else if (dateRange === "month") {
      matchesDateRange = itemDate >= monthAgo;
    }
    
    return matchesType && matchesDateRange;
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login": return <FiUser className="h-5 w-5 text-blue-400" />;
      case "model_usage": return <FiCpu className="h-5 w-5 text-purple-400" />;
      case "mcp_usage": return <FiCommand className="h-5 w-5 text-green-400" />;
      case "data_access": return <FiDatabase className="h-5 w-5 text-yellow-400" />;
      case "settings_change": return <FiSettings className="h-5 w-5 text-orange-400" />;
      default: return <FiActivity className="h-5 w-5 text-gray-400" />;
    }
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
                    <div className="font-medium text-text-default">{user?.name}</div>
                    <div className="text-xs text-text-light">{user?.plan} User</div>
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
                  <Link href="/dashboard/mcps" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiCommand className="mr-3 h-4 w-4" />
                    <span className="text-sm">MCPs</span>
                  </Link>
                  <Link href="/dashboard/data" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiDatabase className="mr-3 h-4 w-4" />
                    <span className="text-sm">Data</span>
                  </Link>
                  <Link href="/dashboard/activity" className="flex items-center text-secondary bg-secondary/10 px-3 py-2 rounded-md">
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
                    onClick={logout}
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
                    <p className="text-text-light">Loading activity history...</p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Header and filters */}
                  <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                      <div>
                        <h1 className="text-2xl font-bold text-text-default font-sora">Activity History</h1>
                        <p className="text-text-light mt-1">Track all interactions with your AIOS account</p>
                      </div>
                      <div className="mt-4 md:mt-0 space-x-2">
                        <button className="btn-secondary text-xs">
                          <FiCalendar className="inline-block mr-1" /> Export Activity
                        </button>
                      </div>
                    </div>
                    
                    {/* Most recent authentication */}
                    {filteredActivityItems.filter(item => item.type === "login").length > 0 && (
                      <div className="bg-secondary/5 rounded-md p-4 mb-6 border border-secondary/20">
                        <h3 className="text-text-default text-sm font-medium mb-2 flex items-center">
                          <FiUser className="h-4 w-4 text-secondary mr-2" /> Recent Authentication Activity
                        </h3>
                        {filteredActivityItems
                          .filter(item => item.type === "login")
                          .slice(0, 1)
                          .map(item => (
                            <div key={`recent-${item.id}`} className="text-sm text-text-light flex items-start">
                              <div className="h-2 w-2 rounded-full bg-green-400 mt-1.5 mr-2"></div>
                              <div>
                                {item.description} on {formatDate(item.timestamp)}
                                <div className="text-xs mt-0.5 text-text-light/80">{item.details}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative">
                        <button 
                          className="btn-secondary flex items-center"
                          onClick={() => {
                            const types: Array<"All" | "login" | "model_usage" | "mcp_usage" | "data_access" | "settings_change" | "system"> = 
                              ["All", "login", "model_usage", "mcp_usage", "data_access", "settings_change", "system"];
                            const currentIndex = types.indexOf(filterType);
                            const nextIndex = (currentIndex + 1) % types.length;
                            setFilterType(types[nextIndex]);
                          }}
                        >
                          <FiFilter className="mr-2" /> {filterType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                      </div>
                      
                      <div className="relative">
                        <button 
                          className="btn-secondary flex items-center"
                          onClick={() => {
                            const ranges: Array<"today" | "week" | "month" | "all"> = ["today", "week", "month", "all"];
                            const currentIndex = ranges.indexOf(dateRange);
                            const nextIndex = (currentIndex + 1) % ranges.length;
                            setDateRange(ranges[nextIndex]);
                          }}
                        >
                          <FiClock className="mr-2" /> 
                          {dateRange === "today" ? "Today" : 
                           dateRange === "week" ? "Past Week" : 
                           dateRange === "month" ? "Past Month" : 
                           "All Time"}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity timeline */}
                  <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6">
                    {filteredActivityItems.length > 0 ? (
                      <div className="space-y-4">
                        {filteredActivityItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="flex"
                          >
                            <div className="flex-shrink-0 mr-4">
                              <div className="bg-primary-dark/50 h-10 w-10 rounded-full flex items-center justify-center">
                                {getActivityIcon(item.type)}
                              </div>
                            </div>
                            <div className="flex-grow">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                                <div className="font-medium text-text-default">{item.description}</div>
                                <div className="text-sm text-text-light">{formatDate(item.timestamp)}</div>
                              </div>
                              <div className="text-sm text-text-light">{item.details}</div>
                              {(item.model || item.mcp) && (
                                <div className="mt-1">
                                  {item.model && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 mr-2">
                                      <FiCpu className="mr-1 h-3 w-3" /> {item.model}
                                    </span>
                                  )}
                                  {item.mcp && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                      <FiCommand className="mr-1 h-3 w-3" /> {item.mcp}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FiActivity className="h-16 w-16 text-gray-500 mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-medium text-text-default mb-2">No activity found</h3>
                        <p className="text-text-light max-w-md mx-auto">
                          {filterType !== "All" || dateRange !== "all" 
                            ? "No activity found for the selected filters. Try adjusting your filters to see more results."
                            : "Your activity history will appear here as you use AIOS. Start by exploring models, connecting MCPs, or using the platform features."}
                        </p>
                        {(filterType !== "All" || dateRange !== "all") && (
                          <button 
                            className="text-secondary text-sm hover:underline mt-4"
                            onClick={() => { setFilterType("All"); setDateRange("all"); }}
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 