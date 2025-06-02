"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu, FiX, FiUser } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { Coins } from "lucide-react";
import { usePoints } from "@/contexts/PointsContext";
import Image from "next/image";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const { balance } = usePoints();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "MCPs", href: "/mcps" },
    { name: "Use Cases", href: "/use-cases" },
    { name: "Pricing", href: "/pricing" },
    { name: "Documentation", href: "/documentation" },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-primary-dark/80 backdrop-blur-xl shadow-lg shadow-secondary/5 py-3 border-b border-gray-800/50"
          : "bg-transparent py-5"
      }`}
    >
      {/* Gradient background with glass effect */}
      <div className="absolute inset-0 opacity-50 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-r from-secondary/5 via-blue-500/5 to-secondary/5 opacity-30 animate-gradient-x"></div>

      <div className="relative z-10 container-fluid">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-transparent font-sora bg-gradient-to-r from-text-default to-secondary bg-clip-text">
              AIOS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-secondary ${
                  pathname === item.href ? "text-secondary" : "text-text-light"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated && (
              <Link
                href="/dashboard/points"
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-default hover:text-secondary"
              >
                <Coins className="w-4 h-4" />
                <span>{balance.toLocaleString()} Points</span>
              </Link>
            )}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 hover:text-secondary"
                >
                  <div className="flex items-center justify-center rounded-full h-9 w-9 bg-secondary/20">
                    {user?.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <FiUser className="w-5 h-5 text-secondary" />
                    )}
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 z-10 w-48 mt-2 border border-gray-800 rounded-md shadow-lg bg-primary-dark">
                    <div className="py-1">
                      <div className="block px-4 py-2 text-sm font-medium border-b border-gray-800 text-text-default">
                        {user?.name || 'User'}
                        <div className="mt-1 text-xs text-text-light">
                          {user?.plan || 'Free'} User
                        </div>
                      </div>
                      <Link
                        href="/dashboard/points"
                        className="flex items-center block gap-2 px-4 py-2 text-sm text-text-default hover:bg-primary-gradient-dark"
                      >
                        <Coins className="w-4 h-4" />
                        Points
                      </Link>
                      <Link
                        href="/reset"
                        className="block px-4 py-2 text-sm text-yellow-400 border-t border-gray-800 hover:bg-primary-gradient-dark"
                      >
                        Reset Demo Data
                      </Link>
                      <button
                        onClick={logout}
                        className="block w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-primary-gradient-dark"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/signin" className="btn-secondary">
                Sign In
              </Link>
            )}
            <Link href="/download" className="btn-primary">
              Download Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="text-text-light hover:text-secondary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="mt-2 border-t border-gray-800 md:hidden bg-primary-gradient-dark">
          <div className="py-4 space-y-4 container-fluid">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block text-base font-medium transition-colors hover:text-secondary ${
                  pathname === item.href ? "text-secondary" : "text-text-light"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 space-y-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/reset"
                    className="block w-full mb-3 text-center text-yellow-400 btn-secondary bg-yellow-500/10 border-yellow-500/30"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Reset Demo Data
                  </Link>
                </>
              ) : (
                <Link
                  href="/signin"
                  className="block w-full mb-3 text-center btn-secondary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
              <Link
                href="/download"
                className="block w-full text-center btn-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Download Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
