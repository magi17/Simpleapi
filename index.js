const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');
const { gpt, llama } = require("gpti");
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { off } = require('process');
const apiKeys = [
  "AIzaSyC5n8Fr6Xq722k0jkrRM0emqSQk_4s_C-o",
  "AIzaSyD5CCNspQlYuqIR2t1BggzEFG0jmTThino"
];
const API_KEY = apiKeys[Math.floor(Math.random() * apiKeys.length)];

if (!API_KEY) {
  console.error("API_KEY is not set.");
  process.exit(1);
}

const app = express();
app.use(express.json());

app.use(cors());

const quotesFilePath = path.join(__dirname, 'shoti.json');

// Create an empty quotes array if the file doesn't exist
fs.access(quotesFilePath)
  .catch(() => fs.writeFile(quotesFilePath, '[]'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

app.get("/video", async function (req, res) {
  res.sendFile(path.join(__dirname, "video.html"));
});

app.get('/gemini', async (req, res) => {
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


app.get("/", async function (req, res) {
res.sendFile(path.join(__dirname,  "./index.html"));
});

app.get('/shoti', async (req, res) => {
  try {
    // Read the quotes from the JSON file
    const data = await fs.readFile(quotesFilePath, 'utf8');
    const quotes = JSON.parse(data);

    // Select a random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    // Return the quote as a JSON response
    res.json(randomQuote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch a quote.' });
  }
});

app.post('/shoti', async (req, res) => {
  try {
    // Extract the quote and author from the request body
    const { name, description, url } = req.body;

    // Read the existing quotes from the JSON file
    const data = await fs.readFile(quotesFilePath, 'utf8');
    const quotes = JSON.parse(data);

    // Create a new quote object
    const newQuote = { name, description, url };

    // Add the new quote to the quotes array
    quotes.push(newQuote);

    // Write the updated quotes array back to the JSON file
    await fs.writeFile(quotesFilePath, JSON.stringify(quotes));

    // Return the new quote as a JSON response
    res.json(newQuote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erorr to fetch data.' });
  }
});

const port = 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Custom message for inspecting
