"use client";

import React, { useState } from 'react';
import { useSocialLinks } from '@/hooks/useSocialLinks';

export default function SocialFloatingWidget() {
    const { whatsapp, instagram, trackClick } = useSocialLinks();
    const [isOpen, setIsOpen] = useState(false);

    // Removed early return to ensure the 24/7 Support button is always accessible

    const handleClick = (platform, url) => {
        trackClick(platform, 'widget');
        window.open(url, '_blank');
    };

    return (
        <div style={{ position: 'fixed', bottom: '90px', right: '27px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease-out' }}>
                    <button
                        onClick={() => { window.location.href = '/contact-us'; setIsOpen(false); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#f844a4', color: '#fff', border: 'none',
                            padding: '10px 16px', borderRadius: '30px', fontWeight: 600,
                            fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(248, 68, 164, 0.3)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <span>🎧 24/7 Support</span>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Contact Us</span>
                    </button>
                    {whatsapp && (
                        <button
                            onClick={() => handleClick('whatsapp', whatsapp.url)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: '#25D366', color: '#fff', border: 'none',
                                padding: '10px 16px', borderRadius: '30px', fontWeight: 600,
                                fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span>🟢 {whatsapp.title || 'WhatsApp Channel'}</span>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Join Now</span>
                        </button>
                    )}
                    {instagram && (
                        <button
                            onClick={() => handleClick('instagram', instagram.url)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                color: '#fff', border: 'none',
                                padding: '10px 16px', borderRadius: '30px', fontWeight: 600,
                                fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220, 39, 67, 0.3)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span>📸 {instagram.title || 'Instagram Community'}</span>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Join Now</span>
                        </button>
                    )}
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '56px', height: '56px', borderRadius: '28px',
                    background: '#111827', color: '#fff', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                    fontSize: '24px', transition: 'transform 0.2s'
                }}
            >
                {isOpen ? '✕' : '💬'}
            </button>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
