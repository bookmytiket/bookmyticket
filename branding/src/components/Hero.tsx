import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Reveal from "./Reveal";

export default function Hero() {
  return (
    <section className="relative pt-40 pb-32 overflow-hidden bg-white dark:bg-black">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-brand-pink/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-blue/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="flex flex-col gap-8 text-center lg:text-left">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-brand-pink/10 text-brand-pink text-xs font-bold uppercase tracking-wider mb-6">
                  NEW ERA OF TICKETING
                </span>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1]">
                  Branding made{" "}
                  <span className="bg-gradient-to-r from-brand-blue to-brand-pink bg-clip-text text-transparent">
                    Simple and Powerful
                  </span>
                </h1>
              </div>
              
              <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Transform your ticket booking experience with our modern, 
                customizable branding suite. Built for speed, designed for beauty.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/branding-preview"
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-brand-indigo to-brand-purple text-white font-bold text-lg hover:shadow-xl hover:shadow-brand-indigo/20 transition-all flex items-center justify-center gap-2 group"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/branding-preview"
                  className="px-8 py-4 rounded-full border-2 border-gray-200 dark:border-gray-800 text-text-primary font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                >
                  View Demo
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-black bg-gray-200 dark:bg-gray-800 shrink-0"
                    />
                  ))}
                </div>
                <p className="text-sm text-text-secondary">
                  Joined by <span className="font-bold text-text-primary">10k+</span> creators
                </p>
              </div>
            </div>
          </Reveal>

          {/* Illustration Placeholder */}
          <Reveal delay={0.2}>
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-black border border-gray-200 dark:border-gray-800 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-brand-blue/5 mix-blend-overlay" />
                <div className="text-gray-400 font-medium text-center p-8">
                  <div className="text-4xl mb-4">✨</div>
                  Interactive Branding Dashboard
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
