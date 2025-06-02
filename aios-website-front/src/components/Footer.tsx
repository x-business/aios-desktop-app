import Link from "next/link";
import { FiGithub, FiTwitter, FiLinkedin, FiYoutube } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="bg-black py-12">
      <div className="container-fluid">
        {/* Logo and description */}
        <div className="mb-8">
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold font-sora bg-gradient-to-r from-text-default to-secondary bg-clip-text text-transparent">
              AIOS
            </span>
          </Link>
          <p className="mt-4 text-text-light text-sm max-w-lg">
            The ultimate AI assistant designed to connect people with AI tools, boosting productivity and simplifying workflows.
          </p>
          <div className="flex space-x-6 mt-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-light hover:text-secondary transition-colors"
            >
              <FiGithub className="h-6 w-6" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-light hover:text-secondary transition-colors"
            >
              <FiTwitter className="h-6 w-6" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-light hover:text-secondary transition-colors"
            >
              <FiLinkedin className="h-6 w-6" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-light hover:text-secondary transition-colors"
            >
              <FiYoutube className="h-6 w-6" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
          {/* Site Map */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg text-text-default font-medium font-sora mb-4">Site Map</h3>
            <div className="grid grid-cols-2 gap-x-4">
              {/* First column */}
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/"
                    className="text-text-light hover:text-secondary transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features"
                    className="text-text-light hover:text-secondary transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mcps"
                    className="text-text-light hover:text-secondary transition-colors"
                  >
                    MCPs
                  </Link>
                </li>
              </ul>
              
              {/* Second column */}
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/use-cases"
                    className="text-text-light hover:text-secondary transition-colors"
                  >
                    Use Cases
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-text-light hover:text-secondary transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documentation"
                    className="text-text-light hover:text-secondary transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-lg text-text-default font-medium font-sora mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/documentation"
                  className="text-text-light hover:text-secondary transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-text-light hover:text-secondary transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1">
            <h3 className="text-lg text-text-default font-medium font-sora mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-text-light hover:text-secondary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-text-light hover:text-secondary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  className="text-text-light hover:text-secondary transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-center md:justify-between items-center">
          <p className="text-text-light text-center md:text-left mb-6 md:mb-0">
            &copy; 2025 Blackcode Research. All rights reserved.
          </p>
          <div className="flex justify-center">
            <Link
              href="/download"
              className="btn-primary border-none text-white bg-teal-500 hover:bg-teal-600 px-6 py-3 rounded-md"
            >
              Download Now
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 