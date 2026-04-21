"use client";
import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Users, 
  FileText, 
  History, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Save,
  X,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";

const CATEGORIES = ["Welcome", "Password Reset", "Notification", "Service Update", "Promotional"];

export default function EmailCommSystem({ t, theme }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("templates"); // templates | broadcast | logs
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Template Editing State
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    identifier: "",
    subject: "",
    body: "",
    category: "Notification",
    auto_send: false
  });

  // Broadcast State
  const [broadcastTarget, setBroadcastTarget] = useState("all_users");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/comm/email/templates");
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch (err) {
      showToast("Error fetching templates", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.identifier || !templateForm.subject || !templateForm.body) {
      showToast("Please fill all required fields", "error");
      return;
    }

    try {
      const res = await fetch("/api/comm/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...templateForm, id: editingTemplate?.id })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Template saved successfully", "success");
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/comm/email/templates?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Template deleted", "success");
        fetchTemplates();
      }
    } catch (err) {
      showToast("Error deleting template", "error");
    }
  };

  const handleBroadcast = async (isTest = false) => {
    if (!selectedTemplateId) {
      showToast("Please select a template to send", "error");
      return;
    }

    if (isTest && !testEmail) {
      showToast("Please enter a test email address", "error");
      return;
    }

    if (!isTest && !confirm(`Are you sure you want to send this email to ${broadcastTarget.replace('_', ' ')}?`)) return;

    setBroadcastLoading(true);
    try {
      const res = await fetch("/api/comm/email/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          target: isTest ? "test" : broadcastTarget,
          filter: isTest ? { email: testEmail } : {}
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        fetchLogs();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBroadcastLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 20px",
        borderRadius: "8px",
        backgroundColor: activeTab === id ? "#3b82f615" : "transparent",
        color: activeTab === id ? "#3b82f6" : t.textSub,
        border: "none",
        fontWeight: 700,
        fontSize: "14px",
        cursor: "pointer",
        transition: "0.2s"
      }}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Tabs */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        backgroundColor: t.cardBg,
        padding: "16px 24px",
        borderRadius: "16px",
        border: `1px solid ${t.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <TabButton id="templates" label="Templates" icon={FileText} />
          <TabButton id="broadcast" label="Broadcast" icon={Send} />
          <TabButton id="logs" label="Logs" icon={History} />
        </div>
        {activeTab === "templates" && (
          <button
            onClick={() => {
              setEditingTemplate({ id: null });
              setTemplateForm({ name: "", identifier: "", subject: "", body: "", category: "Notification", auto_send: false });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "10px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <Plus size={18} />
            New Template
          </button>
        )}
      </div>

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {editingTemplate ? (
            <div style={{ 
              backgroundColor: t.cardBg, 
              padding: "32px", 
              borderRadius: "16px", 
              border: `1px solid ${t.border}` 
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 800 }}>{editingTemplate.id ? "Edit Template" : "Create Template"}</h3>
                <button onClick={() => setEditingTemplate(null)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Template Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }}
                    placeholder="e.g. Welcome Registration"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Unique Identifier</label>
                  <input
                    type="text"
                    value={templateForm.identifier}
                    onChange={e => setTemplateForm({ ...templateForm, identifier: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }}
                    placeholder="e.g. welcome_user"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Category</label>
                  <select
                    value={templateForm.category}
                    onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "24px" }}>
                  <input
                    type="checkbox"
                    id="auto_send"
                    checked={templateForm.auto_send}
                    onChange={e => setTemplateForm({ ...templateForm, auto_send: e.target.checked })}
                  />
                  <label htmlFor="auto_send" style={{ fontSize: "14px", fontWeight: 600 }}>Enable Auto-Send (Trigger Based)</label>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Email Subject</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }}
                  placeholder="Hello {{name}}, Welcome to..."
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700 }}>Email Body (HTML supported)</label>
                  <span style={{ fontSize: "11px", color: t.textSub }}>Available placeholders: {"{{name}}, {{email}}, {{site_url}}"}</span>
                </div>
                <textarea
                  value={templateForm.body}
                  onChange={e => setTemplateForm({ ...templateForm, body: e.target.value })}
                  style={{ width: "100%", minHeight: "300px", padding: "16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontFamily: "monospace", fontSize: "14px" }}
                  placeholder="<h1>Hello {{name}}</h1>..."
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleSaveTemplate}
                  style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "#3b82f6", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <Save size={18} />
                  Save Template
                </button>
                <button
                  onClick={() => setEditingTemplate(null)}
                  style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "none", color: t.textMain, border: `1px solid ${t.border}`, fontWeight: 800, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
              {templates.map(tmpl => (
                <div key={tmpl.id} style={{ 
                  backgroundColor: t.cardBg, 
                  padding: "24px", 
                  borderRadius: "16px", 
                  border: `1px solid ${t.border}`,
                  position: "relative",
                  transition: "0.2s"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>{tmpl.name}</h4>
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: t.textSub, fontFamily: "monospace" }}>{tmpl.identifier}</p>
                    </div>
                    <span style={{ 
                      padding: "4px 10px", 
                      borderRadius: "100px", 
                      fontSize: "10px", 
                      fontWeight: 800, 
                      backgroundColor: "#3b82f615", 
                      color: "#3b82f6",
                      textTransform: "uppercase"
                    }}>
                      {tmpl.category}
                    </span>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: t.textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Subject: {tmpl.subject}
                    </p>
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: t.textSub, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {tmpl.body.replace(/<[^>]*>?/gm, '')}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => {
                        setEditingTemplate(tmpl);
                        setTemplateForm(tmpl);
                      }}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", borderRadius: "8px", border: `1px solid ${t.border}`, background: "none", color: "#3b82f6", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px", borderRadius: "8px", border: `1px solid ${t.border}`, background: "none", color: "#ef4444", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && !loading && (
                <div style={{ gridColumn: "1 / -1", padding: "80px", textAlign: "center", backgroundColor: t.cardBg, borderRadius: "16px", border: `1px dashed ${t.border}` }}>
                  <Mail size={48} style={{ opacity: 0.1, marginBottom: "16px" }} />
                  <p style={{ color: t.textSub, fontWeight: 600 }}>No templates found. Create your first email template to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Broadcast Tab */}
      {activeTab === "broadcast" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Email Broadcast</h3>
            
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>1. Select Target Audience</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { id: "all_users", label: "All Registered Users", icon: Users },
                  { id: "all_subscribers", label: "Newsletter Subscribers", icon: Mail },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setBroadcastTarget(opt.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "10px",
                      padding: "20px",
                      borderRadius: "12px",
                      border: `2px solid ${broadcastTarget === opt.id ? "#3b82f6" : t.border}`,
                      background: broadcastTarget === opt.id ? "#3b82f605" : "none",
                      color: broadcastTarget === opt.id ? "#3b82f6" : t.textSub,
                      cursor: "pointer",
                      transition: "0.2s"
                    }}
                  >
                    <opt.icon size={24} />
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>2. Select Email Template</label>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: `1.5px solid ${t.border}`, background: t.bg, color: t.textMain, fontWeight: 600 }}
              >
                <option value="">-- Choose a template --</option>
                {templates.map(tmpl => <option key={tmpl.id} value={tmpl.id}>{tmpl.name} ({tmpl.category})</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "32px", padding: "20px", borderRadius: "12px", backgroundColor: "#fef3c730", border: "1.5px dashed #f59e0b", display: "flex", gap: "12px" }}>
              <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#d97706" }}>Safety Check</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: t.textSub, lineHeight: "1.5" }}>
                  Broadcasting emails will send a message to all selected users. Please preview the email by sending a test mail first.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <input 
                  type="email"
                  placeholder="Test Email Address"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  style={{ flex: 1, padding: "14px", borderRadius: "12px", border: `1.5px solid ${t.border}`, background: t.bg, color: t.textMain }}
                />
                <button
                  onClick={() => handleBroadcast(true)}
                  disabled={broadcastLoading}
                  style={{ padding: "0 24px", borderRadius: "12px", border: `1.5px solid #3b82f6`, background: "none", color: "#3b82f6", fontWeight: 800, cursor: "pointer" }}
                >
                  Send Test
                </button>
              </div>
              
              <button
                onClick={() => handleBroadcast(false)}
                disabled={broadcastLoading}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 10px 25px rgba(59, 130, 246, 0.25)",
                  opacity: broadcastLoading ? 0.7 : 1
                }}
              >
                {broadcastLoading ? <RefreshCw className="spin" size={20} /> : <Send size={20} />}
                {broadcastLoading ? "Broadcasting..." : "Confirm & Send Broadcast"}
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Live Preview</h3>
            {selectedTemplateId ? (
              <div style={{ 
                border: `1px solid ${t.border}`, 
                borderRadius: "12px", 
                overflow: "hidden", 
                backgroundColor: "#fff",
                height: "500px",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ padding: "16px", borderBottom: `1px solid ${t.border}`, backgroundColor: "#f8fafc" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Subject:</p>
                  <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                    {templates.find(t => t.id === selectedTemplateId)?.subject}
                  </p>
                </div>
                <div style={{ flex: 1, padding: "24px", overflowY: "auto", color: "#333", fontSize: "15px" }}>
                  <div dangerouslySetInnerHTML={{ 
                    __html: (templates.find(t => t.id === selectedTemplateId)?.body || "")
                      .replace(/{{\s*name\s*}}/g, "<strong>[User Name]</strong>")
                      .replace(/{{\s*site_url\s*}}/g, "https://bookmyticket.net")
                      .replace(/{{\s*reset_link\s*}}/g, "https://bookmyticket.net/reset-password?token=PREVIEW_TOKEN&email=test@example.com")
                      .replace(/{{\s*otp\s*}}/g, "<strong>123456</strong>")
                      .replace(/{{\s*ticket_url\s*}}/g, "https://bookmyticket.net/ticket/PREVIEW")
                      .replace(/{{\s*eventName\s*}}/g, "<strong>Sample Event Name</strong>")
                      .replace(/{{\s*date\s*}}/g, "<strong>April 21, 2026</strong>")
                      .replace(/{{\s*bookingId\s*}}/g, "<strong>BMT-12345</strong>")
                      .replace(/\n/g, "<br/>")
                  }} />
                </div>
              </div>
            ) : (
              <div style={{ height: "500px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${t.border}`, borderRadius: "12px" }}>
                <Eye size={48} style={{ opacity: 0.1, marginBottom: "16px" }} />
                <p style={{ color: t.textSub, fontWeight: 600 }}>Select a template to see preview</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800 }}>Communication History</h3>
            <button onClick={fetchLogs} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px" }}>
              <RefreshCw size={14} /> Refresh Logs
            </button>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Recipient</th>
                  <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Subject</th>
                  <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ backgroundColor: theme === 'light' ? '#f8fafc' : t.bg, borderRadius: "10px" }}>
                    <td style={{ padding: "16px", borderRadius: "10px 0 0 10px", fontWeight: 600 }}>{log.email}</td>
                    <td style={{ padding: "16px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.subject}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ 
                        padding: "4px 10px", 
                        borderRadius: "100px", 
                        fontSize: "10px", 
                        fontWeight: 800, 
                        backgroundColor: log.status === 'SUCCESS' ? "#22c55e15" : "#ef444415",
                        color: log.status === 'SUCCESS' ? "#22c55e" : "#ef4444"
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px", borderRadius: "0 10px 10px 0", fontSize: "12px", color: t.textSub }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No email logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
