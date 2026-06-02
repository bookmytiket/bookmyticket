"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Download, Layout, Smartphone, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

export default function MarathonPosterGenerator({ marathon, registrationUrl }) {
  const canvasRef = useRef(null);
  const [format, setFormat] = useState('instagram_post');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [assets, setAssets] = useState({ banner: null });

  const FORMATS = {
    instagram_post: { width: 1080, height: 1080, label: 'Instagram Post (1:1)' },
    instagram_story: { width: 1080, height: 1920, label: 'Instagram Story (9:16)' },
    facebook_post: { width: 1200, height: 630, label: 'Facebook Post (1.91:1)' },
  };

  useEffect(() => {
    QRCode.toDataURL(registrationUrl, { width: 256, margin: 1, color: { dark: '#000', light: '#fff' } })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [registrationUrl]);

  useEffect(() => {
    if (!marathon?.banner_image) return;
    
    const banner = new Image();
    banner.crossOrigin = "anonymous";
    banner.src = marathon.banner_image;
    
    banner.onload = () => {
      setAssets({ banner });
      setImagesLoaded(true);
    };
  }, [marathon?.banner_image]);

  useEffect(() => {
    if (imagesLoaded && qrDataUrl) {
      drawPoster();
    }
  }, [format, imagesLoaded, qrDataUrl]);

  const drawPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = FORMATS[format];
    
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background Image
    if (assets.banner) {
      const imgRatio = assets.banner.width / assets.banner.height;
      const canvasRatio = width / height;
      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = height * imgRatio;
        offsetX = -(drawWidth - width) / 2;
      } else {
        drawHeight = width / imgRatio;
        offsetY = -(drawHeight - height) / 2;
      }
      
      ctx.drawImage(assets.banner, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Add Dark Gradient Overlay for text readability
    const gradient = ctx.createLinearGradient(0, height * 0.4, 0, height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.8, 'rgba(0,0,0,0.8)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 3. Draw Event Details
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    const isStory = format === 'instagram_story';
    const isLandscape = format === 'facebook_post';

    // Title
    ctx.font = `bold ${isLandscape ? '70px' : '90px'} sans-serif`;
    const titleY = isLandscape ? height - 180 : height - (isStory ? 450 : 350);
    ctx.fillText(marathon.title.toUpperCase(), width / 2, titleY, width - 80);

    // Date & Venue
    ctx.font = `bold ${isLandscape ? '30px' : '40px'} sans-serif`;
    ctx.fillStyle = '#ec4899'; // pink-500
    const dateText = marathon.event_date ? new Date(marathon.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Coming Soon';
    const subText = `${dateText} • ${marathon.venue}`;
    ctx.fillText(subText, width / 2, titleY + 60, width - 80);

    // 4. Draw QR Code Container & Image
    const qrSize = isLandscape ? 140 : 200;
    const qrX = isLandscape ? width - qrSize - 40 : width / 2 - qrSize / 2;
    const qrY = isLandscape ? height - qrSize - 40 : height - qrSize - 60;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20 + 30, 16);
    ctx.fill();

    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    qrImg.onload = () => {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN TO REGISTER', qrX + qrSize / 2, qrY + qrSize + 20);
    };
  };

  const downloadPoster = () => {
    const link = document.createElement('a');
    link.download = `${marathon.slug || 'marathon'}-${format}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Layout className="text-pink-400" /> Smart Poster Generator
          </h2>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">
            Auto-generate promotional materials with your registration QR
          </p>
        </div>
        <div className="flex bg-black/50 p-1 rounded-xl">
          {Object.keys(FORMATS).map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${format === f ? 'bg-pink-500 text-white' : 'text-white/40 hover:text-white/80'}`}
            >
              {FORMATS[f].label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="bg-[#0a0a0f] rounded-2xl overflow-hidden border border-white/10 flex justify-center p-4">
          <canvas 
            ref={canvasRef} 
            className="max-w-full object-contain bg-black shadow-2xl"
            style={{ maxHeight: '60vh' }}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
            <h3 className="text-blue-100 font-bold text-sm mb-1 flex items-center gap-2"><Smartphone size={16}/> Ready for Social Media</h3>
            <p className="text-blue-200/70 text-xs">The poster is automatically sized for {FORMATS[format].label}. Your event poster acts as the background, overlaid with details and the registration QR code.</p>
          </div>

          <button onClick={downloadPoster} disabled={!imagesLoaded || !qrDataUrl} className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100">
            <Download size={18} /> Download {FORMATS[format].label.split(' ')[0]} Poster
          </button>
        </div>
      </div>
    </div>
  );
}
