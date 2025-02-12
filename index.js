const express = require("express");
const { gpt, llama } = require("gpti");
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

const apiKeys = [
  "AIzaSyC5n8Fr6Xq722k0jkrRM0emqSQk_4s_C-o",
  "AIzaSyD5CCNspQlYuqIR2t1BggzEFG0jmTThino"
];

const API_KEY = apiKeys[Math.floor(Math.random() * apiKeys.length)];

if (!API_KEY) {
  console.error("API_KEY is not set.");
  process.exit(1);
}

app.get("/", async function (req, res) {
res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/gemini', async (req, res) => { // Updated endpoint
  const ask = req.query.ask;
  const imagurl = req.query.imagurl;

  if (!ask) {
    return res.status(400).json({ error: 'The ask parameter is required.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result;

    if (imagurl) {
      // If imagurl is provided, fetch the image and include it in the request
      const imageResponse = await axios.get(imagurl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Referer': 'https://facebook.com'
        }
      });

      const image = {
        inlineData: {
          data: Buffer.from(imageResponse.data).toString("base64"),
          mimeType: "image/jpeg",
        },
      };

      result = await model.generateContent([ask, image]);
    } else {
      // If imagurl is not provided, only use the text input (ask)
      result = await model.generateContent(ask);
    }

    res.json({
      description: result.response.text(),
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      error: 'An error occurred while processing the request.',
      details: error.message,
    });
  }
});

// API Endpoint for JSON file
app.get('/shoti', (req, res) => {
    const filePath = path.join(__dirname, 'shoti.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read the responses file.' });

        try {
            const responses = JSON.parse(data);
            const randomItem = responses[Math.floor(Math.random() * responses.length)];
            res.json(randomItem);
        } catch (error) {
            res.status(500).json({ error: 'Invalid JSON format in the file.' });
        }
    });
});

// GPT API Route
app.get("/gpt", async (req, res) => {
    try {
        const message = req.query.message;
        if (!message) return res.status(400).json({ error: "Message is required" });

        let messages = [{ role: "user", content: message }];
        let data = await gpt.v3({ messages, markdown: false, stream: false });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Llama API Route
app.get("/llama", async (req, res) => {
    try {
        const message = req.query.message;
        if (!message) return res.status(400).json({ error: "Message is required" });

        let messages = [{ role: "user", content: message }];
        let data = await llama({ messages, markdown: false, stream: false });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export Express App as a Vercel Function
module.exports = app;
