const fs = require('fs');
let code = fs.readFileSync('app/pwa-scan/page.js', 'utf8');

// Colors to replace:
// Backgrounds: #FAF8F5 -> #0A0A0E
// Card Backgrounds: #FFFFFF -> #13131A
// Card Borders: #EFECE6 -> #1F1F2E
// Primary Accent: #8C7B6B -> #D946EF (Fuchsia/Pink-500)
// Secondary Accent: #F2EDE4 -> #2A1A32 (Dark purple tint)
// Text Dark: #2C2520 -> #FFFFFF
// Text Muted: #7A7067 -> #A1A1AA (Zinc-400)

code = code.replace(/bg-\[\#FAF8F5\]/g, "bg-[#0A0A0E]");
code = code.replace(/bg-\[\#FFFFFF\]/g, "bg-[#13131A]");
code = code.replace(/border-\[\#EFECE6\]/g, "border-[#1F1F2E]");
code = code.replace(/text-\[\#2C2520\]/g, "text-white");
code = code.replace(/text-\[\#7A7067\]/g, "text-zinc-400");
code = code.replace(/bg-\[\#F2EDE4\]/g, "bg-white/5");
code = code.replace(/bg-\[\#8C7B6B\]/g, "bg-gradient-to-r from-pink-500 to-purple-600");
code = code.replace(/text-\[\#8C7B6B\]/g, "text-pink-400");
code = code.replace(/border-\[\#8C7B6B\]\/30/g, "border-pink-500/30");
code = code.replace(/border-\[\#8C7B6B\]\/50/g, "border-pink-500/50");
code = code.replace(/border-\[\#8C7B6B\]\/20/g, "border-pink-500/20");
code = code.replace(/shadow-\[\#8C7B6B\]\/20/g, "shadow-pink-500/20");
code = code.replace(/shadow-\[\#8C7B6B\]\/10/g, "shadow-pink-500/10");
code = code.replace(/border-\[\#8C7B6B\]/g, "border-pink-500");
code = code.replace(/bg-\[\#8C7B6B\]\/10/g, "bg-pink-500/10");
code = code.replace(/bg-\[\#8C7B6B\]\/50/g, "bg-pink-500/50");

// Special handling for scanner box to make it more pink/purple app-like
code = code.replace(/border-\[\#D2C5B4\]/g, "border-pink-500/50");

// Also add 'no-scrollbar' to the main container to fix the ugly scrollbar track
code = code.replace(/<main className="flex-1 overflow-y-auto/g, '<main className="flex-1 overflow-y-auto no-scrollbar');

// Make the EXIT button pop more with pink/purple
code = code.replace(/bg-\[\#2C2520\]/g, "bg-gradient-to-r from-pink-600 to-purple-600");
code = code.replace(/text-\[\#FFFFFF\]/g, "text-white");
code = code.replace(/shadow-\[\#2C2520\]\/10/g, "shadow-purple-500/20");

fs.writeFileSync('app/pwa-scan/page.js', code);
