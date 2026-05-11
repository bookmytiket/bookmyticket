import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import LikeButton from "@/components/LikeButton";

const TopRatedServices = ({ professionals = [] }) => {
    if (!professionals || professionals.length === 0) return null;

    // Filter for top rated (Rating >= 4)
    const topRated = professionals
        .map(pro => {
            const settings = typeof pro.advanced_settings === 'string' 
                ? JSON.parse(pro.advanced_settings) 
                : (pro.advanced_settings || {});
            return { ...pro, settings };
        })
        .filter(pro => Number(pro.settings.rating || 0) >= 4)
        .sort((a, b) => Number(b.settings.rating) - Number(a.settings.rating))
        .slice(0, 8);

    if (topRated.length === 0) return null;

    return (
        <section style={{ padding: '80px 20px', background: '#f8fafc' }}>
            <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'inline-block', padding: '4px 12px', background: '#ecfdf5', borderRadius: '100px', color: '#059669', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', border: '1px solid #d1fae5' }}>
                            Premium Professionals
                        </div>
                        <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>
                            Top Rated <span style={{ color: 'transparent', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(to right, #10b981, #3b82f6)' }}>Services</span>
                        </h2>
                        <p style={{ color: '#64748b', marginTop: '12px', fontSize: '16px', fontWeight: 500 }}>Handpicked professionals with the highest customer satisfaction.</p>
                    </div>
                    <Link href="/services" style={{ padding: '12px 24px', borderRadius: '14px', background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700, fontSize: '14px', textDecoration: 'none', transition: 'all 0.2s' }}>
                        View All Services
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {topRated.map((pro, i) => (
                        <motion.div
                            key={pro.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            style={{ 
                                background: '#fff', 
                                borderRadius: '24px', 
                                overflow: 'hidden', 
                                border: '1px solid #f1f5f9',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.06)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
                            }}
                        >
                            <Link href={`/services/${pro.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'relative', height: '200px', width: '100%' }}>
                                    <img 
                                        src={pro.image_url || 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=600'} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        alt={pro.business_name}
                                    />
                                    <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20 }}>
                                        <LikeButton 
                                            itemId={pro.id} 
                                            type="service" 
                                            size={16} 
                                        />
                                    </div>
                                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase' }}>
                                        {pro.category}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: '#fff', color: '#0f172a', fontSize: '11px', fontWeight: 900, padding: '4px 10px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Star size={12} fill="#fbbf24" color="#fbbf24" /> {pro.settings.rating || '5.0'}
                                    </div>
                                </div>

                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{pro.business_name}</h3>
                                        <ShieldCheck size={16} color="#10b981" />
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
                                        <MapPin size={14} /> {pro.city || 'Available Online'}
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Starting from</div>
                                            <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>₹{Number(pro.starting_price || pro.pricing || 1999).toLocaleString()}</div>
                                        </div>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                            <ExternalLink size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TopRatedServices;
