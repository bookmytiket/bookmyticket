"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Ticket, CheckCircle, ChevronRight } from "lucide-react";

export default function EarlyBirdPricingCards({ raceCategories, onSelect, selectedCategoryId }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const calculateTimeLeft = (endDate) => {
    const difference = +new Date(endDate) - +currentDate;
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60)
      };
    }
    return {};
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {raceCategories.map((category) => {
          const isEarlyBirdActive = category.early_bird_price && category.early_bird_end && new Date(category.early_bird_end) > currentDate;
          const timeLeft = isEarlyBirdActive ? calculateTimeLeft(category.early_bird_end) : null;
          const isSelected = selectedCategoryId === category.id;
          const price = category.regular_price || category.price;

          return (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(category)}
              className={`relative overflow-hidden rounded-2xl border-2 cursor-pointer transition-all flex flex-row ${
                isSelected
                  ? "border-pink-500 shadow-lg shadow-pink-500/20"
                  : "border-slate-200 hover:border-pink-300"
              } bg-white`}
            >
              {/* Selected tick */}
              {isSelected && (
                <div className="absolute top-3 right-3 text-pink-500 z-10">
                  <CheckCircle size={22} className="fill-pink-50" />
                </div>
              )}

              {/* LEFT: Dark header with category name */}
              <div className={`flex flex-col items-center justify-center p-4 min-w-[140px] max-w-[180px] shrink-0 ${isEarlyBirdActive ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-slate-800'}`}>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider text-center leading-snug">
                  {category.category_name}
                </h3>
                {category.distance && (
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mt-1 text-center">
                    {category.distance}
                  </p>
                )}
              </div>

              {/* RIGHT: Price + footer */}
              <div className="flex flex-row flex-1 items-stretch">

                {/* Price section */}
                <div className="flex-1 flex flex-col items-start justify-center px-6 py-4 bg-slate-50">
                  {isEarlyBirdActive ? (
                    <>
                      <div className="text-slate-400 font-semibold text-sm line-through decoration-red-500 decoration-2 mb-1">
                        ₹{price}
                      </div>
                      <div className="flex items-baseline gap-1 text-pink-600 font-black text-3xl">
                        <span className="text-xl">₹</span>{category.early_bird_price}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-bold text-xs border border-pink-200">
                        🔥 EARLY BIRD
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1 text-slate-800 font-black text-3xl">
                      <span className="text-xl">₹</span>{price}
                    </div>
                  )}
                </div>

                {/* Footer / Countdown strip — right side */}
                {isEarlyBirdActive ? (
                  <div className="bg-slate-800 flex flex-col items-center justify-center px-4 py-3 shrink-0 min-w-[110px] border-l border-slate-700">
                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-[10px] mb-1 uppercase tracking-wider">
                      <Clock size={12} />
                      <span>Ends In</span>
                    </div>
                    <div className="text-white font-mono text-xs tracking-wider text-center">
                      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 flex flex-col items-center justify-center px-4 py-3 shrink-0 min-w-[110px] border-l border-slate-200">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                      <Ticket size={14} />
                      <span>Regular</span>
                    </div>
                    <div className="text-slate-400 text-[10px] font-semibold mt-0.5">Pricing</div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
