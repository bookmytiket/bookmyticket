"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Settings, Wrench, Clock, RefreshCw, MessageCircle } from 'lucide-react';

export default function MaintenancePage() {
    const router = useRouter();
    const [message, setMessage] = useState("We're upgrading your experience. Please check back soon!");
    const [isChecking, setIsChecking] = useState(false);

    // Auto-check if maintenance is over
    useEffect(() => {
        const checkStatus = async () => {
            const { data, error } = await supabase
                .from('system_config')
                .select('value')
                .eq('key', 'maintenance_mode')
                .maybeSingle();
            
            const config = data?.value;

            if (config) {
                setMessage(config.maintenance_message);
                if (!config.maintenance_mode) {
                    router.push('/');
                }
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [router]);

    const handleManualRefresh = async () => {
        setIsChecking(true);
        const { data } = await supabase.from('system_config').select('value').eq('key', 'maintenance_mode').maybeSingle();
        if (data?.value && !data.value.maintenance_mode) {
            router.push('/');
        } else {
            setTimeout(() => setIsChecking(false), 1000);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
            fontFamily: '"Figtree", sans-serif',
            color: 'white',
            overflow: 'hidden',
            position: 'relative',
            padding: '24px'
        }}>
            {/* Animated Background Orbs */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
                animation: 'float 20s infinite alternate'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '50%',
                height: '50%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                filter: 'blur(120px)',
                animation: 'float 25s infinite alternate-reverse'
            }} />

            {/* Content Card */}
            <div style={{
                width: '100%',
                maxWidth: '500px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '32px',
                padding: '48px 32px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                zIndex: 10,
                animation: 'fadeInUp 0.8s ease-out'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 32px',
                    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 20px rgba(236, 72, 153, 0.3)',
                    transform: 'rotate(-5deg)'
                }}>
                    <Wrench size={40} color="white" strokeWidth={2.5} />
                </div>

                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    marginBottom: '16px',
                    background: 'linear-gradient(to bottom, #ffffff 0%, #cbd5e1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                }}>
                    Under Maintenance
                </h1>

                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#94a3b8',
                    marginBottom: '40px'
                }}>
                    {message}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                        onClick={handleManualRefresh}
                        disabled={isChecking}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            background: 'white',
                            color: '#0f172a',
                            border: 'none',
                            padding: '14px 24px',
                            borderRadius: '16px',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            width: '100%'
                        }}
                    >
                        {isChecking ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                        {isChecking ? "Checking Status..." : "Check if Online"}
                    </button>

                    <button
                        onClick={() => window.open('mailto:support@bookmyticket.net')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '14px 24px',
                            borderRadius: '16px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            width: '100%'
                        }}
                    >
                        <MessageCircle size={18} />
                        Contact Support
                    </button>
                </div>

                <div style={{
                    marginTop: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    color: '#64748b'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ec4899' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Secure Access</span>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(30px, 30px) scale(1.1); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
