"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { 
    Briefcase, Plus, Search, Filter, Edit, Trash2, 
    Users, Calendar, MapPin, ExternalLink, Download,
    CheckCircle, XCircle, Clock, AlertCircle, ChevronRight,
    ArrowLeft, FileText, Mail, Phone, Globe
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { ChevronDown } from "lucide-react";

const CustomDropdown = ({ value, options, onChange, placeholder, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    padding: "12px 16px", 
                    borderRadius: "12px", 
                    border: `1px solid ${t.border}`, 
                    background: t.bg, 
                    color: value ? t.textMain : t.textSub, 
                    fontSize: "14px", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    fontWeight: value ? 600 : 500,
                    transition: "all 0.2s ease"
                }}
            >
                {value || placeholder || "Select option"}
                <ChevronDown size={16} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", opacity: 0.5 }} />
            </div>

            {isOpen && (
                <div style={{ 
                    position: "absolute", 
                    top: "calc(100% + 8px)", 
                    left: 0, 
                    width: "100%", 
                    background: t.cardBg, 
                    border: `1px solid ${t.border}`, 
                    borderRadius: "12px", 
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)", 
                    zIndex: 100, 
                    overflow: "hidden",
                    padding: "4px"
                }}>
                    {options.map((opt, i) => (
                        <div 
                            key={i}
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            style={{ 
                                padding: "10px 12px", 
                                fontSize: "14px", 
                                color: t.textMain, 
                                cursor: "pointer", 
                                borderRadius: "8px",
                                background: value === opt ? `${t.border}40` : "transparent",
                                fontWeight: value === opt ? 700 : 500,
                                transition: "all 0.1s ease"
                            }}
                            onMouseOver={e => e.currentTarget.style.background = `${t.border}20`}
                            onMouseOut={e => e.currentTarget.style.background = value === opt ? `${t.border}40` : "transparent"}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CareersAdmin = ({ t, theme }) => {
    const [view, setView] = useState("jobs"); // 'jobs' | 'applicants' | 'job_form'
    const [selectedJob, setSelectedJob] = useState(null);
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    // Data Fetching
    const { data: jobs = [], loading: jobsLoading, refetch: refetchJobs } = useSupabaseQuery('jobs', (q) => q.order('created_at', { ascending: false }));
    const { data: applicants = [], loading: applicantsLoading, refetch: refetchApplicants } = useSupabaseQuery('job_applications', (q) => q.order('created_at', { ascending: false }));

    // Mutations
    const [upsertJob] = useSupabaseMutation('jobs', 'upsert');
    const [deleteJob] = useSupabaseMutation('jobs', 'delete', (q, p) => q.eq('id', p.id));
    const [updateApplicantStatus] = useSupabaseMutation('job_applications', 'update', (q, p) => q.eq('id', p.id));

    const [jobForm, setJobForm] = useState({
        title: "",
        department: "",
        type: "Full-time",
        location: "Remote",
        description: "",
        skills: [],
        openings: 1,
        salary_range: "",
        deadline: "",
        status: "open"
    });

    const handleEditJob = (job) => {
        setJobForm(job);
        setSelectedJob(job);
        setView("job_form");
    };

    const handleSaveJob = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...jobForm };
            if (!selectedJob) delete payload.id;
            
            await upsertJob(payload);
            showToast(selectedJob ? "Job updated" : "Job created", "success");
            setView("jobs");
            refetchJobs();
        } catch (err) {
            showToast("Error saving job: " + err.message, "error");
        }
    };

    const handleDeleteJob = async (id) => {
        const ok = await confirm({
            title: "Delete Job Opening?",
            message: "This will also remove all associated application records. This action cannot be undone.",
            confirmText: "Delete",
            type: "danger"
        });
        if (ok) {
            try {
                await deleteJob({ id });
                showToast("Job deleted", "success");
                refetchJobs();
            } catch (err) {
                showToast("Error deleting job", "error");
            }
        }
    };

    if (view === "job_form") {
        return (
            <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                    <button onClick={() => setView("jobs")} style={{ padding: "8px", borderRadius: "10px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMain, cursor: "pointer" }}>
                        <ArrowLeft size={18} />
                    </button>
                    <h2 style={{ fontSize: "24px", fontWeight: 900, color: t.textMain }}>{selectedJob ? "Edit Job" : "Post New Job"}</h2>
                </div>

                <form onSubmit={handleSaveJob} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", border: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Job Title</label>
                        <input 
                            required
                            value={jobForm.title}
                            onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                            placeholder="e.g. Senior Frontend Engineer"
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Department</label>
                        <CustomDropdown 
                            value={jobForm.department}
                            options={["Engineering", "Design", "Product", "Marketing", "Operations", "HR", "Legal"]}
                            onChange={val => setJobForm({ ...jobForm, department: val })}
                            placeholder="Select Department"
                            t={t}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Job Type</label>
                        <CustomDropdown 
                            value={jobForm.type}
                            options={["Full-time", "Part-time", "Contract", "Internship", "Remote"]}
                            onChange={val => setJobForm({ ...jobForm, type: val })}
                            t={t}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Location</label>
                        <input 
                            value={jobForm.location}
                            onChange={e => setJobForm({ ...jobForm, location: e.target.value })}
                            placeholder="e.g. Remote or Coimbatore"
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 2" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Job Description (Markdown supported)</label>
                        <textarea 
                            required
                            rows={6}
                            value={jobForm.description}
                            onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                            placeholder="Describe the role, responsibilities, and requirements..."
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px", resize: "vertical" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Salary Range</label>
                        <input 
                            value={jobForm.salary_range}
                            onChange={e => setJobForm({ ...jobForm, salary_range: e.target.value })}
                            placeholder="e.g. ₹12L - ₹18L"
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Application Deadline</label>
                        <input 
                            type="date"
                            value={jobForm.deadline}
                            onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })}
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Status</label>
                        <CustomDropdown 
                            value={jobForm.status}
                            options={["open", "closed", "draft"]}
                            onChange={val => setJobForm({ ...jobForm, status: val })}
                            t={t}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: t.textSub }}>Number of Openings</label>
                        <input 
                            type="number"
                            value={jobForm.openings}
                            onChange={e => setJobForm({ ...jobForm, openings: e.target.value })}
                            style={{ padding: "12px 16px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "14px" }}
                        />
                    </div>

                    <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                        <button type="button" onClick={() => setView("jobs")} style={{ padding: "12px 24px", borderRadius: "12px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMain, fontWeight: 700, cursor: "pointer" }}>
                            Cancel
                        </button>
                        <button type="submit" style={{ padding: "12px 32px", borderRadius: "12px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", border: "none", color: "#white", fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 20px rgba(248, 68, 100, 0.2)" }}>
                            {selectedJob ? "Update Job Posting" : "Publish Job Opening"}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (view === "applicants") {
        const filteredApplicants = selectedJob 
            ? applicants.filter(a => a.job_id === selectedJob.id)
            : applicants;

        return (
            <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button onClick={() => setView("jobs")} style={{ padding: "8px", borderRadius: "10px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMain, cursor: "pointer" }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 style={{ fontSize: "24px", fontWeight: 900, color: t.textMain }}>
                                {selectedJob ? `Applicants for ${selectedJob.title}` : "All Applicants"}
                            </h2>
                            <p style={{ fontSize: "13px", color: t.textSub, margin: "4px 0 0" }}>Review and manage candidates</p>
                        </div>
                    </div>
                </div>

                {filteredApplicants.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px", backgroundColor: t.cardBg, borderRadius: "24px", border: `2px dashed ${t.border}` }}>
                        <Users size={48} style={{ color: t.textSub, opacity: 0.3, marginBottom: "20px" }} />
                        <h3 style={{ fontSize: "18px", fontWeight: 800, color: t.textMain }}>No applicants yet</h3>
                        <p style={{ color: t.textSub }}>Share the job link to start receiving applications.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                        {filteredApplicants.map(app => (
                            <div key={app.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", alignItems: "center", gap: "20px", padding: "24px", backgroundColor: t.cardBg, borderRadius: "20px", border: `1px solid ${t.border}` }}>
                                <div style={{ display: "flex", gap: "16px" }}>
                                    <div>
                                        <h4 style={{ fontSize: "16px", fontWeight: 800, color: t.textMain, margin: 0 }}>{app.name}</h4>
                                        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                            <span style={{ fontSize: "12px", color: t.textSub, display: "flex", alignItems: "center", gap: "4px" }}>
                                                <Mail size={12} /> {app.email}
                                            </span>
                                            <span style={{ fontSize: "12px", color: t.textSub, display: "flex", alignItems: "center", gap: "4px" }}>
                                                <Phone size={12} /> {app.phone}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: t.textSub, display: "block", marginBottom: "4px" }}>Applied Date</span>
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: t.textMain }}>{new Date(app.created_at).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: t.textSub, display: "block", marginBottom: "4px" }}>Status</span>
                                    <select 
                                        value={app.status}
                                        onChange={async (e) => {
                                            await updateApplicantStatus({ id: app.id, status: e.target.value });
                                            showToast("Status updated", "success");
                                            refetchApplicants();
                                        }}
                                        style={{ 
                                            padding: "6px 12px", 
                                            borderRadius: "8px", 
                                            fontSize: "12px", 
                                            fontWeight: 800, 
                                            background: app.status === 'shortlisted' ? "#22c55e15" : (app.status === 'rejected' ? "#ef444415" : "#3b82f615"),
                                            color: app.status === 'shortlisted' ? "#22c55e" : (app.status === 'rejected' ? "#ef4444" : "#3b82f6"),
                                            border: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <option value="new">New</option>
                                        <option value="shortlisted">Shortlisted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <a 
                                        href={app.resume_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ padding: "10px 16px", borderRadius: "10px", background: "#f1f5f9", color: "#64748b", fontSize: "12px", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <Download size={14} /> Resume
                                    </a>
                                    {app.portfolio_url && (
                                        <a 
                                            href={app.portfolio_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ padding: "10px 16px", borderRadius: "10px", background: "#f1f5f9", color: "#64748b", fontSize: "12px", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
                                        >
                                            <Globe size={14} /> Portfolio
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
                <div>
                    <h2 style={{ fontSize: "28px", fontWeight: 900, color: t.textMain, tracking: "-0.02em" }}>Careers Management</h2>
                    <p style={{ fontSize: "14px", color: t.textSub, margin: "4px 0 0" }}>Manage your team's expansion and job opportunities</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button 
                        onClick={() => {
                            setSelectedJob(null);
                            setJobForm({
                                title: "",
                                department: "",
                                type: "Full-time",
                                location: "Remote",
                                description: "",
                                skills: [],
                                openings: 1,
                                salary_range: "",
                                deadline: "",
                                status: "open"
                            });
                            setView("job_form");
                        }}
                        style={{ padding: "12px 24px", borderRadius: "14px", background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", border: "none", color: "white", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 10px 20px rgba(248, 68, 100, 0.2)" }}
                    >
                        <Plus size={18} /> Add New Job
                    </button>
                    <button 
                        onClick={() => {
                            setSelectedJob(null);
                            setView("applicants");
                        }}
                        style={{ padding: "12px 24px", borderRadius: "14px", background: t.cardBg, border: `1px solid ${t.border}`, color: t.textMain, fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <Users size={18} /> View All Applicants
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "40px" }}>
                {[
                    { label: "Active Jobs", value: jobs.filter(j => j.status === 'open').length, icon: Briefcase, color: "#3b82f6" },
                    { label: "Total Applicants", value: applicants.length, icon: Users, color: "#9333ea" },
                    { label: "New Candidates", value: applicants.filter(a => a.status === 'new').length, icon: Clock, color: "#f59e0b" },
                    { label: "Shortlisted", value: applicants.filter(a => a.status === 'shortlisted').length, icon: CheckCircle, color: "#22c55e" }
                ].map((stat, i) => (
                    <div key={i} style={{ padding: "24px", backgroundColor: t.cardBg, borderRadius: "24px", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: "20px" }}>
                        <div>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: t.textSub, margin: 0 }}>{stat.label}</p>
                            <p style={{ fontSize: "24px", fontWeight: 900, color: t.textMain, margin: 0 }}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Jobs List */}
            <div style={{ backgroundColor: t.cardBg, borderRadius: "24px", border: `1px solid ${t.border}`, overflow: "hidden" }}>
                <div style={{ padding: "24px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: t.textMain }}>Recent Job Postings</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <div style={{ position: "relative" }}>
                            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub }} />
                            <input 
                                placeholder="Search jobs..."
                                style={{ padding: "8px 12px 8px 36px", borderRadius: "10px", border: `1px solid ${t.border}`, background: t.bg, color: t.textMain, fontSize: "13px", width: "240px" }}
                            />
                        </div>
                    </div>
                </div>

                {jobsLoading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>Loading jobs...</div>
                ) : jobs.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center" }}>
                        <Briefcase size={40} style={{ color: t.textSub, opacity: 0.2, marginBottom: "16px" }} />
                        <p style={{ color: t.textSub, fontWeight: 600 }}>No job postings yet. Create your first opening to get started!</p>
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: `1px solid ${t.border}` }}>
                                <th style={{ padding: "16px 24px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Role</th>
                                <th style={{ padding: "16px 24px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Details</th>
                                <th style={{ padding: "16px 24px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Applicants</th>
                                <th style={{ padding: "16px 24px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>Status</th>
                                <th style={{ padding: "16px 24px", color: t.textSub, fontSize: "12px", fontWeight: 800, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => (
                                <tr key={job.id} style={{ borderBottom: `1px solid ${t.border}`, transition: "background 0.2s" }}>
                                    <td style={{ padding: "20px 24px" }}>
                                        <div>
                                            <p style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, margin: 0 }}>{job.title}</p>
                                            <p style={{ fontSize: "12px", color: t.textSub, margin: "4px 0 0" }}>{job.department} • {job.id.slice(0, 8)}</p>
                                        </div>
                                    </td>
                                    <td style={{ padding: "20px 24px" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span style={{ fontSize: "12px", color: t.textMain, display: "flex", alignItems: "center", gap: "6px" }}>
                                                <MapPin size={12} style={{ color: "#f84464" }} /> {job.location}
                                            </span>
                                            <span style={{ fontSize: "12px", color: t.textMain, display: "flex", alignItems: "center", gap: "6px" }}>
                                                <Calendar size={12} style={{ color: "#3b82f6" }} /> Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : "No Limit"}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "20px 24px" }}>
                                        <button 
                                            onClick={() => { setSelectedJob(job); setView("applicants"); }}
                                            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6" }}>
                                                    {applicants.filter(a => a.job_id === job.id).length} Applicants
                                                </span>
                                            </div>
                                        </button>
                                    </td>
                                    <td style={{ padding: "20px 24px" }}>
                                        <span style={{ 
                                            padding: "4px 10px", 
                                            borderRadius: "100px", 
                                            fontSize: "11px", 
                                            fontWeight: 800, 
                                            backgroundColor: job.status === 'open' ? "#22c55e15" : (job.status === 'closed' ? "#ef444415" : "#64748b15"),
                                            color: job.status === 'open' ? "#22c55e" : (job.status === 'closed' ? "#ef4444" : "#64748b")
                                        }}>
                                            {job.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: "20px 24px", textAlign: "right" }}>
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                            <button 
                                                onClick={() => handleEditJob(job)}
                                                style={{ padding: "8px", borderRadius: "10px", background: "#f8fafc", border: `1px solid ${t.border}`, color: "#64748b", cursor: "pointer" }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteJob(job.id)}
                                                style={{ padding: "8px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", cursor: "pointer" }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CareersAdmin;
