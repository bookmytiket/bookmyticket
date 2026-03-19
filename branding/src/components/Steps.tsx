"use client";

import { useEffect, useState } from "react";
import { Settings, Plus, BarChart3, RotateCw, ShieldCheck, Zap, Ticket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Reveal from "./Reveal";

const steps = [
  {
    id: "setup",
    number: "STEP 1",
    title: "Setup",
    subtitle: "Brand Onboarding",
    description: "Launch your brand presence in minutes.",
    icon: Settings,
    bgColor: "bg-[#F3E8FF]", // Light Purple
    tabColor: "text-brand-pink",
    borderColor: "border-purple-200/50",
    features: [
      { 
        name: "Create Your Brand Profile", 
        icon: Settings,
        desc: "Build your brand profile to showcase your identity and create lasting connections."
      },
      { 
        name: "Verify KYC & Go Live", 
        icon: ShieldCheck,
        desc: "Set up your KYC verification and instantly connect your brand to a world of event-goers."
      },
    ],
    image: "👩‍💻",
  },
  {
    id: "create",
    number: "STEP 2",
    title: "Create",
    subtitle: "Design Digital Coupons",
    description: "Craft perfect offers for your audience.",
    icon: Plus,
    bgColor: "bg-[#FFF1F2]", // Light Rose
    tabColor: "text-brand-pink",
    borderColor: "border-rose-200/50",
    features: [
      { 
        name: "Design Digital Coupon", 
        icon: Ticket,
        desc: "Design and launch digital coupons that match your brand customize offers and visuals."
      },
      { 
        name: "Distribute across Channels", 
        icon: Zap,
        desc: "Distribute your brand's coupons via Website, e-mail and whatsapp for maximum visibility."
      },
    ],
    image: "✨",
  },
  {
    id: "track",
    number: "STEP 3",
    title: "Track",
    subtitle: "Reach Customers",
    description: "Measure every interaction in real-time.",
    icon: BarChart3,
    bgColor: "bg-[#F0FDF4]", // Light Emerald
    tabColor: "text-emerald-600",
    borderColor: "border-emerald-200/50",
    features: [
      { 
        name: "Real time analytics", 
        icon: BarChart3,
        desc: "Monitor and optimize coupon and event performance in real-time on the dashboard."
      },
      { 
        name: "Live Coupon Status", 
        icon: BarChart3,
        desc: "Instantly see how many people have availed and redeemed your coupons on the dashboard."
      },
    ],
    image: "📊",
  },
  {
    id: "repeat",
    number: "STEP 4",
    title: "Repeat",
    subtitle: "Coupon Refinement & Retention",
    description: "Scale your reach with smart automation.",
    icon: RotateCw,
    bgColor: "bg-[#FEFCE8]", // Light Yellow
    tabColor: "text-yellow-700",
    borderColor: "border-yellow-200/50",
    features: [
      { 
        name: "Adjust targeting", 
        icon: RotateCw,
        desc: "Target the right customers with tailored coupons to maximize redemptions and ROI."
      },
      { 
        name: "Customer Retention", 
        icon: RotateCw,
        desc: "Keep customers coming back with tailored interactions, ensuring long-term loyalty."
      },
    ],
    image: "🚀",
  },
];

export default function Steps() {
  const [activeTab, setActiveTab] = useState(steps[0].id);

  useEffect(() => {
    const handleScroll = () => {
      // Offset for how far down the screen we want to trigger the active state.
      // Usually around 150-200px from top, where the sticky nav sits.
      const scrollPosition = window.scrollY + 300; 
      
      let currentActiveId = steps[0].id;
      
      for (const step of steps) {
        const element = document.getElementById(step.id);
        if (element) {
          const { offsetTop } = element;
          if (scrollPosition >= offsetTop) {
            currentActiveId = step.id;
          }
        }
      }
      
      setActiveTab(currentActiveId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger once on mount to set initial correct tab
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToStep = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset slightly to account for the sticky tabs height
      const top = element.offsetTop - 180; 
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <section className="relative bg-[#FDFDFF] dark:bg-black py-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Sticky Header & Tabs */}
        <div className="sticky top-[60px] z-[40] bg-[#FDFDFF]/90 dark:bg-black/90 backdrop-blur-md pt-8 pb-6 mb-16 border-b border-gray-100 dark:border-gray-800 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all duration-300">
          <Reveal>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1a1c20] dark:text-white leading-tight mb-8 tracking-tight text-center">
              Your entire brand journey in one place
            </h2>

            <div className="flex flex-wrap justify-center gap-3">
              {steps.map((step) => {
                const isActive = activeTab === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => scrollToStep(step.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border shadow-sm",
                      isActive 
                        ? cn("bg-white dark:bg-gray-700 border-transparent shadow-md transform scale-105", step.tabColor)
                        : "bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105"
                    )}
                  >
                    <step.icon className={cn("w-4 h-4 transition-colors duration-300", isActive ? step.tabColor : "text-gray-400")} />
                    {step.title}
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* Steps Content List */}
        <div className="flex flex-col gap-24 lg:gap-32 w-full flex-grow items-center justify-center relative">
          {steps.map((step) => (
            <div key={step.id} id={step.id} className="w-full scroll-mt-40">
              <Reveal>
                <StepCard step={step} />
              </Reveal>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}

function StepCard({ step }: { step: any }) {
  return (
    <div
      className={cn(
        "w-full max-w-5xl mx-auto aspect-auto lg:aspect-[16/8] rounded-[48px] p-8 md:p-12 lg:p-16 border bg-white dark:bg-gray-900 shadow-2xl flex flex-col lg:flex-row gap-12 items-center relative overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]",
        step.borderColor
      )}
    >
      {/* Theme wash */}
      <div className={cn("absolute inset-0 opacity-[0.05]", step.bgColor)} />

      {/* Content Side */}
      <div className="flex-[6] text-left relative z-10 w-full lg:w-auto h-full flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-black flex items-center justify-center text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-800">
            <step.icon className="w-5 h-5" />
          </div>
          <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{step.number}</span>
        </div>
        
        <h3 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black text-[#1a1c20] dark:text-white mb-2 tracking-tighter leading-[1.1]">{step.title}</h3>
        <p className="text-xl text-[#334155] dark:text-gray-400 mb-10 font-bold leading-relaxed">{step.subtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-12 flex-grow">
          {step.features.map((feature: any, i: number) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-800 dark:text-gray-200 border border-gray-100/50 bg-white/80 dark:bg-black/40 shadow-sm">
                <feature.icon className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-gray-900 dark:text-white leading-tight text-lg">{feature.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-auto">
           <button className="bg-[#f43f5e] text-white px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-rose-600 transition-all shadow-xl shadow-rose-100 dark:shadow-rose-900/20 active:scale-95 group w-full md:w-auto">
            Get Started <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Illustration Side */}
      <div className="flex-[4] w-full min-h-[300px] lg:h-full bg-[#F8F9FB] dark:bg-[#0F172A] rounded-[32px] p-4 shadow-inner border border-gray-100 dark:border-gray-800 flex items-center justify-center relative overflow-hidden">
         <div className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden border border-gray-50 dark:border-gray-700 shadow-sm transition-transform duration-500 hover:scale-105">
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className="text-[100px] md:text-[120px] drop-shadow-2xl select-none leading-none transform transition-transform duration-700 hover:rotate-6">
                {step.image}
              </div>
              <div className="px-6 py-2 bg-[#F8F9FB] dark:bg-black rounded-full text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] shadow-sm border border-gray-100 dark:border-gray-800">
                {step.title} PREVIEW
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/5 via-transparent to-brand-blue/5 pointer-events-none" />
         </div>
      </div>
    </div>
  );
}
