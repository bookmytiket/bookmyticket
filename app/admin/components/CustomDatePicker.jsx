import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CustomDatePicker = ({ value, onChange, placeholder, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleSelectDate = (day, e) => {
        e.stopPropagation();
        const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Format to YYYY-MM-DD
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const formattedDay = String(selectedDate.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${formattedDay}`);
        setIsOpen(false);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    padding: "12px 16px", 
                    borderRadius: "12px", 
                    border: `1px solid ${t.border}`, 
                    background: t.bg, 
                    color: value ? t.textMain : t.textSub, 
                    fontSize: "14px", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    fontWeight: value ? 600 : 500,
                    transition: "all 0.2s ease"
                }}
            >
                {value ? new Date(value).toLocaleDateString() : (placeholder || "Select Date")}
                <CalendarIcon size={16} style={{ opacity: 0.5 }} />
            </div>

            {isOpen && (
                <div style={{ 
                    position: "absolute", 
                    top: "calc(100% + 8px)", 
                    left: 0, 
                    width: "280px", 
                    background: t.cardBg, 
                    border: `1px solid ${t.border}`, 
                    borderRadius: "16px", 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)", 
                    zIndex: 100, 
                    padding: "16px"
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <button type="button" onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: t.textMain, borderRadius: '8px' }} onMouseOver={e => e.currentTarget.style.backgroundColor = t.bg} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <ChevronLeft size={18} />
                        </button>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: t.textMain }}>
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </div>
                        <button type="button" onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: t.textMain, borderRadius: '8px' }} onMouseOver={e => e.currentTarget.style.backgroundColor = t.bg} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center' }}>
                        {weekDays.map(day => (
                            <div key={day} style={{ fontSize: '10px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase' }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = value && new Date(value).getDate() === day && new Date(value).getMonth() === currentDate.getMonth() && new Date(value).getFullYear() === currentDate.getFullYear();
                            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                            
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={(e) => handleSelectDate(day, e)}
                                    style={{
                                        padding: '8px 0',
                                        background: isSelected ? 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)' : (isToday ? t.bg : 'transparent'),
                                        border: isToday && !isSelected ? `1px solid ${t.border}` : 'none',
                                        color: isSelected ? '#fff' : t.textMain,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: isSelected ? 800 : 600,
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? '0 4px 10px rgba(248, 68, 100, 0.3)' : 'none'
                                    }}
                                    onMouseOver={e => !isSelected && (e.currentTarget.style.backgroundColor = t.bg)}
                                    onMouseOut={e => !isSelected && (e.currentTarget.style.backgroundColor = isToday ? t.bg : 'transparent')}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
