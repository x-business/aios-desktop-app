"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { FiSend, FiChevronDown, FiMic, FiCpu, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import Layout from "@/components/Layout";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function NewChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AIOS assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("GPT-4");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (input.trim() === "") return;
    
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // Simulate AI response delay
    setTimeout(() => {
      const aiResponses = [
        "I've analyzed your request and here's what I found...",
        "Based on the information available, I'd recommend the following approach...",
        "Let me process that for you. The answer to your question is...",
        "I've accessed the relevant data and I can confirm that...",
        "That's an interesting question. According to my knowledge..."
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const assistantMessage: Message = {
        role: "assistant",
        content: randomResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const models = [
    "GPT-4",
    "GPT-4 Turbo",
    "Claude-3.7-sonnet",
    "Gemini-2.5-Pro",
    "o3",
    "o4-Mini"
  ];

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <Layout>
      <div className={`py-4 ${isFullScreen ? 'fixed inset-0 z-50 bg-primary-dark' : ''}`}>
        <div className="container-fluid h-full flex flex-col">
          {isFullScreen && (
            <div className="bg-primary-gradient-dark py-2 px-4 flex items-center justify-between">
              <div className="text-lg font-medium text-text-default">AIOS Chat</div>
              <button 
                onClick={toggleFullScreen}
                className="text-text-light hover:text-secondary p-2"
              >
                <FiMinimize2 className="h-5 w-5" />
              </button>
            </div>
          )}
          
          <div className={`bg-primary-gradient-dark rounded-xl border border-gray-800 flex flex-col ${isFullScreen ? 'flex-grow' : 'h-[80vh]'}`} ref={chatContainerRef}>
            {/* Chat header */}
            <div className="border-b border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <button 
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center space-x-2 bg-primary-dark/50 px-3 py-2 rounded-md border border-gray-800 hover:border-gray-700"
                  >
                    <FiCpu className="text-secondary" />
                    <span className="text-sm text-text-default">{selectedModel}</span>
                    <FiChevronDown className="h-4 w-4 text-text-light" />
                  </button>
                  
                  {isModelDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-primary-dark border border-gray-800 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        {models.map((model) => (
                          <button
                            key={model}
                            onClick={() => {
                              setSelectedModel(model);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              model === selectedModel
                                ? "text-secondary bg-secondary/10"
                                : "text-text-default hover:bg-primary-gradient-dark"
                            }`}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 text-sm text-text-light">
                  New Conversation
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={toggleFullScreen}
                  className="text-text-light hover:text-secondary p-2"
                >
                  {isFullScreen ? <FiMinimize2 className="h-5 w-5" /> : <FiMaximize2 className="h-5 w-5" />}
                </button>
                <Link 
                  href="/dashboard"
                  className="text-text-light hover:text-secondary p-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Chat messages */}
            <div className="flex-grow p-4 overflow-y-auto">
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div 
                      className={`max-w-3/4 rounded-lg p-4 ${
                        message.role === "user" 
                          ? "bg-secondary/20 text-text-default" 
                          : "bg-primary-dark/60 border border-gray-800 text-text-default"
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs text-text-light mt-1 text-right">{formatTime(message.timestamp)}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-primary-dark/60 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse delay-150"></div>
                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse delay-300"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Chat input */}
            <div className="border-t border-gray-800 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <button
                  type="button"
                  className="text-text-light hover:text-secondary p-2"
                >
                  <FiMic className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow bg-primary-dark/50 border border-gray-800 rounded-md px-4 py-3 text-text-default focus:outline-none focus:border-secondary"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="btn-primary p-3 rounded-md"
                  disabled={isLoading || input.trim() === ""}
                >
                  <FiSend className="h-5 w-5" />
                </button>
              </form>
              <div className="mt-2 text-xs text-text-light text-center">
                Using {selectedModel} • AIOS may produce inaccurate information about people, places, or facts
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 