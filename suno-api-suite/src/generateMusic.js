const axios = require("axios");

// Replace with your actual base URL
const baseUrl = "http://localhost:3001";

async function generateMusic() {
  const url = `${baseUrl}/api/generate`;
  const payload = {
    prompt: "A relaxing instrumental piece with soft piano and strings.",
    make_instrumental: false,
    wait_audio: true,  // Change this to true
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("Generated Music Data:", response.data);

    // Check if audio_url is present and log it
    response.data.forEach(track => {
      if (track.audio_url) {
        console.log("Audio URL:", track.audio_url);
      } else {
        console.log("Audio URL not available.");
      }
    });
  } catch (error) {
    console.error("Error generating music:", error);
  }
}

generateMusic();
