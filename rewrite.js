const fs = require('fs');
let code = fs.readFileSync('app/pwa-scan/page.js', 'utf8');

// 1. Add new state variables
code = code.replace('const [isExpired, setIsExpired] = useState(false);', 
`const [isExpired, setIsExpired] = useState(false);
    const [isActioning, setIsActioning] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);
`);

// 2. Add handleAction function right before handleValidate
code = code.replace('const handleValidate = async (id) => {', 
`const handleAction = async (actionType) => {
        if (!scanResult || !scanResult.ticket_id) return;
        setIsActioning(true);

        try {
            const res = await fetch("/api/scanner/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticketId: scanResult.ticket_id,
                    bookingId: scanResult.booking_id,
                    ticketCode: scanResult.ticket_code,
                    action: actionType,
                    idType: "Visual Match",
                    rejectionReason: actionType === 'reject' ? rejectionReason : null,
                    deviceUuid: navigator.userAgent,
                    deviceName: "Staff Scanner Portal",
                    gateName: gateName,
                    scannerUserId: user?.id
                })
            });

            const data = await res.json();
            if (res.ok && data.status === "valid") {
                showToast("Entry Approved", "success");
                setScanResult({
                    ...scanResult,
                    status: "valid",
                    message: "TICKET APPROVED • WELCOME TO THE EVENT!"
                });
                refetchScanLogs();
            } else if (res.ok && data.status === "rejected") {
                showToast("Entry Rejected", "error");
                setScanResult({
                    ...scanResult,
                    status: "rejected",
                    message: "ENTRY REJECTED • " + rejectionReason
                });
                setShowRejectModal(false);
                setRejectionReason("");
                refetchScanLogs();
            } else {
                showToast(data.message || "Action failed", "error");
            }
        } catch (err) {
            showToast("Network error", "error");
        } finally {
            setIsActioning(false);
        }
    };

    const handleValidate = async (id) => {`);

// 3. Update handleValidate
code = code.replace('const res = await fetch("/api/scanner/validate"', 'const res = await fetch("/api/scanner/lookup"');

code = code.replace(/if \(data\.status === "valid"\) \{[\s\S]*?refetchScanLogs\(\);\s*\}/, 
`if (data.status === "requires_action") {
                    setScanResult(data);
                }`);

// Fix Already Checked-In logic inside handleValidate to support the new response format from lookup
code = code.replace(/else if \(data\.status === "already_used"\) \{[\s\S]*?showToast\("Already Checked-In", "warning"\);\s*\}/,
`else if (data.status === "already_used") {
                    setScanResult(data);
                    showToast("Already Checked-In", "warning");
                }`);

