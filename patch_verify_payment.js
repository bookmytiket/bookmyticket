const fs = require('fs');

const file = 'app/api/booking-session/verify-payment/route.js';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("assignBibNumber")) {
    code = code.replace("import { createClient } from '@supabase/supabase-js';", 
        "import { createClient } from '@supabase/supabase-js';\nimport { assignBibNumber } from '@/lib/bibGenerator';");

    // Replace the old bib generation logic
    const oldBibLogicStart = code.indexOf("// 3.5 Auto-Assign Bib Number");
    const oldBibLogicEnd = code.indexOf("// 4. Update Booking Status");

    if (oldBibLogicStart !== -1 && oldBibLogicEnd !== -1) {
        const replacement = `// 3.5 Auto-Assign Bib Number if Configured (for Marathons/Sports)
        let assignedBibNumber = await assignBibNumber(session.event_id, bookingId, session.package_id || "default");
        
        `;
        code = code.substring(0, oldBibLogicStart) + replacement + code.substring(oldBibLogicEnd);
        fs.writeFileSync(file, code);
        console.log("Patched verify-payment!");
    } else {
        console.log("Could not find the target code to replace.");
    }
} else {
    console.log("Already patched.");
}
