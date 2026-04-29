"use client";
import React, { useState, useEffect } from 'react';
import { 
    Briefcase, MapPin, Clock, ArrowRight, Sparkles, 
    Rocket, Users, Heart, Filter, X, CheckCircle, 
    Upload, Loader2, Search, DollarSign, Calendar, ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabase';
import Footer from '@/components/Footer';
import { useToast } from '@/context/ToastContext';

export default function CareersPage() {
    const { showToast } = useToast();
    const [selectedJob, setSelectedJob] = useState(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [filterDept, setFilterDept] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    
    // Fetch Banner Config
    const [bannerConfig, setBannerConfig] = useState({
        is_enabled: true,
        text: "We Are Hiring!!!",
        subtext: "Join our world-class team and build the future of live experiences.",
        theme: "pink-purple",
        button_text: "View Openings"
    });

    useEffect(() => {
        const fetchBanner = async () => {
            const { data } = await supabase.from('system_config').select('value').eq('key', 'careers_banner_settings').maybeSingle();
            if (data?.value) setBannerConfig(data.value);
        };
        fetchBanner();
    }, []);

    // Fetch Jobs
    const { data: jobs = [], loading: jobsLoading } = useSupabaseQuery('jobs', (q) => 
        q.eq('status', 'open').order('created_at', { ascending: false })
    );

    const departments = ["All", ...new Set(jobs.map(j => j.department).filter(Boolean))];

    const filteredJobs = jobs.filter(job => {
        const matchesDept = filterDept === "All" || job.department === filterDept;
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             job.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesDept && matchesSearch;
    });

    const handleApply = (job) => {
        setSelectedJob(job);
        setIsApplyModalOpen(true);
    };

    return (
        <main className="min-h-screen bg-[#fafbfc]">
            {/* Dynamic Banner */}
            {bannerConfig.is_enabled && (
                <section className={`relative pt-32 pb-24 px-6 overflow-hidden ${
                    bannerConfig.theme === 'pink-purple' ? 'bg-gradient-to-r from-pink-600 to-purple-700' :
                    bannerConfig.theme === 'blue-cyan' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' :
                    bannerConfig.theme === 'golden' ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-slate-950'
                }`}>
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                    <div className="max-w-[1240px] mx-auto text-center relative z-10 text-white">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-8">
                            <Sparkles className="w-4 h-4" /> {bannerConfig.text}
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {bannerConfig.text.split('!!!')[0]} <br /> 
                            <span className="opacity-80">Our Team</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 max-w-[800px] mx-auto leading-relaxed mb-12 font-medium">
                            {bannerConfig.subtext}
                        </p>
                        <button 
                            onClick={() => document.getElementById('jobs-list').scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-white text-slate-900 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-2xl shadow-black/20"
                        >
                            {bannerConfig.button_text}
                        </button>
                    </div>
                </section>
            )}

            {!bannerConfig.is_enabled && (
                <section className="pt-32 pb-24 px-6 bg-slate-950 text-white text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-4">Careers</h1>
                    <p className="text-slate-400">Join our growing family</p>
                </section>
            )}

            {/* Filter Section */}
            <section id="jobs-list" className="py-12 px-6 max-w-[1240px] mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search roles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500/20 text-sm font-medium"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                        {departments.map(dept => (
                            <button
                                key={dept}
                                onClick={() => setFilterDept(dept)}
                                className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                    filterDept === dept 
                                    ? 'bg-slate-900 text-white' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {dept}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Jobs Grid */}
                {jobsLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Fetching latest openings...</p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[40px] border border-slate-100">
                        <Briefcase className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No positions found</h3>
                        <p className="text-slate-500">Try adjusting your filters or search term.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredJobs.map(job => (
                            <JobCard key={job.id} job={job} onApply={() => handleApply(job)} />
                        ))}
                    </div>
                )}
            </section>

            {isApplyModalOpen && (
                <ApplyModal 
                    job={selectedJob} 
                    onClose={() => setIsApplyModalOpen(false)} 
                    showToast={showToast}
                />
            )}

            <Footer />
        </main>
    );
}

function JobCard({ job, onApply }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isClosingSoon = job.deadline && (new Date(job.deadline) - new Date()) < (3 * 24 * 60 * 60 * 1000) && (new Date(job.deadline) - new Date()) > 0;
    const isExpired = job.deadline && new Date(job.deadline) < new Date();

    const renderList = (text, icon, title, color) => {
        if (!text) return null;
        const items = text.split('\n').filter(i => i.trim());
        if (items.length === 0) return null;

        return (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className={`flex items-center gap-2 mb-3 ${color}`}>
                    {icon}
                    <h4 className="text-sm font-black uppercase tracking-widest">{title}</h4>
                </div>
                <ul className="space-y-2">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${color.replace('text', 'bg')}`} />
                            {item.replace(/📌|🧠|🌟/g, '').trim()}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="group p-8 bg-white rounded-[40px] border border-slate-100 hover:border-pink-500/30 transition-all hover:shadow-2xl hover:shadow-pink-500/5 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                        {job.department}
                    </span>
                    <span className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-pink-100">
                        {job.type}
                    </span>
                    {isClosingSoon && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" /> Closing Soon
                        </span>
                    )}
                </div>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-pink-600 transition-colors">
                {job.title}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-bold">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold">{job.salary_range || 'Competitive'}</span>
                </div>
            </div>

            {/* Collapsible Content */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] mb-8' : 'max-h-0'}`}>
                <div className="pt-4 border-t border-slate-50">
                    {renderList(job.responsibilities, <Rocket className="w-4 h-4" />, "Key Responsibilities", "text-blue-600")}
                    {renderList(job.qualifications, <Sparkles className="w-4 h-4" />, "Required Skills & Qualifications", "text-purple-600")}
                    {renderList(job.preferred_skills, <Heart className="w-4 h-4" />, "Preferred Skills", "text-pink-600")}
                </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-pink-500 transition-colors flex items-center gap-2 mb-2"
                >
                    {isExpanded ? 'Show Less' : 'View Details & Requirements'} 
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                <button 
                    disabled={isExpired}
                    onClick={onApply}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                        isExpired 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-slate-50 text-slate-900 group-hover:bg-pink-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-500/25'
                    }`}
                >
                    {isExpired ? 'Application Closed' : 'Apply For This Position'} <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function ApplyModal({ job, onClose, showToast }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        cover_letter: "",
        portfolio_url: "",
        resume: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let resumeUrl = "";
            if (formData.resume) {
                const file = formData.resume;
                const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                
                if (!allowedTypes.includes(file.type)) {
                    throw new Error("Only PDF and Word documents are allowed.");
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `${job.id}-${Date.now()}.${fileExt}`;
                const filePath = `resumes/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('resumes')
                    .upload(filePath, file);

                if (uploadError) throw new Error("Resume upload failed: " + uploadError.message);

                const { data: { publicUrl } } = supabase.storage
                    .from('resumes')
                    .getPublicUrl(filePath);
                
                resumeUrl = publicUrl;
            }

            const { error: dbError } = await supabase
                .from('job_applications')
                .insert([{
                    job_id: job.id,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    cover_letter: formData.cover_letter,
                    portfolio_url: formData.portfolio_url,
                    resume_url: resumeUrl,
                    status: 'new',
                    status_history: [{ status: 'new', date: new Date().toISOString() }]
                }]);

            if (dbError) throw dbError;

            setIsSuccess(true);
            showToast("Application submitted successfully!", "success");
        } catch (err) {
            console.error(err);
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
                <div className="bg-white rounded-[40px] p-12 max-w-[500px] w-full text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">Application Received!</h2>
                    <p className="text-slate-500 mb-8 font-medium">Thank you for applying for the <strong>{job.title}</strong> role. Our team will review your application and get back to you soon.</p>
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-pink-600 transition-colors"
                    >
                        Got it, Thanks
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] overflow-hidden max-w-[800px] w-full max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-500">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Applying for {job.title}</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{job.department} • {job.location}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                                <input 
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500/20 font-medium text-slate-900"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                <input 
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500/20 font-medium text-slate-900"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                <input 
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500/20 font-medium text-slate-900"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portfolio / LinkedIn Link</label>
                                <input 
                                    type="url"
                                    value={formData.portfolio_url}
                                    onChange={e => setFormData({ ...formData, portfolio_url: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500/20 font-medium text-slate-900"
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resume / CV (PDF)</label>
                            <div className="relative group/upload">
                                <input 
                                    required
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={e => setFormData({ ...formData, resume: e.target.files[0] })}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full p-8 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-3 group-hover/upload:border-pink-500/50 transition-colors bg-slate-50">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">
                                        {formData.resume ? formData.resume.name : 'Click to upload or drag & drop'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PDF, DOC up to 10MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cover Letter / Message</label>
                            <textarea 
                                rows={4}
                                value={formData.cover_letter}
                                onChange={e => setFormData({ ...formData, cover_letter: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500/20 font-medium text-slate-900 resize-none"
                                placeholder="Tell us why you're a great fit..."
                            />
                        </div>

                        <button 
                            disabled={isSubmitting}
                            type="submit"
                            className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-pink-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10"
                        >
                            {isSubmitting ? (
                                <> <Loader2 className="w-5 h-5 animate-spin" /> Processing Application... </>
                            ) : (
                                <> Submit Application <ArrowRight className="w-5 h-5" /> </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
