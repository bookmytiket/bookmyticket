"use client";
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ContactPage() {
    const [status, setStatus] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('success');
    };

    return (
        <main className="min-h-screen bg-[#fafbfc]">
            <Navbar />
            
            {/* Header */}
            <section className="pt-32 pb-20 px-6 bg-white border-b border-slate-100">
                <div className="max-w-[1240px] mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-100 rounded-full text-pink-600 text-xs font-bold uppercase tracking-widest mb-6">
                        <MessageCircle className="w-4 h-4" /> We're here to help
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Get in <span className="text-pink-500">Touch</span></h1>
                    <p className="text-lg text-slate-500 max-w-[600px] mx-auto font-medium">
                        Have a question about a booking? Or maybe you're an organizer looking to list your event? We'd love to hear from you.
                    </p>
                </div>
            </section>

            <section className="py-20 px-6 max-w-[1240px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    
                    {/* Contact Info */}
                    <div className="lg:col-span-5 space-y-10">
                        <div className="space-y-8">
                            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Contact Information</h2>
                            
                            <div className="flex gap-6 p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Us</div>
                                    <div className="text-lg font-bold text-slate-900">hello@bookmyticket.net</div>
                                    <div className="text-sm text-slate-500 mt-1">We typically reply within 2 hours.</div>
                                </div>
                            </div>

                            <div className="flex gap-6 p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 flex-shrink-0">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Call Support</div>
                                    <div className="text-lg font-bold text-slate-900">+91 (123) 456-7890</div>
                                    <div className="text-sm text-slate-500 mt-1">Available Mon-Sat, 10 AM - 7 PM.</div>
                                </div>
                            </div>

                            <div className="flex gap-6 p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Our Location</div>
                                    <div className="text-lg font-bold text-slate-900">Coimbatore, Tamil Nadu, India</div>
                                    <div className="text-sm text-slate-500 mt-1">Visit our headquarters for a coffee.</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <Clock className="w-16 h-16 opacity-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 uppercase tracking-tight">Support Hours</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Monday - Friday</span>
                                    <span className="font-bold">10:00 AM - 08:00 PM</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Saturday</span>
                                    <span className="font-bold">10:00 AM - 04:00 PM</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Sunday</span>
                                    <span className="font-bold">Emergency Only</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl p-10 md:p-14 relative">
                            {status === 'success' ? (
                                <div className="py-20 text-center space-y-6">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Message Sent!</h3>
                                    <p className="text-slate-500 font-medium max-w-[300px] mx-auto">
                                        Thank you for reaching out. Our team will get back to you shortly.
                                    </p>
                                    <button onClick={() => setStatus(null)} className="text-pink-500 font-bold uppercase tracking-widest text-sm hover:underline">Send another message</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Your Name</label>
                                            <input type="text" required placeholder="John Doe" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                            <input type="email" required placeholder="john@example.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Subject</label>
                                        <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all">
                                            <option>Booking Inquiry</option>
                                            <option>Event Hosting</option>
                                            <option>Refund Request</option>
                                            <option>Technical Issue</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Message</label>
                                        <textarea rows={6} required placeholder="How can we help you today?" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/10 transition-all resize-none"></textarea>
                                    </div>
                                    <button type="submit" className="w-full py-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-sm shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                        Send Message <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                </div>
            </section>

            <Footer />
        </main>
    );
}
