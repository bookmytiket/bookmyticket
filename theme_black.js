const fs = require('fs');
let code = fs.readFileSync('app/pwa-scan/page.js', 'utf8');

// Replace backgrounds
code = code.replace(/bg-\[\#0A0A0E\]/g, "bg-[#000000]");
code = code.replace(/bg-\[\#13131A\]/g, "bg-[#111111]");
code = code.replace(/border-\[\#1F1F2E\]/g, "border-[#333333]");

// Text colors
code = code.replace(/text-zinc-400/g, "text-[#888888]");
code = code.replace(/text-pink-400/g, "text-[#CCCCCC]");

// Gradients and accents
code = code.replace(/bg-gradient-to-r from-pink-500 to-purple-600/g, "bg-[#222222]");
code = code.replace(/bg-gradient-to-r from-pink-600 to-purple-600/g, "bg-[#333333]");

// Borders and Shadows
code = code.replace(/border-pink-500\/50/g, "border-[#555555]");
code = code.replace(/border-pink-500\/30/g, "border-[#444444]");
code = code.replace(/border-pink-500\/20/g, "border-[#333333]");
code = code.replace(/border-pink-500/g, "border-[#555555]");

code = code.replace(/shadow-pink-500\/20/g, "shadow-[#000000]/50");
code = code.replace(/shadow-pink-500\/10/g, "shadow-[#000000]/30");
code = code.replace(/shadow-purple-500\/20/g, "shadow-[#000000]/50");

code = code.replace(/bg-pink-500\/10/g, "bg-[#222222]");
code = code.replace(/bg-pink-500\/50/g, "bg-[#555555]");
code = code.replace(/selection:bg-pink-500\/30/g, "selection:bg-[#555555]");

// Also make the "live" indicator green, but that's already green.

fs.writeFileSync('app/pwa-scan/page.js', code);
