import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
    Settings, 
    FileText, 
    Download, 
    PieChart, 
    Save, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle,
    Calendar as CalendarIcon,
    Search,
    ChevronRight,
    Building2,
    Briefcase
} from "lucide-react";

const GstPortal = ({ t, theme }) => {
    const [activeSubTab, setActiveSubTab] = useState("settings");
    const settings = useQuery(api.gst.getSettings);
    const updateSettings = useMutation(api.gst.updateSettings);

    const [formData, setFormData] = useState({
        businessName: "",
        businessAddress: "",
        gstin: "",
        taxConfig: { cgst: 9, sgst: 9, igst: 18 },
        categoryRates: {
            events: { cgst: 9, sgst: 9, igst: 18, enabled: true },
            turf: { cgst: 9, sgst: 9, igst: 18, enabled: true },
            services: { cgst: 9, sgst: 9, igst: 18, enabled: true },
        },
        invoicePrefix: "BMT-",
        isEnabled: false,
        pricingType: "inclusive",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    useEffect(() => {
        if (settings) {
            setFormData({
                ...settings,
                categoryRates: settings.categoryRates || formData.categoryRates
            });
        }
    }, [settings]);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await updateSettings(formData);
            setSaveStatus("success");
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            setSaveStatus("error");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRateChange = (category, field, value) => {
        setFormData(prev => ({
            ...prev,
            categoryRates: {
                ...prev.categoryRates,
                [category]: {
                    ...prev.categoryRates[category],
                    [field]: field === "enabled" ? value : parseFloat(value) || 0
                }
            }
        }));
    };

    return (
        <div style={{ color: t.textMain }}>
            {/* Header Navigation */}
            <div style={{ 
                display: "flex", 
                gap: "24px", 
                marginBottom: "32px",
                borderBottom: `1px solid ${t.border}`,
                paddingBottom: "16px"
            }}>
                {[
                    { id: "settings", label: "Configuration", icon: Settings },
                    { id: "reports", label: "Reporting", icon: PieChart },
                    { id: "invoices", label: "Invoices", icon: FileText }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 16px",
                            borderRadius: "12px",
                            border: "none",
                            background: activeSubTab === tab.id ? `${t.activeLink}15` : "transparent",
                            color: activeSubTab === tab.id ? t.activeLink : t.textSub,
                            fontWeight: 700,
                            fontSize: "14px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeSubTab === "settings" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {/* Business Info Section */}
                        <div style={{ 
                            background: t.cardBg, 
                            borderRadius: "20px", 
                            padding: "32px", 
                            border: `1px solid ${t.border}`,
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.02)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                                <div style={{ p: "10px", borderRadius: "12px", background: "#3b82f615", color: "#3b82f6" }}>
                                    <Building2 size={24} />
                                </div>
                                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>Business Information</h3>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase" }}>Legal Business Name</label>
                                    <input 
                                        type="text"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                                        style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: theme === 'dark' ? "#1e293b" : "#fff", color: t.textMain }}
                                        placeholder="e.g. BookMyTicket Services Pvt Ltd"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase" }}>GSTIN Number</label>
                                    <input 
                                        type="text"
                                        value={formData.gstin}
                                        onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                                        style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: theme === 'dark' ? "#1e293b" : "#fff", color: t.textMain }}
                                        placeholder="e.g. 27AAAAA0000A1Z5"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase" }}>Invoice Prefix</label>
                                    <input 
                                        type="text"
                                        value={formData.invoicePrefix}
                                        onChange={(e) => setFormData({...formData, invoicePrefix: e.target.value})}
                                        style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: theme === 'dark' ? "#1e293b" : "#fff", color: t.textMain }}
                                        placeholder="e.g. BMT-"
                                    />
                                </div>
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "8px", textTransform: "uppercase" }}>Registered Business Address</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.businessAddress}
                                        onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                                        style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: theme === 'dark' ? "#1e293b" : "#fff", color: t.textMain, resize: "none" }}
                                        placeholder="Enter full address as per GST registration"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Category Rates Section */}
                        <div style={{ 
                            background: t.cardBg, 
                            borderRadius: "20px", 
                            padding: "32px", 
                            border: `1px solid ${t.border}`
                        }}>
                             <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                                <div style={{ p: "10px", borderRadius: "12px", background: "#8b5cf615", color: "#8b5cf6" }}>
                                    <Briefcase size={24} />
                                </div>
                                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>Category Tax Rates</h3>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {["events", "turf", "services"].map((cat) => (
                                    <div key={cat} style={{ 
                                        padding: "20px", 
                                        borderRadius: "16px", 
                                        border: `1px solid ${t.border}`,
                                        background: theme === 'dark' ? "rgba(255,255,255,0.02)" : "#fcfcfc"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                            <h4 style={{ margin: 0, textTransform: "capitalize", fontSize: "16px", fontWeight: 700 }}>{cat} Booking GST</h4>
                                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.categoryRates[cat].enabled}
                                                    onChange={(e) => handleRateChange(cat, "enabled", e.target.checked)}
                                                />
                                                <span style={{ fontSize: "12px", fontWeight: 700 }}>Enabled</span>
                                            </label>
                                        </div>
                                        
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, opacity: 0.6, marginBottom: "4px" }}>CGST (%)</label>
                                                <input 
                                                    type="number"
                                                    disabled={!formData.categoryRates[cat].enabled}
                                                    value={formData.categoryRates[cat].cgst}
                                                    onChange={(e) => handleRateChange(cat, "cgst", e.target.value)}
                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'dark' ? "#1e293b" : "#fff", color: t.textMain }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, opacity: 0.6, marginBottom: "4px" }}>SGST (%)</label>
                                                <input 
                                                    type="number"
                                                    disabled={!formData.categoryRates[cat].enabled}
                                                    value={formData.categoryRates[cat].sgst}
                                                    onChange={(e) => handleRateChange(cat, "sgst", e.target.value)}
                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'dark' ? "#1e293b" : "#fff", color: t.textMain }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, opacity: 0.6, marginBottom: "4px" }}>IGST (%)</label>
                                                <input 
                                                    type="number"
                                                    disabled={!formData.categoryRates[cat].enabled}
                                                    value={formData.categoryRates[cat].igst}
                                                    onChange={(e) => handleRateChange(cat, "igst", e.target.value)}
                                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'dark' ? "#1e293b" : "#fff", color: t.textMain }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{ 
                            background: t.cardBg, 
                            borderRadius: "20px", 
                            padding: "24px", 
                            border: `1px solid ${t.border}`,
                            position: "sticky",
                            top: "100px"
                        }}>
                             <h4 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 800 }}>Master Control</h4>

                             <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", width: "100%", cursor: "pointer", padding: "12px", borderRadius: "12px", background: formData.isEnabled ? "#10b98110" : "#ef444410", transition: "all 0.3s" }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>Enable GST System</p>
                                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 500, color: t.textSub }}>{formData.isEnabled ? "System is active" : "GST is currently disabled"}</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        style={{ width: "20px", height: "20px" }}
                                        checked={formData.isEnabled}
                                        onChange={(e) => setFormData({...formData, isEnabled: e.target.checked})}
                                    />
                                </label>
                             </div>

                             <div style={{ marginBottom: "24px" }}>
                                <p style={{ fontSize: "12px", fontWeight: 700, color: t.textSub, marginBottom: "12px", textTransform: "uppercase" }}>Pricing Model</p>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {["inclusive", "exclusive"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({...formData, pricingType: type})}
                                            style={{
                                                flex: 1,
                                                padding: "10px",
                                                borderRadius: "10px",
                                                border: `1px solid ${formData.pricingType === type ? t.activeLink : t.border}`,
                                                background: formData.pricingType === type ? `${t.activeLink}10` : "transparent",
                                                color: formData.pricingType === type ? t.activeLink : t.textSub,
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                textTransform: "capitalize",
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ fontSize: "10px", color: t.textSub, marginTop: "8px" }}>
                                    {formData.pricingType === 'inclusive' 
                                        ? "Prices already include GST. System will backward calculate taxable amount." 
                                        : "GST will be added on top of the base price during checkout."}
                                </p>
                             </div>

                             <button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    borderRadius: "14px",
                                    background: "#3b82f6",
                                    color: "#fff",
                                    border: "none",
                                    fontWeight: 800,
                                    cursor: isSaving ? "wait" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                    transition: "all 0.2s"
                                }}
                             >
                                {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                {isSaving ? "Saving..." : "Apply Changes"}
                             </button>

                             {saveStatus === "success" && (
                                 <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "13px", fontWeight: 600 }}>
                                     <CheckCircle2 size={16} /> Configuration updated!
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === "reports" && (
                <GstReports t={t} theme={theme} />
            )}

            {activeSubTab === "invoices" && (
                <GstInvoices t={t} theme={theme} />
            )}
        </div>
    );
};

