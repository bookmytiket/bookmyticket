"use client";

import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, X, Share2, Info, Facebook, MessageCircle } from "lucide-react";
import { toPng } from "html-to-image";

export default function PromoteModal({
  isOpen,
  onClose,
  title,
  imageUrl,
  bookingUrl,
  type = "Event",
  date,
  location
}) {
  const posterRef = useRef(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (posterRef.current === null) return;
    try {
      const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_poster.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate poster', err);
    }
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bookingUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = `Check out this ${type}: ${title}! Book your tickets here: ${bookingUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: The Poster Preview */}
        <div className="w-full md:w-[45%] p-6 bg-[#111] flex items-center justify-center border-r border-[#333] overflow-y-auto">
          <div 
            ref={posterRef} 
            className="w-full max-w-[320px] aspect-[4/5] bg-gradient-to-br from-[#2a2a2a] to-[#111] rounded-xl overflow-hidden relative shadow-2xl flex flex-col"
          >
            {/* Image Section */}
            <div className="h-3/5 w-full relative">
              {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full bg-[#333] flex items-center justify-center text-gray-500">
                  <span className="text-xl font-bold">No Image</span>
                </div>
              )}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-xs font-semibold">
                SCAN TO BOOK
              </div>
            </div>

            {/* Content Section */}
            <div className="h-2/5 p-5 flex items-center justify-between bg-[#1f1f1f]">
              <div className="flex-1 pr-4">
                <h2 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-2">{title}</h2>
                {date && <p className="text-gray-400 text-xs mb-1">{date}</p>}
                {location && <p className="text-gray-400 text-xs line-clamp-1">{location}</p>}
                <a 
                  href={bookingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-3 inline-block bg-[#ff4a00] hover:bg-[#e04000] transition-colors text-white text-[10px] font-bold px-3 py-1.5 rounded-md tracking-wide cursor-pointer"
                >
                  BOOK NOW
                </a>
              </div>

              {/* QR Code */}
              <div className="bg-white p-2 rounded-lg shadow-inner shrink-0">
                <QRCodeSVG value={bookingUrl || "https://bookmyticket.net"} size={80} level="H" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="w-full md:w-[55%] p-8 flex flex-col justify-center relative bg-[#1a1a1a]">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#2a2a2a] hover:bg-[#333] flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>

          <h3 className="text-2xl text-white font-bold mb-2">Promote Your {type}</h3>
          <p className="text-gray-400 mb-8 text-sm">
            Share this promotional poster on your social media channels or download it to print. The QR code links directly to your booking page.
          </p>

          <div className="space-y-4">
            <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#333]">
              <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2 block">Direct Booking Link</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={bookingUrl}
                  className="bg-[#111] text-white w-full px-4 py-2 rounded-lg border border-[#333] outline-none text-sm focus:border-gray-500"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(bookingUrl)}
                  className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={handleDownload}
                className="col-span-2 flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black py-3 px-4 rounded-xl font-bold transition-all shadow-lg"
              >
                <Download size={18} /> Download Poster
              </button>
              
              <button 
                 onClick={handleShareFacebook}
                 className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#155fc2] text-white py-3 px-4 rounded-xl font-semibold transition-colors text-sm w-full"
              >
                <Facebook size={18} /> Facebook
              </button>
              <button 
                 onClick={handleShareWhatsApp}
                 className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ead53] text-white py-3 px-4 rounded-xl font-semibold transition-colors text-sm w-full"
              >
                <MessageCircle size={18} /> WhatsApp
              </button>
            </div>

            <div className="mt-6 flex items-start gap-3 bg-[#ff4a00]/10 text-[#ff4a00] p-4 rounded-xl border border-[#ff4a00]/20">
              <Info size={20} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                When users scan the QR Code on this poster from their phone camera or a social media app, they will be instantly redirected to complete their booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
