"use client";

import Layout from "@/components/Layout";
import Link from "next/link";
import { ReactNode, useState, useEffect } from "react";
import { FiHome, FiBookOpen, FiCommand, FiCpu, FiCode, FiShield, FiMic, FiLifeBuoy } from "react-icons/fi";

// This is a client component
export default function Documentation() {
  const [activeSection, setActiveSection] = useState("getting-started");

  // Function to handle navigation clicks
  const handleNavClick = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default anchor behavior
    setActiveSection(sectionId);
    
    // Scroll to the section
    const element = document.getElementById(sectionId);
    if (element) {
      // Scroll with some offset to account for sticky header
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Debug function to log section IDs
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    console.log('Available sections:');
    sections.forEach(section => {
      console.log(`ID: ${section.id}`);
    });
  }, []);

  // Use effect to detect scroll and update active section
  useEffect(() => {
    const handleScroll = () => {
      // Get all section elements with IDs
      const sections = document.querySelectorAll('section[id]');
      
      if (sections.length === 0) return;
      
      // Find the section that is currently most visible in the viewport
      let currentSection = sections[0].id;
      let maxVisibility = 0;
      
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // Calculate how much of the section is visible
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        
        // Calculate position bias - favor sections near the top of the viewport
        const positionBias = 1 - Math.max(0, Math.min(1, rect.top / (window.innerHeight * 0.5)));
        
        // Final score combines visible height and position
        const score = visibleHeight * positionBias;
        
        if (score > maxVisibility && visibleHeight > 0) {
          maxVisibility = score;
          currentSection = section.id;
        }
      });
      
      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check after render
    setTimeout(handleScroll, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeSection]);

  return (
    <Layout>
      <section className="py-20">
        <div className="container-fluid">
          <h1 className="text-4xl md:text-5xl font-bold text-text-default mb-6 font-sora">
            Documentation
          </h1>
          <p className="text-text-light text-xl mb-12 max-w-3xl">
            Everything you need to know about using AIOS
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 sticky top-24">
                <div className="p-6">
                  <h2 className="text-lg font-bold text-text-default mb-4 font-sora">
                    Quick Navigation
                  </h2>
                  
                  <nav className="space-y-1">
                    <NavItem 
                      icon={<FiHome />} 
                      href="#getting-started" 
                      label="Getting Started" 
                      isActive={activeSection === "getting-started"}
                      onClick={(e) => handleNavClick("getting-started", e)}
                    />
                    <NavItem 
                      icon={<FiCommand />} 
                      href="#mcp-documentation" 
                      label="MCP Documentation" 
                      isActive={activeSection === "mcp-documentation"}
                      onClick={(e) => handleNavClick("mcp-documentation", e)}
                    />
                    <NavItem 
                      icon={<FiCpu />} 
                      href="#computer-use-agent" 
                      label="Computer Use Agent" 
                      isActive={activeSection === "computer-use-agent"}
                      onClick={(e) => handleNavClick("computer-use-agent", e)}
                    />
                    <NavItem 
                      icon={<FiCode />} 
                      href="#api-reference" 
                      label="API Reference" 
                      isActive={activeSection === "api-reference"}
                      onClick={(e) => handleNavClick("api-reference", e)}
                    />
                    <NavItem 
                      icon={<FiShield />} 
                      href="#security-privacy" 
                      label="Security & Privacy" 
                      isActive={activeSection === "security-privacy"}
                      onClick={(e) => handleNavClick("security-privacy", e)}
                    />
                    <NavItem 
                      icon={<FiMic />} 
                      href="#voice-interface" 
                      label="Voice Interface" 
                      isActive={activeSection === "voice-interface"}
                      onClick={(e) => handleNavClick("voice-interface", e)}
                    />
                    <NavItem 
                      icon={<FiLifeBuoy />} 
                      href="#troubleshooting" 
                      label="Troubleshooting" 
                      isActive={activeSection === "troubleshooting"}
                      onClick={(e) => handleNavClick("troubleshooting", e)}
                    />
                  </nav>
                  
                  <div className="mt-8 pt-6 border-t border-gray-800">
                    <h3 className="text-sm font-medium text-text-default mb-3">
                      Need more help?
                    </h3>
                    <div className="flex flex-col space-y-3">
                      <Link href="/contact" className="text-secondary hover:underline text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Contact Support
                      </Link>
                      <Link href="/community" className="text-secondary hover:underline text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        Join Community
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="space-y-12">
                {/* Installation Guide Section */}
                <section id="getting-started" className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-text-default mb-6 font-sora">
                    Installation Guide
                  </h2>
                  
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-medium text-text-default mb-4 flex items-center">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-primary-dark font-bold mr-3">1</span>
                        System Requirements
                      </h3>
                      <div className="pl-10">
                        <p className="text-text-light mb-4">
                          Before installing AIOS, ensure your system meets the following requirements:
                        </p>
                        <ul className="space-y-2 text-text-light">
                          <li className="flex items-start">
                            <span className="text-secondary mr-2">•</span>
                            <span>Windows 10 or 11 (64-bit)</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary mr-2">•</span>
                            <span>8GB RAM minimum (16GB recommended)</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary mr-2">•</span>
                            <span>2GB free disk space</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary mr-2">•</span>
                            <span>Internet connection</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium text-text-default mb-4 flex items-center">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-primary-dark font-bold mr-3">2</span>
                        Download and Installation
                      </h3>
                      <div className="pl-10">
                        <ol className="space-y-4">
                          <li className="flex items-start">
                            <span className="text-secondary font-medium mr-2">a.</span>
                            <div>
                              <p className="text-text-light">
                                <a href="/download" className="text-secondary hover:underline">Download</a> the latest AIOS installer package from our official website.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary font-medium mr-2">b.</span>
                            <div>
                              <p className="text-text-light">
                                Run the installer and follow the on-screen instructions.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary font-medium mr-2">c.</span>
                            <div>
                              <p className="text-text-light">
                                Select your preferred installation location or use the default path.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary font-medium mr-2">d.</span>
                            <div>
                              <p className="text-text-light">
                                Choose which components to install (recommended: all components).
                              </p>
                            </div>
                          </li>
                        </ol>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium text-text-default mb-4 flex items-center">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-primary-dark font-bold mr-3">3</span>
                        Initial Configuration
                      </h3>
                      <div className="pl-10">
                        <ol className="space-y-4">
                          <li className="flex items-start">
                            <span className="text-secondary font-medium mr-2">a.</span>
                            <div>
                              <p className="text-text-light">
                                Launch AIOS after installation.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary font-medium mr-2">b.</span>
                            <div>
                              <p className="text-text-light">
                                Create an account or sign in with your existing credentials.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary font-medium mr-2">c.</span>
                            <div>
                              <p className="text-text-light">
                                Choose your pricing option: use your own API keys or purchase AIOS points.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary font-medium mr-2">d.</span>
                            <div>
                              <p className="text-text-light">
                                If using your own API keys, enter them in the settings panel.
                              </p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <span className="text-secondary font-medium mr-2">e.</span>
                            <div>
                              <p className="text-text-light">
                                Select which MCPs to enable (you can change this later).
                              </p>
                            </div>
                          </li>
                        </ol>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="bg-primary-dark p-4 rounded-lg border border-gray-800">
                        <h4 className="text-text-default font-medium mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Note on Security Permissions
                        </h4>
                        <p className="text-text-light text-sm">
                          AIOS will request various system permissions based on the MCPs you enable. For example, the Filesystem Access MCP requires permission to access specific folders. You can adjust these permissions at any time in the Settings panel.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
                
                {/* MCP Documentation Preview */}
                <section id="mcp-documentation" className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-text-default mb-6 font-sora">
                    MCP Documentation
                  </h2>
                  
                  <p className="text-text-light mb-6">
                    Model Context Protocols (MCPs) extend your AI assistant's capabilities by connecting it with external systems and data sources. This section provides detailed documentation for each available MCP.
                  </p>
                  
                  <div className="mb-6">
                    <Link href="/mcps" className="text-secondary hover:underline inline-flex items-center">
                      View full MCP documentation
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                  
                  <div className="bg-primary-dark p-6 rounded-lg border border-gray-800">
                    <h3 className="text-lg font-medium text-text-default mb-4">
                      Popular MCPs:
                    </h3>
                    <ul className="space-y-3">
                      <li>
                        <a href="/mcps#filesystem" className="text-secondary hover:underline">Filesystem Access</a>
                        <p className="text-text-light text-sm mt-1">
                          Access, read, and write files on your local system with fine-grained permissions.
                        </p>
                      </li>
                      <li>
                        <a href="/mcps#playwright" className="text-secondary hover:underline">Playwright</a>
                        <p className="text-text-light text-sm mt-1">
                          Automate browser interactions and web research.
                        </p>
                      </li>
                      <li>
                        <a href="/mcps#google-workspace" className="text-secondary hover:underline">Google Workspace</a>
                        <p className="text-text-light text-sm mt-1">
                          Integrate with Gmail and Google Calendar for email and scheduling.
                        </p>
                      </li>
                    </ul>
                  </div>
                </section>
                
                {/* Additional Documentation Sections (No Dropdowns) */}
                <section id="computer-use-agent" className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-text-default mb-6 font-sora">
                    Computer Use Agent
                  </h2>
                      <p className="text-text-light mb-4">
                        The Computer Use Agent (CUA) allows AIOS to interact with your Windows system, helping you accomplish tasks efficiently through natural language commands.
                      </p>
                      <h3 className="text-lg font-medium text-text-default mb-3">Key Features:</h3>
                      <ul className="space-y-2 text-text-light mb-4">
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>Natural language control of Windows applications</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>Automated workflow assistance</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>System management and monitoring</span>
                        </li>
                      </ul>
                      <div className="bg-primary-dark p-4 rounded-lg border border-gray-800">
                        <p className="text-text-light text-sm">
                          For detailed CUA documentation, including commands and use cases, see the <a href="/documentation/cua" className="text-secondary hover:underline">full CUA guide</a>.
                        </p>
                      </div>
                </section>
                
                <section id="api-reference" className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-text-default mb-6 font-sora">
                    API Reference
                  </h2>
                      <p className="text-text-light mb-4">
                        AIOS provides a comprehensive API for developers who want to integrate AIOS capabilities into their own applications.
                      </p>
                      <h3 className="text-lg font-medium text-text-default mb-3">Available Endpoints:</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-800">
                              <th className="py-3 px-4 text-left text-text-default">Endpoint</th>
                              <th className="py-3 px-4 text-left text-text-default">Method</th>
                              <th className="py-3 px-4 text-left text-text-default">Description</th>
                            </tr>
                          </thead>
                          <tbody className="text-text-light">
                            <tr className="border-b border-gray-800">
                              <td className="py-3 px-4"><code className="bg-primary-dark px-2 py-1 rounded">/api/chat</code></td>
                              <td className="py-3 px-4">POST</td>
                              <td className="py-3 px-4">Send a message to an AI model</td>
                            </tr>
                            <tr className="border-b border-gray-800">
                              <td className="py-3 px-4"><code className="bg-primary-dark px-2 py-1 rounded">/api/models</code></td>
                              <td className="py-3 px-4">GET</td>
                              <td className="py-3 px-4">List available AI models</td>
                            </tr>
                            <tr>
                              <td className="py-3 px-4"><code className="bg-primary-dark px-2 py-1 rounded">/api/mcps</code></td>
                              <td className="py-3 px-4">GET</td>
                              <td className="py-3 px-4">List enabled MCPs</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4">
                        <Link href="/documentation/api" className="text-secondary hover:underline inline-flex items-center">
                          View full API documentation
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                </section>
                
                <section id="security-privacy" className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-text-default mb-6 font-sora">
                    Security & Privacy
                  </h2>
                      <p className="text-text-light mb-4">
                        AIOS is designed with security and privacy as core principles. We implement multiple layers of protection to keep your data safe.
                      </p>
                      <h3 className="text-lg font-medium text-text-default mb-3">Security Features:</h3>
                      <ul className="space-y-2 text-text-light mb-4">
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>Granular permission controls for all MCPs</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>End-to-end encryption for sensitive data</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>Local processing options to keep data on your device</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>Regular security audits and updates</span>
                        </li>
                      </ul>
                      <h3 className="text-lg font-medium text-text-default mb-3">Privacy Commitments:</h3>
                      <ul className="space-y-2 text-text-light">
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>No data collection without explicit consent</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>Option to opt out of all telemetry</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>Clear data retention policies</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span>Compliance with GDPR and other regulations</span>
                    </li>
                  </ul>
                </section>
                
                {/* Voice Interface Section */}
                <section id="voice-interface" className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-text-default mb-6 font-sora">
                    Voice Interface
                  </h2>
                  <p className="text-text-light mb-4">
                    AIOS provides a natural voice interface that allows hands-free interaction with your AI assistant. Use voice commands to control AIOS while you're working on other tasks.
                  </p>
                  
                  <h3 className="text-lg font-medium text-text-default mb-3">Voice Commands:</h3>
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="py-3 px-4 text-left text-text-default">Command Type</th>
                          <th className="py-3 px-4 text-left text-text-default">Example</th>
                          <th className="py-3 px-4 text-left text-text-default">Function</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-light">
                        <tr className="border-b border-gray-800">
                          <td className="py-3 px-4">Wake Word</td>
                          <td className="py-3 px-4">"Hey AIOS"</td>
                          <td className="py-3 px-4">Activates voice recognition</td>
                        </tr>
                        <tr className="border-b border-gray-800">
                          <td className="py-3 px-4">Task Command</td>
                          <td className="py-3 px-4">"Summarize my emails"</td>
                          <td className="py-3 px-4">Instructs AIOS to perform a specific task</td>
                        </tr>
                        <tr className="border-b border-gray-800">
                          <td className="py-3 px-4">System Control</td>
                          <td className="py-3 px-4">"Pause listening"</td>
                          <td className="py-3 px-4">Controls AIOS system functions</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Contextual Query</td>
                          <td className="py-3 px-4">"What about yesterday's meeting?"</td>
                          <td className="py-3 px-4">Continues a conversation with context</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <h3 className="text-lg font-medium text-text-default mb-3">Voice Settings:</h3>
                  <ul className="space-y-2 text-text-light mb-6">
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span>Custom wake word configuration</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span>Voice recognition training for improved accuracy</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span>Multiple voice profile support for different users</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span>Privacy controls for voice data</span>
                    </li>
                  </ul>
                  
                  <div className="bg-primary-dark p-4 rounded-lg border border-gray-800">
                    <h4 className="text-text-default font-medium mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Quick Tip
                    </h4>
                    <p className="text-text-light text-sm">
                      For best voice recognition results, place your microphone in a location with minimal background noise and speak clearly. You can adjust microphone sensitivity in the Voice Settings panel.
                    </p>
                  </div>
                </section>
                
                {/* Troubleshooting Section */}
                <section id="troubleshooting" className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-8">
                  <h2 className="text-2xl font-bold text-text-default mb-6 font-sora">
                    Troubleshooting
                  </h2>
                  <p className="text-text-light mb-6">
                    If you encounter issues with AIOS, use this troubleshooting guide to identify and resolve common problems. If you need additional assistance, please contact our support team.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-medium text-text-default mb-3">Connection Issues</h3>
                      <div className="bg-primary-dark p-4 rounded-lg border border-gray-800 mb-4">
                        <h4 className="text-text-default font-medium mb-2">Symptom: Cannot connect to AI models</h4>
                        <p className="text-text-light text-sm mb-2">Possible causes:</p>
                        <ul className="space-y-1 text-text-light text-sm mb-3 pl-4">
                          <li>Internet connection is down</li>
                          <li>API keys are invalid or expired</li>
                          <li>Server is experiencing high traffic</li>
                        </ul>
                        <p className="text-text-light text-sm">Solution: Check your internet connection, verify API keys in Settings → API Keys, and try again later if servers are busy.</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium text-text-default mb-3">Permission Errors</h3>
                      <div className="bg-primary-dark p-4 rounded-lg border border-gray-800 mb-4">
                        <h4 className="text-text-default font-medium mb-2">Symptom: "Permission denied" errors when using MCPs</h4>
                        <p className="text-text-light text-sm mb-2">Possible causes:</p>
                        <ul className="space-y-1 text-text-light text-sm mb-3 pl-4">
                          <li>Required permissions not granted</li>
                          <li>Access to restricted directories</li>
                          <li>Security software blocking access</li>
                        </ul>
                        <p className="text-text-light text-sm">Solution: Review and update MCP permissions in Settings → MCPs → Permissions, ensure you're not accessing restricted paths, and check your security software settings.</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium text-text-default mb-3">Performance Issues</h3>
                      <div className="bg-primary-dark p-4 rounded-lg border border-gray-800 mb-4">
                        <h4 className="text-text-default font-medium mb-2">Symptom: AIOS running slowly or unresponsive</h4>
                        <p className="text-text-light text-sm mb-2">Possible causes:</p>
                        <ul className="space-y-1 text-text-light text-sm mb-3 pl-4">
                          <li>Low system resources</li>
                          <li>Too many MCPs enabled simultaneously</li>
                          <li>Large conversation history consuming memory</li>
                        </ul>
                        <p className="text-text-light text-sm">Solution: Close unused applications, disable unnecessary MCPs, clear conversation history in Settings → Data Management, and restart AIOS.</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-medium text-text-default mb-3">Diagnostic Tools</h3>
                      <p className="text-text-light mb-4">
                        AIOS includes built-in diagnostic tools to help identify and resolve issues:
                      </p>
                      <ul className="space-y-2 text-text-light">
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span><strong>System Diagnostics:</strong> Run a complete system check (Help → Run Diagnostics)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span><strong>Connection Test:</strong> Verify API connectivity (Settings → Connectivity → Test Connection)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span><strong>Log Files:</strong> Access detailed logs for error analysis (Help → View Logs)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span><strong>Reset Settings:</strong> Return to default configuration (Settings → Advanced → Reset)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

// Type definitions for the components
interface NavItemProps {
  icon: ReactNode;
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

// Navigation Item Component
function NavItem({ icon, href, label, isActive = false, onClick }: NavItemProps) {
  return (
    <a 
      href={href}
      className={`flex items-center px-3 py-2 text-sm rounded transition-colors ${
        isActive 
          ? 'bg-secondary/10 text-secondary' 
          : 'text-text-light hover:bg-primary-dark/50 hover:text-text-default'
      }`}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </a>
  );
} 