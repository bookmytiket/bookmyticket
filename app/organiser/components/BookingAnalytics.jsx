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
    const [activeTab, setActiveTab] = useState('insights'); // 'insights' or 'report'

    const stats = useMemo(() => {
        const filteredBookings = bookings.filter(b => {
            const matchesEvent = selectedEventId === 'all' || String(b.event_id) === String(selectedEventId);
            const statusOk = ["Confirmed", "Scanned"].includes(b.status);
            return matchesEvent && statusOk;
        });

        // Detailed Report Data Extraction
        const detailedReport = filteredBookings.map(b => {
            const details = b.customer_details || {};
            // Extract common marathon/event fields with fallbacks
            return {
                id: b.id,
                date: new Date(b.created_at).toLocaleDateString(),
                firstName: details.firstName || details['Full Name'] || details.name?.split(' ')[0] || 'N/A',
                lastName: details.lastName || details.name?.split(' ').slice(1).join(' ') || '',
                email: details.email || details['Email'] || b.user_email || 'N/A',
                phone: details.phone || details['Mobile'] || details.contact || details.mobile || 'N/A',
                km: details.km || details.distance || details.category || 'N/A',
                tshirtSize: details.tshirtSize || details['T-Shirt Size'] || details.tshirt || details.size || 'N/A',
                gender: details.gender || details['Gender'] || 'N/A',
                status: b.status,
                amount: Number(b.total_price || b.total_amount || 0),
                rawDetails: details
            };
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

        // Registration Insights Analysis
        const regFieldCounts = {};
        filteredBookings.forEach(b => {
            const details = b.customer_details || {};
            Object.entries(details).forEach(([key, value]) => {
                // Ignore standard fields
                if (['name', 'email', 'phone', 'identifier', 'userId', 'id', 'user_id', 'created_at'].includes(key.toLowerCase())) return;
                if (!value) return;
                
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                if (!regFieldCounts[label]) regFieldCounts[label] = {};
                regFieldCounts[label][value] = (regFieldCounts[label][value] || 0) + 1;
            });
        });

        const regInsights = Object.entries(regFieldCounts).map(([field, values]) => ({
            field,
            data: Object.entries(values).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
        }));

        return {
            totalRevenue,
            totalGross,
            totalBonus,
            totalTickets,
            activeEventsCount,
            salesTrendData,
            eventData,
            regInsights,
            detailedReport,
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
        const allKeys = new Set();
        stats.detailedReport.forEach(r => {
            if (r.rawDetails) {
                Object.keys(r.rawDetails).forEach(k => {
                    if (!['applied_campaign_id', 'applied_campaign_code', 'meeting_url'].includes(k)) {
                        allKeys.add(k);
                    }
                });
            }
        });
        const dynamicHeaders = Array.from(allKeys);

        const headers = ["Order ID", "Date", "Status", "Amount", ...dynamicHeaders.map(k => k.charAt(0).toUpperCase() + k.slice(1))];
        const rows = stats.detailedReport.map(r => {
            const rowData = [
                r.id,
                r.date,
                r.status,
                r.amount
            ];
            dynamicHeaders.forEach(k => {
                let val = r.rawDetails?.[k] || '';
                rowData.push(`"${val}"`);
            });
            return rowData;
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `registration-report-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('landscape'); // Landscape for more columns
        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246);
        doc.text("Registration Detailed Report", 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Event: ${selectedEventId === 'all' ? 'All Events' : events.find(e => String(e.id) === String(selectedEventId))?.title}`, 20, 30);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 37);

        doc.autoTable({
            startY: 45,
            head: [["ID", "Name", "Email", "Phone", "KM/Cat", "Status", "Amount"]],
            body: stats.detailedReport.map(r => [
                r.id.slice(-6).toUpperCase(),
                `${r.firstName} ${r.lastName}`,
                r.email,
                r.phone,
                r.km,
                r.status,
                r.amount
            ]),
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
            styles: { fontSize: 8 },
            margin: { left: 10, right: 10 }
        });

        doc.save(`registrations-${Date.now()}.pdf`);
    };

    const [expandedRow, setExpandedRow] = useState(null);

    const t = {
        cardBg: isDark ? 'rgba(30, 41, 59, 0.4)' : '#fff',
        border: isDark ? '#334155' : '#f1f5f9',
        textMain: isDark ? '#f8fafc' : '#1e293b',
        textSub: isDark ? '#94a3b8' : '#64748b',
        accent: '#3b82f6'
    };

    return (
        <div ref={dashboardRef} style={{ padding: '2px', fontFamily: "'Inter', sans-serif" }}>
            <div className="no-export" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 900, color: t.textMain, marginBottom: '8px', letterSpacing: '-1.0px' }}>
                        Performance Outlook
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', background: isDark ? '#1e293b' : '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                            <button 
                                onClick={() => setActiveTab('insights')}
                                style={{ 
                                    padding: '6px 16px', 
                                    borderRadius: '8px', 
                                    fontSize: '12px', 
                                    fontWeight: 800, 
                                    cursor: 'pointer', 
                                    border: 'none',
                                    transition: '0.2s',
                                    background: activeTab === 'insights' ? (isDark ? '#3b82f6' : '#fff') : 'transparent',
                                    color: activeTab === 'insights' ? (isDark ? '#fff' : '#3b82f6') : t.textSub,
                                    boxShadow: activeTab === 'insights' && !isDark ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <Activity size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Visual Insights
                            </button>
                            <button 
                                onClick={() => setActiveTab('report')}
                                style={{ 
                                    padding: '6px 16px', 
                                    borderRadius: '8px', 
                                    fontSize: '12px', 
                                    fontWeight: 800, 
                                    cursor: 'pointer', 
                                    border: 'none',
                                    transition: '0.2s',
                                    background: activeTab === 'report' ? (isDark ? '#3b82f6' : '#fff') : 'transparent',
                                    color: activeTab === 'report' ? (isDark ? '#fff' : '#3b82f6') : t.textSub,
                                    boxShadow: activeTab === 'report' && !isDark ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <Calendar size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Detailed Report
                            </button>
                        </div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ 
                        display: 'flex', 
                        background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#fff', 
                        padding: '6px', 
                        borderRadius: '16px', 
                        border: `1px solid ${t.border}`,
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
                                color: t.textMain,
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
                            onClick={handleExportCSV}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '12px 20px', 
                                background: isDark ? '#1e293b' : '#fff', 
                                color: isDark ? '#f8fafc' : '#1e293b', 
                                border: `1px solid ${t.border}`,
                                borderRadius: '16px',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            <Download size={18} /> Excel (CSV)
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
                                boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)'
                            }}
                        >
                            <Download size={18} /> Export PDF
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'insights' ? (
                    <motion.div 
                        key="insights"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                            <MetricCard title="Partner Net Yield" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} trend="up" trendValue="12.5%" color="#3b82f6" isDark={isDark} />
                            <MetricCard title="Extra Yield (2%)" value={`₹${stats.totalBonus.toLocaleString()}`} icon={Zap} color="#10b981" isDark={isDark} />
                            <MetricCard title="Gross User Paid" value={`₹${stats.totalGross.toLocaleString()}`} icon={Activity} color="#8b5cf6" isDark={isDark} />
                            <MetricCard title="Active Campaigns" value={stats.activeEventsCount} icon={Calendar} color="#ec4899" isDark={isDark} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', marginBottom: '32px' }}>
                            <div style={{ background: t.cardBg, padding: '32px', borderRadius: '32px', border: `1px solid ${t.border}`, height: '450px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: t.textMain, marginBottom: '4px' }}>Revenue velocity</h3>
                                        <p style={{ fontSize: '13px', color: t.textSub }}>Daily revenue generation (30d window)</p>
                                    </div>
                                    <Activity size={24} style={{ color: '#3b82f6' }} />
                                </div>
                                <ResponsiveContainer width="100%" height="80%" minWidth={1} minHeight={1}>
                                    <AreaChart data={stats.salesTrendData}>
                                        <defs>
                                            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.border} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} minTickGap={30} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickFormatter={(val) => `₹${val >= 1000 ? val/1000 + 'k' : val}`} />
                                        <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }} itemStyle={{ color: '#3b82f6', fontWeight: 800, fontSize: '14px' }} />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#revenueFill)" animationDuration={2000} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div style={{ background: t.cardBg, padding: '32px', borderRadius: '32px', border: `1px solid ${t.border}`, height: '450px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: t.textMain, marginBottom: '4px' }}>Top Performing</h3>
                                        <p style={{ fontSize: '13px', color: t.textSub }}>Revenue comparison by top 5 events</p>
                                    </div>
                                    <BarChart3 size={24} style={{ color: '#8b5cf6' }} />
                                </div>
                                <ResponsiveContainer width="100%" height="80%" minWidth={1} minHeight={1}>
                                    <BarChart data={stats.eventData} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fill: t.textMain, fontSize: 12, fontWeight: 800 }} />
                                        <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }} contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '16px', padding: '12px' }} />
                                        <Bar dataKey="revenue" radius={[0, 20, 20, 0]} barSize={24} animationDuration={1500}>
                                            {stats.eventData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {stats.regInsights && stats.regInsights.length > 0 && (
                            <div style={{ marginTop: '48px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: 900, color: t.textMain, marginBottom: '24px' }}>Registration Insights</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                                    {stats.regInsights.map((insight, idx) => (
                                        <div key={idx} style={{ background: t.cardBg, padding: '28px', borderRadius: '28px', border: `1px solid ${t.border}` }}>
                                            <h4 style={{ fontSize: '12px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>{insight.field}</h4>
                                            <div style={{ height: '200px' }}>
                                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                                    <BarChart data={insight.data}>
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                                        <YAxis hide />
                                                        <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '16px' }} />
                                                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={32}>
                                                            {insight.data.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="report"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ background: t.cardBg, borderRadius: '32px', border: `1px solid ${t.border}`, overflow: 'hidden' }}
                    >
                        <div style={{ padding: '32px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 900, color: t.textMain, margin: 0 }}>Detailed Registration Manifest</h3>
                                <p style={{ fontSize: '13px', color: t.textSub, margin: '4px 0 0' }}>Comprehensive list of all participant registrations and metadata</p>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6', background: '#3b82f615', padding: '8px 16px', borderRadius: '12px' }}>
                                {stats.detailedReport.length} Total Records
                            </div>
                        </div>
                        
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase' }}>Participant</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase' }}>Contact info</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase' }}>Details</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase' }}>Category/KM</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.detailedReport.map((row, i) => (
                                        <React.Fragment key={i}>
                                            <tr style={{ borderBottom: `1px solid ${t.border}`, transition: '0.2s' }}>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 800, color: t.textMain }}>{row.firstName} {row.lastName}</div>
                                                    <div style={{ fontSize: '11px', color: t.textSub, marginTop: '2px' }}>Order: {row.id.slice(-8).toUpperCase()}</div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: t.textMain }}>{row.email}</div>
                                                    <div style={{ fontSize: '12px', color: t.textSub, marginTop: '2px' }}>{row.phone}</div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#8b5cf6', background: '#8b5cf615', padding: '4px 8px', borderRadius: '6px' }}>Size: {row.tshirtSize}</span>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#ec4899', background: '#ec489915', padding: '4px 8px', borderRadius: '6px' }}>{row.gender}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>{row.km}</div>
                                                    <div style={{ fontSize: '11px', color: t.textSub, marginTop: '2px' }}>{row.date}</div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <span style={{ 
                                                        fontSize: '11px', 
                                                        fontWeight: 900, 
                                                        padding: '6px 12px', 
                                                        borderRadius: '100px',
                                                        background: row.status === 'Confirmed' ? '#dcfce7' : '#fee2e2',
                                                        color: row.status === 'Confirmed' ? '#16a34a' : '#ef4444',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <button 
                                                        onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)} 
                                                        style={{
                                                            padding: '6px 12px', 
                                                            borderRadius: '8px', 
                                                            background: isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9', 
                                                            border: `1px solid ${t.border}`, 
                                                            fontSize: '11px', 
                                                            fontWeight: 800, 
                                                            cursor: 'pointer', 
                                                            color: t.textMain
                                                        }}
                                                    >
                                                        {expandedRow === row.id ? 'Hide Details' : 'View Data'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRow === row.id && (
                                                <tr style={{ background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc' }}>
                                                    <td colSpan="6" style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                                            {Object.entries(row.rawDetails || {}).filter(([k]) => !['applied_campaign_id', 'applied_campaign_code', 'meeting_url'].includes(k)).map(([key, value]) => (
                                                                <div key={key}>
                                                                    <div style={{ fontSize: '10px', fontWeight: 800, color: t.textSub, textTransform: 'uppercase', marginBottom: '4px' }}>{key}</div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: t.textMain }}>{value || 'N/A'}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            {stats.detailedReport.length === 0 && (
                                <div style={{ padding: '80px', textAlign: 'center', color: t.textSub }}>
                                    <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                    <p style={{ fontSize: '16px', fontWeight: 700 }}>No registration data found for this selection</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
