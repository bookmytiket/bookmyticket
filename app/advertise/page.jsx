"use client";
import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AdvertisePage() {
    const { user } = useAuth();
    const router = useRouter();
    const packages = useQuery(api.banners.getPackages);
    const requestBanner = useMutation(api.banners.requestBanner);

    // Filter to only show Monthly and Yearly
    const filteredPackages = packages?.filter(p => p.name === "Monthly" || p.name === "Yearly") || [];

    const [selectedPkg, setSelectedPkg] = useState(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: user?.email || "",
        phone: "",
        link: ""
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Image Dimension Validation
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            if (img.width !== 4727 || img.height !== 2000) {
                setError("Image must be exactly 4727x2000 pixels.");
                setImageFile(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                setError("");
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            }
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!user) {
            router.push('/signin?redirect=/advertise');
            return;
        }

        if (!selectedPkg) {
            setError("Please select a plan first.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            setError("Please fill in all contact details.");
            return;
        }

        if (!imageFile) {
            setError("Please upload your banner image (4727x2000).");
            return;
        }

        setLoading(true);
        try {
            // In a production app, we would use ctx.storage.store(file)
            // For now, since we don't have a direct upload utility for this specific flow in Convex yet, 
            // we'll simulate the storage ID or just pass the metadata.
            // Note: Generating a DataURL as a placeholder for the "imageStorageId" field
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64data = reader.result;

                await requestBanner({
                    userId: user.id || user.identifier || user.email,
                    packageId: selectedPkg._id,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    link: formData.link || undefined,
                    imageStorageId: base64data, // Store dataURL for now as per user requested simplicity
                });
                setSuccess(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        } catch (err) {
            setError("Failed to submit request: " + (err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: 'var(--font-body)' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '140px auto 100px', padding: '0 24px' }}>
                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '56px',
                        fontWeight: 900,
                        color: '#111',
                        marginBottom: '20px',
                        letterSpacing: '-0.04em',
                        lineHeight: 1
                    }}>
                        Elevate Your <span style={{
                            background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Brand</span>
                    </h1>
                    <p style={{ fontSize: '20px', color: '#666', maxWidth: '700px', margin: '0 auto', fontWeight: 500 }}>
                        Get featured on our premium Hero Banner and reach thousands of daily visitors.
                    </p>
                </div>

                {success ? (
                    <div style={{
                        padding: '100px 40px',
                        borderRadius: '32px',
                        textAlign: 'center',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ fontSize: '80px', marginBottom: '30px' }}>⭐</div>
                        <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#111', marginBottom: '20px' }}>Application Secured!</h2>
                        <p style={{ color: '#444', fontSize: '18px', maxWidth: '500px', margin: '0 auto 40px' }}>
                            We have received your advertisement request. Our team will review your banner artwork and contact you for payment within 24 hours.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                padding: '16px 40px',
                                background: '#111',
                                color: '#fff',
                                borderRadius: '50px',
                                fontWeight: 800,
                                fontSize: '16px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Explore Site
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Package Selection */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '30px',
                            marginBottom: '100px',
                            flexWrap: 'wrap'
                        }}>
                            {filteredPackages.map((pkg) => (
                                <div
                                    key={pkg._id}
                                    style={{
                                        width: '320px',
                                        background: '#fff',
                                        borderRadius: '24px',
                                        padding: '40px',
                                        border: `2px solid ${selectedPkg?._id === pkg._id ? '#f84464' : '#f1f5f9'}`,
                                        position: 'relative',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                        boxShadow: selectedPkg?._id === pkg._id ? '0 30px 60px rgba(248, 68, 100, 0.15)' : '0 10px 30px rgba(0,0,0,0.02)'
                                    }}
                                    onClick={() => setSelectedPkg(pkg)}
                                >
                                    {pkg.name === "Yearly" && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-15px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: '#f84464',
                                            color: '#fff',
                                            padding: '6px 20px',
                                            borderRadius: '50px',
                                            fontSize: '12px',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px'
                                        }}>
                                            Best Value
                                        </div>
                                    )}
                                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#111', marginBottom: '8px' }}>{pkg.name}</h3>
                                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Excellent for sustained visibility</p>

                                    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '32px' }}>
                                        <span style={{ fontSize: '48px', fontWeight: 900, color: '#111' }}>₹{pkg.price}</span>
                                        <span style={{ fontSize: '16px', color: '#999', marginLeft: '6px' }}>/ {pkg.durationDays} days</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#444' }}>
                                            <div style={{ color: '#f84464' }}>✓</div> 24/7 Placement on Hero Section
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#444' }}>
                                            <div style={{ color: '#f84464' }}>✓</div> Custom Target Link Support
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', color: '#444' }}>
                                            <div style={{ color: '#f84464' }}>✓</div> Professional Review & Setup
                                        </div>
                                    </div>

                                    <button style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        border: selectedPkg?._id === pkg._id ? 'none' : '2px solid #f1f5f9',
                                        background: selectedPkg?._id === pkg._id ? '#111' : 'transparent',
                                        color: selectedPkg?._id === pkg._id ? '#fff' : '#111',
                                        fontWeight: 800,
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}>
                                        {selectedPkg?._id === pkg._id ? 'Selected Plan' : 'Choose Plan'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Request Form */}
                        <div style={{
                            maxWidth: '800px',
                            margin: '0 auto',
                            background: '#f8fafc',
                            padding: '60px',
                            borderRadius: '32px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111', marginBottom: '8px', textAlign: 'center' }}>Send Request</h2>
                            <p style={{ color: '#666', textAlign: 'center', marginBottom: '40px' }}>Fill in your campaign details to get started.</p>

                            {error && (
                                <div style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fee2e2',
                                    color: '#dc2626',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    marginBottom: '30px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    textAlign: 'center'
                                }}>
                                    ⚠ {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px', textTransform: 'uppercase' }}>First Name</label>
                                        <input
                                            name="firstName"
                                            required
                                            placeholder="John"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '15px', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px', textTransform: 'uppercase' }}>Last Name</label>
                                        <input
                                            name="lastName"
                                            required
                                            placeholder="Doe"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '15px', outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px', textTransform: 'uppercase' }}>Email Address</label>
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '15px', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px', textTransform: 'uppercase' }}>Phone Number</label>
                                        <input
                                            name="phone"
                                            type="tel"
                                            required
                                            placeholder="+91 98765 43210"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '15px', outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px', textTransform: 'uppercase' }}>Target URL (Optional)</label>
                                    <input
                                        name="link"
                                        type="url"
                                        placeholder="https://yourbrand.com/campaign"
                                        value={formData.link}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '15px', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '40px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '12px', textTransform: 'uppercase' }}>Upload Your Banner (Image Size: 4727x2000 only)</label>
                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        style={{
                                            width: '100%',
                                            height: '180px',
                                            border: '2px dashed #cbd5e1',
                                            borderRadius: '20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            background: '#f1f5f9',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.borderColor = '#94a3b8'}
                                        onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                                        ) : (
                                            <>
                                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🖼️</div>
                                                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Click to upload (JPG, PNG)</span>
                                                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Strict Requirement: 4727 x 2000 px</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            hidden
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '18px',
                                        background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                                        color: '#fff',
                                        borderRadius: '16px',
                                        fontWeight: 800,
                                        fontSize: '16px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 30px rgba(248, 68, 100, 0.25)',
                                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {loading ? "Submitting Application..." : "Submit Secure Request"}
                                </button>
                                <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '20px' }}>
                                    Final price includes all taxes. Your banner will be reviewed for quality.
                                </p>
                            </form>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
