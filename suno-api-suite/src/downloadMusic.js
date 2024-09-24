const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Replace with your actual base URL
const baseUrl = "http://localhost:3001";

// Define a global directory for downloads
const downloadDir = path.resolve(__dirname, '../../nextjs-flask/public');
console.log(downloadDir);

// Create the download directory if it doesn't exist
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

// Function to read prompt from a file
function getPromptFromFile(filePath) {
  try {
    const prompt = fs.readFileSync(filePath, 'utf8');
    return prompt.trim(); // Return the prompt without extra whitespace
  } catch (error) {
    console.error(`Error reading prompt file: ${error}`);
    return null; // Return null if there's an error
  }
}

async function downloadAudio(audioUrl, fileName) {
  try {
    const response = await axios({
      method: "get",
      url: audioUrl,
      responseType: "stream", // Get the data as a stream
    });

    const filePath = path.join(downloadDir, fileName); // Use the global download directory
    console.log(filePath);
    const writer = fs.createWriteStream(filePath);

    // Pipe the response stream to a file
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`Downloaded: ${filePath}`);
        resolve();
      });
      writer.on("error", (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error(`Error downloading audio from ${audioUrl}:`, error);
  }
}

async function generateMusic() {
  const url = `${baseUrl}/api/generate`;
  
  // Specify the path to your prompt file
  const promptFilePath = path.resolve(__dirname, '../../nextjs-flask/public/prompt.txt');
  const prompt = getPromptFromFile(promptFilePath);
  console.log(prompt)

  if (!prompt) {
    console.error("No prompt available. Exiting.");
    return; // Exit if there's no prompt
  }

  const payload = {
    prompt: prompt, // Use the prompt from the file
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

    // Download the audio files
    const downloadPromises = response.data.map((track, index) => {
      if (track.audio_url) {
        const fileName = `track_${index + 1}.mp3`; // Name the file track_1.mp3, track_2.mp3, etc.
        console.log("Audio URL:", track.audio_url);
        return downloadAudio(track.audio_url, fileName);
      } else {
        console.log("Audio URL not available for track:", index + 1);
      }
    });

    // Wait for all downloads to complete
    await Promise.all(downloadPromises);
    console.log("All downloads complete.");
  } catch (error) {
    console.error("Error generating music:", error);
  }
}

generateMusic();
