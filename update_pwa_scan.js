const fs = require('fs');
let code = fs.readFileSync('app/pwa-scan/page.js', 'utf8');

// The styling replacements
code = code.replace(/bg-slate-950/g, 'bg-[#FAF8F5]');
code = code.replace(/text-white/g, 'text-[#2C2520]');
code = code.replace(/bg-slate-900/g, 'bg-[#FFFFFF]');
code = code.replace(/text-slate-500/g, 'text-[#7A7067]');
code = code.replace(/text-slate-400/g, 'text-[#7A7067]');
code = code.replace(/text-slate-300/g, 'text-[#7A7067]');
code = code.replace(/text-slate-600/g, 'text-[#7A7067]');
code = code.replace(/text-slate-700/g, 'text-[#7A7067]');
code = code.replace(/text-slate-800/g, 'text-[#7A7067]');
code = code.replace(/border-white\/5/g, 'border-[#EFECE6]');
code = code.replace(/border-white\/10/g, 'border-[#EFECE6]');
code = code.replace(/border-white\/20/g, 'border-[#D2C5B4]');
code = code.replace(/bg-white\/5/g, 'bg-[#F2EDE4]');
code = code.replace(/bg-white/g, 'bg-[#2C2520]'); // Invert buttons
code = code.replace(/text-slate-950/g, 'text-[#FFFFFF]'); // Invert buttons
code = code.replace(/shadow-white\/10/g, 'shadow-[#2C2520]/10');
code = code.replace(/from-slate-950 via-slate-950/g, 'from-[#FAF8F5] via-[#FAF8F5]');
code = code.replace(/from-slate-900 to-slate-950/g, 'bg-[#FFFFFF]');

// Buttons & Gradients
code = code.replace(/from-pink-500 to-purple-500/g, 'bg-[#8C7B6B]');
code = code.replace(/from-pink-500\/20 to-purple-500\/20/g, 'bg-[#F2EDE4]');
code = code.replace(/text-pink-500/g, 'text-[#8C7B6B]');
code = code.replace(/border-pink-500\/30/g, 'border-[#8C7B6B]/30');
code = code.replace(/border-pink-500\/50/g, 'border-[#8C7B6B]/50');
code = code.replace(/border-pink-500\/20/g, 'border-[#8C7B6B]/20');
code = code.replace(/border-pink-500/g, 'border-[#8C7B6B]');
code = code.replace(/bg-pink-500\/10/g, 'bg-[#8C7B6B]/10');
code = code.replace(/bg-pink-500\/5/g, 'bg-[#8C7B6B]/5');
code = code.replace(/bg-pink-500\/50/g, 'bg-[#8C7B6B]/50');
code = code.replace(/shadow-pink-500\/20/g, 'shadow-[#8C7B6B]/20');
code = code.replace(/shadow-pink-500\/10/g, 'shadow-[#8C7B6B]/10');

// Fix text-white on buttons/icons that are now inside dark backgrounds
code = code.replace(/text-\[\#2C2520\] fill-white/g, 'text-white fill-white');
// The zap icon background was bg-gradient-to-br from-pink-500 to-purple-500, now bg-[#8C7B6B]
// It should keep text-white. 
code = code.replace(/<Zap size={20} className="text-\[\#2C2520\] fill-white" \/>/g, '<Zap size={20} className="text-white fill-white" />');

// The big scanner button
code = code.replace(/bg-gradient-to-br bg-\[\#FFFFFF\]/g, 'bg-[#FFFFFF]');

fs.writeFileSync('app/pwa-scan/page.js', code);
