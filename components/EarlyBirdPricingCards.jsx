"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Ticket, CheckCircle, ChevronRight, Ban } from "lucide-react";

export default function EarlyBirdPricingCards({ raceCategories, onSelect, selectedCategoryId }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const calculateTimeLeft = (endDate) => {
    const difference = +new Date(endDate) - +currentDate;
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60)
      };
    }
    return timeLeft;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {raceCategories.map((category) => {
          const isEarlyBirdActive = category.early_bird_price && category.early_bird_end && new Date(category.early_bird_end) > currentDate;
          const timeLeft = isEarlyBirdActive ? calculateTimeLeft(category.early_bird_end) : null;
          const isSelected = selectedCategoryId === category.id;

          return (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(category)}
              className={`relative overflow-hidden rounded-2xl border-2 cursor-pointer transition-all ${
                isSelected ? "border-pink-500 shadow-lg shadow-pink-500/20" : "border-slate-200 hover:border-pink-300"
              } bg-white flex flex-col h-full`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-pink-500 z-10">
                  <CheckCircle size={24} className="fill-pink-50" />
                </div>
              )}

              {/* Header */}
              <div className={`p-4 text-center ${isEarlyBirdActive ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-slate-800'}`}>
                <h3 className="text-white font-bold text-xl mb-1 uppercase tracking-wider">{category.category_name}</h3>
                <p className="text-white/80 text-sm font-medium uppercase tracking-widest">{category.distance}</p>
              </div>

              {/* Pricing Content */}
              <div className="p-6 flex-1 flex flex-col items-center justify-center text-center bg-slate-50">
                {isEarlyBirdActive ? (
                  <>
                    <div className="text-slate-400 font-semibold text-lg line-through decoration-red-500 decoration-2 mb-2">
                      ₹{category.regular_price}
                    </div>
                    <div className="flex items-center gap-2 text-pink-600 font-black text-4xl mb-4 drop-shadow-sm">
                      <span className="text-2xl">₹</span>{category.early_bird_price}
                    </div>
                    <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full font-bold text-sm shadow-sm border border-pink-200">
                      🔥 EARLY BIRD
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-800 font-black text-4xl mb-4 mt-6">
                    <span className="text-2xl">₹</span>{category.regular_price}
                  </div>
                )}
              </div>

              {/* Footer / Countdown */}
              {isEarlyBirdActive ? (
                <div className="bg-slate-800 p-3 text-center border-t border-slate-700">
                  <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-sm mb-1">
                    <Clock size={16} />
                    <span>Early Bird Ends In:</span>
                  </div>
                  <div className="text-white font-mono text-xs tracking-wider">
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 p-3 text-center border-t border-slate-200">
                   <div className="flex items-center justify-center gap-2 text-slate-600 font-bold text-sm">
                    <Ticket size={16} />
                    <span>Regular Pricing</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
