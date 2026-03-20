"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdvertisePage() {
    const router = useRouter();
    useEffect(() => {
        router.push('/branding');
    }, [router]);

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            background: '#fff'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    border: '4px solid #f1f5f9', 
                    borderTopColor: '#4f46e5', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                }} />
                <h2 style={{ color: '#111', fontWeight: 700 }}>Redirecting to Branding...</h2>
                <p style={{ color: '#64748b' }}>Moving you to our premium branding portal.</p>
                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
}
