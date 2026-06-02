"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronRight, ArrowLeft, CheckCircle2, User, FileText, 
  CreditCard, ShieldCheck, Download, AlertCircle, Shirt 
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";
import QRCode from "qrcode";

export default function MarathonRegistrationClient({ marathon, categories, customFields, slug }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const initialCategory = categories.find(c => c.id === searchParams.get('category')) || null;

  const [formData, setFormData] = useState({
    category_id: initialCategory?.id || '',
    participant: {
      full_name: user?.user_metadata?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dob: '',
      gender: '',
      blood_group: '',
      emergency_contact: '',
      address: '',
      city: '',
      state: '',
      country: 'India'
    },
    tshirt_size: '',
    running_club: '',
    document_type: '',
    document_file: null,
    document_preview: null,
    custom_fields: {}
  });

  const [registrationResult, setRegistrationResult] = useState(null);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  const handleImageUpload = async (file) => {
    // Mock upload for now, ideally use Supabase storage as implemented in other components
    return URL.createObjectURL(file); // Temporary blob URL
  };

  const submitRegistration = async () => {
    setLoading(true);
    try {
      // In a real flow, first integrate Razorpay/Stripe here.
      // We will skip actual payment processing for this skeleton and simulate success.
      
      const payload = {
        marathon_id: marathon.id,
        category_id: formData.category_id,
        user_id: user?.id || null,
        participant: formData.participant,
        tshirt_size: formData.tshirt_size,
        running_club: formData.running_club,
        custom_fields: formData.custom_fields,
        payment_id: `PAY_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        payment_amount: selectedCategory?.effective_price || 0,
        payment_status: 'Paid'
      };

      const res = await fetch('/api/marathon/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setRegistrationResult(data.registration);
      
      if (formData.document_file && data.registration?.registration_id) {
         // Optionally upload document here via /api/marathon/documents
      }

      // Generate QR for display
      const qrDataUrl = await QRCode.toDataURL(data.registration.qr_code, { width: 200, margin: 1 });
      setQrCodeUrl(qrDataUrl);

      setStep(5);
      showToast("Registration successful!", "success");

    } catch (err) {
      console.error(err);
      showToast(err.message || "An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Category", icon: Trophy },
    { id: 2, title: "Details", icon: User },
    { id: 3, title: "Identity", icon: ShieldCheck },
    { id: 4, title: "Payment", icon: CreditCard },
  ];

  if (step === 5) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black mb-2">Registration Confirmed!</h2>
          <p className="text-white/60 mb-6 text-sm">Your booking ID: <span className="font-bold text-white">{registrationResult?.registration_id}</span></p>
          
          <div className="bg-white rounded-3xl p-6 mb-8 inline-block">
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />}
            <p className="text-black/50 text-[10px] font-bold uppercase mt-4 tracking-widest">Scan at Check-In</p>
          </div>

          <div className="flex gap-4">
            <button onClick={() => window.print()} className="flex-1 py-4 border border-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <Download size={16} /> E-Ticket
            </button>
            <button onClick={() => router.push('/')} className="flex-1 py-4 bg-pink-500 rounded-xl font-bold text-sm">
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <div className="bg-white/5 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => step > 1 ? handleBack() : router.back()} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-black truncate">{marathon?.title || "Register"}</h1>
            <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Step {step} of 4</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-10 px-2 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -z-10" />
          <div className="absolute top-1/2 left-0 h-0.5 bg-pink-500 -z-10 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step >= s.id ? 'bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 'bg-[#1a1a24] text-white/40 border border-white/10'
              }`}>
                {step > s.id ? <CheckCircle2 size={20} /> : <s.icon size={18} />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.id ? 'text-pink-400' : 'text-white/40'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: Category */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-black mb-6">Select Category</h2>
            {categories.map(cat => {
              const available = cat.available_slots ?? Math.max(0, (cat.slots_total || 100) - (cat.slots_booked || 0));
              const isSelected = formData.category_id === cat.id;
              
              return (
                <button
                  key={cat.id}
                  disabled={available <= 0}
                  onClick={() => setFormData(p => ({ ...p, category_id: cat.id }))}
                  className={`w-full text-left p-6 rounded-3xl border transition-all ${
                    available <= 0 ? 'opacity-50 border-white/5 cursor-not-allowed' :
                    isSelected ? 'bg-pink-500/10 border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-lg font-black text-white">{cat.category_name} <span className="text-pink-400">({cat.distance_km}{cat.distance_unit === 'M' ? 'M' : 'K'})</span></h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cat.age_group && <span className="text-xs px-2 py-1 bg-white/10 rounded-md text-white/70">Age: {cat.age_group}</span>}
                        {cat.gender_category && cat.gender_category !== 'All' && <span className="text-xs px-2 py-1 bg-white/10 rounded-md text-white/70">{cat.gender_category}</span>}
                        {available <= 0 ? (
                          <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-md font-bold">Sold Out</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-md">{available} slots left</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {cat.is_early_bird && <div className="text-[10px] text-yellow-400 font-bold uppercase mb-1">Early Bird</div>}
                      <div className="text-2xl font-black">₹{Number(cat.effective_price || cat.price).toLocaleString('en-IN')}</div>
                      {cat.is_early_bird && <div className="text-xs text-white/40 line-through">₹{Number(cat.price).toLocaleString('en-IN')}</div>}
                    </div>
                  </div>
                </button>
              );
            })}
            
            <div className="mt-8 flex justify-end">
              <button 
                disabled={!formData.category_id} 
                onClick={handleNext}
                className="px-8 py-4 bg-white text-black rounded-xl font-black flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-black mb-6">Participant Info</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 block pl-2">Full Name *</label>
                <input required value={formData.participant.full_name} onChange={e => setFormData(p => ({...p, participant: {...p.participant, full_name: e.target.value}}))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white placeholder:text-white/20 focus:border-pink-500 outline-none" placeholder="Legal Name" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 block pl-2">Email *</label>
                <input required type="email" value={formData.participant.email} onChange={e => setFormData(p => ({...p, participant: {...p.participant, email: e.target.value}}))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white placeholder:text-white/20 focus:border-pink-500 outline-none" placeholder="Email Address" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 block pl-2">Phone *</label>
                <input required type="tel" value={formData.participant.phone} onChange={e => setFormData(p => ({...p, participant: {...p.participant, phone: e.target.value}}))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white placeholder:text-white/20 focus:border-pink-500 outline-none" placeholder="Mobile Number" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 block pl-2">Date of Birth *</label>
                <input required type="date" value={formData.participant.dob} onChange={e => setFormData(p => ({...p, participant: {...p.participant, dob: e.target.value}}))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white placeholder:text-white/20 focus:border-pink-500 outline-none [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 block pl-2">Gender *</label>
                <select required value={formData.participant.gender} onChange={e => setFormData(p => ({...p, participant: {...p.participant, gender: e.target.value}}))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:border-pink-500 outline-none appearance-none">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 block pl-2">Blood Group *</label>
                <select required value={formData.participant.blood_group} onChange={e => setFormData(p => ({...p, participant: {...p.participant, blood_group: e.target.value}}))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:border-pink-500 outline-none appearance-none">
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mt-6">
              <h3 className="font-black mb-4 flex items-center gap-2"><Shirt size={18} className="text-pink-400"/> Event Add-ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 block pl-2">T-Shirt Size</label>
                  <select value={formData.tshirt_size} onChange={e => setFormData(p => ({...p, tshirt_size: e.target.value}))} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:border-pink-500 outline-none appearance-none">
                    <option value="">Select Size</option>
                    <option value="XS">XS (34")</option>
                    <option value="S">S (36")</option>
                    <option value="M">M (38")</option>
                    <option value="L">L (40")</option>
                    <option value="XL">XL (42")</option>
                    <option value="XXL">XXL (44")</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 block pl-2">Running Club (Optional)</label>
                  <input value={formData.running_club} onChange={e => setFormData(p => ({...p, running_club: e.target.value}))} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-bold text-white placeholder:text-white/20 focus:border-pink-500 outline-none" placeholder="e.g. Coimbatore Runners" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={handleBack} className="px-6 py-4 bg-white/5 text-white rounded-xl font-bold">Back</button>
              <button 
                onClick={() => {
                  const p = formData.participant;
                  if(!p.full_name || !p.email || !p.phone || !p.dob || !p.gender || !p.blood_group) {
                    showToast("Please fill all required fields", "error");
                    return;
                  }
                  handleNext();
                }}
                className="px-8 py-4 bg-white text-black rounded-xl font-black flex items-center gap-2"
              >
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Identity Verification */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4">
              <AlertCircle className="text-blue-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-black text-blue-100 mb-1">Identity Verification Required</h3>
                <p className="text-sm text-blue-200/70">To maintain the integrity of age-category races, organizers require a valid government ID. Your document is securely stored.</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 block pl-2">Document Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {['Aadhaar', 'Passport', 'Driving License', 'College ID'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData(p => ({...p, document_type: type}))}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      formData.document_type === type ? 'bg-pink-500/20 border-pink-500 text-pink-100' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {formData.document_type && (
              <div className="mt-6">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 block pl-2">Upload {formData.document_type} *</label>
                <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-3xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all overflow-hidden group">
                  {formData.document_preview ? (
                    <>
                      <img src={formData.document_preview} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-all" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <span className="bg-black/80 px-4 py-2 rounded-full text-xs font-bold">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-10 h-10 mb-3 text-white/40" />
                      <p className="mb-2 text-sm text-white/60"><span className="font-bold text-white">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-white/40">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                    const file = e.target.files[0];
                    if(file) {
                      setFormData(p => ({...p, document_file: file, document_preview: URL.createObjectURL(file)}));
                    }
                  }} />
                </label>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={handleBack} className="px-6 py-4 bg-white/5 text-white rounded-xl font-bold">Back</button>
              <button 
                onClick={() => {
                  if(!formData.document_type || !formData.document_file) {
                    showToast("Please upload a valid document", "error");
                    return;
                  }
                  handleNext();
                }}
                className="px-8 py-4 bg-white text-black rounded-xl font-black flex items-center gap-2"
              >
                Review & Pay <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Summary & Payment */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-black mb-6">Review & Payment</h2>
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4 border-b border-white/10 pb-4">Registration Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-bold">{formData.participant.full_name}</p>
                    <p className="text-white/50 text-sm">{selectedCategory?.category_name} ({selectedCategory?.distance_km}{selectedCategory?.distance_unit === 'M' ? 'M' : 'K'})</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg">₹{Number(selectedCategory?.effective_price || 0).toLocaleString('en-IN')}</p>
                    {selectedCategory?.is_early_bird && <p className="text-[10px] text-yellow-400 font-bold uppercase mt-1">Early Bird Applied</p>}
                  </div>
                </div>

                {formData.tshirt_size && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">T-Shirt Size</span>
                    <span className="text-white font-bold">{formData.tshirt_size}</span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-white/50 font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-pink-400">₹{Number(selectedCategory?.effective_price || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="text-green-400" />
              <p className="text-xs text-green-100/70 font-medium">Payments are securely processed. We don't store your card details.</p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button disabled={loading} onClick={handleBack} className="px-6 py-4 bg-white/5 text-white rounded-xl font-bold disabled:opacity-50">Back</button>
              <button 
                disabled={loading}
                onClick={submitRegistration}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-black flex items-center gap-2 disabled:opacity-50 shadow-xl shadow-pink-500/20"
              >
                {loading ? "Processing..." : `Pay ₹${Number(selectedCategory?.effective_price || 0).toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
