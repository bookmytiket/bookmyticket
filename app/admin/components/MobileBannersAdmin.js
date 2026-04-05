"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Video, Image as ImageIcon, Plus, Trash2, Edit, Save, X, GripVertical } from "lucide-react";

export default function MobileBannersAdmin() {
    const banners = useQuery(api.mobileBanners.getAll) || [];
    const allConfig = useQuery(api.systemConfig.getAllConfig);
    const setConfigMutation = useMutation(api.systemConfig.setConfig);

    const createBanner = useMutation(api.mobileBanners.create);
    const updateBanner = useMutation(api.mobileBanners.update);
    const removeBanner = useMutation(api.mobileBanners.remove);
    const toggleStatus = useMutation(api.mobileBanners.toggleStatus);
    const reorderBanners = useMutation(api.mobileBanners.reorder);
    const generateUploadUrl = useMutation(api.mobileBanners.generateUploadUrl);

    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formState, setFormState] = useState({
        type: "video",
        mediaUrl: "",
        title: "",
        isActive: true,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    
    // Playback mode from systemConfig
    const playbackModeRaw = allConfig && allConfig["mobile_banner_playback_mode"];
    const playbackMode = playbackModeRaw ? (typeof playbackModeRaw === "string" ? JSON.parse(playbackModeRaw) : playbackModeRaw) : "sequential";

    const handlePlaybackModeChange = async (e) => {
        const val = e.target.value;
        await setConfigMutation({ key: "mobile_banner_playback_mode", value: JSON.stringify(val) });
    };

    const resetForm = () => {
        setFormState({ type: "video", mediaUrl: "", title: "", isActive: true });
        setSelectedFile(null);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (b) => {
        setEditingId(b._id);
        setFormState({
            type: b.type,
            mediaUrl: b.mediaUrl,
            title: b.title || "",
            isActive: b.isActive,
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalMediaUrl = formState.mediaUrl;
            let finalStorageId = undefined;

            if (selectedFile) {
                const uploadUrl = await generateUploadUrl();
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                });
                const { storageId } = await result.json();
                finalStorageId = storageId;
                // Since convex file storage requires url resolving, we handle it on client or pass storage id. 
                // But typically for frontend URLs, we can either use api.storage.getUrl equivalent, or just store the media URL. 
                // For Convex, we might need a function to transform storageId. Wait, actually we can just store the storageId and fetch in RN.
                // Let's use the local API if available. 
                // Wait, if it's external URL, they can just paste it in mediaUrl.
            }

            const payload = {
                type: formState.type,
                mediaUrl: selectedFile ? "" : finalMediaUrl,
                title: formState.title,
                isActive: formState.isActive,
                order: editingId ? banners.find(b => b._id === editingId).order : banners.length,
            };

            if (finalStorageId) payload.storageId = finalStorageId;

            if (editingId) {
                await updateBanner({ id: editingId, ...payload });
            } else {
                await createBanner(payload);
            }
            resetForm();
        } catch (error) {
            alert("Error saving banner: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleMoveUp = async (index) => {
        if (index === 0) return;
        const newBanners = [...banners];
        [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
        await saveOrder(newBanners);
    };

    const handleMoveDown = async (index) => {
        if (index === banners.length - 1) return;
        const newBanners = [...banners];
        [newBanners[index + 1], newBanners[index]] = [newBanners[index], newBanners[index + 1]];
        await saveOrder(newBanners);
    };

    const saveOrder = async (reorderedArray) => {
        const items = reorderedArray.map((b, i) => ({ id: b._id, order: i }));
        await reorderBanners({ items });
    };

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>Mobile Video Banners</h2>
                    <p style={{ color: "#6b7280" }}>Manage sequential video advertisements for the mobile hero section.</p>
                </div>
                
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ backgroundColor: "#f3f4f6", padding: "8px 12px", borderRadius: "8px", display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600" }}>Playback Mode:</span>
                        <select 
                            value={playbackMode} 
                            onChange={handlePlaybackModeChange}
                            style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                        >
                            <option value="sequential">Sequential</option>
                            <option value="random">Random</option>
                        </select>
                    </div>

                    <button 
                        onClick={() => setShowForm(true)}
                        style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#3b82f6", color: "white", padding: "10px 16px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}
                    >
                        <Plus size={18} /> Add Banner
                    </button>
                </div>
            </div>

            {showForm && (
                <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>{editingId ? "Edit" : "Create"} Banner</h3>
                        <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Media Type</label>
                            <select 
                                value={formState.type} 
                                onChange={(e) => setFormState({...formState, type: e.target.value})}
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                            >
                                <option value="video">Video</option>
                                <option value="image">Image</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Title (Optional)</label>
                            <input 
                                type="text" 
                                value={formState.title} 
                                onChange={(e) => setFormState({...formState, title: e.target.value})}
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                            />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Media Action (Choose one)</label>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <input 
                                    type="url" 
                                    placeholder="External URL (https://...)" 
                                    value={formState.mediaUrl} 
                                    onChange={(e) => setFormState({...formState, mediaUrl: e.target.value})}
                                    style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                                    disabled={!!selectedFile}
                                />
                                <span style={{ fontWeight: "bold", color: "#9ca3af" }}>OR</span>
                                <input 
                                    type="file" 
                                    accept={formState.type === "video" ? "video/*" : "image/*"}
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    style={{ flex: 1 }}
                                    disabled={!!formState.mediaUrl}
                                />
                            </div>
                        </div>
                        <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                            <button type="button" onClick={resetForm} style={{ padding: "10px 16px", borderRadius: "8px", backgroundColor: "#e5e7eb", border: "none", cursor: "pointer", fontWeight: "600" }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={isSaving || (!formState.mediaUrl && !selectedFile)} style={{ padding: "10px 16px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "white", border: "none", cursor: "pointer", fontWeight: "600" }}>
                                {isSaving ? "Saving..." : "Save Banner"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px", fontWeight: 700 }}>Order</th>
                        <th style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px", fontWeight: 700 }}>Media</th>
                        <th style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px", fontWeight: 700 }}>Title</th>
                        <th style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px", fontWeight: 700 }}>Type</th>
                        <th style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px", fontWeight: 700 }}>Status</th>
                        <th style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {banners.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>No banners found. Click &quot;Add Banner&quot; to create one.</td>
                        </tr>
                    ) : (
                        banners.map((b, index) => (
                            <tr key={b._id} style={{ backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderRadius: "8px" }}>
                                <td style={{ padding: "16px", borderRadius: "8px 0 0 8px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "24px" }}>
                                        <button onClick={() => handleMoveUp(index)} disabled={index===0} style={{ border: "none", background: "transparent", cursor: index===0 ? "default" : "pointer", color: index===0 ? "#d1d5db" : "#6b7280" }}>▲</button>
                                        <span style={{ fontWeight: "bold" }}>{index + 1}</span>
                                        <button onClick={() => handleMoveDown(index)} disabled={index===banners.length-1} style={{ border: "none", background: "transparent", cursor: index===banners.length-1 ? "default" : "pointer", color: index===banners.length-1 ? "#d1d5db" : "#6b7280" }}>▼</button>
                                    </div>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                                        {b.type === "video" ? <Video size={20} /> : <ImageIcon size={20} />}
                                    </div>
                                    {b.storageId && <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }}>File Uploaded</div>}
                                </td>
                                <td style={{ padding: "16px", fontWeight: "600" }}>{b.title || "-"}</td>
                                <td style={{ padding: "16px", textTransform: "capitalize" }}>{b.type}</td>
                                <td style={{ padding: "16px" }}>
                                    <button 
                                        onClick={() => toggleStatus({ id: b._id, isActive: !b.isActive })}
                                        style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "12px", fontWeight: "bold", border: "none", cursor: "pointer", backgroundColor: b.isActive ? "#dcfce7" : "#fee2e2", color: b.isActive ? "#166534" : "#991b1b" }}
                                    >
                                        {b.isActive ? "Enabled" : "Disabled"}
                                    </button>
                                </td>
                                <td style={{ padding: "16px", borderRadius: "0 8px 8px 0", textAlign: "right" }}>
                                    <button onClick={() => handleEdit(b)} style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", marginRight: "12px" }}><Edit size={18} /></button>
                                    <button onClick={() => { if(confirm("Delete this banner?")) removeBanner({ id: b._id }); }} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
