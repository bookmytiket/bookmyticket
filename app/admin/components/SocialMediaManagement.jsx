"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Upload } from 'lucide-react';

export default function SocialMediaManagement() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const res = await fetch('/api/admin/social-links', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.length === 0) {
                    setLinks([
                        { platform: 'whatsapp', title: 'WhatsApp Channel', url: '', icon_url: '', is_enabled: true, show_in_navbar: true, show_in_footer: true, show_on_event_page: true, show_on_booking_success: true },
                        { platform: 'instagram', title: 'Instagram Community', url: '', icon_url: '', is_enabled: true, show_in_navbar: true, show_in_footer: true, show_on_event_page: true, show_on_booking_success: true }
                    ]);
                } else {
                    setLinks(data);
                }
            }
        } catch (err) {
            showToast('Failed to load social links', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (platformLink) => {
        try {
            const res = await fetch('/api/admin/social-links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(platformLink)
            });
            const result = await res.json();
            if (result.success) {
                showToast(`${platformLink.platform} settings saved successfully!`, 'success');
            } else {
                showToast(result.error || 'Failed to save', 'error');
            }
        } catch (err) {
            showToast('Network error', 'error');
        }
    };

    const updateLinkField = (platform, field, value) => {
        setLinks(prev => prev.map(l => l.platform === platform ? { ...l, [field]: value } : l));
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Social Media Management</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>Manage WhatsApp Channel and Instagram Community links across the platform.</p>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {links.map((link) => (
                    <div key={link.platform} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {link.platform === 'whatsapp' ? '🟢' : link.platform === 'instagram' ? '📸' : '🔗'} {link.platform} Configuration
                            </h3>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={link.is_enabled} 
                                    onChange={(e) => updateLinkField(link.platform, 'is_enabled', e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: '#f84464' }}
                                />
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>Enable Module</span>
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', opacity: link.is_enabled ? 1 : 0.5, pointerEvents: link.is_enabled ? 'auto' : 'none' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Title (Display Name)</label>
                                <input 
                                    value={link.title || ''}
                                    onChange={(e) => updateLinkField(link.platform, 'title', e.target.value)}
                                    placeholder={link.platform === 'whatsapp' ? 'WhatsApp Channel' : 'Instagram Community'}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>URL (Channel / Profile Link)</label>
                                <input 
                                    value={link.url || ''}
                                    onChange={(e) => updateLinkField(link.platform, 'url', e.target.value)}
                                    placeholder={`https://${link.platform}.com/...`}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', opacity: link.is_enabled ? 1 : 0.5, pointerEvents: link.is_enabled ? 'auto' : 'none' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px' }}>Display Locations</h4>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                {['show_in_navbar', 'show_in_footer', 'show_on_event_page', 'show_on_booking_success'].map(field => (
                                    <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                                        <input 
                                            type="checkbox" 
                                            checked={!!link[field]} 
                                            onChange={(e) => updateLinkField(link.platform, field, e.target.checked)}
                                        />
                                        {field.replace(/show_/g, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => handleSave(link)}
                                style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Save {link.platform} Settings
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
