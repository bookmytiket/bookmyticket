async function check() {
  const url = 'https://www.thescmsilk.in/media/logo/stores/1/SCMS';
  console.log("Checking headers for:", url);
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get('content-type'));
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
check();
