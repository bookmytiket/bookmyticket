"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Settings, Activity, AlertCircle, RefreshCw, Send, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CommunicationCenter() {
    const [activeTab, setActiveTab] = useState('templates');
    const [templates, setTemplates] = useState([]);
    const [logs, setLogs] = useState([]);
    const [queue, setQueue] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [branding, setBranding] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: tData } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false });
            setTemplates(tData || []);

            const { data: bData } = await supabase.from('email_branding_settings').select('*').limit(1).single();
            setBranding(bData || {
                primary_color: '#1E40AF',
                secondary_color: '#3B82F6',
                footer_text: 'BookMyTicket © 2026',
                support_email: 'support@bookmyticket.net'
            });

            // If you want to fetch logs and queue as well:
            const { data: lData } = await supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(20);
            setLogs(lData || []);

            const { data: qData } = await supabase.from('notification_queue').select('*').order('created_at', { ascending: false }).limit(20);
            setQueue(qData || []);

            const { data: cData } = await supabase.from('event_campaigns').select('*, events(title)').order('created_at', { ascending: false }).limit(20);
            setCampaigns(cData || []);
        } catch (error) {
            console.error("Failed to load communication data", error);
            // Ignore PGRST205 errors if migration is not run yet
        }
        setLoading(false);
    };

    const handleSaveBranding = async () => {
        try {
            if (branding.id) {
                await supabase.from('email_branding_settings').update(branding).eq('id', branding.id);
            } else {
                const { data } = await supabase.from('email_branding_settings').insert(branding).select().single();
                setBranding(data);
            }
            toast.success("Branding saved!");
        } catch (e) {
            toast.error("Failed to save branding");
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={28} color="#1E40AF" />
                    Communication Center
                </h1>
                <button 
                    onClick={fetchData}
                    style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} /> Refresh Data
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                {['templates', 'campaigns', 'branding', 'queue', 'logs'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 16px', 
                            background: activeTab === tab ? '#1E40AF' : 'transparent',
                            color: activeTab === tab ? '#fff' : '#475569',
                            border: 'none', 
                            borderRadius: '8px', 
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            cursor: 'pointer'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div>
                    {activeTab === 'templates' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                <button style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Plus size={16} /> Create Template
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {templates.map(t => (
                                    <div key={t.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{t.template_name}</h3>
                                                <div style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>{t.template_key}</div>
                                            </div>
                                            <div style={{ background: t.is_active ? '#dcfce7' : '#fee2e2', color: t.is_active ? '#166534' : '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                                {t.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '12px', fontSize: '14px', color: '#475569' }}>
                                            <strong>Subject:</strong> {t.subject_template}
                                        </div>
                                    </div>
                                ))}
                                {templates.length === 0 && <div>No templates found.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'branding' && branding && (
                        <div style={{ padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', maxWidth: '600px' }}>
                            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Global Email Branding</h2>
                            
                            <label style={{ display: 'block', marginBottom: '12px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Primary Color</div>
                                <input type="color" value={branding.primary_color || '#1E40AF'} onChange={e => setBranding({...branding, primary_color: e.target.value})} style={{ width: '100%', height: '40px', cursor: 'pointer' }} />
                            </label>
                            
                            <label style={{ display: 'block', marginBottom: '12px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Secondary Color</div>
                                <input type="color" value={branding.secondary_color || '#3B82F6'} onChange={e => setBranding({...branding, secondary_color: e.target.value})} style={{ width: '100%', height: '40px', cursor: 'pointer' }} />
                            </label>

                            <label style={{ display: 'block', marginBottom: '12px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Support Email</div>
                                <input type="email" value={branding.support_email || ''} onChange={e => setBranding({...branding, support_email: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                            </label>

                            <label style={{ display: 'block', marginBottom: '24px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Footer Text</div>
                                <textarea value={branding.footer_text || ''} onChange={e => setBranding({...branding, footer_text: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px' }} />
                            </label>

                            <button onClick={handleSaveBranding} style={{ padding: '10px 24px', background: '#1E40AF', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Save Branding
                            </button>
                        </div>
                    )}

                    {activeTab === 'campaigns' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '18px', margin: 0 }}>Event Broadcast Campaigns</h2>
                            </div>
                            {campaigns.map(c => (
                                <div key={c.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0f172a' }}>{c.campaign_name}</h3>
                                        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '12px' }}>
                                            <span>Type: <strong>{c.campaign_type.toUpperCase()}</strong></span>
                                            <span>Audience: <strong>{c.audience_type}</strong></span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ background: c.status === 'completed' ? '#dcfce7' : c.status === 'processing' ? '#dbeafe' : '#fef3c7', color: c.status === 'completed' ? '#166534' : c.status === 'processing' ? '#1e40af' : '#92400e', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '4px' }}>
                                            {c.status.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            {new Date(c.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {campaigns.length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                    No broadcast campaigns found. Create and publish an event to see it here.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'queue' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {queue.map(q => (
                                <div key={q.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{q.event_type}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>{q.payload?.to || 'No email specified'}</div>
                                    <div style={{ fontSize: '12px' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '12px', background: q.status === 'pending' ? '#fef3c7' : q.status === 'processed' ? '#dcfce7' : '#fee2e2', color: q.status === 'pending' ? '#92400e' : q.status === 'processed' ? '#166534' : '#991b1b' }}>
                                            {q.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>
                                        {new Date(q.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {queue.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No pending or recent queue items.</div>}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {logs.map(log => (
                                <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{log.recipient_email}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }} numberOfLines={1}>{log.subject}</div>
                                    <div style={{ fontSize: '12px' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '12px', background: log.status === 'sent' ? '#dcfce7' : '#fee2e2', color: log.status === 'sent' ? '#166534' : '#991b1b' }}>
                                            {log.status || 'unknown'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No email logs found.</div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
