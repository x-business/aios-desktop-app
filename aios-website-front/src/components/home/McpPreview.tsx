"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiFolder, FiGlobe, FiCalendar, FiYoutube, FiDownload, FiCpu, FiTerminal } from "react-icons/fi";

const mcpData = [
  {
    name: "Filesystem Access",
    icon: <FiFolder className="h-5 w-5" />,
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    name: "Playwright",
    icon: <FiGlobe className="h-5 w-5" />,
    color: "bg-purple-500/20 text-purple-400",
  },
  {
    name: "Google Workspace",
    icon: <FiCalendar className="h-5 w-5" />,
    color: "bg-green-500/20 text-green-400",
  },
  {
    name: "YouTube Transcript",
    icon: <FiYoutube className="h-5 w-5" />,
    color: "bg-red-500/20 text-red-400",
  },
  {
    name: "Fetch",
    icon: <FiDownload className="h-5 w-5" />,
    color: "bg-yellow-500/20 text-yellow-400",
  },
  {
    name: "Sequential Thinking",
    icon: <FiCpu className="h-5 w-5" />,
    color: "bg-pink-500/20 text-pink-400",
  },
  {
    name: "Windows CLI",
    icon: <FiTerminal className="h-5 w-5" />,
    color: "bg-cyan-500/20 text-cyan-400",
  },
];

const McpPreview = () => {
  return (
    <section className="py-20 bg-primary-gradient-dark">
      <div className="container-fluid">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text-default mb-4 font-sora">
              Model Context Protocol (MCP)
            </h2>
            <p className="text-text-light mb-8">
              Standardized connections between AI models and various data sources or tools, enabling powerful real-world interactions. MCPs are the building blocks that allow your AI assistant to interact with the world around you.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {mcpData.map((mcp) => (
                <div
                  key={mcp.name}
                  className="flex items-center p-3 rounded-lg border border-gray-800 hover:border-secondary/50 transition-all duration-300"
                >
                  <div className={`p-2 rounded-md mr-3 ${mcp.color}`}>
                    {mcp.icon}
                  </div>
                  <span className="text-text-light text-sm">{mcp.name}</span>
                </div>
              ))}
            </div>

            <Link href="/mcps" className="btn-primary">
              Learn More
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* MCP Interface Mockup */}
            <div className="relative h-[400px] w-full rounded-xl overflow-hidden shadow-xl border border-gray-800 bg-primary-dark">
              {/* Interface header */}
              <div className="bg-primary-gradient-dark p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm font-medium text-secondary">AIOS Model Context Protocol</div>
                  <div className="text-xs text-gray-500">v2.0</div>
                </div>
              </div>

              {/* Interface content */}
              <div className="grid grid-cols-3 h-[calc(100%-48px)]">
                {/* Sidebar */}
                <div className="col-span-1 border-r border-gray-800 p-4">
                  <div className="text-xs uppercase text-gray-500 mb-3">Available MCPs</div>
                  {mcpData.map((mcp, index) => (
                    <div key={mcp.name} className={`flex items-center p-2 mb-2 rounded-md ${index === 0 ? 'bg-secondary/20 border border-secondary/30' : 'hover:bg-gray-800/50'} cursor-pointer`}>
                      <div className={`p-1.5 rounded-md mr-2 ${mcp.color}`}>
                        {mcp.icon}
                      </div>
                      <span className="text-xs">{mcp.name}</span>
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="col-span-2 p-4">
                  <div className="mb-4">
                    <div className="text-sm font-medium text-blue-400 mb-1">Filesystem Access</div>
                    <div className="text-xs text-gray-400 mb-3">Access and manipulate files on your system</div>
                    
                    <div className="bg-primary-gradient-dark p-3 rounded-md border border-gray-800 mb-4">
                      <code className="text-xs text-gray-300 block">
                        <span className="text-purple-400">aios</span> <span className="text-yellow-400">run</span> --mcp filesystem --action list --path "/documents"
                      </code>
                    </div>
                  </div>
                  
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-md p-3">
                    <div className="flex items-center mb-2">
                      <FiFolder className="text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-blue-400">Results</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-300">
                      <div className="flex items-center">
                        <FiFolder className="text-gray-400 mr-2 h-3 w-3" />
                        <span>projects/</span>
                      </div>
                      <div className="flex items-center">
                        <FiFolder className="text-gray-400 mr-2 h-3 w-3" />
                        <span>templates/</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 mr-2 inline-block">📄</span>
                        <span>report.docx</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 mr-2 inline-block">📄</span>
                        <span>presentation.pptx</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default McpPreview;