const GstReports = ({ t, theme }) => {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(),
        end: Date.now()
    });

    const reportData = useQuery(api.gst.getGstReport, { 
        startDate: dateRange.start, 
        endDate: dateRange.end 
    });

    const stats = useMemo(() => {
        if (!reportData) return { totalTaxable: 0, totalGst: 0, totalAmount: 0, count: 0 };
        return reportData.reduce((acc, curr) => ({
            totalTaxable: acc.totalTaxable + (curr.taxableAmount || 0),
            totalGst: acc.totalGst + (curr.gstAmount || 0),
            totalAmount: acc.totalAmount + (curr.totalAmount || 0),
            count: acc.count + 1
        }), { totalTaxable: 0, totalGst: 0, totalAmount: 0, count: 0 });
    }, [reportData]);

    const handleExportCsv = () => {
        if (!reportData) return;
        const headers = ["Invoice Number", "Date", "Type", "Taxable Amount", "GST Amount", "Total Amount", "Status"];
        const rows = reportData.map(r => [
            r.invoiceNumber,
            new Date(r.date).toLocaleDateString(),
            r.type,
            r.taxableAmount,
            r.gstAmount,
            r.totalAmount,
            r.status
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `GST_Report_${new Date(dateRange.start).toLocaleDateString()}_to_${new Date(dateRange.end).toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Filters */}
            <div style={{ 
                background: t.cardBg, 
                padding: "20px", 
                borderRadius: "16px", 
                border: `1px solid ${t.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <CalendarIcon size={18} color={t.textSub} />
                        <span style={{ fontSize: "13px", fontWeight: 700 }}>Date Range:</span>
                    </div>
                    {/* Simplified Date Picker inputs for now */}
                    <input 
                        type="date"
                        defaultValue={new Date(dateRange.start).toISOString().split('T')[0]}
                        onChange={(e) => setDateRange(prev => ({...prev, start: new Date(e.target.value).getTime()}))}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'dark' ? "#1e293b" : "#fff", color: t.textMain }}
                    />
                    <span style={{ color: t.textSub }}>to</span>
                    <input 
                        type="date"
                        defaultValue={new Date(dateRange.end).toISOString().split('T')[0]}
                        onChange={(e) => setDateRange(prev => ({...prev, end: new Date(e.target.value).getTime()}))}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, background: theme === 'dark' ? "#1e293b" : "#fff", color: t.textMain }}
                    />
                </div>

                <button
                    onClick={handleExportCsv}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        background: t.activeLink,
                        color: "#fff",
                        border: "none",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Summary Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
                {[
                    { label: "Total Taxable", value: `₹${stats.totalTaxable.toLocaleString()}`, color: "#3b82f6" },
                    { label: "GST Collected", value: `₹${stats.totalGst.toLocaleString()}`, color: "#10b981" },
                    { label: "Gross Revenue", value: `₹${stats.totalAmount.toLocaleString()}`, color: "#8b5cf6" },
                    { label: "Invoice Count", value: stats.count.toString(), color: "#f59e0b" }
                ].map((s, i) => (
                    <div key={i} style={{ 
                        background: t.cardBg, 
                        padding: "24px", 
                        borderRadius: "20px", 
                        border: `1px solid ${t.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                    }}>
                        <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: t.textSub, textTransform: "uppercase" }}>{s.label}</p>
                        <h3 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: s.color }}>{s.value}</h3>
                    </div>
                ))}
            </div>

            {/* Report Table */}
            <div style={{ 
                background: t.cardBg, 
                borderRadius: "20px", 
                border: `1px solid ${t.border}`,
                overflow: "hidden"
            }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: theme === 'dark' ? "#1e293b" : "#f8fafc" }}>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Invoice No.</th>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Date</th>
                            <th style={{ padding: "16px", textAlign: "left", fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Type</th>
                            <th style={{ padding: "16px", textAlign: "right", fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Taxable</th>
                            <th style={{ padding: "16px", textAlign: "right", fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>GST</th>
                            <th style={{ padding: "16px", textAlign: "right", fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Total</th>
                            <th style={{ padding: "16px", textAlign: "center", fontSize: "11px", fontWeight: 800, color: t.textSub, textTransform: "uppercase" }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!reportData ? (
                            <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading records...</td></tr>
                        ) : reportData.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: t.textSub }}>No GST records found for this range.</td></tr>
                        ) : reportData.map((row) => (
                            <tr key={row.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                <td style={{ padding: "16px", fontWeight: 700, fontSize: "13px" }}>{row.invoiceNumber}</td>
                                <td style={{ padding: "16px", fontSize: "13px", color: t.textSub }}>{new Date(row.date).toLocaleDateString()}</td>
                                <td style={{ padding: "16px" }}>
                                    <span style={{ 
                                        padding: "4px 8px", 
                                        borderRadius: "6px", 
                                        fontSize: "10px", 
                                        fontWeight: 800, 
                                        background: `${t.activeLink}15`,
                                        color: t.activeLink,
                                        textTransform: "uppercase"
                                    }}>{row.type}</span>
                                </td>
                                <td style={{ padding: "16px", textAlign: "right", fontWeight: 600 }}>₹{row.taxableAmount.toLocaleString()}</td>
                                <td style={{ padding: "16px", textAlign: "right", fontWeight: 600, color: "#10b981" }}>₹{row.gstAmount.toLocaleString()}</td>
                                <td style={{ padding: "16px", textAlign: "right", fontWeight: 800 }}>₹{row.totalAmount.toLocaleString()}</td>
                                <td style={{ padding: "16px", textAlign: "center" }}>
                                    <span style={{ 
                                        padding: "4px 8px", 
                                        borderRadius: "6px", 
                                        fontSize: "10px", 
                                        fontWeight: 800, 
                                        background: row.status === 'Confirmed' || row.status === 'confirmed' ? "#10b98115" : "#f59e0b15",
                                        color: row.status === 'Confirmed' || row.status === 'confirmed' ? "#10b981" : "#f59e0b"
                                    }}>{row.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GstInvoices = ({ t, theme }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const reportData = useQuery(api.gst.getGstReport, { 
        startDate: 0, 
        endDate: Date.now() 
    });

    const filteredInvoices = useMemo(() => {
        if (!reportData) return [];
        return reportData.filter(r => 
            r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 50); // Limit to last 50 for performance
    }, [reportData, searchQuery]);

    const downloadPdf = async (invoice) => {
        try {
            const { jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");
            
            const doc = new jsPDF();
            const accentColor = [59, 130, 246]; // Blue
            
            // Header
            doc.setFontSize(24);
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text("TAX INVOICE", 105, 20, { align: "center" });
            
            // Business Details
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text(settings?.businessName || "BookMyTicket Services", 20, 35);
            doc.text(settings?.businessAddress || "N/A", 20, 40, { maxWidth: 80 });
            doc.text(`GSTIN: ${settings?.gstin || "N/A"}`, 20, 50);

            // Invoice Details
            doc.setTextColor(0, 0, 0);
            doc.text(`Invoice No: ${invoice.invoiceNumber}`, 140, 35);
            doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 140, 40);
            doc.text(`Category: ${invoice.type}`, 140, 45);

            // Line Items Table
            autoTable(doc, {
                startY: 60,
                head: [["Description", "Amount (INR)", "Tax Rate", "Tax Amount", "Total"]],
                body: [
                    [
                        `${invoice.type} Booking Subscription`,
                        `₹${invoice.taxableAmount.toLocaleString()}`,
                        `${((invoice.gstAmount / invoice.taxableAmount) * 100).toFixed(1)}%`,
                        `₹${invoice.gstAmount.toLocaleString()}`,
                        `₹${invoice.totalAmount.toLocaleString()}`
                    ]
                ],
                theme: "striped",
                headStyles: { fillBlue: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
                foot: [
                    [
                        { content: "Total Amount Payable", colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                        { content: `₹${invoice.totalAmount.toLocaleString()}`, styles: { fontStyle: 'bold' } }
                    ]
                ]
            });

            // Footer
            const finalY = doc.lastAutoTable.finalY || 100;
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text("This is a computer generated invoice and does not require a physical signature.", 105, finalY + 20, { align: "center" });
            doc.text("Thank you for using BookMyTicket!", 105, finalY + 25, { align: "center" });
            
            doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert("Error generating PDF. Please check console.");
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ 
                background: t.cardBg, 
                padding: "20px", 
                borderRadius: "16px", 
                border: `1px solid ${t.border}`,
                display: "flex",
                alignItems: "center",
                gap: "16px"
            }}>
                <Search size={20} color={t.textSub} />
                <input 
                    type="text"
                    placeholder="Search by Invoice Number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, border: "none", background: "transparent", color: t.textMain, outline: "none", fontSize: "14px" }}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {filteredInvoices.map(invoice => (
                    <div key={invoice.id} style={{ 
                        background: t.cardBg, 
                        padding: "24px", 
                        borderRadius: "20px", 
                        border: `1px solid ${t.border}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        ":hover": { borderColor: t.activeLink }
                    }}>
                        <div>
                            <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 800 }}>{invoice.invoiceNumber}</p>
                            <p style={{ margin: 0, fontSize: "12px", color: t.textSub }}>{new Date(invoice.date).toLocaleDateString()} • {invoice.type}</p>
                            <p style={{ margin: "8px 0 0 0", fontSize: "16px", fontWeight: 700 }}>₹{invoice.totalAmount.toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => downloadPdf(invoice)}
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: `${t.activeLink}10`,
                                color: t.activeLink,
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <Download size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GstPortal;
