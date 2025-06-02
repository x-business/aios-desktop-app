"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { 
  FiHome, FiSettings, FiUser, FiDownload, FiCommand, FiCpu, 
  FiDatabase, FiActivity, FiFilter, FiPlusCircle, FiTrash2,
  FiUpload, FiDownloadCloud, FiSearch, FiRefreshCw, FiCalendar
} from "react-icons/fi";
import { motion } from "framer-motion";

interface DataSource {
  id: string;
  name: string;
  type: "Document" | "Vector" | "Image" | "Audio" | "Video" | "Custom";
  size: string;
  items: number;
  lastUpdated: string;
  status: "Active" | "Processing" | "Error";
  description: string;
}

export default function Data() {
  const router = useRouter();
  const [userName, setUserName] = useState("John Doe");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Document" | "Vector" | "Image" | "Audio" | "Video" | "Custom">("All");
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [totalStorage, setTotalStorage] = useState({ used: "2.7 GB", total: "10 GB", percentage: 27 });

  // Load user data and data sources
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserName("John Doe");
      setDataSources([
        {
          id: "docs-1",
          name: "Project Documentation",
          type: "Document",
          size: "450 MB",
          items: 78,
          lastUpdated: "2 hours ago",
          status: "Active",
          description: "Contains project specifications, requirements, and design documents."
        },
        {
          id: "images-1",
          name: "Product Images",
          type: "Image",
          size: "1.2 GB",
          items: 324,
          lastUpdated: "Yesterday",
          status: "Active",
          description: "High-resolution product photos for marketing materials."
        },
        {
          id: "vectors-1",
          name: "Semantic Search Embeddings",
          type: "Vector",
          size: "320 MB",
          items: 15420,
          lastUpdated: "3 days ago",
          status: "Active",
          description: "Vector embeddings for semantic search of knowledge base."
        },
        {
          id: "audio-1",
          name: "Meeting Recordings",
          type: "Audio",
          size: "750 MB",
          items: 12,
          lastUpdated: "1 week ago",
          status: "Active",
          description: "Recorded team meetings with transcriptions."
        },
        {
          id: "custom-1",
          name: "Customer Database",
          type: "Custom",
          size: "120 MB",
          items: 5230,
          lastUpdated: "5 days ago",
          status: "Active",
          description: "Structured customer data with purchase history and preferences."
        },
        {
          id: "video-1",
          name: "Training Videos",
          type: "Video",
          size: "1.8 GB",
          items: 8,
          lastUpdated: "2 weeks ago",
          status: "Processing",
          description: "Educational content for product training and onboarding."
        },
      ]);
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Filter data sources based on search and type filter
  const filteredDataSources = dataSources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          source.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || source.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Get icon based on data source type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Document": return <FiDatabase className="h-5 w-5 text-blue-400" />;
      case "Vector": return <FiActivity className="h-5 w-5 text-purple-400" />;
      case "Image": return <FiCommand className="h-5 w-5 text-green-400" />;
      case "Audio": return <FiCommand className="h-5 w-5 text-yellow-400" />;
      case "Video": return <FiCommand className="h-5 w-5 text-red-400" />;
      default: return <FiDatabase className="h-5 w-5 text-gray-400" />;
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
                  <Link href="/dashboard/mcps" className="flex items-center text-text-light hover:text-secondary hover:bg-secondary/5 px-3 py-2 rounded-md">
                    <FiCommand className="mr-3 h-4 w-4" />
                    <span className="text-sm">MCPs</span>
                  </Link>
                  <Link href="/dashboard/data" className="flex items-center text-secondary bg-secondary/10 px-3 py-2 rounded-md">
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
                    <p className="text-text-light">Loading data sources...</p>
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
                        <h1 className="text-2xl font-bold text-text-default font-sora">Data Management</h1>
                        <p className="text-text-light mt-1">Manage data sources for your AI to access and learn from</p>
                      </div>
                      <div className="mt-4 md:mt-0 space-x-2">
                        <button 
                          className="btn-primary"
                          onClick={() => setShowUploadModal(true)}
                        >
                          <FiUpload className="inline-block mr-1" /> Add Data Source
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-grow relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light" />
                        <input
                          type="text"
                          placeholder="Search data sources..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-primary-dark/50 border border-gray-800 rounded-md pl-10 pr-4 py-2 text-text-default focus:border-secondary focus:outline-none"
                        />
                      </div>
                      <div className="relative">
                        <button 
                          className="btn-secondary flex items-center"
                          onClick={() => {
                            const types: Array<"All" | "Document" | "Vector" | "Image" | "Audio" | "Video" | "Custom"> = 
                              ["All", "Document", "Vector", "Image", "Audio", "Video", "Custom"];
                            const currentIndex = types.indexOf(filterType);
                            const nextIndex = (currentIndex + 1) % types.length;
                            setFilterType(types[nextIndex]);
                          }}
                        >
                          <FiFilter className="mr-2" /> {filterType}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Storage usage */}
                  <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <h2 className="text-xl font-bold text-text-default font-sora">Storage Usage</h2>
                      <div className="flex items-center mt-2 md:mt-0">
                        <span className="text-text-light text-sm mr-2">Last updated: 5 minutes ago</span>
                        <button className="text-secondary hover:text-secondary/80">
                          <FiRefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-grow">
                        <div className="mb-2 flex justify-between">
                          <span className="text-text-light text-sm">{totalStorage.used} used of {totalStorage.total}</span>
                          <span className="text-text-light text-sm">{totalStorage.percentage}%</span>
                        </div>
                        <div className="w-full bg-primary-dark/60 rounded-full h-2.5">
                          <div 
                            className="bg-secondary h-2.5 rounded-full" 
                            style={{ width: `${totalStorage.percentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          <div className="bg-primary-dark/40 p-3 rounded-lg text-center">
                            <div className="text-blue-400 mb-1 font-medium text-sm">Documents</div>
                            <div className="text-text-default">570 MB</div>
                          </div>
                          <div className="bg-primary-dark/40 p-3 rounded-lg text-center">
                            <div className="text-green-400 mb-1 font-medium text-sm">Images</div>
                            <div className="text-text-default">1.2 GB</div>
                          </div>
                          <div className="bg-primary-dark/40 p-3 rounded-lg text-center">
                            <div className="text-purple-400 mb-1 font-medium text-sm">Vectors</div>
                            <div className="text-text-default">320 MB</div>
                          </div>
                          <div className="bg-primary-dark/40 p-3 rounded-lg text-center">
                            <div className="text-yellow-400 mb-1 font-medium text-sm">Audio</div>
                            <div className="text-text-default">750 MB</div>
                          </div>
                          <div className="bg-primary-dark/40 p-3 rounded-lg text-center">
                            <div className="text-red-400 mb-1 font-medium text-sm">Video</div>
                            <div className="text-text-default">1.8 GB</div>
                          </div>
                          <div className="bg-primary-dark/40 p-3 rounded-lg text-center">
                            <div className="text-gray-400 mb-1 font-medium text-sm">Other</div>
                            <div className="text-text-default">120 MB</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center space-y-2">
                        <button className="btn-secondary flex items-center text-sm w-full">
                          <FiDownloadCloud className="mr-2 h-4 w-4" /> Export All Data
                        </button>
                        <button className="text-red-400 text-sm hover:text-red-300 bg-red-400/5 hover:bg-red-400/10 px-3 py-2 rounded-md flex items-center w-full">
                          <FiTrash2 className="mr-2 h-4 w-4" /> Clear Unused Data
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Data sources list */}
                  <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-800">
                      <h2 className="text-xl font-bold text-text-default font-sora">Data Sources</h2>
                      <p className="text-text-light text-sm mt-1">
                        {filteredDataSources.length} {filteredDataSources.length === 1 ? "source" : "sources"} available
                      </p>
                    </div>
                    
                    {filteredDataSources.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-primary-dark/60 text-text-light text-xs">
                            <tr>
                              <th className="px-6 py-3 font-medium">Name</th>
                              <th className="px-6 py-3 font-medium">Type</th>
                              <th className="px-6 py-3 font-medium">Size</th>
                              <th className="px-6 py-3 font-medium">Items</th>
                              <th className="px-6 py-3 font-medium">Last Updated</th>
                              <th className="px-6 py-3 font-medium">Status</th>
                              <th className="px-6 py-3 font-medium sr-only">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {filteredDataSources.map((source) => (
                              <tr 
                                key={source.id} 
                                className="hover:bg-primary-dark/20 transition-colors"
                                onClick={() => router.push(`/dashboard/data/${source.id}`)}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    <div className="bg-primary-dark/50 p-2 rounded-md mr-3">
                                      {getTypeIcon(source.type)}
                                    </div>
                                    <div>
                                      <div className="font-medium text-text-default">{source.name}</div>
                                      <div className="text-xs text-text-light mt-0.5 max-w-xs truncate">{source.description}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-text-light">{source.type}</td>
                                <td className="px-6 py-4 text-text-light">{source.size}</td>
                                <td className="px-6 py-4 text-text-light">{source.items.toLocaleString()}</td>
                                <td className="px-6 py-4 text-text-light">
                                  <div className="flex items-center">
                                    <FiCalendar className="h-3 w-3 mr-1.5 text-gray-500" />
                                    <span>{source.lastUpdated}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    source.status === 'Active' 
                                      ? 'bg-green-500/10 text-green-400' 
                                      : source.status === 'Processing'
                                      ? 'bg-yellow-500/10 text-yellow-400'
                                      : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {source.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button className="text-secondary hover:text-secondary/80 mr-2">
                                    <FiDownload className="h-4 w-4" />
                                  </button>
                                  <button className="text-red-400 hover:text-red-300">
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-text-light">No data sources found matching your criteria.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload modal */}
                  {showUploadModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6 max-w-lg w-full"
                      >
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-text-default">Add New Data Source</h3>
                          <button 
                            className="text-text-light hover:text-text-default"
                            onClick={() => setShowUploadModal(false)}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <form className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-text-light mb-1">
                              Source Name
                            </label>
                            <input
                              type="text"
                              className="w-full bg-primary-dark/50 border border-gray-800 rounded-md px-4 py-2 text-text-default focus:border-secondary focus:outline-none"
                              placeholder="My Data Source"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-text-light mb-1">
                              Source Type
                            </label>
                            <select className="w-full bg-primary-dark/50 border border-gray-800 rounded-md px-4 py-2 text-text-default focus:border-secondary focus:outline-none">
                              <option>Document</option>
                              <option>Vector</option>
                              <option>Image</option>
                              <option>Audio</option>
                              <option>Video</option>
                              <option>Custom</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-text-light mb-1">
                              Description
                            </label>
                            <textarea
                              className="w-full bg-primary-dark/50 border border-gray-800 rounded-md px-4 py-2 text-text-default focus:border-secondary focus:outline-none h-20"
                              placeholder="Enter a description..."
                            ></textarea>
                          </div>
                          
                          <div className="border-2 border-dashed border-gray-800 rounded-lg p-8 text-center">
                            <FiUpload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-text-light mb-2">Drag and drop files here, or click to browse</p>
                            <p className="text-xs text-gray-500">Supported formats: PDF, TXT, DOC, DOCX, JPG, PNG, MP3, MP4, CSV, JSON</p>
                            <input type="file" className="hidden" multiple />
                            <button className="btn-secondary mt-4 text-sm">
                              Select Files
                            </button>
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                            <button 
                              type="button"
                              className="btn-secondary"
                              onClick={() => setShowUploadModal(false)}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              className="btn-primary"
                            >
                              Upload & Process
                            </button>
                          </div>
                        </form>
                      </motion.div>
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