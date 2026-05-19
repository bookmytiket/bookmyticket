async function test() {
  console.log("Testing POST /api/admin/event-mappings with valid payload...");
  try {
    const res = await fetch('http://localhost:3000/api/admin/event-mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: '4aba9725-9b4b-4df4-85d6-9741d95abea5',
        campaign_id: 'b144c491-77df-4e89-8acb-d68fb5f8f58a',
        is_enabled: true,
        allocation_limit: 100
      })
    });
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response body:", data);
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
