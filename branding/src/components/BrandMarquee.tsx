"use client";

import Image from "next/image";
import Reveal from "./Reveal";

export default function BrandMarquee() {
  return (
    <section className="py-16 bg-[#FFF9F5] dark:bg-zinc-900/50 border-y border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex justify-center">
          <span className="px-5 py-1.5 rounded-full bg-[#FFE4E6] text-[#fe2c6c] text-xs font-bold uppercase tracking-widest shadow-sm">
            Popular Brands
          </span>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative flex overflow-x-hidden">
        <div className="flex animate-marquee whitespace-nowrap items-center gap-16 py-4">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="flex-shrink-0 flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100 cursor-pointer">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <span className="text-xl font-black text-gray-400">BRAND {i}</span>
            </div>
          ))}
          {/* Repeat for seamless loop */}
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i+10} className="flex-shrink-0 flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100 cursor-pointer">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <span className="text-xl font-black text-gray-400">BRAND {i}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
           <div className="flex items-center gap-4 border-r border-gray-200 pr-8 hidden md:flex">
             <div className="text-3xl font-bold text-gray-900 tracking-tighter">Capterra</div>
             <div className="text-xs text-gray-500 font-medium leading-tight">Recommended on <br/> Capterra</div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs">G</div>
              <div className="text-gray-600 font-medium text-sm leading-relaxed">
                Ticket9 is trusted by <span className="text-gray-900 font-extrabold underline decoration-brand-pink">700+</span> <br className="hidden sm:block"/> companies of all sizes
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
