import Layout from "@/components/Layout";
import Image from "next/image";
import Link from "next/link";
import { FiFolder, FiGlobe, FiCalendar, FiYoutube, FiDownload, FiCpu, FiTerminal, FiLock } from "react-icons/fi";

export default function MCPs() {
  // MCP data
  const mcps = [
    {
      id: "filesystem",
      name: "Filesystem Access",
      description: "Provides tools to interact with the local filesystem (read, write, list). Requires user configuration of allowed paths.",
      icon: <FiFolder className="h-8 w-8" />,
      color: "bg-blue-500/20 text-blue-400",
      benefits: [
        "Read and analyze documents on your local drive",
        "Organize files based on content or metadata",
        "Save generated content directly to your computer"
      ]
    },
    {
      id: "playwright",
      name: "Playwright",
      description: "Provides tools for browser automation, allowing AIOS to browse the web, extract information, and interact with web applications.",
      icon: <FiGlobe className="h-8 w-8" />,
      color: "bg-purple-500/20 text-purple-400",
      benefits: [
        "Research information across multiple websites",
        "Fill out online forms automatically",
        "Screenshot and save web content"
      ]
    },
    {
      id: "google-workspace",
      name: "Google Workspace",
      description: "Connects to Google Mail and Calendar accounts for email and schedule management with your AI assistant.",
      icon: <FiCalendar className="h-8 w-8" />,
      color: "bg-green-500/20 text-green-400",
      benefits: [
        "Draft and send emails with AI assistance",
        "Organize your calendar and create events",
        "Get smart reminders and notifications"
      ]
    },
    {
      id: "youtube-transcript",
      name: "YouTube Transcript",
      description: "Provides tools to get transcript of a YouTube video from its link for analysis and summarization.",
      icon: <FiYoutube className="h-8 w-8" />,
      color: "bg-red-500/20 text-red-400",
      benefits: [
        "Extract key points from long videos",
        "Search for specific information within videos",
        "Create notes from educational content"
      ]
    },
    {
      id: "fetch",
      name: "Fetch",
      description: "Provides tools to fetch web pages and data from APIs for real-time information retrieval.",
      icon: <FiDownload className="h-8 w-8" />,
      color: "bg-yellow-500/20 text-yellow-400",
      benefits: [
        "Get up-to-date information from the web",
        "Integrate with various APIs and services",
        "Download and process structured data"
      ]
    },
    {
      id: "sequential-thinking",
      name: "Sequential Thinking",
      description: "Provides tools for sequential thinking that improves problem-solving capabilities through step-by-step reasoning.",
      icon: <FiCpu className="h-8 w-8" />,
      color: "bg-pink-500/20 text-pink-400",
      benefits: [
        "Break down complex problems methodically",
        "Improve accuracy of AI reasoning",
        "Create detailed process documentation"
      ]
    },
    {
      id: "windows-cli",
      name: "Windows CLI",
      description: "Provides tools to interact with the Windows Command Line Interface for system management and automation.",
      icon: <FiTerminal className="h-8 w-8" />,
      color: "bg-cyan-500/20 text-cyan-400",
      benefits: [
        "Execute system commands with AI guidance",
        "Automate Windows tasks and maintenance",
        "Troubleshoot system issues faster"
      ]
    },
  ];

  return (
    <Layout>
      <section className="py-20">
        <div className="container-fluid">
          <h1 className="text-4xl md:text-5xl font-bold text-text-default mb-6 font-sora">
            Model Context Protocol (MCP)
          </h1>
          <p className="text-text-light text-xl mb-10 max-w-3xl">
            Expand your AI assistant's capabilities with standardized connections to data sources and services
          </p>
          
          {/* Explanation Section */}
          <div className="mb-20 bg-primary-gradient-dark p-8 rounded-xl border border-gray-800">
            <h2 className="text-2xl font-bold text-text-default mb-6 font-sora">
              What is an MCP?
            </h2>
            <p className="text-text-light mb-8">
              Model Context Protocols (MCPs) are standardized connections between AI models and various data sources or tools. They enable your AI assistant to interact with real-world systems, dramatically expanding what you can accomplish together. Each MCP provides a specific set of capabilities, from file access to web browsing, all managed with fine-grained security controls.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-primary-dark/50 p-6 rounded-lg border border-gray-800">
                <div className="text-secondary mb-3">
                  <FiGlobe className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-text-default mb-2 font-sora">
                  Expand AI Capabilities
                </h3>
                <p className="text-text-light text-sm">
                  MCPs bridge the gap between powerful language models and real-world systems, transforming AI from a conversational tool to an interactive assistant.
                </p>
              </div>
              <div className="bg-primary-dark/50 p-6 rounded-lg border border-gray-800">
                <div className="text-secondary mb-3">
                  <FiLock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-text-default mb-2 font-sora">
                  Built-in Security
                </h3>
                <p className="text-text-light text-sm">
                  Each MCP comes with granular permission controls, allowing you to specify exactly what your AI assistant can and cannot access.
                </p>
              </div>
              <div className="bg-primary-dark/50 p-6 rounded-lg border border-gray-800">
                <div className="text-secondary mb-3">
                  <FiCpu className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-text-default mb-2 font-sora">
                  Modular Design
                </h3>
                <p className="text-text-light text-sm">
                  Enable only the MCPs you need. Each protocol is independent, allowing you to customize your AI's capabilities for your specific requirements.
                </p>
              </div>
              <div className="bg-primary-dark/50 p-6 rounded-lg border border-gray-800">
                <div className="text-secondary mb-3">
                  <FiTerminal className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-text-default mb-2 font-sora">
                  Developer Extensible
                </h3>
                <p className="text-text-light text-sm">
                  Advanced users can create custom MCPs to integrate with additional services or internal systems using our developer framework.
                </p>
              </div>
            </div>
          </div>
          
          {/* MCP Directory */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-text-default mb-8 font-sora">
              MCP Directory
            </h2>
            
            <div className="space-y-6">
              {mcps.map((mcp) => (
                <div 
                  key={mcp.id}
                  className="border border-gray-800 rounded-xl bg-primary-gradient-dark p-6 hover:border-secondary/30 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center">
                    <div className={`${mcp.color} p-4 rounded-lg mr-6 mb-4 md:mb-0`}>
                      {mcp.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-text-default mb-2 font-sora">
                        {mcp.name}
                      </h3>
                      <p className="text-text-light mb-4">
                        {mcp.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {mcp.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-secondary mr-2">•</span>
                            <span className="text-text-light text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* MCP Management Section */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-3xl font-bold text-text-default mb-4 font-sora">
                  MCP Management
                </h2>
                <p className="text-text-light mb-4">
                  AIOS includes a comprehensive MCP Extension Management interface that gives you complete control over which capabilities are available to your AI assistant. Enable, disable, and configure MCPs with just a few clicks.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-secondary mr-2">•</span>
                    <span className="text-text-light">Toggle MCPs on/off as needed for different tasks</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-secondary mr-2">•</span>
                    <span className="text-text-light">Configure security permissions for each protocol</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-secondary mr-2">•</span>
                    <span className="text-text-light">Install new MCPs from our directory or third-party sources</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-secondary mr-2">•</span>
                    <span className="text-text-light">Review usage logs and security notifications</span>
                  </li>
                </ul>
              </div>
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
                    <div className="flex items-center p-2 mb-2 rounded-md bg-secondary/20 border border-secondary/30 cursor-pointer">
                      <div className="p-1.5 rounded-md mr-2 bg-blue-500/20 text-blue-400">
                        <FiFolder className="h-5 w-5" />
                      </div>
                      <span className="text-xs">Filesystem Access</span>
                    </div>
                    <div className="flex items-center p-2 mb-2 rounded-md hover:bg-gray-800/50 cursor-pointer">
                      <div className="p-1.5 rounded-md mr-2 bg-purple-500/20 text-purple-400">
                        <FiGlobe className="h-5 w-5" />
                      </div>
                      <span className="text-xs">Playwright</span>
                    </div>
                    <div className="flex items-center p-2 mb-2 rounded-md hover:bg-gray-800/50 cursor-pointer">
                      <div className="p-1.5 rounded-md mr-2 bg-green-500/20 text-green-400">
                        <FiCalendar className="h-5 w-5" />
                      </div>
                      <span className="text-xs">Google Workspace</span>
                    </div>
                    <div className="flex items-center p-2 mb-2 rounded-md hover:bg-gray-800/50 cursor-pointer">
                      <div className="p-1.5 rounded-md mr-2 bg-red-500/20 text-red-400">
                        <FiYoutube className="h-5 w-5" />
                      </div>
                      <span className="text-xs">YouTube Transcript</span>
                    </div>
                    <div className="flex items-center p-2 mb-2 rounded-md hover:bg-gray-800/50 cursor-pointer">
                      <div className="p-1.5 rounded-md mr-2 bg-pink-500/20 text-pink-400">
                        <FiCpu className="h-5 w-5" />
                      </div>
                      <span className="text-xs">Sequential Thinking</span>
                    </div>
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
            </div>
          </div>
          
          {/* How MCPs Work Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-text-default mb-4 font-sora">
              How MCPs Work
            </h2>
            <div className="w-full">
              <div className="flex flex-col md:flex-row items-center justify-between mb-4 relative">
                {/* AI Assistant Box */}
                <div className="w-full md:w-[30%] py-4 px-4 bg-primary-dark rounded-xl border border-gray-800 relative mb-4 md:mb-0 z-10">
                  <h3 className="text-lg font-medium text-text-default mb-2 font-sora text-center">AI Assistant</h3>
                  <p className="text-text-light text-center text-sm">
                    When you ask your AI to perform a task that requires real-world interaction, it identifies the appropriate MCPs needed.
                  </p>
                </div>
                
                {/* Arrow 1 */}
                <div className="hidden md:flex flex-col items-center justify-center md:w-[5%] z-20">
                  <div className="text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Mobile down arrow (shown only on mobile) */}
                <div className="md:hidden flex justify-center w-full mb-4">
                  <div className="text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  </div>
                </div>
                
                {/* MCP Controller Box */}
                <div className="w-full md:w-[30%] py-4 px-4 bg-primary-dark rounded-xl border border-gray-800 relative mb-4 md:mb-0 z-10">
                  <h3 className="text-lg font-medium text-text-default mb-2 font-sora text-center">MCP Controller</h3>
                  <p className="text-text-light text-center text-sm">
                    The MCP Controller validates permissions, executes the requested actions, and enforces security boundaries.
                  </p>
                </div>
                
                {/* Arrow 2 */}
                <div className="hidden md:flex flex-col items-center justify-center md:w-[5%] z-20">
                  <div className="text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Mobile down arrow (shown only on mobile) */}
                <div className="md:hidden flex justify-center w-full mb-4">
                  <div className="text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  </div>
                </div>
                
                {/* External Services Box */}
                <div className="w-full md:w-[30%] py-4 px-4 bg-primary-dark rounded-xl border border-gray-800 relative z-10">
                  <h3 className="text-lg font-medium text-text-default mb-2 font-sora text-center">External Services</h3>
                  <p className="text-text-light text-center text-sm">
                    The appropriate services are accessed (files, browsers, APIs), actions are performed, and results are returned to your AI assistant.
                  </p>
                </div>
              </div>
              
              <p className="text-text-light text-center mt-4 text-sm">
                This secure workflow ensures that AI interactions with external systems are controlled, monitored, and limited to only what you've explicitly authorized.
              </p>
            </div>
          </div>
          
          {/* Build Your Own Section */}
          <div className="bg-primary-dark p-12 rounded-2xl border border-gray-800 text-center">
            <h2 className="text-3xl font-bold text-text-default mb-6 font-sora">
              Interested in extending AIOS?
            </h2>
            <p className="text-text-light mb-8 max-w-2xl mx-auto">
              Access our developer documentation to build your own MCPs. Create custom integrations with your favorite services or internal systems to make your AI assistant even more powerful.
            </p>
            <Link href="/documentation" className="btn-primary px-8 py-4">
              Developer Documentation
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
} 