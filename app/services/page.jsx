"use client";
import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, Sparkles, Filter, ChevronRight, Flower2, Camera, Palette } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CATEGORY_MAP = {
  "Mehendi Artists": "Mehendi Artist",
  "Photographers/Studios": "Photographer/Studio",
  "Makeup Artists": "Makeup Artist"
};

const CATEGORIES = [
  { name: "Mehendi Artists", icon: <Flower2 size={18} /> },
  { name: "Photographers/Studios", icon: <Camera size={18} /> },
  { name: "Makeup Artists", icon: <Palette size={18} /> },
];

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get("category") || "Mehendi Artists";
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  
  // Map the URL category to the database category
  const dbCategory = CATEGORY_MAP[activeCategory] || activeCategory;
  
  const vendorsRaw = useQuery(api.vendors.listByCategory, { category: dbCategory });
  const vendors = vendorsRaw || [];
  const isLoading = vendorsRaw === undefined;

  // Sync state with URL
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && CATEGORY_MAP[cat]) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  const handleCategoryChange = (catName) => {
    setActiveCategory(catName);
    router.push(`/services?category=${encodeURIComponent(catName)}`, { scroll: false });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-[120px] pb-24">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200 py-12 mb-8">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-100 text-pink-600 text-sm font-bold uppercase tracking-widest">
                            <Sparkles size={16} />
                            <span>Professional Services</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                            Discover Top {activeCategory}
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">
                            Browse portfolios, compare packages, and book the perfect professional for your special day.
                        </p>
                    </div>
                </div>

                {/* Categories Tabs */}
                <div className="flex items-center gap-3 mt-10 overflow-x-auto pb-4 scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => handleCategoryChange(cat.name)}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl whitespace-nowrap font-bold transition-all ${
                                activeCategory === cat.name
                                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                            {cat.icon}
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
                <p className="font-bold text-slate-500">
                    Showing <span className="text-slate-900">{vendors.length}</span> professionals
                </p>
                <button className="flex items-center space-x-2 font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200">
                    <Filter size={18} />
                    <span>Filter & Sort</span>
                </button>
            </div>

            {/* Vendor Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="animate-pulse bg-white rounded-3xl h-96 border border-slate-100"></div>
                    ))}
                </div>
            ) : vendors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vendors.map((vendor) => {
                        // Find starting price
                        const startingPrice = vendor.pricing && vendor.pricing.length > 0 
                            ? Math.min(...vendor.pricing.map(p => p.price)) 
                            : null;
                        
                        // Get primary photo
                        const coverPhoto = vendor.portfolio && vendor.portfolio.length > 0 
                            ? vendor.portfolio[0].url.startsWith('http') ? vendor.portfolio[0].url : `https://images.unsplash.com/photo-1596704017254-9b1210630b65?q=80&w=800`
                            : `https://images.unsplash.com/photo-1596704017254-9b1210630b65?q=80&w=800`; // Placeholder

                        return (
                            <Link 
                                href={`/services/${vendor.id}`} 
                                key={vendor.id}
                                className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 flex flex-col"
                            >
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                                    <img 
                                        src={coverPhoto} 
                                        alt={vendor.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    {vendor.rating > 0 && (
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-lg">
                                            <Star size={14} className="text-yellow-500" fill="currentColor" />
                                            <span className="text-sm font-black text-slate-900">{vendor.rating.toFixed(1)}</span>
                                            <span className="text-xs text-slate-500 font-bold">({vendor.reviewsCount})</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 md:p-8 flex flex-col flex-grow">
                                    <div className="flex-grow space-y-3">
                                        <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                            <MapPin size={14} className="text-pink-500" />
                                            <span className="truncate">{vendor.advancedSettings?.serviceLocations || "Multiple Locations"}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-pink-600 transition-colors line-clamp-1">
                                            {vendor.name}
                                        </h3>
                                        <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed">
                                            {vendor.bio || `${vendor.category} providing premium services for your special day.`}
                                        </p>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                        <div>
                                            {startingPrice ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Starts At</p>
                                                    <p className="text-lg font-black text-slate-900">₹{startingPrice}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm font-bold text-slate-500">Price on Request</p>
                                            )}
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-600 transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] border border-slate-200 py-32 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                        <Sparkles size={48} />
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Professionals Found</h3>
                        <p className="text-slate-500 font-medium">We couldn't find any {activeCategory.toLowerCase()} at the moment. Please check back later or try another category.</p>
                    </div>
                </div>
            )}
        </div>
      </main>
      <Footer />
    </>
  );
}
