"use client";

import React, { useMemo, useState, useRef } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
    TrendingUp, Users, DollarSign, Ticket, Calendar, 
    ArrowUpRight, ArrowDownRight, Download, Filter, 
    ChevronRight, Info, Activity, PieChart as PieIcon, BarChart3,
    Image as ImageIcon, Share2, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as htmlToImage from 'html-to-image';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color, isDark }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
            background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            padding: '24px',
            borderRadius: '24px',
            border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 0.8)'}`,
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: `${color}15`, borderRadius: '50%', filter: 'blur(20px)' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{ padding: '12px', background: `${color}20`, borderRadius: '16px', color: color }}>
                {Icon && <Icon size={24} />}
            </div>
            {trend && (
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    padding: '4px 10px', 
                    borderRadius: '100px', 
                    fontSize: '11px', 
                    fontWeight: 800,
                    background: trend === 'up' ? '#f0fdf4' : '#fef2f2',
                    color: trend === 'up' ? '#16a34a' : '#ef4444',
                    border: `1px solid ${trend === 'up' ? '#dcfce7' : '#fee2e2'}`
                }}>
                    {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trendValue}
                </div>
            )}
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
            <div style={{ fontSize: '32px', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: '-1px' }}>{value}</div>
        </div>
    </motion.div>
);

