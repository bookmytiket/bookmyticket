"use client";
import React, { useState, useEffect, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import { Camera, CheckCircle2, XCircle, AlertCircle, RefreshCw, Shirt, User, MapPin } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';

export default function MarathonScanner() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [lastScanned, setLastScanned] = useState(null);

  // Simple debounce to prevent rapid duplicate scans
  const lastScanTimeRef = useRef(0);

  const handleScan = async (result, err) => {
    if (result) {
      const text = result?.text;
      if (!text) return;

      const now = Date.now();
      if (text === lastScanned && now - lastScanTimeRef.current < 3000) {
        return; // debounce same QR code
      }

      setLastScanned(text);
      lastScanTimeRef.current = now;
      processQRCode(text);
    }
    if (err) {
      // console.info(err);
    }
  };

  const processQRCode = async (qrText) => {
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      let qrData;
      try {
        qrData = JSON.parse(qrText);
      } catch (e) {
        throw new Error('Invalid QR Code Format');
      }

      if (qrData.type !== 'marathon_registration' || !qrData.registration_id) {
        throw new Error('Not a valid Marathon Registration QR');
      }

      // Check-in API call
      const res = await fetch('/api/marathon/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await window.supabase?.auth.getSession())?.data?.session?.access_token || ''}`
        },
        body: JSON.stringify({
          registration_id: qrData.registration_id,
          action: 'checkin',
          scan_location: 'Main Gate'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in failed');

      setScanResult(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const issueKit = async () => {
    if (!scanResult?.participant?.registration_id) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/marathon/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await window.supabase?.auth.getSession())?.data?.session?.access_token || ''}`
        },
        body: JSON.stringify({
          registration_id: scanResult.participant.registration_id,
          action: 'kit',
          scan_location: 'Kit Counter'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kit issuance failed');

      setScanResult({ ...scanResult, checkin: data.checkin });
      alert('Kit marked as issued successfully!');

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-8 text-white text-center">Please login as Staff to use the scanner.</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <div className="bg-[#111] border-b border-white/10 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="font-black">QR Check-In</h1>
          <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">Marathon Staff Scanner</p>
        </div>
        <button onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')} className="p-2 bg-white/10 rounded-full">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        {!scanResult && !error && (
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="w-full max-w-sm rounded-3xl overflow-hidden border-2 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.3)]">
              <QrReader
                constraints={{ facingMode }}
                onResult={handleScan}
                scanDelay={500}
                className="w-full"
              />
            </div>
            <p className="mt-8 text-white/50 text-sm flex items-center gap-2">
              <Camera size={16} /> Align QR code within frame
            </p>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin text-pink-500"><RefreshCw size={40} /></div>
          </div>
        )}

        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
              <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2">Scan Failed</h2>
            <p className="text-white/60 mb-8">{error}</p>
            <button onClick={() => { setError(''); setLastScanned(null); }} className="w-full max-w-xs py-4 bg-white/10 rounded-xl font-bold">
              Scan Again
            </button>
          </div>
        )}

        {scanResult && !loading && (
          <div className="flex-1 flex flex-col p-2 animate-in slide-in-from-bottom-8">
            <div className={`p-6 rounded-3xl mb-6 ${scanResult.already_checked_in ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${scanResult.already_checked_in ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                  {scanResult.already_checked_in ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div>
                  <h2 className={`text-xl font-black ${scanResult.already_checked_in ? 'text-yellow-400' : 'text-green-400'}`}>
                    {scanResult.already_checked_in ? 'Already Checked In' : 'Check-In Successful'}
                  </h2>
                  {scanResult.already_checked_in && (
                    <p className="text-yellow-100/70 text-xs">Initially checked in at: {new Date(scanResult.checkin.checkin_time).toLocaleTimeString()}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-black/40 rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Participant</p>
                  <p className="font-black text-lg">{scanResult.participant.full_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-3">
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Category</p>
                    <p className="font-bold text-sm text-pink-400">{scanResult.participant.category_name} ({scanResult.participant.distance_km}K)</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Bib Number</p>
                    <p className="font-bold text-sm">{scanResult.participant.bib_number || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">T-Shirt Size</p>
                    <p className="font-bold text-sm flex items-center gap-1"><Shirt size={14}/> {scanResult.participant.tshirt_size || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Blood Group</p>
                    <p className="font-bold text-sm text-red-400">{scanResult.participant.blood_group || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-auto">
              {!scanResult.checkin.kit_issued && (
                <button onClick={issueKit} className="w-full py-4 bg-pink-500 rounded-xl font-black flex items-center justify-center gap-2">
                  <Shirt size={18} /> Mark Kit as Issued
                </button>
              )}
              {scanResult.checkin.kit_issued && (
                <div className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 text-white/50">
                  <CheckCircle2 size={18} /> Kit Already Issued
                </div>
              )}
              <button onClick={() => { setScanResult(null); setLastScanned(null); }} className="w-full py-4 bg-white/10 rounded-xl font-bold">
                Scan Next Participant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
