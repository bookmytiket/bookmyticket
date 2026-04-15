"use client";

import React, { useState, useEffect } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import * as LucideIcons from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AdminCheckoutFooter({ theme, t }) {
    const { showToast } = useToast();
    const { data: configData, loading } = useSupabaseQuery('system_config', (q) => q.eq('key', 'admin_checkout_footers'));
    const [upsertConfig] = useSupabaseMutation('system_config', 'upsert', (q, p) => q.eq('key', 'admin_checkout_footers'));

    const footers = configData?.[0]?.value || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        iconName: "Info",
        actionType: "modal", // 'redirect' or 'modal'
        redirectUrl: "",
        modalContent: "",
        order: 0,
        isActive: true
    });

    if (loading) return <div style={{ color: t.textMain, padding: "20px" }}>Loading Checkout Footers...</div>;

    const saveFooters = async (newList) => {
        try {
            await upsertConfig({ 
                key: 'admin_checkout_footers', 
                value: newList 
            });
            showToast("Changes saved successfully", "success");
        } catch (err) {
            showToast("Error saving: " + err.message, "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newList;
        const newItem = { 
            ...formData, 
            id: editingItem ? editingItem.id : crypto.randomUUID(),
            order: parseInt(formData.order) 
        };

        if (editingItem) {
            newList = footers.map(f => f.id === editingItem.id ? newItem : f);
        } else {
            newList = [...footers, newItem];
        }

        await saveFooters(newList);
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const removeFooter = async (id) => {
        const newList = footers.filter(f => f.id !== id);
        await saveFooters(newList);
    };

    const toggleActive = async (id) => {
        const newList = footers.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f);
        await saveFooters(newList);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            description: item.description,
            iconName: item.iconName,
            actionType: item.actionType,
            redirectUrl: item.redirectUrl || "",
            modalContent: item.modalContent || "",
            order: item.order,
            isActive: item.isActive
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({
            title: "", description: "", iconName: "Info",
            actionType: "modal", redirectUrl: "", modalContent: "",
            order: footers.length + 1, isActive: true
        });
        setIsModalOpen(true);
    };

    return (
        <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Checkout Footer Menu</h2>
                    <p style={{ color: t.textSub, marginTop: "4px" }}>Manage the sticky footer items on the Checkout / Payment pages.</p>
                </div>
                <button
                    onClick={openCreate}
                    style={{
                        padding: "10px 20px", background: "#f84464", color: "#fff",
                        border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer"
                    }}
                >
                    + Add New Footer
                </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", background: t.cardBg, borderRadius: "12px", overflow: "hidden" }}>
                <thead>
                    <tr style={{ background: theme === 'light' ? "#f1f5f9" : "#1e293b", textAlign: "left" }}>
                        <th style={{ padding: "16px", color: t.textSub, fontSize: "12px" }}>Order</th>
                        <th style={{ padding: "16px", color: t.textSub, fontSize: "12px" }}>Icon & Title</th>
                        <th style={{ padding: "16px", color: t.textSub, fontSize: "12px" }}>Action</th>
                        <th style={{ padding: "16px", color: t.textSub, fontSize: "12px" }}>Status</th>
                        <th style={{ padding: "16px", color: t.textSub, fontSize: "12px" }}>Manage</th>
                    </tr>
                </thead>
                <tbody>
                    {[...footers].sort((a,b) => a.order - b.order).map((item) => {
                        const Icon = LucideIcons[item.iconName] || LucideIcons.Info;
                        return (
                            <tr key={item.id} style={{ borderTop: `1px solid ${t.border}` }}>
                                <td style={{ padding: "16px", color: t.textMain }}>{item.order}</td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <Icon size={20} color={t.textMain} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, color: t.textMain }}>{item.title}</p>
                                            <p style={{ margin: 0, fontSize: "11px", color: t.textSub }}>{item.description}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: "16px", color: t.textMain }}>
                                    <span style={{ fontSize: "12px", background: theme === 'light' ? "#f1f5f9" : "#334155", padding: "4px 8px", borderRadius: "4px" }}>
                                        {item.actionType === 'modal' ? 'Modal Popup' : 'Redirect'}
                                    </span>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <button 
                                        onClick={() => toggleActive(item.id)}
                                        style={{ 
                                            padding: "6px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer",
                                            background: item.isActive ? "#22c55e20" : "#ef444420",
                                            color: item.isActive ? "#22c55e" : "#ef4444"
                                        }}
                                    >
                                        {item.isActive ? "Active" : "Hidden"}
                                    </button>
                                </td>
                                <td style={{ padding: "16px", display: "flex", gap: "8px" }}>
                                    <button onClick={() => openEdit(item)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#3b82f6" }}><LucideIcons.Edit size={16} /></button>
                                    <button onClick={() => confirm("Delete this footer item?") && removeFooter(item.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444" }}><LucideIcons.Trash2 size={16} /></button>
                                </td>
                            </tr>
                        );
                    })}
                    {footers.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No footer items found.</td>
                        </tr>
                    ) }
                </tbody>
            </table>

            {isModalOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: t.cardBg, width: "500px", padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}`, maxHeight: "90vh", overflowY: "auto" }}>
                        <h3 style={{ margin: "0 0 20px", color: t.textMain }}>{editingItem ? "Edit Footer" : "Create Footer"}</h3>
                        
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", gap: "16px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: t.textSub }}>Title</label>
                                    <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: t.textSub }}>Lucide Icon Name</label>
                                    <input required type="text" value={formData.iconName} onChange={e=>setFormData({...formData, iconName: e.target.value})} placeholder="e.g. Shield, LifeBuoy" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }} />
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: t.textSub }}>Short Description</label>
                                <input required type="text" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }} />
                            </div>

                            <div style={{ display: "flex", gap: "16px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: t.textSub }}>Action Type</label>
                                    <select value={formData.actionType} onChange={e=>setFormData({...formData, actionType: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }}>
                                        <option value="modal">Show Modal Popup</option>
                                        <option value="redirect">Redirect to URL</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: t.textSub }}>Display Order</label>
                                    <input required type="number" value={formData.order} onChange={e=>setFormData({...formData, order: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }} />
                                </div>
                            </div>

                            {formData.actionType === 'redirect' ? (
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: t.textSub }}>Redirect URL</label>
                                    <input type="text" value={formData.redirectUrl} onChange={e=>setFormData({...formData, redirectUrl: e.target.value})} placeholder="/support or https://..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }} />
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: t.textSub }}>Modal Content text</label>
                                    <textarea rows={5} value={formData.modalContent} onChange={e=>setFormData({...formData, modalContent: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain }} />
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "12px", background: "transparent", color: t.textMain, border: `1px solid ${t.border}`, borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: "12px", background: "#f84464", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
