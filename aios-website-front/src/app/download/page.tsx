import Layout from "@/components/Layout";
import Link from "next/link";
import Image from "next/image";
import { FiDownload, FiCheckCircle, FiHelpCircle, FiGithub, FiGlobe, FiTwitter } from "react-icons/fi";

export default function Download() {
  // Define OS options
  const osOptions = [
    {
      id: "windows",
      name: "Windows",
      version: "1.2.3",
      primary: true,
      requirements: "Windows 10/11 64-bit, 8GB RAM, 2GB disk space",
      fileName: "AIOS-Setup-1.2.3.exe",
      size: "148 MB",
    },
    {
      id: "mac",
      name: "macOS",
      version: "1.2.3",
      comingSoon: true,
      requirements: "macOS 11.0+, Apple Silicon or Intel, 8GB RAM",
      fileName: "AIOS-1.2.3.dmg",
      size: "152 MB",
    },
    {
      id: "linux",
      name: "Linux",
      version: "1.2.3",
      comingSoon: true,
      requirements: "Ubuntu 20.04+, Debian 11+, or compatible distro",
      fileName: "AIOS-1.2.3.AppImage",
      size: "145 MB",
    }
  ];

  return (
    <Layout>
      <section className="py-20">
        <div className="container-fluid">
          <h1 className="text-4xl md:text-5xl font-bold text-text-default mb-6 font-sora">
            Download AIOS
          </h1>
          <p className="text-text-light text-xl mb-10 max-w-3xl">
            Get started with the advanced AI integration tool
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Main Download Options */}
              <div className="space-y-6">
                {osOptions.map((os) => (
                  <div 
                    key={os.id}
                    className={`bg-primary-gradient-dark rounded-xl border ${
                      os.primary ? 'border-secondary/30' : 'border-gray-800'
                    } overflow-hidden relative`}
                  >
                    {os.primary && (
                      <div className="absolute top-0 right-0 bg-secondary text-primary-dark px-4 py-1 text-sm font-medium rounded-bl-lg">
                        Recommended
                      </div>
                    )}
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div className="mb-4 md:mb-0">
                          <h2 className="text-2xl font-bold text-text-default font-sora flex items-center">
                            <FiGlobe className="mr-3 h-6 w-6" />
                            AIOS for {os.name}
                          </h2>
                          <p className="text-text-light mt-1">Version {os.version}</p>
                        </div>
                        
                        {os.comingSoon ? (
                          <div className="inline-flex items-center px-4 py-2 bg-primary-dark/50 text-text-light rounded-md border border-gray-800">
                            Coming Soon
                          </div>
                        ) : (
                          <Link href={`/downloads/${os.fileName}`} className="btn-primary inline-flex items-center">
                            <FiDownload className="mr-2" />
                            Download Now
                          </Link>
                        )}
                      </div>
                      
                      <div className="bg-primary-dark/60 p-4 rounded-lg mb-6">
                        <h3 className="text-text-default font-medium mb-2">System Requirements</h3>
                        <p className="text-text-light text-sm">{os.requirements}</p>
                      </div>
                      
                      <div className="flex flex-wrap justify-between text-text-light text-sm">
                        <div>
                          <span className="font-medium">File name:</span> {os.fileName}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {os.size}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Installation Instructions */}
              <div className="mt-12 bg-primary-gradient-dark rounded-xl border border-gray-800 p-8">
                <h2 className="text-2xl font-bold text-text-default mb-6 font-sora">
                  Installation Guide
                </h2>
                
                <ol className="space-y-6">
                  <li className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mr-4">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-text-default mb-2">Download the installer</h3>
                      <p className="text-text-light">
                        Choose your operating system above and download the installer package.
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mr-4">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-text-default mb-2">Run the installer</h3>
                      <p className="text-text-light">
                        Double-click the downloaded file and follow the on-screen instructions to complete the installation.
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mr-4">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-text-default mb-2">Initial setup</h3>
                      <p className="text-text-light">
                        Launch AIOS after installation. You'll be guided through the initial setup process, including account creation and API key configuration.
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mr-4">
                      4
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-text-default mb-2">Enable MCPs</h3>
                      <p className="text-text-light">
                        Select which Model Context Protocols you want to enable. You can change these settings later from the MCPs management panel.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Release Notes */}
              <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-text-default mb-4 font-sora">
                  Release Notes
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-text-default">Version 1.2.3</h3>
                    <p className="text-text-light text-sm mt-1">Released on May 1, 2023</p>
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-start">
                        <FiCheckCircle className="text-secondary h-4 w-4 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-text-light text-sm">Added support for Claude 3 Opus model</span>
                      </li>
                      <li className="flex items-start">
                        <FiCheckCircle className="text-secondary h-4 w-4 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-text-light text-sm">Improved Filesystem MCP permission handling</span>
                      </li>
                      <li className="flex items-start">
                        <FiCheckCircle className="text-secondary h-4 w-4 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-text-light text-sm">Fixed voice recognition in noisy environments</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-text-default">Version 1.2.0</h3>
                    <p className="text-text-light text-sm mt-1">Released on April 15, 2023</p>
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-start">
                        <FiCheckCircle className="text-secondary h-4 w-4 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-text-light text-sm">Added Google Workspace MCP</span>
                      </li>
                      <li className="flex items-start">
                        <FiCheckCircle className="text-secondary h-4 w-4 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-text-light text-sm">New voice interface with improved latency</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <Link href="/changelog" className="text-secondary hover:underline inline-flex items-center mt-4 text-sm">
                  View full changelog
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              
              {/* Need Help */}
              <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-text-default mb-4 font-sora flex items-center">
                  <FiHelpCircle className="mr-2" />
                  Need Help?
                </h2>
                <p className="text-text-light mb-4">
                  Having trouble with the installation or need assistance with setup? We're here to help!
                </p>
                <ul className="space-y-3">
                  <li>
                    <Link href="/documentation" className="text-secondary hover:underline">Installation guide</Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-secondary hover:underline">Troubleshooting FAQ</Link>
                  </li>
                  <li>
                    <Link href="/community" className="text-secondary hover:underline">Community forums</Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-secondary hover:underline">Contact support</Link>
                  </li>
                </ul>
              </div>
              
              {/* Contributing */}
              <div className="bg-primary-gradient-dark rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-text-default mb-4 font-sora flex items-center">
                  <FiGithub className="mr-2" />
                  Contributing
                </h2>
                <p className="text-text-light mb-4">
                  AIOS is partially open source. Help us improve by contributing to the project!
                </p>
                <div className="flex flex-col space-y-2">
                  <a 
                    href="https://github.com/aios/community-mcps" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-secondary hover:underline inline-flex items-center"
                  >
                    MCP repository
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                  <a 
                    href="https://github.com/aios/documentation" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-secondary hover:underline inline-flex items-center"
                  >
                    Documentation repository
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Social Sharing */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-text-default mb-4 font-sora">
              Share AIOS
            </h2>
            <p className="text-text-light mb-6">
              If you love AIOS, help us spread the word!
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="https://twitter.com/intent/tweet?text=Check out AIOS, the advanced AI integration tool! https://aios.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary-dark h-10 w-10 rounded-full flex items-center justify-center border border-gray-800 text-text-light hover:text-secondary hover:border-secondary transition-colors"
              >
                <FiTwitter className="h-5 w-5" />
              </a>
              <a 
                href="https://www.linkedin.com/sharing/share-offsite/?url=https://aios.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary-dark h-10 w-10 rounded-full flex items-center justify-center border border-gray-800 text-text-light hover:text-secondary hover:border-secondary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a 
                href="mailto:?subject=Check out AIOS&body=I've been using AIOS, the advanced AI integration tool, and thought you might be interested: https://aios.app" 
                className="bg-primary-dark h-10 w-10 rounded-full flex items-center justify-center border border-gray-800 text-text-light hover:text-secondary hover:border-secondary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 