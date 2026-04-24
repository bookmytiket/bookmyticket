"use client";
import React, { useState } from "react";
import { 
  Globe, 
  BarChart3, 
  Search, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Save, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Activity,
  Link as LinkIcon,
  Map,
  Zap
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";

export default function SeoAnalyticsAdmin({ t, theme, config, setConfig }) {
  const { showToast } = useToast();
  const [isRefreshingSitemap, setIsRefreshingSitemap] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [newCitySeo, setNewCitySeo] = useState({ title: "", description: "", keywords: "" });
  const [newBacklink, setNewBacklink] = useState({ name: "", url: "", source: "" });
  const [recrawlUrl, setRecrawlUrl] = useState("");

  const handleSaveConfig = async () => {
    try {
      await setConfig(config);
      showToast("SEO & Analytics settings saved!", "success");
    } catch (error) {
      showToast("Error saving settings: " + error.message, "error");
    }
  };

  const handleRefreshSitemap = async () => {
    setIsRefreshingSitemap(true);
    try {
      // Logic to trigger sitemap refresh (e.g., pinging Google/Bing)
      // In a real app, this might call an API route that pings search engines
      const response = await fetch("/api/cron/refresh-sitemap", { method: "POST" });
      
      if (response.ok) {
        setConfig(prev => ({ ...prev, sitemap_last_ping: new Date().toISOString() }));
        showToast("Sitemap refreshed and search engines notified!", "success");
      } else {
        throw new Error("Failed to refresh sitemap");
      }
    } catch (error) {
      showToast("Error: " + error.message, "error");
    } finally {
      setIsRefreshingSitemap(false);
    }
  };

  const handleAddCitySeo = () => {
    if (!newCity) return;
    setConfig(prev => ({
      ...prev,
      city_seo_overrides: {
        ...prev.city_seo_overrides,
        [newCity.toLowerCase()]: newCitySeo
      }
    }));
    setNewCity("");
    setNewCitySeo({ title: "", description: "", keywords: "" });
    showToast(`SEO settings added for ${newCity}`, "success");
  };

  const handleRemoveCitySeo = (city) => {
    const newOverrides = { ...config.city_seo_overrides };
    delete newOverrides[city];
    setConfig(prev => ({ ...prev, city_seo_overrides: newOverrides }));
  };

  const handleAddBacklink = () => {
    if (!newBacklink.name || !newBacklink.url) return;
    setConfig(prev => ({
      ...prev,
      backlink_tracking: [
        ...(prev.backlink_tracking || []),
        { ...newBacklink, id: Date.now(), created_at: new Date().toISOString() }
      ]
    }));
    setNewBacklink({ name: "", url: "", source: "" });
    showToast("Backlink tracked!", "success");
  };

  const handleRemoveBacklink = (id) => {
    setConfig(prev => ({
      ...prev,
      backlink_tracking: prev.backlink_tracking.filter(b => b.id !== id)
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Google Analytics Integration */}
      <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChart3 size={20} color="#ec4899" />
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Google Analytics Integration</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
             <span style={{ fontSize: "13px", fontWeight: 600, color: t.textSub }}>
               {config.ga_enabled ? "Tracking Enabled" : "Tracking Disabled"}
             </span>
             <button 
                onClick={() => setConfig(prev => ({ ...prev, ga_enabled: !prev.ga_enabled }))}
                style={{
                  width: "48px",
                  height: "24px",
                  borderRadius: "100px",
                  backgroundColor: config.ga_enabled ? "#ec4899" : "#e2e8f0",
                  border: "none",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
             >
               <div style={{
                 width: "18px",
                 height: "18px",
                 borderRadius: "50%",
                 backgroundColor: "#fff",
                 position: "absolute",
                 top: "3px",
                 left: config.ga_enabled ? "27px" : "3px",
                 transition: "all 0.3s"
               }} />
             </button>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>GA4 Measurement ID</label>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                value={config.ga_id}
                onChange={(e) => setConfig(prev => ({ ...prev, ga_id: e.target.value }))}
                placeholder="G-XXXXXXXXXX"
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
              />
              <button 
                onClick={handleSaveConfig}
                style={{ backgroundColor: "#ec4899", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              onClick={() => window.open('https://analytics.google.com/', '_blank')}
              style={{ 
                flex: 1,
                padding: "10px 20px", 
                borderRadius: "8px", 
                backgroundColor: "#fff", 
                border: "1px solid #ec4899", 
                color: "#ec4899", 
                fontWeight: 700, 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#ec4899"; e.currentTarget.style.color = "#fff"; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.color = "#ec4899"; }}
            >
              <ExternalLink size={16} />
              {config.ga_id && config.ga_id !== "G-XXXXXXXXXX" ? "Open Analytics Dashboard" : "Setup Google Analytics"}
            </button>
          </div>
        </div>
        <p style={{ fontSize: "12px", color: t.textSub, marginTop: "12px", margin: "12px 0 0" }}>Values are updated dynamically in app/layout.js without code changes.</p>
      </div>

      {/* 1b. Global SEO Settings */}
      <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <Globe size={20} color="#3b82f6" />
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Global SEO Settings</h3>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Global Site Title</label>
              <input
                type="text"
                value={config.global_title || ""}
                onChange={(e) => setConfig(prev => ({ ...prev, global_title: e.target.value }))}
                placeholder="BookMyTicket - Online Event & Service Booking"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Global Meta Keywords</label>
              <textarea
                value={config.global_keywords || ""}
                onChange={(e) => setConfig(prev => ({ ...prev, global_keywords: e.target.value }))}
                placeholder="tickets, events, concerts..."
                rows={3}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Global Meta Description</label>
              <textarea
                value={config.global_description || ""}
                onChange={(e) => setConfig(prev => ({ ...prev, global_description: e.target.value }))}
                placeholder="Book the latest events, sports turfs..."
                rows={3}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Meta Ads / Tracking Pixels (Head Scripts)</label>
            <textarea
              value={config.meta_ads_code || ""}
              onChange={(e) => setConfig(prev => ({ ...prev, meta_ads_code: e.target.value }))}
              rows={12}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain, fontFamily: "monospace", fontSize: "12px" }}
              placeholder="Paste your Meta Pixel or Ad scripts here..."
            />
          </div>
        </div>
        <button
          onClick={handleSaveConfig}
          style={{ marginTop: "20px", backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
          Save Global Settings
        </button>
      </div>

      {/* 2. Google Search Console Recrawl & Indexing */}
      <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Zap size={20} color="#f59e0b" />
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Google Search Console Indexing</h3>
          </div>
          <button 
            onClick={() => window.open('https://search.google.com/search-console', '_blank')}
            style={{ 
              padding: "8px 16px", 
              borderRadius: "8px", 
              backgroundColor: "#fff", 
              border: "1px solid #f59e0b", 
              color: "#f59e0b", 
              fontWeight: 700, 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              fontSize: "13px",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#f59e0b"; e.currentTarget.style.color = "#fff"; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.color = "#f59e0b"; }}
          >
            <ExternalLink size={16} /> Open Search Console
          </button>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Request Indexing (Direct URL)</label>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                value={recrawlUrl}
                onChange={(e) => setRecrawlUrl(e.target.value)}
                placeholder="e.target /events/in/coimbatore"
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
              />
              <button 
                onClick={() => {
                  if (!recrawlUrl) return;
                  const fullUrl = `https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fwww.bookmyticket.net%2F&id=${encodeURIComponent('https://www.bookmyticket.net' + (recrawlUrl.startsWith('/') ? '' : '/') + recrawlUrl)}`;
                  window.open(fullUrl, '_blank');
                  showToast("Opening GSC URL Inspection...", "info");
                }}
                style={{ backgroundColor: "#f59e0b", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Search size={16} /> Inspect
              </button>
            </div>
            <p style={{ fontSize: "12px", color: t.textSub, marginTop: "8px" }}>Note: Direct API recrawl is restricted. Use this tool to quickly jump to GSC for manual submission.</p>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600 }}>Quick Submission Links</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {["/", "/events", "/turfs", "/events/in/coimbatore", "/events/in/chennai"].map(path => (
                <button 
                  key={path}
                  onClick={() => setRecrawlUrl(path)}
                  style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  {path}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEO Page Management (City Pages) */}
      <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Globe size={20} color="#3b82f6" />
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>City SEO Page Management</h3>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px", backgroundColor: theme === 'light' ? '#f8fafc' : '#1e293b', borderRadius: "12px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>Add City Override</h4>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>City Name</label>
              <input 
                type="text" 
                value={newCity} 
                onChange={e => setNewCity(e.target.value)} 
                placeholder="e.g. Coimbatore"
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Meta Title</label>
              <input 
                type="text" 
                value={newCitySeo.title} 
                onChange={e => setNewCitySeo({...newCitySeo, title: e.target.value})} 
                placeholder="Events in Coimbatore"
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Meta Description</label>
              <textarea 
                value={newCitySeo.description} 
                onChange={e => setNewCitySeo({...newCitySeo, description: e.target.value})} 
                placeholder="Find the best events, concerts and activities in Coimbatore..."
                rows={3}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain }}
              />
            </div>
            <button 
              onClick={handleAddCitySeo}
              style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Plus size={16} /> Add Override
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                  <th style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}>City</th>
                  <th style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}>Title</th>
                  <th style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(config.city_seo_overrides || {}).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: t.textSub }}>No city overrides configured.</td>
                  </tr>
                ) : Object.entries(config.city_seo_overrides).map(([city, seo]) => (
                  <tr key={city} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "12px", fontWeight: 700, textTransform: "capitalize" }}>{city}</td>
                    <td style={{ padding: "12px", fontSize: "13px" }}>{seo.title}</td>
                    <td style={{ padding: "12px" }}>
                      <button 
                        onClick={() => handleRemoveCitySeo(city)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
           <button onClick={handleSaveConfig} style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Save All Overrides</button>
        </div>
      </div>

      {/* 4. Backlink & Promotion Management */}
      <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <LinkIcon size={20} color="#8b5cf6" />
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Backlink & Promotion Tracking</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
           <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input 
                type="text" 
                value={newBacklink.name} 
                onChange={e => setNewBacklink({...newBacklink, name: e.target.value})} 
                placeholder="Campaign Name (e.g. Summer Sale Instagram)"
                style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
              />
              <input 
                type="text" 
                value={newBacklink.url} 
                onChange={e => setNewBacklink({...newBacklink, url: e.target.value})} 
                placeholder="Source URL / Social Link"
                style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#1e293b', color: t.textMain }}
              />
              <button 
                onClick={handleAddBacklink}
                style={{ backgroundColor: "#8b5cf6", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
              >
                Track Link
              </button>
           </div>
           <div style={{ padding: "16px", backgroundColor: "#f5f3ff", borderRadius: "12px", border: "1px solid #ddd6fe" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#6d28d9", fontWeight: 600 }}>Pro Tip: Use UTM parameters in these links to track traffic sources directly in Google Analytics.</p>
           </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                <th style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}>URL</th>
                <th style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}>Date Added</th>
                <th style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(config.backlink_tracking || []).length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: t.textSub }}>No links tracked yet.</td>
                </tr>
              ) : config.backlink_tracking.map((link) => (
                <tr key={link.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: "12px", fontWeight: 600 }}>{link.name}</td>
                  <td style={{ padding: "12px", fontSize: "12px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <a href={link.url} target="_blank" rel="noreferrer" style={{ color: "#8b5cf6" }}>{link.url}</a>
                  </td>
                  <td style={{ padding: "12px", fontSize: "12px", color: t.textSub }}>{new Date(link.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "12px" }}>
                    <button 
                      onClick={() => handleRemoveBacklink(link.id)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Sitemap & Indexing Control */}
      <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Map size={20} color="#06b6d4" />
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Sitemap & Global Indexing</h3>
          </div>
          <button 
            onClick={handleRefreshSitemap}
            disabled={isRefreshingSitemap}
            style={{ 
              backgroundColor: "#06b6d4", 
              color: "#fff", 
              border: "none", 
              padding: "10px 24px", 
              borderRadius: "8px", 
              fontWeight: 700, 
              cursor: isRefreshingSitemap ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: isRefreshingSitemap ? 0.7 : 1
            }}
          >
            {isRefreshingSitemap ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isRefreshingSitemap ? "Pinging..." : "Refresh Sitemap & Notify"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
           <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#ecfeff", border: "1px solid #a5f3fc", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0891b2", marginBottom: "4px" }}>
                <CheckCircle size={16} />
                <span style={{ fontWeight: 700, fontSize: "14px" }}>Sitemap is Auto-Generated</span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#0e7490" }}>Location: <a href="/sitemap.xml" target="_blank" style={{ fontWeight: 600, color: "#0891b2" }}>bookmyticket.net/sitemap.xml</a></p>
           </div>
           
           <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "13px", color: t.textSub }}>
                Last successful ping to search engines: <br />
                <strong style={{ color: t.textMain }}>{config.sitemap_last_ping ? new Date(config.sitemap_last_ping).toLocaleString() : "Never"}</strong>
              </p>
           </div>
        </div>
      </div>
      
      <div style={{ height: "40px" }} />
    </div>
  );
}
