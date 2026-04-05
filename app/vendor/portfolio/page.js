"use client";
import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import {
    Loader2,
    Star,
    Tag,
    X,
    FolderHeart,
    Check,
    Camera,
    Image as ImageIcon,
    ArrowLeftRight,
    Trash,
    Plus,
    Sparkles,
    ChevronRight,
    Info
} from "lucide-react";

// Helper component for individual portfolio items
const DesignCard = ({ item, onDelete, onToggleBeforeAfter, onToggleTopDesign, onEditLabels }) => {
    const imageUrl = item.url.startsWith("http") 
        ? item.url 
        : `https://images.unsplash.com/photo-1596704017254-9b1210630b65?q=80&w=1080&auto=format&fit=crop`;

    return (
        <div className="group relative bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40 animate-in zoom-in-95 duration-500 hover:border-pink-300 transition-all">
            <div className="aspect-[4/5] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                
                <img 
                    src={imageUrl}
                    alt={item.category}
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                />

                {/* Badges */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-xl text-slate-900 px-4 py-2 rounded-xl border border-white/50 flex items-center space-x-2 shadow-xl shadow-slate-900/10">
                        {item.type === "video" ? <Camera size={12} className="text-pink-500" /> : <ImageIcon size={12} className="text-pink-500" />}
                        <span className="text-[10px] font-black uppercase tracking-widest italic">{item.category}</span>
                    </div>
                    {item.isTopDesign && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl border border-yellow-300 flex items-center space-x-2 shadow-xl shadow-yellow-500/20">
                            <Star size={12} fill="currentColor" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Masterpiece</span>
                        </div>
                    )}
                </div>

                {/* Before/After Badge */}
                {item.beforeAfter && (
                    <div className="absolute top-4 right-4 z-20">
                        <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-[10px] font-black px-4 py-2 rounded-xl border border-white/20 shadow-xl uppercase tracking-widest text-white animate-pulse">
                            B / A
                        </span>
                    </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute bottom-6 left-6 right-6 z-20 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={onToggleBeforeAfter}
                            className={`p-3 rounded-2xl border transition-all shadow-xl shadow-slate-900/20 ${item.beforeAfter ? 'bg-pink-500 border-pink-400 text-white' : 'bg-white/90 backdrop-blur-xl border-white/50 text-slate-900 hover:bg-pink-500 hover:text-white'}`}
                            title="Toggle Before/After"
                        >
                            <ArrowLeftRight size={18} />
                        </button>
                        <button 
                            onClick={onToggleTopDesign}
                            className={`p-3 rounded-2xl border transition-all shadow-xl shadow-slate-900/20 ${item.isTopDesign ? 'bg-yellow-500 border-yellow-400 text-white' : 'bg-white/90 backdrop-blur-xl border-white/50 text-slate-900 hover:bg-yellow-500 hover:text-white'}`}
                            title="Mark as Highlight"
                        >
                            <Star size={18} fill={item.isTopDesign ? "currentColor" : "none"} />
                        </button>
                    </div>
                    <button 
                        onClick={onDelete}
                        className="p-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/20"
                    >
                        <Trash size={18} />
                    </button>
                </div>
            </div>
            
            <div className="p-6 space-y-4 relative bg-white">
                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, idx) => (
                            <span key={idx} className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5 hover:bg-pink-50 hover:text-pink-500 transition-colors cursor-default">
                                <Tag size={10} />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50"></div>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">{item.category} Mehendi</span>
                    </div>
                    <button 
                        onClick={onEditLabels}
                        className="text-[10px] font-black text-slate-300 hover:text-pink-500 transition-colors uppercase tracking-[0.3em] flex items-center space-x-1"
                    >
                        <span>Edit</span>
                        <ChevronRight size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function PortfolioPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const profile = useQuery(
        api.vendors.getByOrganiserId,
        vendorId ? { organiserId: vendorId } : "skip"
    );
    const updateProfile = useMutation(api.vendors.updateProfile);
    const generateUploadUrl = useMutation(api.images.generateUploadUrl);

    const portfolio = profile?.portfolio || [];
    const [filter, setFilter] = useState("All");
    const [showUploadConfig, setShowUploadConfig] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [uploadConfig, setUploadConfig] = useState({
        category: "Bridal",
        tags: "",
        isTopDesign: false,
        beforeAfter: false
    });

    const filteredPortfolio = filter === "All" 
        ? portfolio 
        : portfolio.filter(item => item.category === filter);

    const categories = ["Bridal", "Arabic", "Minimal", "Traditional"];

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setPendingFiles(files);
        setShowUploadConfig(true);
    };

    const handleUpload = async (filesToUpload = pendingFiles) => {
        if (!filesToUpload || filesToUpload.length === 0) return;
        setUploading(true);
        setShowUploadConfig(false);
        try {
            const newPhotos = [];
            for (const file of filesToUpload) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                const { storageId } = await result.json();
                newPhotos.push({
                    url: storageId,
                    type: file.type.startsWith("video") ? "video" : "image",
                    category: uploadConfig.category,
                    tags: uploadConfig.tags.split(",").map(t => t.trim()).filter(t => t),
                    isTopDesign: uploadConfig.isTopDesign,
                    beforeAfter: uploadConfig.beforeAfter
                });
            }
            await updateProfile({
                organiserId: vendorId,
                category: profile?.category || "Unknown",
                portfolio: [...portfolio, ...newPhotos]
            });
            setPendingFiles([]);
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            setPendingFiles(files);
            setShowUploadConfig(true);
        }
    };

    const handleDelete = async (index) => {
        const newPortfolio = portfolio.filter((_, i) => i !== index);
        try {
            await updateProfile({
                organiserId: vendorId,
                category: profile?.category || "Unknown",
                portfolio: newPortfolio
            });
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const toggleTopDesign = async (index) => {
        const newPortfolio = [...portfolio];
        newPortfolio[index].isTopDesign = !newPortfolio[index].isTopDesign;
        try {
            await updateProfile({
                organiserId: vendorId,
                category: profile?.category || "Unknown",
                portfolio: newPortfolio
            });
        } catch (error) {
            console.error("Toggle failed:", error);
        }
    };

    const toggleBeforeAfter = async (index) => {
        const newPortfolio = [...portfolio];
        newPortfolio[index].beforeAfter = !newPortfolio[index].beforeAfter;
        try {
            await updateProfile({
                organiserId: vendorId,
                category: profile?.category || "Unknown",
                portfolio: newPortfolio
            });
        } catch (error) {
            console.error("Toggle failed:", error);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            <div className="flex flex-col space-y-10">
                {/* Filters */}
                <div className="flex items-center space-x-3 overflow-x-auto pb-6 scrollbar-hide">
                    {["All", ...categories].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border shadow-xl shadow-slate-200/20 ${
                                filter === cat 
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400' 
                                    : 'bg-white text-slate-400 border-slate-100 hover:text-slate-900 hover:border-pink-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-slate-200">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-pink-50 to-pink-100 text-pink-500 border border-pink-200 flex items-center justify-center font-black">
                                <ImageIcon size={28} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">Exhibit Masterwork</span>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Portfolio Gallery</h2>
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm max-w-2xl font-medium leading-relaxed">Showcase your absolute best designs. High-fidelity visual evidence increases booking conversions by over 40%.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            multiple 
                            accept="image/*,video/*" 
                            className="hidden" 
                        />
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            disabled={uploading}
                            className="flex items-center space-x-4 bg-slate-900 text-white px-10 py-4.5 rounded-[2rem] font-black text-xs shadow-2xl hover:bg-pink-500 transition-all disabled:opacity-30 group uppercase tracking-[0.3em] italic"
                        >
                            {uploading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            )}
                            <span>{uploading ? "Uploading..." : "Publish Content"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadConfig && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-2xl bg-slate-900/40">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] border border-slate-100 shadow-3xl p-10 space-y-10 animate-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-pink-50 rounded-2xl text-pink-500 flex items-center justify-center border border-pink-100 italic font-black">
                                    <FolderHeart size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Context & Settings</h3>
                            </div>
                            <button onClick={() => setShowUploadConfig(false)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center border border-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Classification</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setUploadConfig({...uploadConfig, category: cat})}
                                            className={`p-5 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                                                uploadConfig.category === cat 
                                                    ? 'bg-pink-50 border-pink-500 text-pink-500 shadow-inner' 
                                                    : 'bg-white border-slate-50 text-slate-400 hover:border-pink-200 hover:text-slate-900'
                                            }`}
                                        >
                                            {cat}
                                            {uploadConfig.category === cat && <Check size={16} strokeWidth={3} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Style Metadata</label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {['Arabic', 'Rajasthani', 'Minimalist', 'Traditionalist', 'Floral', 'Portraiture'].map(tag => (
                                        <button 
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                                const currentTags = uploadConfig.tags.split(',').map(t => t.trim()).filter(Boolean);
                                                if (!currentTags.includes(tag)) {
                                                    setUploadConfig({...uploadConfig, tags: [...currentTags, tag].join(', ')});
                                                }
                                            }}
                                            className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all bg-slate-50 hover:bg-pink-500 text-slate-400 hover:text-white border border-slate-100 hover:border-pink-400 shadow-sm"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative group">
                                    <Tag size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pink-500 transition-all font-black" />
                                    <input 
                                        type="text" 
                                        placeholder="Add custom keywords..."
                                        value={uploadConfig.tags}
                                        onChange={(e) => setUploadConfig({...uploadConfig, tags: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 pl-14 pr-6 text-sm font-bold text-slate-900 transition-all outline-none focus:bg-white focus:border-pink-500 placeholder:text-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex-1 flex items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:border-pink-200 group transition-all">
                                    <input 
                                        type="checkbox" 
                                        checked={uploadConfig.isTopDesign}
                                        onChange={(e) => setUploadConfig({...uploadConfig, isTopDesign: e.target.checked})}
                                        className="w-5 h-5 rounded-lg border-slate-200 text-pink-500 focus:ring-pink-500/20"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-900 group-hover:text-pink-500 uppercase italic tracking-tight transition-colors">Masterpiece</span>
                                        <span className="text-[9px] text-slate-400 font-bold">Featured Highlight</span>
                                    </div>
                                </label>
                                <label className="flex-1 flex items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:border-pink-200 group transition-all">
                                    <input 
                                        type="checkbox" 
                                        checked={uploadConfig.beforeAfter}
                                        onChange={(e) => setUploadConfig({...uploadConfig, beforeAfter: e.target.checked})}
                                        className="w-5 h-5 rounded-lg border-slate-200 text-pink-500 focus:ring-pink-500/20"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-900 group-hover:text-pink-500 uppercase italic tracking-tight transition-colors">B / A Mode</span>
                                        <span className="text-[9px] text-slate-400 font-bold">Process Capture</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button 
                            onClick={handleUpload}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-5 rounded-[2rem] text-white font-black text-[10px] uppercase tracking-[0.4em] shadow-3xl shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all outline-none"
                        >
                            Initiate Upload ({pendingFiles.length})
                        </button>
                    </div>
                </div>
            )}

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {filteredPortfolio.map((item, i) => (
                    <DesignCard 
                        key={i} 
                        item={item} 
                        onDelete={() => handleDelete(i)}
                        onToggleBeforeAfter={() => toggleBeforeAfter(i)}
                        onToggleTopDesign={() => toggleTopDesign(i)}
                        onEditLabels={() => {}} 
                    />
                ))}
            </div>

            {portfolio.length === 0 && (
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={`py-20 lg:py-44 px-6 lg:px-10 flex flex-col items-center justify-center text-center space-y-8 lg:space-y-10 bg-white rounded-[2rem] lg:rounded-[4rem] border-2 border-dashed transition-all duration-500 shadow-inner ${
                        isDragging ? 'border-pink-500 bg-pink-50/30 scale-[0.98]' : 'border-slate-100'
                    }`}
                >
                    <div className="relative group">
                        <div className={`absolute inset-0 bg-pink-500 blur-[60px] lg:blur-[80px] transition-opacity ${isDragging ? 'opacity-30' : 'opacity-10'}`}></div>
                        <div className={`relative w-24 h-24 lg:w-32 lg:h-32 rounded-[2rem] lg:rounded-[3rem] flex items-center justify-center transition-all duration-700 border ${
                            isDragging ? 'bg-pink-500 text-white scale-110 border-pink-400 rotate-12' : 'bg-slate-50 text-slate-200 border-slate-100'
                        }`}>
                            <ImageIcon size={40} className={isDragging ? 'animate-bounce' : 'lg:size-56'} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                            {isDragging ? 'Release Masterpiece' : 'Digital Canvas Emits Void'}
                        </h3>
                        <p className="text-slate-400 max-w-sm mx-auto text-xs lg:text-sm font-medium leading-relaxed">
                            {isDragging ? 'Drop your files here to initiate the exhibition.' : 'Your portfolio is currently blank. Drag and drop high-fidelity visual evidence here to increase conversions.'}
                        </p>
                    </div>
                    {!isDragging && (
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="bg-slate-900 text-white px-8 lg:px-12 py-4 lg:py-5 rounded-[2rem] lg:rounded-[2.5rem] font-black text-[9px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] hover:bg-pink-500 transition-all shadow-3xl shadow-slate-900/20 italic"
                        >
                            Select Your Masterpiece
                        </button>
                    )}
                </div>
            )}

            {/* Intelligence Notice */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 flex flex-col md:flex-row md:items-center justify-between gap-10 mt-16 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={150} />
                </div>
                <div className="flex items-center space-x-8 relative z-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-pink-50 flex items-center justify-center text-pink-500 shadow-inner border border-pink-100">
                        <Sparkles size={40} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-black text-slate-900 text-xl uppercase tracking-tight italic">Autotag Intelligence</h4>
                        <p className="text-sm text-slate-400 max-w-lg font-bold leading-relaxed">Developing an advanced neural tool to systematically categorize and index your work for precision customer matching.</p>
                    </div>
                </div>
                <button className="px-10 py-4.5 bg-white border-2 border-pink-500 text-pink-500 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-pink-500 hover:text-white transition-all whitespace-nowrap italic relative z-10">
                    Join Access List
                </button>
            </div>
        </div>
    );
}
