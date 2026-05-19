async function check() {
  console.log("Testing GET /api/admin/partners via local HTTP request...");
  try {
    const res = await fetch('http://localhost:3000/api/admin/partners');
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response body:", data);
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
check();
