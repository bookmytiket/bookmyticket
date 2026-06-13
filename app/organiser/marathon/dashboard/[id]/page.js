"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, QrCode, Layout, ShieldCheck, Download, Search, 
  Filter, CheckCircle2, AlertCircle, TrendingUp, DollarSign 
} from 'lucide-react';
import MarathonPosterGenerator from '../../../components/MarathonPosterGenerator';
import DownloadReports from '../../../components/DownloadReports';
import BibBadgeManager from '../../../components/BibBadgeManager';
import { Tag } from 'lucide-react';

export default function MarathonDashboard() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [marathon, setMarathon] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id && user) fetchDashboardData();
  }, [id, user]);

  const fetchDashboardData = async () => {
    try {
      const token = (await window.supabase.auth.getSession()).data.session?.access_token;
      const headers = { 'Authorization': `Bearer ${token}` };

      // Get Marathon details
      const marRes = await fetch(`/api/marathon/${id}`);
      const marData = await marRes.json();
      if (marData.marathon) setMarathon(marData.marathon);

      // Get Registrations
      const regRes = await fetch(`/api/marathon/register?marathon_id=${id}`, { headers });
      const regData = await regRes.json();
      if (regData.registrations) setRegistrations(regData.registrations);

      // Get Check-ins
      const chkRes = await fetch(`/api/marathon/checkin?marathon_id=${id}`, { headers });
      const chkData = await chkRes.json();
      if (chkData.checkins) setCheckins(chkData.checkins);

      // Get Documents
      const docRes = await fetch(`/api/marathon/documents?marathon_id=${id}`, { headers });
      const docData = await docRes.json();
      if (docData.documents) setDocuments(docData.documents);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveDocument = async (docId, status) => {
    try {
      const token = (await window.supabase.auth.getSession()).data.session?.access_token;
      await fetch('/api/marathon/documents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ document_id: docId, verification_status: status })
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-center text-white">Loading Dashboard...</div>;
  if (!marathon) return <div className="p-10 text-center text-white">Marathon not found</div>;

  const totalRevenue = registrations.reduce((sum, r) => sum + (Number(r.payment_amount) || 0), 0);
  const totalCheckedIn = checkins.length;
  const pendingVerification = documents.filter(d => d.verification_status === 'Pending').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'participants', label: 'Participants', icon: Users, badge: registrations.length },
    { id: 'badges', label: 'BIB Badges', icon: Tag },
    { id: 'verification', label: 'ID Verification', icon: ShieldCheck, badge: pendingVerification },
    { id: 'checkins', label: 'Check-Ins', icon: QrCode, badge: totalCheckedIn },
    { id: 'poster', label: 'Smart Poster', icon: Layout },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-pink-500 font-bold uppercase tracking-widest text-xs mb-2 block">Marathon Dashboard</span>
            <h1 className="text-3xl font-black">{marathon.title}</h1>
            <p className="text-white/50 text-sm mt-1">{new Date(marathon.event_date).toDateString()} • {marathon.venue}</p>
          </div>
          <a href={`/marathon/checkin`} target="_blank" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center gap-2 transition-all">
            <QrCode size={18} /> Open Scanner App
          </a>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
              {tab.badge > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white text-pink-500' : 'bg-white/20 text-white'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4"><Users size={20}/></div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Total Registrations</p>
              <p className="text-3xl font-black">{registrations.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center mb-4"><DollarSign size={20}/></div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</p>
              <p className="text-3xl font-black">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-4"><QrCode size={20}/></div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Checked In</p>
              <p className="text-3xl font-black">{totalCheckedIn}</p>
              <div className="w-full bg-white/10 h-1 mt-3 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${registrations.length ? (totalCheckedIn/registrations.length)*100 : 0}%` }} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="w-10 h-10 bg-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center mb-4"><ShieldCheck size={20}/></div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Pending Verification</p>
              <p className="text-3xl font-black">{pendingVerification}</p>
            </div>
          </div>
        )}

        {/* PARTICIPANTS & REPORTS */}
        {activeTab === 'participants' && (
          <DownloadReports 
            marathon={marathon} 
            registrations={registrations} 
            checkins={checkins} 
          />
        )}

        {/* BIB BADGES */}
        {activeTab === 'badges' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <BibBadgeManager 
              marathon={marathon} 
              registrations={registrations} 
            />
          </div>
        )}

        {/* VERIFICATION */}
        {activeTab === 'verification' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {documents.map(doc => (
              <div key={doc.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col">
                <div className="h-48 bg-black relative">
                  <img src={doc.document_url} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all cursor-pointer" onClick={()=>window.open(doc.document_url, '_blank')} />
                  <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    doc.verification_status === 'Approved' ? 'bg-green-500 text-white' : 
                    doc.verification_status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                  }`}>
                    {doc.verification_status}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs text-white/50 font-bold uppercase tracking-widest mb-1">{doc.document_type}</p>
                  <p className="font-black mb-1">{doc.marathon_registrations?.participant_name}</p>
                  <p className="text-xs text-white/50 font-mono mb-6">{doc.marathon_registrations?.registration_id}</p>
                  
                  {doc.verification_status === 'Pending' && (
                    <div className="mt-auto flex gap-2">
                      <button onClick={() => approveDocument(doc.id, 'Rejected')} className="flex-1 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-bold">Reject</button>
                      <button onClick={() => approveDocument(doc.id, 'Approved')} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-black">Approve</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="col-span-full p-10 text-center text-white/50">No documents uploaded yet</div>
            )}
          </div>
        )}

        {/* CHECK-INS */}
        {activeTab === 'checkins' && (
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-in fade-in">
             <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/50 text-white/50 text-[10px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="p-4">Time</th>
                    <th className="p-4">Participant</th>
                    <th className="p-4">Reg ID</th>
                    <th className="p-4">Kit Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {checkins.map(chk => (
                    <tr key={chk.id} className="hover:bg-white/5">
                      <td className="p-4 text-xs">{new Date(chk.checkin_time).toLocaleString()}</td>
                      <td className="p-4 font-bold">{chk.marathon_registrations?.participant_name}</td>
                      <td className="p-4 font-mono text-xs">{chk.marathon_registrations?.registration_id}</td>
                      <td className="p-4">
                        {chk.kit_issued ? (
                          <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={14}/> Yes</span>
                        ) : (
                          <span className="text-white/40">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {checkins.length === 0 && (
                    <tr><td colSpan="4" className="p-8 text-center text-white/50">No check-ins yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* POSTER */}
        {activeTab === 'poster' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <MarathonPosterGenerator 
              marathon={marathon} 
              registrationUrl={`${window.location.origin}/marathon/${marathon.slug || marathon.id}`} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
