"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, CheckCircle, ShieldCheck, FileText, Banknote, Building2, User, ArrowRight, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function PartnerKycPage() {
    const params = useParams();
    const requestId = params.id;

    const request = useQuery(api.partnerRequests.getById, { id: requestId });
    const submitKyc = useMutation(api.partnerRequests.submitKycForRequest);
    const generateUploadUrl = useMutation(api.images.generateUploadUrl);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [agreementAccepted, setAgreementAccepted] = useState(false);

    const [form, setForm] = useState({
        panNumber: "",
        beneficiaryName: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        accountType: "Current",
    });

    const [files, setFiles] = useState({
        panFile: null,
        aadharFile: null,
        chequeFile: null,
    });
    
    const [uploadedFileIds, setUploadedFileIds] = useState({
        panFile: null,
        aadharFile: null,
        chequeFile: null,
    });

    useEffect(() => {
        if (request && request.status === "KYC Completed") {
            setSuccess(true);
        }
    }, [request]);

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [field]: file }));
        }
    };

    const uploadFile = async (file) => {
        if (!file) return null;
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
        });
        const { storageId } = await response.json();
        return storageId;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!agreementAccepted) {
            alert("You must accept the terms and conditions.");
            return;
        }

        setLoading(true);
        try {
            // Upload files
            let panStorageId = uploadedFileIds.panFile;
            let aadharStorageId = uploadedFileIds.aadharFile;
            let chequeStorageId = uploadedFileIds.chequeFile;

            if (files.panFile && !panStorageId) panStorageId = await uploadFile(files.panFile);
            if (files.aadharFile && !aadharStorageId) aadharStorageId = await uploadFile(files.aadharFile);
            if (files.chequeFile && !chequeStorageId) chequeStorageId = await uploadFile(files.chequeFile);

            setUploadedFileIds({ panFile: panStorageId, aadharFile: aadharStorageId, chequeFile: chequeStorageId });

            await submitKyc({
                id: requestId,
                kycDetails: {
                    ...form,
                    panFile: panStorageId,
                    aadharFile: aadharStorageId,
                    chequeFile: chequeStorageId,
                    agreementAccepted,
                }
            });

            setSuccess(true);
        } catch (error) {
            console.error(error);
            alert("Failed to submit KYC details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (request === undefined) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
        );
    }

    if (request === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full mx-4">
                    <ShieldCheck size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Session</h2>
                    <p className="text-gray-500 text-sm">This KYC link is invalid or has expired.</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full mx-4 border border-green-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Submitted Successfully</h2>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Thank you, {request.firstName}! Your verification documents have been received and are currently under review by our admin team. You will be notified via email once approved.
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-500 font-medium">STATUS</span>
                            <span className="text-xs text-blue-600 bg-blue-50 font-bold px-2 py-1 rounded-md">IN REVIEW</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{request.email}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/20">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Partner Verification</h1>
                    <p className="mt-2 text-gray-500">Please provide your business and banking details to complete the onboarding process for {request.firstName} {request.lastName}.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white shadow-xl shadow-gray-200/40 rounded-3xl overflow-hidden border border-gray-100">
                    <div className="p-8">
                        {/* Business Details Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 size={20} className="text-purple-500" /> Business Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                                        placeholder="e.g. ABCDE1234F"
                                        value={form.panNumber}
                                        onChange={(e) => setForm({...form, panNumber: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-8"></div>

                        {/* Document Upload Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-purple-500" /> Document Upload
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FileUploadCard 
                                    title="PAN Card Copy *" 
                                    desc="Upload JPEG/PNG/PDF"
                                    onChange={(e) => handleFileChange(e, "panFile")}
                                    file={files.panFile}
                                />
                                <FileUploadCard 
                                    title="Aadhar Card Copy *" 
                                    desc="Upload JPEG/PNG/PDF"
                                    onChange={(e) => handleFileChange(e, "aadharFile")}
                                    file={files.aadharFile}
                                />
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-8"></div>

                        {/* Bank Details Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Banknote size={20} className="text-purple-500" /> Bank Account Details
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">This account will be used for your event payouts.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition bg-gray-50 focus:bg-white"
                                        value={form.beneficiaryName}
                                        onChange={(e) => setForm({...form, beneficiaryName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition bg-gray-50 focus:bg-white"
                                        value={form.bankName}
                                        onChange={(e) => setForm({...form, bankName: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition bg-gray-50 focus:bg-white"
                                        value={form.accountNumber}
                                        onChange={(e) => setForm({...form, accountNumber: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code *</label>
                                        <input 
                                            type="text" 
                                            required 
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition bg-gray-50 focus:bg-white uppercase"
                                            value={form.ifscCode}
                                            onChange={(e) => setForm({...form, ifscCode: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
                                        <select 
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition bg-gray-50 focus:bg-white"
                                            value={form.accountType}
                                            onChange={(e) => setForm({...form, accountType: e.target.value})}
                                        >
                                            <option value="Current">Current</option>
                                            <option value="Savings">Savings</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <FileUploadCard 
                                title="Cancelled Cheque *" 
                                desc="Used to verify bank details"
                                onChange={(e) => handleFileChange(e, "chequeFile")}
                                file={files.chequeFile}
                            />
                        </div>

                        {/* Agreement */}
                        <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3 mt-8 border border-gray-100">
                            <input 
                                type="checkbox" 
                                id="agreement" 
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                checked={agreementAccepted}
                                onChange={(e) => setAgreementAccepted(e.target.checked)}
                            />
                            <label htmlFor="agreement" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                                I confirm that the information provided is accurate and complete. I agree to the <a href="#" className="font-bold text-purple-600 hover:underline">Platform Terms of Service</a> and <a href="#" className="font-bold text-purple-600 hover:underline">Payout Processing Agreement</a>.
                            </label>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-6 sm:p-8 border-t border-gray-100 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`px-8 py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all shadow-lg shadow-purple-500/30 ${
                                loading ? "bg-purple-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            }`}
                        >
                            {loading ? (
                                <><Loader2 size={20} className="animate-spin" /> Processing...</>
                            ) : (
                                <>Submit Application <ArrowRight size={20} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FileUploadCard({ title, desc, onChange, file }) {
    return (
        <label className="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition group">
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={onChange} />
            
            {file ? (
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{file.name}</p>
                    <p className="text-xs text-green-600 mt-1">Ready to upload</p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-purple-100 rounded-full flex items-center justify-center mb-3 transition">
                        <Upload size={20} className="text-gray-400 group-hover:text-purple-600 transition" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </div>
            )}
        </label>
    );
}
