"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Plus, Upload, Palette, Type, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrandingPreview() {
  const [brandName, setBrandName] = useState("My Brand");
  const [primaryColor, setPrimaryColor] = useState("#fe2c6c");
  const [logoUrl, setLogoUrl] = useState("");
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-gray-900 flex flex-col pt-20">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Editor Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Create Your Brand</h1>
              <p className="text-text-secondary">Customize your ticket's look and feel in real-time.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-6">
              {/* Brand Name Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Type className="w-4 h-4" /> Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand-pink outline-none"
                  placeholder="Enter brand name"
                />
              </div>

              {/* Color Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Primary Color
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border-none cursor-pointer"
                  />
                  <span className="text-sm font-mono text-text-secondary uppercase">{primaryColor}</span>
                </div>
              </div>

              {/* Logo Upload Simulation */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Brand Logo
                </label>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-text-secondary hover:border-brand-pink transition-colors cursor-pointer group">
                  <Plus className="w-6 h-6 group-hover:scale-120 transition-transform" />
                  <span className="text-xs">Upload 300x300 PNG</span>
                </div>
              </div>

              <button className="w-full py-4 rounded-full bg-brand-indigo text-white font-bold shadow-lg shadow-brand-indigo/20 hover:bg-brand-purple transition-all mt-4">
                Save Branding
              </button>
            </div>
          </div>

          {/* Real-time Mockup Preview */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-[48px] p-12 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-pink/10 blur-[100px] rounded-full" />
            
            <div className="text-center mb-8 flex items-center gap-2 text-text-secondary font-medium">
              <Smartphone className="w-5 h-5" /> Live Mobile Preview
            </div>

            {/* Mobile Phone Frame */}
            <div className="w-[320px] h-[640px] bg-black rounded-[50px] border-[8px] border-black shadow-2xl relative flex flex-col overflow-hidden">
              {/* Speaker/Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />
              
              {/* App Content */}
              <div className="flex-grow bg-white flex flex-col overflow-y-auto">
                {/* App Header */}
                <div className="pt-8 pb-4 px-6 flex items-center justify-between border-b border-gray-100">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-[10px]" style={{ backgroundColor: primaryColor + "20", color: primaryColor }}>
                    {brandName[0]}
                  </div>
                  <div className="text-xs font-bold text-gray-900">{brandName}</div>
                  <div className="w-8" />
                </div>

                {/* Ticket Content */}
                <div className="p-6 flex flex-col gap-6">
                  <div className="w-full aspect-[16/9] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-xs italic">
                    Event Image Placeholder
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="h-6 w-3/4 bg-gray-100 rounded-md" />
                    <div className="h-4 w-1/2 bg-gray-100 rounded-md" />
                  </div>

                  {/* Branded Button */}
                  <div 
                    className="w-full py-3 rounded-xl text-white text-center text-sm font-bold shadow-lg transition-all"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Get Tickets
                  </div>

                  {/* Branded Label */}
                  <div 
                    className="w-fit px-3 py-1 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
                  >
                    VERIFIED BRAND
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
