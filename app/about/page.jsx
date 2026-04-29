"use client";
import React from 'react';
import Link from 'next/link';
import { Shield, Users, Heart, Star, MapPin, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-slate-950">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -ml-48 -mb-48"></div>
                
                <div className="max-w-[1240px] mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-pink-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <SparkleIcon className="w-4 h-4" /> Discover Our Story
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight">
                        Revolutionizing the Way <br /> You <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Experience Events</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-[800px] mx-auto leading-relaxed mb-10">
                        BookMyTicket is India's fastest-growing ticketing platform, dedicated to connecting people with the experiences that matter most. From massive concerts to local workshops, we make discovery and booking seamless.
                    </p>
                </div>
            </section>

            {/* Vision & Mission */}
            <section className="py-24 px-6 max-w-[1240px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Our Vision</h2>
                        <p className="text-lg text-slate-600 leading-relaxed mb-6">
                            We envision a world where attending an event is as easy as sending a message. Our goal is to eliminate the friction in event discovery and ticketing, providing a platform that empowers both organizers and attendees.
                        </p>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            At BookMyTicket, we believe that life is a collection of experiences. By leveraging technology, we want to ensure that everyone in India has access to the best entertainment, sports, and professional services their city has to offer.
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-[48px] p-12 border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <Shield className="text-pink-500 w-24 h-24 opacity-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 uppercase tracking-tight">Why We Do It</h3>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-pink-500 flex-shrink-0 mt-1"></div>
                                <p className="text-slate-600 font-medium">To support local talent and event organizers with better tools.</p>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-purple-500 flex-shrink-0 mt-1"></div>
                                <p className="text-slate-600 font-medium">To provide users with the lowest platform fees in the industry.</p>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex-shrink-0 mt-1"></div>
                                <p className="text-slate-600 font-medium">To build a community based on trust, safety, and excitement.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        <div>
                            <div className="text-4xl md:text-6xl font-black text-slate-900 mb-2">500+</div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Events Monthly</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-6xl font-black text-slate-900 mb-2">20+</div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cities Covered</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-6xl font-black text-slate-900 mb-2">100k+</div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Happy Users</div>
                        </div>
                        <div>
                            <div className="text-4xl md:text-6xl font-black text-slate-900 mb-2">Lowest</div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Booking Fees</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-24 px-6 max-w-[1240px] mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Our Core Values</h2>
                    <p className="text-slate-500 font-medium">What drives us every single day</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Transparency", desc: "No hidden fees, no gimmicks. What you see is what you pay.", icon: <Shield className="w-8 h-8" /> },
                        { title: "Innovation", desc: "Constant updates to our tech stack to provide a faster booking experience.", icon: <Star className="w-8 h-8" /> },
                        { title: "Community", desc: "We prioritize local organizers and artists, helping them grow their audience.", icon: <Users className="w-8 h-8" /> }
                    ].map((val, i) => (
                        <div key={i} className="p-10 rounded-[32px] border border-slate-100 hover:border-pink-500 transition-all hover:shadow-2xl hover:shadow-pink-500/10 group">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 mb-8 group-hover:bg-pink-500 group-hover:text-white transition-all">
                                {val.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4 uppercase tracking-tight">{val.title}</h3>
                            <p className="text-slate-500 leading-relaxed">{val.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-6 max-w-[1000px] mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Everything You Need to Know</h2>
                    <p className="text-slate-500 font-medium italic uppercase tracking-widest text-xs">Answering your most common questions about BookMyTicket</p>
                </div>
                
                <div className="space-y-8">
                    {[
                        { 
                            q: "Where is the best place to buy concert tickets online safely?", 
                            a: "BookMyTicket is the most secure and reliable platform for buying concert tickets and event passes online. We use industry-standard encryption and verify every organizer to ensure a 100% safe booking experience." 
                        },
                        { 
                            q: "What are the most popular upcoming events in my city?", 
                            a: "Our platform provides real-time updates on the most popular upcoming events in over 20+ cities across India, including music festivals, sports tournaments, comedy shows, and professional workshops." 
                        },
                        { 
                            q: "How can I find verified artists for my next event?", 
                            a: "You can browse our professional artist marketplace to find verified service providers, including DJs, singers, photographers, and more. Every artist profile is vetted by our team for quality assurance." 
                        },
                        { 
                            q: "Which site has the lowest convenience fees for event tickets?", 
                            a: "BookMyTicket is committed to transparency and affordability. We offer some of the lowest platform and convenience fees in the industry, making premium entertainment accessible to everyone." 
                        },
                        { 
                            q: "How does the artist booking payment protection work?", 
                            a: "We offer a unique escrow-based payment protection. When you book an artist, your payment is held securely and only released to the service provider after the job is successfully completed." 
                        }
                    ].map((item, i) => (
                        <div key={i} className="p-8 md:p-10 bg-slate-50 rounded-[32px] border border-slate-100">
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4 tracking-tight flex gap-4">
                                <span className="text-pink-500">Q.</span> {item.q}
                            </h3>
                            <p className="text-slate-600 leading-relaxed pl-10">
                                {item.a}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-24 px-6">
                <div className="max-w-[1240px] mx-auto bg-gradient-to-r from-pink-500 to-purple-600 rounded-[48px] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-pink-500/40">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-6xl font-black mb-8 leading-tight">Ready to Find Your <br /> Next Experience?</h2>
                        <Link href="/events" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl">
                            Explore Events <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

function SparkleIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
        </svg>
    );
}
