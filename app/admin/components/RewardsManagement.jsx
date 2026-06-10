"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Plus, Gift, Tag, Edit, Trash2, Sparkles, UploadCloud } from 'lucide-react';
import CustomDateTimePicker from '@/app/components/ui/CustomDateTimePicker';

export default function RewardsManagement() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        campaign_name: '',
        campaign_type: 'coupon',
        sponsor_name: '',
        reward_value: '',
        start_date: '',
        end_date: '',
        total_quantity: 0
    });
    
    const fileInputRef = React.useRef(null);
    const [uploadingCampaignId, setUploadingCampaignId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/admin/rewards/campaigns');
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data);
            }
        } catch (err) {
            showToast('Failed to load campaigns', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/rewards/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            
            if (result.success) {
                showToast('Campaign Created Successfully!', 'success');
                setShowForm(false);
                fetchCampaigns();
            } else {
                showToast(result.error || 'Failed to create campaign', 'error');
            }
        } catch (err) {
            showToast('Network Error', 'error');
        }
    };

    const triggerFileUpload = (campaignId) => {
        setUploadingCampaignId(campaignId);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !uploadingCampaignId) return;

        setIsUploading(true);
        try {
            const text = await file.text();
            // Parse CSV: split by newlines, split by comma, take first column, filter out empty
            const codes = text.split(/\r?\n/)
                .map(line => line.split(',')[0].trim())
                .filter(code => code && code.length > 0 && code.toLowerCase() !== 'code' && code.toLowerCase() !== 'voucher_code');
            
            if (codes.length === 0) {
                showToast('No valid codes found in CSV', 'error');
                setIsUploading(false);
                return;
            }

            const res = await fetch('/api/admin/rewards/vouchers/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaign_id: uploadingCampaignId, codes })
            });
            const result = await res.json();

            if (result.success) {
                showToast(`Successfully uploaded ${result.count} vouchers!`, 'success');
                fetchCampaigns(); // Refresh to update count
            } else {
                showToast(result.error || 'Upload failed', 'error');
            }
        } catch (err) {
            showToast('Error parsing file', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setUploadingCampaignId(null);
        }
    };

    if (loading) return <div className="p-10 text-center text-pink-500 font-bold animate-pulse">Loading Campaigns...</div>;

    return (
        <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-pink-100/50 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 m-0 flex items-center gap-3">
                        <Gift size={32} className="text-pink-500" /> Rewards & Vouchers
                    </h2>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Manage customer reward campaigns, cashbacks, and gift e-cards.</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-none py-3 px-6 rounded-xl font-bold cursor-pointer transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transform hover:-translate-y-0.5"
                >
                    {showForm ? 'Cancel Creation' : <><Plus size={20} /> New Campaign</>}
                </button>
            </div>

            <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
            />

            {showForm && (
                <form onSubmit={handleCreate} className="bg-gradient-to-br from-pink-50/50 to-purple-50/50 p-8 rounded-2xl mb-8 border border-pink-200/60 shadow-inner relative overflow-hidden">
                    <Sparkles className="absolute top-4 right-4 text-pink-200 opacity-50" size={120} />
                    <h3 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="bg-pink-100 text-pink-600 p-2 rounded-lg"><Gift size={20} /></span> Create New Reward Campaign
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Name</label>
                            <input required value={formData.campaign_name} onChange={e => setFormData({...formData, campaign_name: e.target.value})} className="w-full p-3 rounded-xl border border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none transition-all bg-white/80 backdrop-blur-sm font-medium" placeholder="e.g. Welcome Bonus 2026" />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Type</label>
                            <div 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="w-full p-3 rounded-xl border border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none transition-all bg-white/80 backdrop-blur-sm font-medium cursor-pointer flex justify-between items-center"
                            >
                                <span>{formData.campaign_type === 'coupon' ? 'Discount Coupon' : formData.campaign_type === 'gift_card' ? 'Gift E-Card' : 'Sponsor Offer'}</span>
                                <svg className={`w-4 h-4 text-pink-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                            
                            {dropdownOpen && (
                                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-pink-100 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div 
                                        className="p-3 hover:bg-pink-50 hover:text-pink-600 cursor-pointer font-medium transition-colors"
                                        onClick={() => { setFormData({...formData, campaign_type: 'coupon'}); setDropdownOpen(false); }}
                                    >
                                        Discount Coupon
                                    </div>
                                    <div 
                                        className="p-3 hover:bg-pink-50 hover:text-pink-600 cursor-pointer font-medium transition-colors"
                                        onClick={() => { setFormData({...formData, campaign_type: 'gift_card'}); setDropdownOpen(false); }}
                                    >
                                        Gift E-Card
                                    </div>
                                    <div 
                                        className="p-3 hover:bg-pink-50 hover:text-pink-600 cursor-pointer font-medium transition-colors"
                                        onClick={() => { setFormData({...formData, campaign_type: 'sponsor_offer'}); setDropdownOpen(false); }}
                                    >
                                        Sponsor Offer
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Reward Value (e.g., ₹500 or 10% OFF)</label>
                            <input required value={formData.reward_value} onChange={e => setFormData({...formData, reward_value: e.target.value})} className="w-full p-3 rounded-xl border border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none transition-all bg-white/80 backdrop-blur-sm font-medium font-bold text-pink-600" placeholder="₹500" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Sponsor Name (Optional)</label>
                            <input value={formData.sponsor_name} onChange={e => setFormData({...formData, sponsor_name: e.target.value})} className="w-full p-3 rounded-xl border border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none transition-all bg-white/80 backdrop-blur-sm font-medium" placeholder="e.g., Nike, Zomato" />
                        </div>
                        <div>
                            <CustomDateTimePicker 
                                label="Start Date" 
                                value={formData.start_date} 
                                onChange={(val) => setFormData({...formData, start_date: val})} 
                            />
                        </div>
                        <div>
                            <CustomDateTimePicker 
                                label="End Date" 
                                value={formData.end_date} 
                                onChange={(val) => setFormData({...formData, end_date: val})} 
                            />
                        </div>
                        <div className="md:col-span-2 mt-4">
                            <button type="submit" className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white border-none py-4 px-6 rounded-xl font-extrabold cursor-pointer transition-all duration-300 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 text-base">
                                <Sparkles size={20} className="text-pink-400" /> Initialize Reward Campaign
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-pink-50/30 text-slate-500 text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
                            <th className="p-5">Campaign</th>
                            <th className="p-5">Type</th>
                            <th className="p-5">Reward Value</th>
                            <th className="p-5">Validity</th>
                            <th className="p-5">Status</th>
                            <th className="p-5">Vouchers</th>
                            <th className="p-5">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {campaigns.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">No campaigns found. <span className="text-pink-500 font-bold">Create your first reward campaign!</span></td>
                            </tr>
                        ) : campaigns.map(c => (
                            <tr key={c.id} className="text-sm hover:bg-pink-50/30 transition-colors duration-200">
                                <td className="p-5">
                                    <div className="font-bold text-slate-800 text-base">{c.campaign_name}</div>
                                    <div className="text-xs text-pink-500 font-semibold mt-1 flex items-center gap-1"><Tag size={12}/> {c.sponsor_name || 'BookMyTicket Official'}</div>
                                </td>
                                <td className="p-5">
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                                        {c.campaign_type.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-5 font-black text-pink-600 text-lg">
                                    {c.reward_value}
                                </td>
                                <td className="p-5">
                                    <div className="text-xs text-slate-500 font-medium"><span className="text-slate-400">Starts:</span> {new Date(c.start_date).toLocaleDateString()}</div>
                                    <div className="text-xs text-slate-500 font-medium mt-1"><span className="text-slate-400">Ends:</span> {new Date(c.end_date).toLocaleDateString()}</div>
                                </td>
                                <td className="p-5">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        {c.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 text-lg">{c.vouchers_uploaded || 0}</span>
                                        <span className="text-xs text-slate-400">Total Uploaded</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <button 
                                        onClick={() => triggerFileUpload(c.id)}
                                        disabled={isUploading && uploadingCampaignId === c.id}
                                        className={`flex items-center gap-1.5 font-bold px-4 py-2 rounded-lg transition-colors border cursor-pointer
                                            ${isUploading && uploadingCampaignId === c.id 
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                                                : 'text-pink-600 hover:text-purple-700 bg-pink-50 hover:bg-pink-100 border-pink-100'}`}
                                    >
                                        <UploadCloud size={16} className={isUploading && uploadingCampaignId === c.id ? 'animate-bounce' : ''} /> 
                                        {isUploading && uploadingCampaignId === c.id ? 'Uploading...' : 'Upload Vouchers'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
