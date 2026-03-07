const fs = require('fs');

async function check() {
  try {
    const res = await fetch('http://localhost:3001/admin');
    const text = await res.text();
    
    if (text.includes('Something went wrong in the Admin Panel')) {
      console.log("ERROR BOUNDARY TRIGGERED");
      const errMatch = text.match(/<details.*?>(.*?)<\/details>/s);
      if (errMatch) console.log(errMatch[1].replace(/<[^>]*>?/gm, ''));
      process.exit(1);
    }
    
    if (text.includes('Client-side exception has occurred')) {
      console.log("NEXT.JS CLIENT EXCEPTION OVERLAY FOUND");
      process.exit(1);
    }
    
    console.log("SUCCESS: Page loaded without obvious error boundaries.");
    
    const titleMatch = text.match(/<title>(.*?)<\/title>/);
    if (titleMatch) console.log("Page Title:", titleMatch[1]);
    
  } catch (e) {
    console.log("Fetch failed:", e.message);
  }
}
check();
