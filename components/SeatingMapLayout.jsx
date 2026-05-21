"use client";

import React, { useState } from 'react';

const SEAT_STATUS = {
  AVAILABLE: 'available',
  SELECTED: 'selected',
  BLOCKED: 'blocked',
  EMPTY: 'empty'
};

const Seat = ({ id, number, status, onClick }) => {
  if (status === SEAT_STATUS.EMPTY) {
    return <div className="w-8 h-8 sm:w-10 sm:h-10 m-1" />;
  }

  let baseClasses = "w-8 h-8 sm:w-10 sm:h-10 m-1 rounded-md text-xs sm:text-sm font-semibold flex items-center justify-center transition-all border-[1.5px] select-none ";
  
  if (status === SEAT_STATUS.AVAILABLE) {
    baseClasses += " border-emerald-500 text-slate-600 bg-white hover:bg-emerald-50 cursor-pointer";
  } else if (status === SEAT_STATUS.SELECTED) {
    baseClasses += " border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 text-slate-700 shadow-[0_0_10px_rgba(251,191,36,0.6)] cursor-pointer";
  } else if (status === SEAT_STATUS.BLOCKED) {
    baseClasses += " border-slate-200 bg-slate-200 text-white cursor-not-allowed";
  }

  return (
    <div 
      className={baseClasses}
      onClick={() => status !== SEAT_STATUS.BLOCKED && onClick(id)}
    >
      {number}
    </div>
  );
};

export default function SeatingMapLayout() {
  const [selectedSeats, setSelectedSeats] = useState(new Set());

  const toggleSeat = (seatId) => {
    setSelectedSeats(prev => {
      const next = new Set(prev);
      if (next.has(seatId)) {
        next.delete(seatId);
      } else {
        next.add(seatId);
      }
      return next;
    });
  };

  // Helper to generate a row of seats
  const renderRow = (prefix, startNum, statuses) => {
    return statuses.map((status, index) => {
      const seatNum = String(startNum + index).padStart(2, '0');
      const seatId = `${prefix}-${seatNum}`;
      
      const currentStatus = status === SEAT_STATUS.EMPTY 
        ? SEAT_STATUS.EMPTY 
        : status === SEAT_STATUS.BLOCKED
          ? SEAT_STATUS.BLOCKED
          : selectedSeats.has(seatId) 
            ? SEAT_STATUS.SELECTED 
            : SEAT_STATUS.AVAILABLE;

      return (
        <Seat 
          key={seatId} 
          id={seatId}
          number={seatNum} 
          status={currentStatus}
          onClick={toggleSeat}
        />
      );
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-10 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-[1.5px] border-emerald-500 rounded bg-white"></div>
          <span className="text-sm font-medium text-slate-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-[1.5px] border-amber-400 bg-amber-50 rounded shadow-[0_0_8px_rgba(251,191,36,0.4)]"></div>
          <span className="text-sm font-medium text-slate-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-[1.5px] border-slate-200 bg-slate-200 rounded"></div>
          <span className="text-sm font-medium text-slate-600">Blocked</span>
        </div>
      </div>

      {/* Screen / Stage Indicator */}
      <div className="w-full flex flex-col items-center mb-16">
        <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full opacity-50"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Stage / Screen</p>
      </div>

      <div className="flex flex-col items-center w-full space-y-12">
        
        {/* Platinum Section */}
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex items-center justify-center gap-4 mb-6 relative">
            <div className="absolute w-full h-px bg-slate-100"></div>
            <span className="bg-white px-4 text-slate-800 font-bold tracking-wide relative z-10">₹180 Platinum</span>
          </div>

          <div className="flex gap-8 sm:gap-16 justify-center w-full overflow-x-auto pb-4">
            {/* Left Block */}
            <div className="flex flex-col gap-1">
              <div className="flex">{renderRow('P-L1', 1, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED])}</div>
              <div className="flex">{renderRow('P-L2', 1, [SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED])}</div>
              <div className="flex">{renderRow('P-L3', 1, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex mt-4">{renderRow('P-L4', 1, [SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-L5', 1, [SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-L6', 1, [SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-L7', 1, [SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.EMPTY, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              
              <div className="flex mt-8">{renderRow('P-L8', 1, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-L9', 1, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
            </div>

            {/* Right Block */}
            <div className="flex flex-col gap-1">
              <div className="flex">{renderRow('P-R1', 9, [SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED, SEAT_STATUS.BLOCKED, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-R2', 9, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-R3', 9, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex mt-4">{renderRow('P-R4', 5, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-R5', 5, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-R6', 5, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-R7', 5, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-R8', 1, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              
              <div className="flex mt-8">{renderRow('P-R9', 9, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
              <div className="flex">{renderRow('P-R10', 9, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
            </div>
          </div>
        </div>

        {/* Gold Section */}
        <div className="w-full flex flex-col items-center mt-8">
          <div className="w-full flex items-center justify-center gap-4 mb-6 relative">
            <div className="absolute w-full h-px bg-slate-100"></div>
            <span className="bg-white px-4 text-slate-800 font-bold tracking-wide relative z-10">₹180 GOLD</span>
          </div>

          <div className="flex gap-8 sm:gap-16 justify-center w-full overflow-x-auto pb-4">
            {/* Left Block */}
            <div className="flex flex-col gap-1">
              <div className="flex">{renderRow('G-L1', 1, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
            </div>

            {/* Right Block */}
            <div className="flex flex-col gap-1">
              <div className="flex">{renderRow('G-R1', 9, [SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE, SEAT_STATUS.AVAILABLE])}</div>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Footer Summary */}
      {selectedSeats.size > 0 && (
        <div className="sticky bottom-4 mt-12 p-4 bg-slate-900 rounded-xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold">
              {selectedSeats.size}
            </div>
            <div>
              <p className="text-white font-medium text-sm">Seats Selected</p>
              <p className="text-slate-400 text-xs">Total: ₹{selectedSeats.size * 180}</p>
            </div>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-lg font-bold transition-colors">
            Proceed
          </button>
        </div>
      )}
    </div>
  );
}
