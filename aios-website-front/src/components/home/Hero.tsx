"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TypeAnimation } from 'react-type-animation';

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-20 lg:pt-24 pb-16">
      {/* Background gradient/pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-dark to-primary-gradient-dark z-0">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4ECDC4_1px,transparent_1px)] [background-size:40px_40px]"></div>
        
        {/* Animated background light effects */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-secondary/10 blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full bg-blue-500/10 blur-[80px] animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-2/3 left-1/3 w-[200px] h-[200px] rounded-full bg-purple-500/10 blur-[120px] animate-pulse-slow animation-delay-1000"></div>
        
        {/* Additional subtle gradient orbs */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-secondary/5 to-transparent blur-[80px] animate-orbit"></div>
        <div className="absolute -bottom-60 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-blue-500/5 to-transparent blur-[100px] animate-orbit animation-delay-3000"></div>
      </div>

      <div className="container-fluid relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-sora tracking-tight">
                <span className="bg-gradient-to-r from-white via-secondary to-blue-400 inline-block text-transparent bg-clip-text animate-gradient bg-gradient-size">
                  AIOS
                </span>
              </h1>
              <div className="text-xl md:text-2xl text-text-light mb-8 max-w-xl h-24 md:h-20">
                <TypeAnimation
                  sequence={[
                    'The ultimate AI assistant designed to connect people with AI tools, boosting productivity and simplifying workflows.',
                    1000, // Wait 1s before starting over
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={0}
                  cursor={true}
                  className="text-xl md:text-2xl text-text-light"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/download" className="btn-primary text-center">
                  Download Now
                </Link>
                <Link href="/features" className="btn-secondary text-center">
                  Explore Features
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Styled interface mockup instead of image */}
            <div className="relative h-[400px] w-full rounded-xl overflow-hidden shadow-2xl shadow-secondary/20 border border-gray-800 bg-primary-gradient-dark">
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
                  <span className="text-gray-300">aios connect --model gpt-4</span>
                </div>
                <div className="text-gray-400 mb-4">Connecting to AI model...</div>
                
                <div className="text-green-400 mb-4">✓ Connection established</div>
                
                <div className="flex mb-2">
                  <span className="text-secondary mr-2">$</span>
                  <span className="text-gray-300">aios run --mcp filesystem --query "Find all PDF files"</span>
                </div>
                
                <div className="bg-secondary/10 border border-secondary/20 rounded p-3 my-3">
                  <div className="text-secondary font-medium mb-2">Results:</div>
                  <div className="text-gray-300">- /documents/report.pdf</div>
                  <div className="text-gray-300">- /downloads/manual.pdf</div>
                  <div className="text-gray-300">- /projects/proposal.pdf</div>
                </div>
                
                <div className="flex">
                  <span className="text-secondary mr-2">$</span>
                  <span className="text-gray-300 animate-pulse">_</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 