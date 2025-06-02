"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { FiHome, FiSettings, FiUser, FiDownload, FiCommand, FiCpu, FiDatabase, FiActivity, FiLock, FiCreditCard, FiBell } from "react-icons/fi";
import { motion } from "framer-motion";

export default function Settings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSuccessMessage("Profile updated successfully!");
    setIsLoading(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
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
                    <div className="font-medium text-text-default">{name}</div>
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
                  <Link href="/dashboard/settings" className="flex items-center text-secondary bg-secondary/10 px-3 py-2 rounded-md">
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6 mb-6">
                  <h1 className="text-2xl font-bold text-text-default font-sora mb-6">Settings</h1>
                  
                  {/* Tabs */}
                  <div className="flex border-b border-gray-800 mb-6 overflow-x-auto">
                    <button
                      onClick={() => setActiveTab("profile")}
                      className={`px-4 py-2 font-medium text-sm border-b-2 mr-4 -mb-px whitespace-nowrap ${
                        activeTab === "profile"
                          ? "border-secondary text-secondary"
                          : "border-transparent text-text-light hover:text-text-default"
                      }`}
                    >
                      <FiUser className="inline-block mr-2 h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab("security")}
                      className={`px-4 py-2 font-medium text-sm border-b-2 mr-4 -mb-px whitespace-nowrap ${
                        activeTab === "security"
                          ? "border-secondary text-secondary"
                          : "border-transparent text-text-light hover:text-text-default"
                      }`}
                    >
                      <FiLock className="inline-block mr-2 h-4 w-4" />
                      Security
                    </button>
                    <button
                      onClick={() => setActiveTab("notifications")}
                      className={`px-4 py-2 font-medium text-sm border-b-2 mr-4 -mb-px whitespace-nowrap ${
                        activeTab === "notifications"
                          ? "border-secondary text-secondary"
                          : "border-transparent text-text-light hover:text-text-default"
                      }`}
                    >
                      <FiBell className="inline-block mr-2 h-4 w-4" />
                      Notifications
                    </button>
                    <button
                      onClick={() => setActiveTab("billing")}
                      className={`px-4 py-2 font-medium text-sm border-b-2 mr-4 -mb-px whitespace-nowrap ${
                        activeTab === "billing"
                          ? "border-secondary text-secondary"
                          : "border-transparent text-text-light hover:text-text-default"
                      }`}
                    >
                      <FiCreditCard className="inline-block mr-2 h-4 w-4" />
                      Billing
                    </button>
                  </div>
                  
                  {/* Success message */}
                  {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-md mb-6">
                      {successMessage}
                    </div>
                  )}
                  
                  {/* Profile Tab */}
                  {activeTab === "profile" && (
                    <form onSubmit={handleSaveProfile}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-text-light mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-primary-dark/50 border border-gray-800 rounded-md p-3 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-text-light mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-primary-dark/50 border border-gray-800 rounded-md p-3 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="timezone" className="block text-sm font-medium text-text-light mb-2">
                            Timezone
                          </label>
                          <select
                            id="timezone"
                            className="w-full bg-primary-dark/50 border border-gray-800 rounded-md p-3 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                          >
                            <option>UTC (Coordinated Universal Time)</option>
                            <option>America/New_York (Eastern Time)</option>
                            <option>America/Chicago (Central Time)</option>
                            <option>America/Denver (Mountain Time)</option>
                            <option>America/Los_Angeles (Pacific Time)</option>
                            <option>Europe/London (GMT)</option>
                            <option>Europe/Paris (Central European Time)</option>
                            <option>Asia/Tokyo (Japan Standard Time)</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="language" className="block text-sm font-medium text-text-light mb-2">
                            Language
                          </label>
                          <select
                            id="language"
                            className="w-full bg-primary-dark/50 border border-gray-800 rounded-md p-3 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                          >
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                            <option>Japanese</option>
                            <option>Chinese (Simplified)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-6 border-t border-gray-800 pt-6">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="btn-primary px-6 py-3"
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  )}
                  
                  {/* Security Tab */}
                  {activeTab === "security" && (
                    <div>
                      <h2 className="text-xl font-semibold text-text-default mb-4">Change Password</h2>
                      <form className="grid grid-cols-1 gap-4 max-w-md">
                        <div>
                          <label htmlFor="current-password" className="block text-sm font-medium text-text-light mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            id="current-password"
                            className="w-full bg-primary-dark/50 border border-gray-800 rounded-md p-3 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="new-password" className="block text-sm font-medium text-text-light mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            id="new-password"
                            className="w-full bg-primary-dark/50 border border-gray-800 rounded-md p-3 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="confirm-password" className="block text-sm font-medium text-text-light mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirm-password"
                            className="w-full bg-primary-dark/50 border border-gray-800 rounded-md p-3 text-text-default focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                          />
                        </div>
                        
                        <div className="mt-2">
                          <button
                            type="submit"
                            className="btn-primary px-6 py-3"
                          >
                            Update Password
                          </button>
                        </div>
                      </form>
                      
                      <div className="mt-8 pt-8 border-t border-gray-800">
                        <h2 className="text-xl font-semibold text-text-default mb-4">Two-Factor Authentication</h2>
                        <p className="text-text-light mb-4">
                          Add an extra layer of security to your account by enabling two-factor authentication.
                        </p>
                        <button className="btn-secondary px-6 py-3">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-text-default mb-4">Email Notifications</h2>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-text-default">Updates and announcements</div>
                              <div className="text-sm text-text-light">Receive emails about new features and updates</div>
                            </div>
                            <div className="relative inline-block w-12 h-6 rounded-full bg-primary-dark/50 border border-gray-800">
                              <input type="checkbox" id="toggle-1" className="sr-only" defaultChecked />
                              <span className="absolute inset-y-1 left-1 w-4 h-4 rounded-full bg-secondary transform transition-transform duration-300 translate-x-6"></span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-text-default">Usage reports</div>
                              <div className="text-sm text-text-light">Receive weekly usage reports</div>
                            </div>
                            <div className="relative inline-block w-12 h-6 rounded-full bg-primary-dark/50 border border-gray-800">
                              <input type="checkbox" id="toggle-2" className="sr-only" />
                              <span className="absolute inset-y-1 left-1 w-4 h-4 rounded-full bg-gray-600 transform transition-transform duration-300"></span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-text-default">Security alerts</div>
                              <div className="text-sm text-text-light">Receive important security notifications</div>
                            </div>
                            <div className="relative inline-block w-12 h-6 rounded-full bg-primary-dark/50 border border-gray-800">
                              <input type="checkbox" id="toggle-3" className="sr-only" defaultChecked />
                              <span className="absolute inset-y-1 left-1 w-4 h-4 rounded-full bg-secondary transform transition-transform duration-300 translate-x-6"></span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-800 pt-6">
                        <h2 className="text-xl font-semibold text-text-default mb-4">In-App Notifications</h2>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-text-default">MCP status changes</div>
                              <div className="text-sm text-text-light">Notify when an MCP is enabled or disabled</div>
                            </div>
                            <div className="relative inline-block w-12 h-6 rounded-full bg-primary-dark/50 border border-gray-800">
                              <input type="checkbox" id="toggle-4" className="sr-only" defaultChecked />
                              <span className="absolute inset-y-1 left-1 w-4 h-4 rounded-full bg-secondary transform transition-transform duration-300 translate-x-6"></span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-text-default">New model availability</div>
                              <div className="text-sm text-text-light">Notify when new AI models are available</div>
                            </div>
                            <div className="relative inline-block w-12 h-6 rounded-full bg-primary-dark/50 border border-gray-800">
                              <input type="checkbox" id="toggle-5" className="sr-only" defaultChecked />
                              <span className="absolute inset-y-1 left-1 w-4 h-4 rounded-full bg-secondary transform transition-transform duration-300 translate-x-6"></span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-800 pt-6">
                        <button className="btn-primary px-6 py-3">
                          Save Preferences
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Billing Tab */}
                  {activeTab === "billing" && (
                    <div>
                      <div className="bg-primary-dark/40 rounded-lg p-6 border border-gray-800 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="inline-block bg-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-medium mb-2">
                              Pro Plan
                            </div>
                            <h2 className="text-xl font-semibold text-text-default">Your current plan</h2>
                            <p className="text-text-light">Next billing date: June 15, 2023</p>
                          </div>
                          <div className="mt-4 md:mt-0">
                            <button className="btn-secondary">
                              Manage Subscription
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-text-default mb-4">Payment Method</h2>
                      <div className="bg-primary-dark/40 rounded-lg p-4 border border-gray-800 flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="bg-blue-500/10 p-2 rounded-md mr-4">
                            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-text-default">Visa ending in 4242</div>
                            <div className="text-sm text-text-light">Expires 12/24</div>
                          </div>
                        </div>
                        <button className="text-secondary text-sm hover:underline">
                          Edit
                        </button>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-text-default mb-4">Billing History</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-gray-800">
                            <tr>
                              <th className="py-3 text-left text-sm font-medium text-text-light">Date</th>
                              <th className="py-3 text-left text-sm font-medium text-text-light">Description</th>
                              <th className="py-3 text-left text-sm font-medium text-text-light">Amount</th>
                              <th className="py-3 text-left text-sm font-medium text-text-light">Status</th>
                              <th className="py-3 text-left text-sm font-medium text-text-light">Invoice</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            <tr>
                              <td className="py-3 text-sm text-text-default">May 15, 2023</td>
                              <td className="py-3 text-sm text-text-default">Pro Plan Monthly</td>
                              <td className="py-3 text-sm text-text-default">$19.99</td>
                              <td className="py-3 text-sm text-green-400">Paid</td>
                              <td className="py-3 text-sm text-secondary hover:underline cursor-pointer">Download</td>
                            </tr>
                            <tr>
                              <td className="py-3 text-sm text-text-default">Apr 15, 2023</td>
                              <td className="py-3 text-sm text-text-default">Pro Plan Monthly</td>
                              <td className="py-3 text-sm text-text-default">$19.99</td>
                              <td className="py-3 text-sm text-green-400">Paid</td>
                              <td className="py-3 text-sm text-secondary hover:underline cursor-pointer">Download</td>
                            </tr>
                            <tr>
                              <td className="py-3 text-sm text-text-default">Mar 15, 2023</td>
                              <td className="py-3 text-sm text-text-default">Pro Plan Monthly</td>
                              <td className="py-3 text-sm text-text-default">$19.99</td>
                              <td className="py-3 text-sm text-green-400">Paid</td>
                              <td className="py-3 text-sm text-secondary hover:underline cursor-pointer">Download</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 