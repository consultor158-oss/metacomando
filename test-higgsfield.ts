
async function testHiggsfield() {
  const keyId = process.env.HIGGSFIELD_API_KEY_ID;
  const secret = process.env.HIGGSFIELD_API_SECRET;

  if (!keyId || !secret) {
    console.error("Missing credentials");
    return;
  }

  const modelId = "higgsfield-ai/soul/standard";
  const url = `https://api.higgsfield.ai/v1/model/${modelId}`;
  
  console.log(`Testing with model: ${modelId}`);
  console.log(`URL: ${url}`);

  const payload = {
    prompt: "A realistic rat wearing a full Spider-Man suit, in a heroic pose on a New York skyscraper ledge, cinematic lighting, 8k resolution",
    aspect_ratio: "9:16",
    resolution: "720p",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Key ${keyId}:${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Raw Response:", text);
    if (text) {
      const result = JSON.parse(text);
      console.log("Result:", JSON.stringify(result, null, 2));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

testHiggsfield();
