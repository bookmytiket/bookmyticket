"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { 
    Upload, CheckCircle, ShieldCheck, FileText, Banknote, 
    Building2, User, ArrowRight, Loader2, AlertCircle, 
    FileUp, Check, X, ArrowLeft, Layout, LogOut, ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function OnboardingPage() {
    const { user, loading: authLoading, fetchAndSetUser } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const [step, setStep] = useState(1);
    const [activeStep, setActiveStep] = useState(1);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [kycData, setKycData] = useState(null);

    const [form, setForm] = useState({
        orgName: "",
        contactPerson: "",
        panNumber: "",
        gstNumber: "",
        address: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
    });

    const [files, setFiles] = useState({
        idProof: null,
        businessProof: null,
        addressProof: null,
        cancelledCheque: null,
    });

    const [previews, setPreviews] = useState({
        idProof: null,
        businessProof: null,
        addressProof: null,
        cancelledCheque: null,
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/signin?redirect=/onboarding");
            return;
        }

        if (user && ["admin", "super_admin", "system_admin"].includes(user.role)) {
            router.push("/admin");
            return;
        }

        const dashboardAccess = user?.verification_status?.dashboard_access === true;
        
        console.log("Onboarding Check:", { dashboardAccess, role: user?.role });

        if (user && dashboardAccess) {
            console.log("Redirecting to /organiser...");
            router.push("/organiser");
            return;
        }

        // If not approved, force a profile refresh to catch any recent admin approvals
        if (user && !dashboardAccess && !loading) {
            fetchAndSetUser(user);
        }

        if (user) {
            setForm(prev => ({
                ...prev,
                orgName: user.business_name || user.org_name || "",
                contactPerson: user.name || user.full_name || "",
                panNumber: user.pan_number || "",
                gstNumber: user.gst_number || "",
                address: user.address || "",
            }));

            // Check if there is existing KYC submission
            fetchKycData();
        }
    }, [user, authLoading, router]);

    const fetchKycData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Speed up load by only fetching what is needed for initialization
            const { data, error } = await supabase
                .from("organizer_verification_status")
                .select("*")
                .eq("organizer_id", user.id)
                .maybeSingle();
            
            if (data) {
                setKycData(data);
                
                // If already submitted, skip to review step
                if (data.kyc_status === "submitted" || data.kyc_status === "under_review" || data.kyc_status === "pending") {
                    setStep(5);
                }
            }
        } catch (err) {
            console.error("Error fetching KYC data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast("File size too large. Max 5MB allowed.", "error");
                return;
            }
            setFiles(prev => ({ ...prev, [field]: file }));
            
            // Create preview if it's an image
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => ({ ...prev, [field]: reader.result }));
                };
                reader.readAsDataURL(file);
            } else {
                setPreviews(prev => ({ ...prev, [field]: 'pdf' }));
            }
        }
    };

    const uploadFile = async (file, bucket = 'organizer-kyc-documents') => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);
            
        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final Validation
        if (!files.cancelledCheque) {
            showToast("Original Cheque Leaf Image is Mandatory", "error");
            return;
        }

        setSubmitting(true);
        try {
            // Upload files first
            const idProofUrl = await uploadFile(files.idProof);
            const businessProofUrl = await uploadFile(files.businessProof);
            const addressProofUrl = await uploadFile(files.addressProof);
            const chequeUrl = await uploadFile(files.cancelledCheque);

            const payload = {
                full_name: form.contactPerson,
                phone: user.phone || "",
                business_name: form.orgName,
                business_type: form.category,
                pan_number: form.panNumber,
                gst_number: form.gstNumber,
                business_address: form.address,
                city: user.selected_city || "",
                state: "",
                pincode: "",
                country: "India",
                bank: {
                    account_holder_name: form.orgName, // Or collect this
                    bank_name: form.bankName,
                    account_number: form.accountNumber,
                    ifsc_code: form.ifscCode,
                },
                documents: {
                    identity: idProofUrl,
                    business: businessProofUrl,
                    address: addressProofUrl,
                    bank: chequeUrl
                }
            };

            const session = await supabase.auth.getSession();
            const res = await fetch("/api/organiser/onboarding", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.data.session?.access_token}`
                },
                body: JSON.stringify(payload)
            });

            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || "Submission failed");

            showToast("KYC Application submitted successfully!", "success");
            setStep(5);
        } catch (err) {
            console.error("Submission error:", err);
            showToast("Failed to submit KYC: " + err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#f84464]" size={40} />
                    <p className="text-slate-600 font-medium animate-pulse">Initializing Onboarding...</p>
                </div>
            </div>
        );
    }

    // Step 5: Success / Status Page
    if (step === 5) {
        const isRejected = kycData?.status === "Rejected";
        return (
            <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 flex items-center">
                <div className="max-w-xl mx-auto text-center w-full">
                    <div className={`w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center ${isRejected ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
                        {isRejected ? <X size={40} /> : <CheckCircle size={40} />}
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase mb-4">
                        {isRejected ? "Application Rejected" : "KYC Under Review"}
                    </h1>
                    <p className="text-slate-500 mb-8 leading-relaxed font-medium">
                        {isRejected 
                            ? "Unfortunately, your verification documents were not accepted. Please check the reason below and re-submit."
                            : "Your documents have been submitted successfully. Our verification team is currently reviewing your profile. You'll receive full access once approved."}
                    </p>

                    {isRejected && (
                        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 mb-8 text-left shadow-sm">
                            <div className="flex gap-3 text-red-600 mb-2 items-center">
                                <AlertCircle size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Reason for Rejection</span>
                            </div>
                            <p className="text-slate-700 text-sm font-semibold">{kycData.rejection_reason || "Documents provided are unclear or incomplete."}</p>
                        </div>
                    )}

                    {!isRejected && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-8 text-left space-y-4 shadow-sm">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 uppercase font-black tracking-widest">Current Status</span>
                                <span className="px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full font-black uppercase tracking-widest text-[10px]">{kycData?.kyc_status || "Submitted"}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 uppercase font-black tracking-widest">Submitted On</span>
                                <span className="text-slate-900 font-black">{new Date(kycData?.submitted_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {isRejected ? (
                            <button 
                                onClick={() => setStep(1)}
                                className="w-full py-5 bg-gradient-to-r from-[#f84464] to-[#c026d3] rounded-2xl text-white font-black uppercase tracking-widest italic hover:scale-[1.02] transition-all shadow-xl shadow-[#f84464]/20"
                            >
                                Update Documents
                            </button>
                        ) : (
                            <button 
                                onClick={() => router.push("/")}
                                className="w-full py-5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-black uppercase tracking-widest italic hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Back to Home
                            </button>
                        )}
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mt-6">Questions? contact partner@bookmyticket.net</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans">
            {/* Header - Slimmed to single row */}
            <div className="max-w-7xl mx-auto py-3 px-6 flex justify-between items-center border-b border-slate-100 mb-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Partner <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Onboarding</span></h1>
                    <div className="h-4 w-px bg-slate-200" />
                    <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest">Verification Portal</p>
                </div>
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-1 w-10 rounded-full transition-all duration-500 ${step >= s ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-slate-200'}`} />
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-4">
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/40">
                    
                    <div className="flex flex-col md:flex-row min-h-[500px]">
                        {/* Vertical Sidebar */}
                        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 text-[10px] font-black uppercase tracking-widest leading-none mb-1">KYC Status</h3>
                                    <p className="text-purple-600 text-[9px] font-bold uppercase tracking-tight">Step {step} of 4</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 mb-10">
                                <SidebarItem 
                                    icon={<User size={16} />} 
                                    text="Business Profile" 
                                    active={step === 1} 
                                    done={step > 1} 
                                />
                                <SidebarItem 
                                    icon={<Building2 size={16} />} 
                                    text="Verification" 
                                    active={step === 2} 
                                    done={step > 2} 
                                />
                                <SidebarItem 
                                    icon={<Banknote size={16} />} 
                                    text="Payout Details" 
                                    active={step === 3} 
                                    done={step > 3} 
                                />
                                <SidebarItem 
                                    icon={<ShieldCheck size={16} />} 
                                    text="Final Review" 
                                    active={step === 4} 
                                    done={step > 4} 
                                />
                            </div>

                            <div className="mt-auto space-y-4">
                                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Need Help?</p>
                                    <p className="text-[9px] text-slate-600 font-medium leading-tight mb-2">Our support team is available 24/7 for verification help.</p>
                                    <button className="w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-[8px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">Contact Support</button>
                                </div>

                                <button 
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        router.push('/');
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-600 hover:bg-purple-600 hover:text-white transition-all group shadow-sm cursor-pointer"
                                >
                                    <LogOut size={14} className="group-hover:rotate-12 transition-transform" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Sign Out Account</span>
                                </button>
                            </div>
                        </div>

                        {/* Full Width Landscape Form Area */}
                        <div className="flex-1 p-4 md:p-8">
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Name</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 outline-none transition-all font-bold text-slate-900 text-xs"
                                            placeholder="Legal Company Name"
                                            value={form.orgName}
                                            onChange={(e) => setForm({...form, orgName: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Representative</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 outline-none transition-all font-bold text-slate-900 text-xs"
                                            placeholder="Full Legal Name"
                                            value={form.contactPerson}
                                            onChange={(e) => setForm({...form, contactPerson: e.target.value})}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Official Address</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 min-h-[45px] focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 outline-none transition-all font-bold text-slate-900 text-xs resize-none"
                                        placeholder="Registered business address with PIN code"
                                        value={form.address}
                                        onChange={(e) => setForm({...form, address: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-3 relative">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Category</label>
                                        <div 
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex justify-between items-center cursor-pointer hover:bg-white hover:border-purple-500 transition-all shadow-sm"
                                        >
                                            <span className={`text-sm font-bold ${form.category ? 'text-slate-900' : 'text-slate-400'}`}>
                                                {form.category || "Select Category"}
                                            </span>
                                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>

                                        {dropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                                {["Individual / Proprietorship", "Pvt Ltd Company", "Partnership Firm", "Professional Organiser", "Other"].map((cat) => (
                                                    <div 
                                                        key={cat}
                                                        onClick={() => {
                                                            setForm({...form, category: cat});
                                                            setDropdownOpen(false);
                                                        }}
                                                        className="px-5 py-3 hover:bg-purple-50 text-slate-700 text-sm font-bold cursor-pointer transition-colors"
                                                    >
                                                        {cat}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business PAN</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-[#f84464] focus:ring-4 focus:ring-[#f84464]/5 outline-none transition-all font-bold uppercase text-slate-900 text-sm"
                                            placeholder="ABCDE1234F"
                                            value={form.panNumber}
                                            onChange={(e) => setForm({...form, panNumber: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">GST Number (Optional)</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-[#f84464] focus:ring-4 focus:ring-[#f84464]/5 outline-none transition-all font-bold uppercase text-slate-900 text-sm"
                                            placeholder="GSTIN Number"
                                            value={form.gstNumber}
                                            onChange={(e) => setForm({...form, gstNumber: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FileCard 
                                        title="Identity Proof" 
                                        desc="Aadhar Card / Passport" 
                                        file={files.idProof}
                                        preview={previews.idProof}
                                        onChange={(e) => handleFileChange(e, 'idProof')}
                                    />
                                    <FileCard 
                                        title="Business Proof" 
                                        desc="Incorporation Certificate" 
                                        file={files.businessProof}
                                        preview={previews.businessProof}
                                        onChange={(e) => handleFileChange(e, 'businessProof')}
                                    />
                                    <FileCard 
                                        title="Address Proof" 
                                        desc="Utility Bill / Rent Agreement" 
                                        file={files.addressProof}
                                        preview={previews.addressProof}
                                        onChange={(e) => handleFileChange(e, 'addressProof')}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bank Name</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:border-[#f84464] outline-none transition-all font-bold text-slate-900 text-xs"
                                            placeholder="Bank Name"
                                            value={form.bankName}
                                            onChange={(e) => setForm({...form, bankName: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Account No</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:border-[#f84464] outline-none transition-all font-bold text-slate-900 text-xs"
                                                placeholder="XXXX XXXX"
                                                value={form.accountNumber}
                                                onChange={(e) => setForm({...form, accountNumber: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">IFSC</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:border-purple-500 outline-none transition-all font-bold text-slate-900 text-xs uppercase"
                                                placeholder="IFSC"
                                                value={form.ifscCode}
                                                onChange={(e) => setForm({...form, ifscCode: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <FileCard 
                                    title="Original Cheque Leaf" 
                                    desc="Original Image Only (Mandatory)" 
                                    file={files.cancelledCheque}
                                    preview={previews.cancelledCheque}
                                    onChange={(e) => handleFileChange(e, 'cancelledCheque')}
                                    accept=".png,.jpg,.jpeg"
                                    isMandatory
                                    fullWidth
                                />
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-200">
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Summary</h3>
                                        <div className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Review & Submit</div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <SummaryItem label="Business Entity" value={form.orgName} />
                                        <SummaryItem label="Category" value={form.category} />
                                        <SummaryItem label="Representative" value={form.contactPerson} />
                                        <SummaryItem label="PAN Number" value={form.panNumber} />
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <SummaryItem label="Registered Address" value={form.address} />
                                        </div>
                                        <SummaryItem label="Settlement" value={form.bankName} />
                                        <SummaryItem label="Account No" value={`****${form.accountNumber.slice(-4)}`} />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-white flex flex-col md:flex-row gap-6 items-center shadow-2xl shadow-purple-500/20">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <p className="text-xs font-black uppercase tracking-tight mb-1 italic">Final Confirmation</p>
                                        <p className="text-[11px] text-white/80 font-semibold">
                                            All details are accurate. Verification takes 24-48 hours.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="px-8 py-3 bg-white text-purple-600 rounded-xl font-black uppercase tracking-widest italic text-[11px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50 shrink-0"
                                    >
                                        {submitting ? "..." : "Complete Submission"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Footer Navigation (only for steps 1-3) */}
                        {step < 4 && (
                            <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100">
                                {step > 1 ? (
                                    <button 
                                        onClick={() => setStep(step - 1)}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-900 font-black uppercase tracking-widest text-[9px] transition-all cursor-pointer"
                                    >
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                ) : <div />}

                                <button 
                                    onClick={() => setStep(step + 1)}
                                    className="flex items-center gap-3 px-10 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-black uppercase tracking-widest italic text-[10px] hover:scale-105 transition-all shadow-xl shadow-purple-500/20 cursor-pointer"
                                >
                                    Proceed <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarItem({ icon, text, active, done }) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${active ? 'bg-white shadow-md border border-slate-100 translate-x-1' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-100 text-slate-400'}`}>
                {done ? <Check size={14} /> : icon}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${active ? 'text-slate-900' : 'text-slate-400'}`}>{text}</span>
        </div>
    );
}

function ReqItem({ icon, text, active }) {
    return (
        <div className={`flex items-center gap-4 transition-all duration-500 ${active ? 'text-slate-900' : 'text-slate-300'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${active ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-transparent text-white shadow-lg shadow-purple-500/20' : 'border-slate-200'}`}>
                {icon}
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest leading-none">{text}</span>
        </div>
    );
}

function FileCard({ title, desc, file, preview, onChange, fullWidth = false, accept = ".pdf,.png,.jpg,.jpeg", isMandatory = false }) {
    return (
        <div className={`${fullWidth ? 'col-span-full' : ''} space-y-2`}>
            <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{title}</label>
                {isMandatory && <span className="text-[8px] font-black text-pink-500 uppercase tracking-widest animate-pulse">Required</span>}
            </div>
            <label className={`relative group cursor-pointer block h-24 rounded-2xl border-2 border-dashed transition-all duration-300 ${file ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-slate-200 bg-slate-50 hover:border-pink-500/40 hover:bg-slate-100 shadow-sm'}`}>
                <input type="file" className="hidden" onChange={onChange} accept={accept} />
                
                {preview ? (
                    <div className="absolute inset-3 rounded-[32px] overflow-hidden shadow-sm">
                        {preview === 'pdf' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                                <FileText size={48} className="text-purple-600 mb-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 max-w-[200px] truncate">{file?.name}</span>
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                {title.includes("Cheque") && (
                                    <div className="absolute top-2 right-2 px-3 py-1 bg-green-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                        <ShieldCheck size={10} /> Originality Verified
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 px-8 py-3 rounded-full shadow-xl">Update Image</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-16 h-16 rounded-[24px] bg-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm border border-slate-100">
                            <FileUp size={32} className="text-slate-400 group-hover:text-pink-500" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors leading-tight">{desc}</p>
                    </div>
                )}
            </label>
        </div>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{label}</p>
            <p className="text-slate-900 font-black italic uppercase tracking-tighter text-xl leading-tight border-l-4 border-[#f84464] pl-4">{value || "Unspecified"}</p>
        </div>
    );
}
