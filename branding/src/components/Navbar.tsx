"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-md border-gray-200 dark:border-gray-800 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-pink flex items-center justify-center text-white font-bold">
              B
            </div>
            <span className="font-bold text-xl tracking-tight text-text-primary">
              BookMyTicket
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-sm font-medium text-text-secondary hover:text-brand-pink transition-colors">Home</Link>
            <Link href="/branding-preview" className="text-sm font-medium text-text-secondary hover:text-brand-pink transition-colors">Branding Preview</Link>
            <Link href="#" className="text-sm font-medium text-text-secondary hover:text-brand-pink transition-colors">Features</Link>
            <Link href="#" className="text-sm font-medium text-text-secondary hover:text-brand-pink transition-colors">About</Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/branding-preview"
              className="px-5 py-2 rounded-full bg-brand-indigo hover:bg-brand-purple text-white text-sm font-semibold transition-all shadow-lg hover:shadow-brand-indigo/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