export default function BookingAnalytics({ events = [], bookings = [], theme = 'light' }) {
    const isDark = theme === 'dark';
    const dashboardRef = useRef(null);
    const [selectedEventId, setSelectedEventId] = useState('all');
    const [isExporting, setIsExporting] = useState(false);

    const stats = useMemo(() => {
        const filteredBookings = bookings.filter(b => {
            const matchesEvent = selectedEventId === 'all' || String(b.event_id) === String(selectedEventId);
            const statusOk = ["Confirmed", "Scanned", "Pending"].includes(b.status);
            return matchesEvent && statusOk;
        });

        const totalRevenue = filteredBookings.reduce((sum, b) => sum + (Number(b.partner_total || b.total_price || b.total_amount) || 0), 0);
        const totalGross = filteredBookings.reduce((sum, b) => sum + (Number(b.total_price || b.total_amount) || 0), 0);
        const totalBonus = filteredBookings.reduce((sum, b) => sum + (Number(b.partner_bonus) || 0), 0);
        const totalTickets = filteredBookings.reduce((sum, b) => sum + (Number(b.ticket_count || 1) || 0), 0);
        
        const currentEvents = selectedEventId === 'all' ? events : events.filter(e => String(e.id) === String(selectedEventId));
        const activeEventsCount = currentEvents.filter(e => e.status?.toLowerCase() === 'published' || e.status?.toLowerCase() === 'active').length;

        const trendMap = {};
        const days = 30;
        const today = new Date();
        const dates = [...Array(days)].map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (days - 1 - i));
            return d.toISOString().split('T')[0];
        });

        dates.forEach(date => trendMap[date] = 0);
        filteredBookings.forEach(b => {
            const date = new Date(b.created_at).toISOString().split('T')[0];
            if (trendMap[date] !== undefined) {
                trendMap[date] += Number(b.partner_total || b.total_price || b.total_amount) || 0;
            }
        });

        const salesTrendData = Object.keys(trendMap).sort().map(date => ({
            date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            revenue: trendMap[date]
        }));

        const eventPerfMap = {};
        filteredBookings.forEach(b => {
            const event = events.find(e => String(e.id) === String(b.event_id || b.turf_id));
            const name = event?.title || event?.name || 'Unknown Facility';
            if (!eventPerfMap[name]) eventPerfMap[name] = { name, revenue: 0, tickets: 0 };
            eventPerfMap[name].revenue += Number(b.partner_total || b.total_price || b.total_amount) || 0;
            eventPerfMap[name].tickets += Number(b.ticket_count || 1) || 0;
        });

        const eventData = Object.values(eventPerfMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        return {
            totalRevenue,
            totalGross,
            totalBonus,
            totalTickets,
            activeEventsCount,
            salesTrendData,
            eventData,
            totalBookings: filteredBookings.length,
            averageOrderValue: totalRevenue / (filteredBookings.length || 1),
            ticketsPerBooking: totalTickets / (filteredBookings.length || 1)
        };
    }, [bookings, events, selectedEventId]);

    const handleExportPNG = async () => {
        if (!dashboardRef.current || isExporting) return;
        setIsExporting(true);
        try {
            const dataUrl = await htmlToImage.toPng(dashboardRef.current, {
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                quality: 1,
                pixelRatio: 2
            });
            const link = document.createElement('a');
            link.download = `analytics-dashboard-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('PNG export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportCSV = () => {
        const headers = ["Date", "Event", "Tickets", "Amount", "Status"];
        const rows = bookings
            .filter(b => selectedEventId === 'all' || String(b.event_id) === String(selectedEventId))
            .map(b => [
                new Date(b.created_at).toLocaleDateString(),
                events.find(e => String(e.id) === String(b.event_id))?.title || 'Unknown',
                b.ticket_count,
                b.total_price,
                b.status
            ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `bookings-report-${selectedEventId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246);
        doc.text("Booking Analytics Summary", 20, 25);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated for: ${selectedEventId === 'all' ? 'All Events' : events.find(e => String(e.id) === String(selectedEventId))?.title}`, 20, 35);
        doc.text(`Date: ${new Date().toLocaleString()}`, 20, 42);

        doc.autoTable({
            startY: 50,
            head: [['Metric', 'Overall Value']],
            body: [
                ['Total Revenue', `₹${stats.totalRevenue.toLocaleString()}`],
                ['Tickets Sold', stats.totalTickets.toLocaleString()],
                ['Active Events', stats.activeEventsCount.toString()],
                ['Average Order Value', `₹${stats.averageOrderValue.toFixed(2)}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text("Top Performance by Event", 20, doc.lastAutoTable.finalY + 15);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Event Name', 'Tickets', 'Revenue']],
            body: stats.eventData.map(e => [e.name, e.tickets, `₹${e.revenue.toLocaleString()}`]),
        });

        doc.save(`analytics-report-${Date.now()}.pdf`);
    };

    return (
        <div ref={dashboardRef} style={{ padding: '2px', fontFamily: "'Inter', sans-serif" }}>
            <div className="no-export" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', marginBottom: '8px', letterSpacing: '-1.0px' }}>
                        Performance Outlook
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>Live data stream active</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ 
                        display: 'flex', 
                        background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#fff', 
                        padding: '6px', 
                        borderRadius: '16px', 
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                        <Filter size={16} style={{ marginLeft: '12px', color: '#64748b' }} />
                        <select 
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                fontSize: '14px', 
                                fontWeight: 700, 
                                color: isDark ? '#f8fafc' : '#1e293b',
                                outline: 'none',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                minWidth: '160px'
                            }}
                        >
                            <option value="all">All Published Events</option>
                            {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={handleExportPNG}
                            disabled={isExporting}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '12px 20px', 
                                background: isDark ? '#1e293b' : '#fff', 
                                color: isDark ? '#f8fafc' : '#1e293b', 
                                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                borderRadius: '16px',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isExporting ? 'Generating...' : <><ImageIcon size={18} /> Snapshot</>}
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '12px 24px', 
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
                                color: '#fff', 
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Download size={18} /> Export PDF
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <MetricCard 
                    title="Partner Net Yield" 
                    value={`₹${stats.totalRevenue.toLocaleString()}`} 
                    icon={DollarSign} 
                    trend="up" 
                    trendValue="12.5%" 
                    color="#3b82f6"
                    isDark={isDark}
                />
                <MetricCard 
                    title="Extra Yield (2%)" 
                    value={`₹${stats.totalBonus.toLocaleString()}`} 
                    color="#10b981"
                    isDark={isDark}
                />
                <MetricCard 
                    title="Gross User Paid" 
                    value={`₹${stats.totalGross.toLocaleString()}`} 
                    icon={Activity} 
                    color="#8b5cf6"
                    isDark={isDark}
                />
                <MetricCard 
                    title="Active Campaigns" 
                    value={stats.activeEventsCount} 
                    icon={Calendar} 
                    color="#ec4899"
                    isDark={isDark}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', marginBottom: '32px' }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ 
                        background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#fff',
                        padding: '32px',
                        borderRadius: '32px',
                        border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
                        height: '450px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 900, color: isDark ? '#f8fafc' : '#1e293b', marginBottom: '4px' }}>Revenue velocity</h3>
                            <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>Daily revenue generation (30d window)</p>
                        </div>
                        <Activity size={24} style={{ color: '#3b82f6' }} />
                    </div>

                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={stats.salesTrendData}>
                            <defs>
                                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                minTickGap={30}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                tickFormatter={(val) => `₹${val >= 1000 ? val/1000 + 'k' : val}`}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    background: isDark ? '#0f172a' : '#fff', 
                                    border: 'none',
                                    borderRadius: '16px',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                    padding: '12px 16px'
                                }}
                                itemStyle={{ color: '#3b82f6', fontWeight: 800, fontSize: '14px' }}
                                labelStyle={{ color: '#94a3b8', fontWeight: 600, fontSize: '11px', marginBottom: '4px' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#3b82f6" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#revenueFill)" 
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ 
                        background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#fff',
                        padding: '32px',
                        borderRadius: '32px',
                        border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
                        height: '450px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 900, color: isDark ? '#f8fafc' : '#1e293b', marginBottom: '4px' }}>Top Performing</h3>
                            <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>Revenue comparison by top 5 events</p>
                        </div>
                        <BarChart3 size={24} style={{ color: '#8b5cf6' }} />
                    </div>

                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={stats.eventData} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                width={120}
                                tick={{ fill: isDark ? '#f8fafc' : '#1e293b', fontSize: 12, fontWeight: 800 }}
                            />
                            <Tooltip 
                                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                                contentStyle={{ 
                                    background: isDark ? '#0f172a' : '#fff', 
                                    border: 'none',
                                    borderRadius: '16px',
                                    padding: '12px'
                                }}
                            />
                            <Bar dataKey="revenue" radius={[0, 20, 20, 0]} barSize={24} animationDuration={1500}>
                                {stats.eventData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                 <div style={{ 
                    background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#fff',
                    padding: '32px',
                    borderRadius: '32px',
                    border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
                }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: isDark ? '#f8fafc' : '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PieIcon size={20} className="text-pink-500" /> Market share
                    </h4>
                    <div style={{ height: '240px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.eventData}
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="tickets"
                                    stroke="none"
                                >
                                    {stats.eventData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>{stats.totalTickets}</div>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Sold</div>
                        </div>
                    </div>
                </div>

                <div style={{ 
                    background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#fff',
                    padding: '32px',
                    borderRadius: '32px',
                    border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 900, color: isDark ? '#f8fafc' : '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Activity size={20} className="text-emerald-500" /> Operational Efficiency
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>Rev. Per Booking</span>
                                <span style={{ fontSize: '16px', fontWeight: 900, color: isDark ? '#f8fafc' : '#1e293b' }}>₹{stats.averageOrderValue.toFixed(0)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>Cart Density</span>
                                <span style={{ fontSize: '16px', fontWeight: 900, color: isDark ? '#f8fafc' : '#1e293b' }}>{stats.ticketsPerBooking.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>tkt/ord</span></span>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ 
                        marginTop: '32px', 
                        padding: '20px', 
                        borderRadius: '24px', 
                        background: 'linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))', 
                        border: '1px dashed rgba(59, 130, 246, 0.2)' 
                    }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <Zap size={22} style={{ color: '#f59e0b', marginTop: '2px' }} />
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Growth Signal</p>
                                <p style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', margin: 0, lineHeight: 1.6 }}>
                                    Your peak interaction occurs at **8 PM**. Schedule your campaign announcements 30 minutes before this window for maximum conversion.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
