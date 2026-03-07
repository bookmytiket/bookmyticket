const fs = require('fs');
try {
  const content = fs.readFileSync('admin_page.html', 'utf8');
  // Look for Next.js error overlay data
  const match = content.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (match && match[1]) {
    const data = JSON.parse(match[1]);
    if (data.err) {
      console.log("NEXT.JS ERROR FOUND:");
      console.log(JSON.stringify(data.err, null, 2));
    } else {
        console.log("No Next.js error found in __NEXT_DATA__.");
    }
  } else {
    console.log("No __NEXT_DATA__ found.");
  }
} catch (e) {
  console.log("Script error:", e);
}