// 4. Update the render block for Result Area
code = code.replace(/\{scanResult\.status === "valid" \? "bg-green-500\/10 border-green-500\/20" :/g,
`{scanResult.status === "valid" ? "bg-green-500/10 border-green-500/20" : 
                        scanResult.status === "requires_action" ? "bg-blue-500/10 border-blue-500/20" : 
                        scanResult.status === "rejected" ? "bg-red-500/10 border-red-500/20" :`);

code = code.replace(/\{scanResult\.status === "valid" \? "bg-green-500 text-\[\#2C2520\] shadow-green-500\/20" :/g,
`{scanResult.status === "valid" ? "bg-green-500 text-white shadow-green-500/20" : 
                                scanResult.status === "requires_action" ? "bg-blue-500 text-white shadow-blue-500/20" : 
                                scanResult.status === "rejected" ? "bg-red-500 text-white shadow-red-500/20" :`);

code = code.replace(/\{scanResult\.status === "valid" \? <CheckCircle size=\{36\} \/> :/g,
`{scanResult.status === "valid" ? <CheckCircle size={36} /> : 
                                 scanResult.status === "requires_action" ? <AlertCircle size={36} /> : `);

code = code.replace(/\{scanResult\.status === "valid" \? "Access Granted" :/g,
`{scanResult.status === "valid" ? "Access Granted" : 
                                     scanResult.status === "requires_action" ? "Verify ID" : 
                                     scanResult.status === "rejected" ? "Entry Rejected" : `);

code = code.replace(/\{scanResult\.status === "valid" \? "text-green-500" :/g,
`{scanResult.status === "valid" ? "text-green-500" : 
                                    scanResult.status === "requires_action" ? "text-blue-500" : `);

code = code.replace(/\{scanResult\.status === "valid" \? "Verified & Checked-In" :/g,
`{scanResult.status === "valid" ? "Verified & Checked-In" : 
                                     scanResult.status === "requires_action" ? "Action Required • Awaiting Approval" : `);

// 5. Update the booking details block
code = code.replace(/\{scanResult\.booking && \(/, `{scanResult.attendee && (`);
code = code.replace(/scanResult\.booking\.full_name \|\| scanResult\.booking\.user_name \|\| "Guest Attendee"/g, `scanResult.attendee || "Guest Attendee"`);
code = code.replace(/scanResult\.booking\.id\.slice\(-8\)/g, `(scanResult.booking_id || "00000000").slice(-8)`);
code = code.replace(/scanResult\.booking\.ticket_count \|\| 1/g, `1`);
code = code.replace(/\{scanResult\.booking\.marathon_details && \(/g, `{scanResult.marathon_details && (`);
code = code.replace(/scanResult\.booking\.marathon_details/g, `scanResult.marathon_details`);
code = code.replace(/scanResult\.booking\.scanned_at/g, `scanResult.scanned_at`);

// 6. Add the action buttons and checklist for requires_action
const actionButtonsHTML = `
                                {scanResult.status === "requires_action" && (
                                    <div className="pt-4 border-t border-[#EFECE6] space-y-4">
                                        <div className="p-4 rounded-2xl bg-white border border-[#EFECE6] space-y-2">
                                            <p className="text-[10px] font-black text-[#8C7B6B] uppercase tracking-widest flex items-center gap-2">
                                                <ShieldAlert size={14} /> ID Verification Required
                                            </p>
                                            <div className="space-y-1">
                                                {(scanResult.verificationSettings?.accepted_id_types || []).map((idType, idx) => (
                                                    <label key={idx} className="flex items-center gap-2 text-xs font-bold text-[#2C2520]">
                                                        <input type="checkbox" className="w-3 h-3 accent-[#8C7B6B]" /> 
                                                        Check {idType}
                                                    </label>
                                                ))}
                                                <label className="flex items-center gap-2 text-xs font-bold text-[#2C2520]">
                                                    <input type="checkbox" className="w-3 h-3 accent-[#8C7B6B]" /> 
                                                    Match Photo & Name
                                                </label>
                                            </div>
                                        </div>

                                        {!showRejectModal ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => handleAction('approve')}
                                                    disabled={isActioning}
                                                    className="py-4 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={16} /> Approve
                                                </button>
                                                <button 
                                                    onClick={() => setShowRejectModal(true)}
                                                    disabled={isActioning}
                                                    className="py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={16} /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3">
                                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Rejection Reason</p>
                                                <select 
                                                    value={rejectionReason}
                                                    onChange={e => setRejectionReason(e.target.value)}
                                                    className="w-full bg-white border border-red-500/20 rounded-xl px-4 py-3 text-[#2C2520] text-sm font-bold outline-none"
                                                >
                                                    <option value="">Select a reason...</option>
                                                    <option value="Invalid ID Proof">Invalid ID Proof</option>
                                                    <option value="Name Mismatch">Name Mismatch</option>
                                                    <option value="Underage">Underage</option>
                                                    <option value="Suspicious Booking">Suspicious Booking</option>
                                                    <option value="Intoxicated/Unruly">Intoxicated/Unruly</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setShowRejectModal(false)}
                                                        className="flex-1 py-3 rounded-xl bg-white border border-[#EFECE6] text-[#7A7067] font-black uppercase tracking-widest text-[10px]"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction('reject')}
                                                        disabled={!rejectionReason || isActioning}
                                                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                                                    >
                                                        Confirm Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
`;
code = code.replace(/\{scanResult\.status === "already_used" && \(/, actionButtonsHTML + '\n                                {scanResult.status === "already_used" && (');

fs.writeFileSync('app/pwa-scan/page.js', code);
