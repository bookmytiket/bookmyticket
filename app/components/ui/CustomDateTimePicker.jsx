import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomDateTimePicker({ value, onChange, label }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const [time, setTime] = useState({ 
        hours: value ? new Date(value).getHours().toString().padStart(2, '0') : '12', 
        minutes: value ? new Date(value).getMinutes().toString().padStart(2, '0') : '00' 
    });
    
    const popupRef = useRef(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const handleDateSelect = (day) => {
        if (!day) return;
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setSelectedDate(newDate);
        updateValue(newDate, time.hours, time.minutes);
    };

    const handleTimeChange = (type, val) => {
        const newTime = { ...time, [type]: val };
        setTime(newTime);
        if (selectedDate) {
            updateValue(selectedDate, newTime.hours, newTime.minutes);
        }
    };

    const updateValue = (date, hrs, mins) => {
        const finalDate = new Date(date);
        finalDate.setHours(parseInt(hrs), parseInt(mins));
        // Adjust for local timezone offset so it saves correctly
        const offset = finalDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(finalDate - offset)).toISOString().slice(0, 16);
        onChange(localISOTime);
    };

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="relative" ref={popupRef}>
            <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 rounded-xl border border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none transition-all bg-white/80 backdrop-blur-sm font-medium cursor-pointer flex justify-between items-center"
            >
                <span className={selectedDate ? "text-slate-800" : "text-slate-400"}>
                    {selectedDate 
                        ? `${selectedDate.toLocaleDateString()} ${time.hours}:${time.minutes}`
                        : "Select Date & Time"}
                </span>
                <Calendar className="w-5 h-5 text-pink-500" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-pink-100 w-72 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={prevMonth} className="p-1 hover:bg-pink-50 rounded-lg text-pink-600 transition-colors"><ChevronLeft size={20}/></button>
                        <div className="font-bold text-slate-800">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </div>
                        <button type="button" onClick={nextMonth} className="p-1 hover:bg-pink-50 rounded-lg text-pink-600 transition-colors"><ChevronRight size={20}/></button>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-center text-xs font-bold text-slate-400">{d}</div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {days.map((day, idx) => (
                            <button
                                key={idx}
                                type="button"
                                disabled={!day}
                                onClick={() => handleDateSelect(day)}
                                className={`
                                    h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                                    ${!day ? '' : 'hover:bg-pink-100 hover:text-pink-600'}
                                    ${selectedDate && day === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth() && currentMonth.getFullYear() === selectedDate.getFullYear()
                                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30' 
                                        : day ? 'text-slate-700' : ''}
                                `}
                            >
                                {day || ''}
                            </button>
                        ))}
                    </div>

                    <hr className="border-slate-100 mb-4" />

                    {/* Time Picker */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-slate-600 font-bold">
                            <Clock size={16} className="text-pink-500" /> Time
                        </div>
                        <div className="flex items-center gap-1">
                            <select 
                                value={time.hours} 
                                onChange={(e) => handleTimeChange('hours', e.target.value)}
                                className="p-1 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-pink-500"
                            >
                                {[...Array(24)].map((_, i) => (
                                    <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                            <span className="font-bold text-slate-400">:</span>
                            <select 
                                value={time.minutes} 
                                onChange={(e) => handleTimeChange('minutes', e.target.value)}
                                className="p-1 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-pink-500"
                            >
                                {['00', '15', '30', '45'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <button 
                        type="button" 
                        onClick={() => setIsOpen(false)}
                        className="mt-4 w-full py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold rounded-xl transition-colors text-sm"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
}
