"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabase';
import { Trophy, FileText, CheckCircle2, AlertCircle, ChevronRight, UploadCloud } from 'lucide-react';
import Script from 'next/script';
import { useToast } from '@/context/ToastContext';

export default function BadmintonRegistration({ params }) {
  const { slug } = params;
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    dob: '',
    gender: 'Boys',
    academyName: '',
    coachName: '',
    playerRanking: '',
    shirtSize: 'M',
    address: '',
    district: '',
    state: '',
    pincode: '',
  });

  const [documents, setDocuments] = useState([]);
  const [docUploadLoading, setDocUploadLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.user_metadata?.full_name || '',
        mobile: prev.mobile || user.user_metadata?.phone || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('badminton_events')
        .select('*, badminton_categories(*)')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      setEvent(data);
    } catch (err) {
      console.error(err);
      showToast("Event not found", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setDocUploadLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'guest'}_${Date.now()}.${fileExt}`;
      const filePath = `${slug}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('player-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('player-documents').getPublicUrl(filePath);
      
      setDocuments(prev => [...prev.filter(d => d.type !== type), { type, url: data.publicUrl }]);
      showToast(`${type} uploaded successfully`, "success");
    } catch (err) {
      console.error(err);
      showToast("Upload failed", "error");
    } finally {
      setDocUploadLoading(false);
    }
  };

  const proceedToPayment = async () => {
    if (!user) {
      showToast("Please login to register", "error");
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!category) return showToast("Please select a category", "error");
    if (!formData.fullName || !formData.mobile || !formData.dob) return showToast("Please fill all personal details", "error");
    
    // Check required documents for age restricted categories
    if (category.age_rule && documents.length === 0) {
      return showToast("Age proof document is required", "error");
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const payload = {
        eventId: event.id,
        categoryId: category.id,
        ...formData,
        documents
      };

      const res = await fetch('/api/badminton/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // In production, trigger Razorpay here using data.amount and data.registration_id
      showToast("Registration Confirmed! Payment successful.", "success");
      setStep(3); // Success Screen
      
    } catch (err) {
      console.error(err);
      showToast(err.message || "Registration failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#020817] flex items-center justify-center"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!event) return <div className="min-h-screen bg-[#020817] text-white flex items-center justify-center">Event not found</div>;

  return (
    <div className="min-h-screen bg-[#020817] text-slate-200 font-sans selection:bg-pink-500/30 py-12">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">{event.event_name}</h1>
          <p className="text-pink-500 font-bold tracking-widest uppercase text-sm">Player Registration Portal</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${step >= s ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50' : 'bg-slate-800 text-slate-500'}`}>
                {step > s ? <CheckCircle2 size={20} /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-pink-500' : 'bg-slate-800'}`} />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
            <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6 border-b border-slate-800 pb-4">Select Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.badminton_categories?.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setCategory(c)}
                  className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${category?.id === c.id ? 'border-pink-500 bg-pink-500/10' : 'border-slate-800 bg-[#020817] hover:border-slate-600'}`}
                >
                  <h3 className={`text-lg font-black uppercase tracking-wider mb-2 ${category?.id === c.id ? 'text-pink-400' : 'text-slate-200'}`}>{c.category_name}</h3>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{c.gender} • {c.age_rule || 'Open Category'}</div>
                  <div className="text-2xl font-black text-white">₹{c.registration_fee}</div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => category ? setStep(2) : showToast("Select a category", "error")}
                className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                Continue <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-3"><FileText className="text-pink-500" /> Player Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Name *</label>
                <input className="w-full bg-[#020817] border border-slate-800 p-4 rounded-xl text-sm font-bold text-white focus:border-pink-500 outline-none" value={formData.fullName} onChange={e => setFormData(p => ({...p, fullName: e.target.value}))} placeholder="As per records" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mobile *</label>
                <input className="w-full bg-[#020817] border border-slate-800 p-4 rounded-xl text-sm font-bold text-white focus:border-pink-500 outline-none" value={formData.mobile} onChange={e => setFormData(p => ({...p, mobile: e.target.value}))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Date of Birth *</label>
                <input type="date" className="w-full bg-[#020817] border border-slate-800 p-4 rounded-xl text-sm font-bold text-white focus:border-pink-500 outline-none" value={formData.dob} onChange={e => setFormData(p => ({...p, dob: e.target.value}))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Academy/Club Name</label>
                <input className="w-full bg-[#020817] border border-slate-800 p-4 rounded-xl text-sm font-bold text-white focus:border-pink-500 outline-none" value={formData.academyName} onChange={e => setFormData(p => ({...p, academyName: e.target.value}))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">T-Shirt Size</label>
                <select className="w-full bg-[#020817] border border-slate-800 p-4 rounded-xl text-sm font-bold text-white focus:border-pink-500 outline-none" value={formData.shirtSize} onChange={e => setFormData(p => ({...p, shirtSize: e.target.value}))}>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Document Upload if age restricted */}
            {category?.age_rule && (
              <div className="mb-8 p-6 border border-yellow-500/30 bg-yellow-500/5 rounded-2xl">
                <div className="flex items-start gap-3 mb-4 text-yellow-500">
                  <AlertCircle size={20} className="shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold uppercase tracking-widest text-sm">Age Proof Required</h4>
                    <p className="text-xs text-yellow-600/70 mt-1">Required for category: {category.age_rule}</p>
                  </div>
                </div>
                <label className="flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-500/5 transition-colors">
                  <UploadCloud className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-300">
                    {docUploadLoading ? 'Uploading...' : documents.find(d => d.type === 'Aadhaar/Birth Certificate') ? 'Document Uploaded ✓' : 'Upload Aadhaar or Birth Certificate'}
                  </span>
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleUpload(e, 'Aadhaar/Birth Certificate')} disabled={docUploadLoading} />
                </label>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-slate-800">
              <button onClick={() => setStep(1)} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Back</button>
              <button 
                onClick={proceedToPayment}
                disabled={submitting}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-pink-500/25 disabled:opacity-50"
              >
                {submitting ? 'Processing...' : `Pay ₹${(Number(category?.registration_fee) + Number(category?.platform_fee)) * (1 + Number(category?.gst_percent)/100)}`}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-gradient-to-b from-[#0f172a] to-[#020817] border border-slate-800 rounded-3xl p-12 shadow-2xl text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Registration Confirmed</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-8">You're officially in the tournament!</p>
            <div className="bg-[#020817] border border-slate-800 p-6 rounded-2xl max-w-sm mx-auto mb-8">
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Player</div>
              <div className="font-bold text-lg text-white mb-4">{formData.fullName}</div>
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Category</div>
              <div className="font-bold text-pink-500">{category?.category_name}</div>
            </div>
            <button onClick={() => router.push('/dashboard')} className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
