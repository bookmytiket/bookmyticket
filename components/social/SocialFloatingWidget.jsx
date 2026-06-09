"use client";

import React, { useState } from 'react';
import { useSocialLinks } from '@/hooks/useSocialLinks';
import { Headset } from 'lucide-react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';

export default function SocialFloatingWidget() {
    const { whatsapp, instagram, trackClick } = useSocialLinks();
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (platform, url) => {
        trackClick(platform, 'widget');
        window.open(url, '_blank');
    };

    return (
        <div style={{ position: 'fixed', bottom: '90px', right: '27px', zIndex: 9999, width: '56px', height: '56px' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* 24/7 Support Icon */}
                <button
                    onClick={() => { window.location.href = '/contact-us'; setIsOpen(false); }}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '52px', height: '52px', borderRadius: '26px',
                        background: '#f844a4', color: '#fff', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(248, 68, 164, 0.4)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: isOpen ? 'translate(0px, -80px) scale(1)' : 'translate(0px, 0px) scale(0)',
                        opacity: isOpen ? 1 : 0,
                        zIndex: 1
                    }}
                    title="24/7 Support"
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(0px, -80px) scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(0px, -80px) scale(1)'}
                >
                    <Headset size={22} strokeWidth={2.5} />
                </button>

                {/* WhatsApp Icon */}
                {whatsapp && (
                    <button
                        onClick={() => handleClick('whatsapp', whatsapp.url)}
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '52px', height: '52px', borderRadius: '26px',
                            background: '#25D366', color: '#fff', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.05s',
                            transform: isOpen ? 'translate(-56px, -56px) scale(1)' : 'translate(0px, 0px) scale(0)',
                            opacity: isOpen ? 1 : 0,
                            zIndex: 1
                        }}
                        title="WhatsApp Channel"
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-56px, -56px) scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-56px, -56px) scale(1)'}
                    >
                        <FaWhatsapp size={26} />
                    </button>
                )}

                {/* Instagram Icon */}
                {instagram && (
                    <button
                        onClick={() => handleClick('instagram', instagram.url)}
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '52px', height: '52px', borderRadius: '26px',
                            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                            color: '#fff', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 4px 12px rgba(220, 39, 67, 0.4)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s',
                            transform: isOpen ? 'translate(-80px, 0px) scale(1)' : 'translate(0px, 0px) scale(0)',
                            opacity: isOpen ? 1 : 0,
                            zIndex: 1
                        }}
                        title="Instagram Community"
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-80px, 0px) scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-80px, 0px) scale(1)'}
                    >
                        <FaInstagram size={26} />
                    </button>
                )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '56px', height: '56px', borderRadius: '28px',
                    background: '#111827', color: '#fff', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', 
                    boxShadow: '0 0 20px rgba(248, 68, 164, 0.3), 0 6px 16px rgba(0,0,0,0.2)',
                    fontSize: '24px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    position: 'relative',
                    zIndex: 2
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.05)' : 'rotate(0deg) scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1)' : 'rotate(0deg) scale(1)'}
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
        </div>
    );
}
