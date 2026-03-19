"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-pink flex items-center justify-center text-white font-bold text-xl shadow-lg">
              B
            </div>
            <span className="font-bold text-2xl tracking-tight text-text-primary">
              BookMyTicket
            </span>
          </Link>
          <p className="text-text-secondary font-medium">Welcome back!</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">Sign In</h2>
          
          <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-primary ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand-pink outline-none transition-all"
                  placeholder="v.rajadece@gmail.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-text-primary">Password</label>
                <Link href="#" className="text-xs font-semibold text-brand-pink hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand-pink outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button className="w-full py-4 rounded-2xl bg-brand-indigo text-white font-bold text-lg shadow-lg shadow-brand-indigo/20 hover:bg-brand-purple transition-all mt-2 flex items-center justify-center gap-2 group">
              Sign In
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account?{" "}
              <Link href="#" className="font-bold text-brand-indigo hover:text-brand-purple transition-colors">Sign Up</Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2">
             Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
