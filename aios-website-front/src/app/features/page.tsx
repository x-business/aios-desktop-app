'use client';

import Layout from "@/components/Layout";
import Image from "next/image";
import { FiCommand, FiServer, FiLayers, FiSliders, FiMoon, FiSun } from "react-icons/fi";
import Link from "next/link";
import { useState } from "react";

export default function Features() {
  const [activeMode, setActiveMode] = useState("dark");

  const features = [
    {
      title: "Model Context Protocol (MCP)",
      description: "Connect AI models with real-world data sources and tools through standardized protocols that enable powerful interactions.",
      icon: <FiCommand className="h-10 w-10" />,
      benefits: [
        "Interact with local files and folders",
        "Automate browser-based tasks",
        "Connect to Google Workspace and more",
      ],
      link: "/mcps",
    },
    {
      title: "Computer Use Agent (CUA)",
      description: "Let AI assist you with complex computer tasks through natural language commands and automated workflows.",
      icon: <FiServer className="h-10 w-10" />,
      benefits: [
        "Control your computer with voice commands",
        "Automate repetitive tasks",
        "Intelligent UI interaction",
      ],
      link: "/use-cases",
    },
    {
      title: "Multi-Provider AI Integration",
      description: "Choose from multiple AI models across different providers to find the perfect solution for every task.",
      icon: <FiLayers className="h-10 w-10" />,
      benefits: [
        "Connect to OpenAI models",
        "Anthropic Claude support",
        "Compare model responses",
      ],
      link: "/documentation",
    },
    {
      title: "Customizable Interface",
      description: "Personalize your AIOS experience with a flexible interface that adapts to your workflow needs.",
      icon: <FiSliders className="h-10 w-10" />,
      benefits: [
        "Dark mode optimized design",
        "Configurable layout options",
        "Keyboard shortcuts",
      ],
      link: "/documentation",
    },
  ];

  const aiModels = [
    {
      name: "GPT-3.5 Turbo",
      description: "Fast responses for everyday tasks with good accuracy and low cost. Perfect for routine questions and assistive tasks.",
      color: "bg-green-500",
    },
    {
      name: "GPT-4",
      description: "Improved reasoning and knowledge with higher accuracy. Great for complex problems requiring deeper understanding.",
      color: "bg-blue-500",
    },
    {
      name: "GPT-4 Turbo",
      description: "The latest model with enhanced capabilities, improved context handling, and more current knowledge cutoff.",
      color: "bg-purple-500",
    },
    {
      name: "Claude-3.7-sonnet",
      description: "Advanced reasoning with exceptional instruction-following and nuanced understanding of context and intent.",
      color: "bg-orange-500",
    },
    {
      name: "Gemini-2.5-Pro",
      description: "Google's multimodal model with strong capabilities across text, code, and reasoning tasks.",
      color: "bg-teal-500",
    },
    {
      name: "o3",
      description: "Pioneering open model with a balanced mix of efficiency and performance for cost-effective deployment.",
      color: "bg-red-500",
    },
    {
      name: "o4-Mini",
      description: "Lightweight, efficient open model delivering impressive capabilities with reduced computational requirements.",
      color: "bg-indigo-500",
    },
  ];

  return (
    <Layout>
      <section className="py-20">
        <div className="container-fluid">
          <h1 className="text-4xl md:text-5xl font-bold text-text-default mb-6 font-sora">
            Features
          </h1>
          <p className="text-text-light text-xl mb-14 max-w-3xl">
            AIOS combines cutting-edge technologies to create a versatile cognitive extension tool
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {features.map((feature) => (
              <div key={feature.title} className="border border-gray-800 rounded-xl bg-primary-gradient-dark p-8 hover:border-secondary/50 transition-all duration-300">
                <div className="bg-secondary/10 p-4 rounded-lg w-fit mb-6 text-secondary">
                  {feature.icon}
                </div>
                <h2 className="text-2xl font-bold text-text-default mb-3 font-sora">
                  {feature.title}
                </h2>
                <p className="text-text-light mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span className="text-text-light">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link href={feature.link} className="text-secondary hover:underline inline-flex items-center">
                  Learn more 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
          
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-text-default mb-6 font-sora">
              Advanced Model Selection
            </h2>
            <p className="text-text-light mb-8 max-w-3xl">
              AIOS provides seamless access to the most powerful AI models available. Choose the right model for your specific needs or let AIOS automatically select the optimal model based on your task.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {aiModels.map((model) => (
                <div 
                  key={model.name}
                  className="border border-gray-800 rounded-xl bg-primary-gradient-dark p-6 hover:border-secondary/30 transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className={`h-3 w-3 rounded-full ${model.color} mr-3`}></div>
                    <h3 className="text-xl font-medium text-text-default font-sora">{model.name}</h3>
                  </div>
                  <p className="text-text-light text-sm">
                    {model.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-20">
            <div className={`border ${activeMode === "dark" ? "border-gray-800 bg-primary-gradient-dark" : "border-gray-200 bg-white"} rounded-xl p-8 shadow-xl transition-colors duration-300`}>
              <div className="mb-6 pl-0">
                <div className={`flex p-1 ${activeMode === "dark" ? "bg-primary-dark border-gray-800" : "bg-gray-100 border-gray-200"} border rounded-full w-fit transition-colors duration-300`}>
                  <button 
                    className={`px-4 py-2 rounded-full transition-all flex items-center ${activeMode === "dark" ? "bg-secondary text-primary-dark" : "bg-transparent text-gray-500"} font-medium`}
                    onClick={() => setActiveMode("dark")}
                  >
                    <FiMoon className="h-5 w-5" />
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-full transition-all flex items-center ${activeMode === "light" ? "bg-secondary text-primary-dark" : "bg-transparent text-text-light"} font-medium`}
                    onClick={() => setActiveMode("light")}
                  >
                    <FiSun className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${activeMode === "dark" ? "" : "hidden"}`}>
                <div>
                  <h3 className="text-2xl font-bold text-text-default mb-4 font-sora">Dark Mode Interface</h3>
                  <p className="text-text-light mb-4">
                    AIOS features a clean, distraction-free dark interface that's easy on the eyes during extended usage. The thoughtfully designed UI keeps the focus on your interaction with the AI while providing powerful customization options.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span className="text-text-light">Reduced eye strain during night-time use</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span className="text-text-light">Enhanced content visibility with high contrast elements</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span className="text-text-light">Customizable accent colors and theme settings</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span className="text-text-light">Intuitive interface with minimal visual distractions</span>
                    </li>
                  </ul>
                </div>
                
                {/* AIOS Terminal UI for Dark Mode */}
                <div className="relative h-[350px] w-full rounded-xl overflow-hidden shadow-2xl shadow-secondary/10 border border-gray-800 bg-primary-gradient-dark">
                  {/* Terminal header */}
                  <div className="h-8 bg-primary-dark/80 border-b border-gray-800 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-400 mx-auto">AIOS Terminal</div>
                  </div>
                  
                  {/* Terminal content */}
                  <div className="p-6 font-mono text-sm">
                    <div className="flex mb-2">
                      <span className="text-secondary mr-2">$</span>
                      <span className="text-gray-300">aios ask "How can I use AIOS for data analysis?"</span>
                    </div>
                    <div className="text-gray-400 mb-4">Analyzing request...</div>
                    
                    <div className="flex items-start mb-4">
                      <div className="text-secondary font-medium mr-2 flex-shrink-0">AIOS:</div>
                      <div className="text-gray-300 space-y-2">
                        <p>For data analysis with AIOS, you can:</p>
                        <ol className="list-decimal pl-5 text-gray-400">
                          <li className="mb-1">Connect to data sources using the Filesystem MCP</li>
                          <li className="mb-1">Process CSV, JSON, or Excel files directly</li>
                          <li className="mb-1">Generate visualizations with Python integration</li>
                          <li className="mb-1">Export results to various formats</li>
                        </ol>
                        <p className="text-xs mt-2 text-gray-500">Would you like me to assist with a specific dataset?</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <span className="text-secondary mr-2">$</span>
                      <span className="text-gray-300 animate-pulse">_</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${activeMode === "light" ? "" : "hidden"}`}>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 font-sora">Light Mode Interface</h3>
                  <p className="text-gray-700 mb-4">
                    For users who prefer a brighter aesthetic, AIOS offers a clean and elegant light mode interface. Carefully designed with optimal contrast and reduced glare for comfortable daytime use.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span className="text-gray-700">Optimized for daytime productivity</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span className="text-gray-700">Clean, minimalist design with subtle shadows</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span className="text-gray-700">Readable typography with perfect contrast ratio</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-secondary mr-2">•</span>
                      <span className="text-gray-700">Seamless transition between dark and light modes</span>
                    </li>
                  </ul>
                </div>
                
                {/* AIOS Terminal UI for Light Mode */}
                <div className="relative h-[350px] w-full rounded-xl overflow-hidden shadow-lg shadow-gray-300 border border-gray-200 bg-white">
                  {/* Terminal header */}
                  <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-500 mx-auto">AIOS Terminal</div>
                  </div>
                  
                  {/* Terminal content */}
                  <div className="p-6 font-mono text-sm">
                    <div className="flex mb-2">
                      <span className="text-secondary mr-2">$</span>
                      <span className="text-gray-700">aios ask "How can I use AIOS for data analysis?"</span>
                    </div>
                    <div className="text-gray-500 mb-4">Analyzing request...</div>
                    
                    <div className="flex items-start mb-4">
                      <div className="text-secondary font-medium mr-2 flex-shrink-0">AIOS:</div>
                      <div className="text-gray-700 space-y-2">
                        <p>For data analysis with AIOS, you can:</p>
                        <ol className="list-decimal pl-5 text-gray-600">
                          <li className="mb-1">Connect to data sources using the Filesystem MCP</li>
                          <li className="mb-1">Process CSV, JSON, or Excel files directly</li>
                          <li className="mb-1">Generate visualizations with Python integration</li>
                          <li className="mb-1">Export results to various formats</li>
                        </ol>
                        <p className="text-xs mt-2 text-gray-500">Would you like me to assist with a specific dataset?</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <span className="text-secondary mr-2">$</span>
                      <span className="text-gray-700 animate-pulse">_</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-default mb-6 font-sora">
              Experience the Power of AI Integration
            </h2>
            <p className="text-text-light mb-8 max-w-2xl mx-auto">
              AIOS brings your AI assistant capabilities to the next level with real-world system integration, multi-model support, and extensive customization.
            </p>
            <Link href="/download" className="btn-primary px-8 py-4 text-lg">
              Download Now
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
} 