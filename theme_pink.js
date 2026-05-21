const fs = require('fs');
let code = fs.readFileSync('app/pwa-scan/page.js', 'utf8');

// Replace backgrounds back to dark app theme
code = code.replace(/bg-\[\#000000\]/g, "bg-[#0A0A0E]");
code = code.replace(/bg-\[\#111111\]/g, "bg-[#13131A]");
code = code.replace(/border-\[\#333333\]/g, "border-[#1F1F2E]");

// Text colors back
code = code.replace(/text-\[\#888888\]/g, "text-zinc-400");
code = code.replace(/text-\[\#CCCCCC\]/g, "text-pink-400");

// Gradients and accents
code = code.replace(/bg-\[\#222222\]/g, "bg-gradient-to-r from-pink-500 to-purple-600");
code = code.replace(/bg-\[\#333333\]/g, "bg-gradient-to-r from-pink-600 to-purple-600");

// Borders and Shadows
code = code.replace(/border-\[\#555555\]/g, "border-pink-500/50");
code = code.replace(/border-\[\#444444\]/g, "border-pink-500/30");
code = code.replace(/border-\[\#333333\]/g, "border-pink-500/20");

code = code.replace(/shadow-\[\#000000\]\/50/g, "shadow-purple-500/20");
code = code.replace(/shadow-\[\#000000\]\/30/g, "shadow-pink-500/10");

code = code.replace(/bg-\[\#555555\]/g, "bg-pink-500/50");
code = code.replace(/selection:bg-\[\#555555\]/g, "selection:bg-pink-500/30");

// Also let's fix the Live Activity user details!
// We will replace "Ticket Validated" or "Entry Approved" with User Name if it exists
// But we need to make sure we parse it. Since ticket_scan_logs might not have user name directly, we should fetch it or pass it.
// Actually, `recentScans` can just show ticket_code as the user, or if we join.
// The easiest is to use `scan.ticket_code` instead of "Entry Approved".

fs.writeFileSync('app/pwa-scan/page.js', code);
