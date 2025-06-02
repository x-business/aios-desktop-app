'use client';

import Layout from "@/components/Layout";
import Link from "next/link";
import { FiFolder, FiGlobe, FiYoutube, FiMail, FiTerminal, FiCode, FiSearch, FiDatabase, FiBookOpen, FiPieChart, FiEdit3, FiArrowRight } from "react-icons/fi";
import { useState } from "react";

export default function UseCases() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const useCases = [
    {
      id: "document-management",
      title: "Document Management & Analysis",
      challenge: "Managing and analyzing large collections of local documents",
      solution: "AIOS with Filesystem Access MCP",
      benefits: [
        "Automate document organization by content type, date, or topic",
        "Extract insights from multiple files simultaneously",
        "Generate comprehensive summaries across document libraries",
        "Create structured databases from unstructured document collections"
      ],
      mcps: ["Filesystem Access", "Sequential Thinking"],
      mcpIcons: [
        <FiFolder key="folder" className="h-5 w-5" />,
        <FiTerminal key="terminal" className="h-5 w-5" />
      ],
      category: "Productivity"
    },
    {
      id: "web-research",
      title: "Web Research & Data Collection",
      challenge: "Gathering and organizing information from multiple web sources",
      solution: "AIOS with Playwright and Fetch MCPs",
      benefits: [
        "Automated data collection from multiple websites",
        "Structured information extraction and organization",
        "Comprehensive research summaries with citations",
        "Data aggregation across diverse online sources"
      ],
      mcps: ["Playwright", "Fetch", "Sequential Thinking"],
      mcpIcons: [
        <FiGlobe key="globe" className="h-5 w-5" />,
        <FiGlobe key="download" className="h-5 w-5" />,
        <FiTerminal key="terminal" className="h-5 w-5" />
      ],
      category: "Research"
    },
    {
      id: "video-analysis",
      title: "Video Content Analysis",
      challenge: "Extracting and analyzing information from video content",
      solution: "AIOS with YouTube Transcript MCP",
      benefits: [
        "Quick content summarization without watching entire videos",
        "Key point extraction and topic identification",
        "Research and learning without time-consuming video watching",
        "Content comparison across multiple video sources"
      ],
      mcps: ["YouTube Transcript", "Sequential Thinking"],
      mcpIcons: [
        <FiYoutube key="youtube" className="h-5 w-5" />,
        <FiTerminal key="terminal" className="h-5 w-5" />
      ],
      category: "Content"
    },
    {
      id: "email-management",
      title: "Calendar & Email Management",
      challenge: "Managing busy schedules and email overload",
      solution: "AIOS with Google Workspace MCP",
      benefits: [
        "Smart scheduling with context-aware calendar management",
        "Email prioritization based on content and importance",
        "Automated response drafting with your writing style",
        "Schedule optimization and meeting preparation"
      ],
      mcps: ["Google Workspace"],
      mcpIcons: [
        <FiMail key="mail" className="h-5 w-5" />
      ],
      category: "Productivity"
    },
    {
      id: "system-administration",
      title: "System Administration & Automation",
      challenge: "Streamlining repetitive system management tasks",
      solution: "AIOS with Windows CLI MCP",
      benefits: [
        "Automated script generation for routine maintenance",
        "System monitoring with intelligent alerting",
        "Troubleshooting assistance with guided remediation",
        "Documentation generation from system commands"
      ],
      mcps: ["Windows CLI", "Sequential Thinking"],
      mcpIcons: [
        <FiTerminal key="terminal1" className="h-5 w-5" />,
        <FiTerminal key="terminal2" className="h-5 w-5" />
      ],
      category: "Development"
    },
    {
      id: "social-media-management",
      title: "Social Media Management",
      challenge: "Managing multiple social media accounts, creating and scheduling posts, and engaging with audiences efficiently.",
      solution: "AIOS with Social Media MCP and automation tools",
      benefits: [
        "Automate post creation and scheduling across platforms",
        "Generate engaging content and hashtags with AI",
        "Monitor and respond to comments and messages",
        "Analyze engagement metrics and optimize posting times"
      ],
      mcps: ["Social Media MCP", "Sequential Thinking"],
      mcpIcons: [
        <FiGlobe key="globe" className="h-5 w-5" />,
        <FiTerminal key="terminal" className="h-5 w-5" />
      ],
      category: "Content"
    },
    {
      id: "code-assistant",
      title: "Programming & Code Generation",
      challenge: "Accelerating software development and debugging complex code issues",
      solution: "AIOS with Code MCP",
      benefits: [
        "Generate efficient code solutions based on requirements",
        "Debug and optimize existing code with intelligent analysis",
        "Translate between programming languages automatically",
        "Create documentation and explanation for complex codebases"
      ],
      mcps: ["Code MCP", "Filesystem Access"],
      mcpIcons: [
        <FiCode key="code" className="h-5 w-5" />,
        <FiFolder key="folder" className="h-5 w-5" />
      ],
      category: "Development"
    },
    {
      id: "market-research",
      title: "Market & Competitor Analysis",
      challenge: "Gathering and analyzing market trends and competitor intelligence efficiently",
      solution: "AIOS with Playwright and Sequential Thinking MCPs",
      benefits: [
        "Automate competitive intelligence gathering across multiple sources",
        "Track market trends and generate comprehensive reports",
        "Monitor competitor product changes and marketing strategies",
        "Identify market opportunities through AI-powered analysis"
      ],
      mcps: ["Playwright", "Sequential Thinking"],
      mcpIcons: [
        <FiGlobe key="globe" className="h-5 w-5" />,
        <FiTerminal key="terminal" className="h-5 w-5" />
      ],
      category: "Research"
    },
    {
      id: "data-analysis",
      title: "Data Analysis & Visualization",
      challenge: "Processing large datasets and creating meaningful visualizations",
      solution: "AIOS with Data Processing MCP",
      benefits: [
        "Automated data cleaning and normalization",
        "Statistical analysis with natural language explanations",
        "Generate visualization code for complex datasets",
        "Extract actionable insights from various data sources"
      ],
      mcps: ["Data Processing MCP", "Filesystem Access"],
      mcpIcons: [
        <FiDatabase key="database" className="h-5 w-5" />,
        <FiFolder key="folder" className="h-5 w-5" />
      ],
      category: "Research"
    },
    {
      id: "academic-research",
      title: "Academic Research Assistance",
      challenge: "Streamlining literature reviews and research paper development",
      solution: "AIOS with Research MCP and Fetch",
      benefits: [
        "Automated literature searches across multiple academic databases",
        "Summarization of research papers and extraction of key findings",
        "Citation management and bibliography generation",
        "Research gap identification and experiment suggestion"
      ],
      mcps: ["Research MCP", "Fetch"],
      mcpIcons: [
        <FiBookOpen key="book" className="h-5 w-5" />,
        <FiGlobe key="globe" className="h-5 w-5" />
      ],
      category: "Research"
    },
    {
      id: "content-creation",
      title: "Content Creation & Editing",
      challenge: "Producing high-quality content at scale for various platforms",
      solution: "AIOS with Content Creation MCP",
      benefits: [
        "Generate engaging content tailored to specific audiences",
        "Edit and optimize existing content for clarity and impact",
        "Create content in multiple formats (blog, social, email, video scripts)",
        "Maintain consistent brand voice across all content"
      ],
      mcps: ["Content Creation MCP", "Social Media MCP"],
      mcpIcons: [
        <FiEdit3 key="edit" className="h-5 w-5" />,
        <FiGlobe key="globe" className="h-5 w-5" />
      ],
      category: "Content"
    },
    {
      id: "business-intelligence",
      title: "Business Intelligence",
      challenge: "Converting raw business data into actionable insights",
      solution: "AIOS with Data Processing and Sequential Thinking MCPs",
      benefits: [
        "Automated data analysis and report generation",
        "Trend identification and forecasting",
        "KPI monitoring and performance tracking",
        "Decision support through AI-powered recommendations"
      ],
      mcps: ["Data Processing MCP", "Sequential Thinking"],
      mcpIcons: [
        <FiPieChart key="chart" className="h-5 w-5" />,
        <FiTerminal key="terminal" className="h-5 w-5" />
      ],
      category: "Productivity"
    },
  ];

  const categories = [
    "All",
    "Productivity",
    "Research",
    "Content",
    "Development"
  ];

  const filteredUseCases = selectedCategory === "All"
    ? useCases
    : useCases.filter((useCase) => useCase.category === selectedCategory);

  return (
    <Layout>
      <section className="py-20">
        <div className="container-fluid">
          <h1 className="text-4xl md:text-5xl font-bold text-text-default mb-6 font-sora">
            Use Cases
          </h1>
          <p className="text-text-light text-xl mb-12 max-w-3xl">
            Discover how AIOS transforms workflows across different scenarios
          </p>
          
          {/* Filter Tabs - Now interactive */}
          <div className="flex flex-wrap gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                className={
                  cat === selectedCategory
                    ? "px-4 py-2 rounded-full bg-secondary text-white font-medium shadow"
                    : "px-4 py-2 rounded-full bg-primary-gradient-dark border border-gray-800 text-text-light hover:border-secondary/50 transition-all"
                }
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} Use Cases
              </button>
            ))}
          </div>
          
          {/* Use Cases Grid - Now 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredUseCases.map((useCase) => (
              <div 
                key={useCase.id}
                className="border border-gray-800 rounded-xl overflow-hidden bg-primary-gradient-dark h-full"
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-text-default mb-4 font-sora">
                    {useCase.title}
                  </h2>
                  
                  <div className="mb-4">
                    <h3 className="text-secondary font-medium mb-1">Challenge</h3>
                    <p className="text-text-light text-sm">
                      {useCase.challenge}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-secondary font-medium mb-1">Solution</h3>
                    <p className="text-text-light text-sm">
                      {useCase.solution}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-secondary font-medium mb-2">Benefits</h3>
                    <ul className="space-y-1">
                      {useCase.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-secondary mr-2">•</span>
                          <span className="text-text-light text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-secondary font-medium mb-3">MCPs Used</h3>
                    <div className="flex flex-wrap gap-2">
                      {useCase.mcps.map((mcp, i) => (
                        <div key={i} className="flex items-center bg-primary-dark/50 px-3 py-2 rounded-md border border-gray-800">
                          <div className="mr-2 text-secondary">
                            {useCase.mcpIcons[i]}
                          </div>
                          <span className="text-text-light text-sm">{mcp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA Section */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-text-default mb-6 font-sora">
              Find Your Use Case
            </h2>
            <p className="text-text-light mb-8 max-w-2xl mx-auto">
              Have a specific workflow challenge that you don't see here? Our team can help you customize AIOS to meet your unique requirements.
            </p>
            <div className="inline-flex gap-4">
              <Link href="/contact" className="btn-primary">
                Contact Us
              </Link>
              <Link href="/documentation" className="btn-secondary">
                Explore Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 