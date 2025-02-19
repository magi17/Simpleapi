const express = require('express');
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');
const { gpt, llama } = require("gpti");
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { off } = require('process');
const { Mistral } = require('@mistralai/mistralai');
//const { yts } = require("@hiudyy/ytdl");
//const fetch = require("node-fetch");
const models = [
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite-preview-02-05"
];
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

app.get("/", async function (req, res) {
res.sendFile(path.join(__dirname,  "./index.html"));
});

app.get("/video", async function (req, res) {
  res.sendFile(path.join(__dirname, "video.html"));
});

// Replace with your API key
const apiKey = 'cixQtTuj5ql7j0mf25m79mk75n6jdPoU';

// Initialize the Mistral client
const client = new Mistral({ apiKey: apiKey });

// GET endpoint to handle user messages
app.get('/mistral', async (req, res) => {
  const { message } = req.query;

  if (!message) {
    return res.status(400).json({ error: 'Message is required ex: mistral?ask=What is agriculture hydroponics ' });
  }

  try {
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: message }],
    });

    const botResponse = chatResponse.choices[0].message.content;
    res.json({ response: botResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});




/*app.get('/yts2', async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: 'Missing required query parameter "q" only search' });
    }

    try {
        const searchResult = await yts(query);
        if (!searchResult.videos.length) {
            return res.status(404).json({ error: "No videos found for the given query" });
        }

        const video = searchResult.videos[0];
        res.json({
            title: video.title.text,
            id: video.id,
            duration: video.thumbnail_overlays?.[0]?.text || "Unknown",
            url: `https://www.youtube.com/watch?v=${video.id}`
        });
    } catch (error) {
        console.error("Error in /video:", error.message);
        res.status(500).json({ error: "Failed to fetch video details" });
    }
});

/*
// Step 2: Handle the video download process
app.get("/yts", async (req, res) => {
    const searchQuery = req.query.q;

    if (!searchQuery) {
        return res.status(400).json({ error: 'Missing required query parameter "q"' });
    }

    console.log("Search Query:", searchQuery);

    try {
        // Fetch video details from the local API
        const searchResponse = await fetch(`http://localhost:${PORT}/video?q=${encodeURIComponent(searchQuery)}`, {
            headers: { "Accept": "application/json" }
        });

        if (!searchResponse.ok) {
            throw new Error(`Failed to fetch video details: ${searchResponse.statusText}`);
        }

        const searchData = await searchResponse.json();
        console.log("First API Response:", searchData);

        if (!searchData.url) {
            return res.status(404).json({ error: "No video URL found" });
        }

        const videoUrl = searchData.url;
        console.log("Fetched video URL:", videoUrl);

        // Fetch download link from new API URL
        const videoResponse = await fetch(`https://yt-video-production.up.railway.app/ytdlv3?url=${encodeURIComponent(videoUrl)}`, {
            headers: { "Accept": "application/json" }
        });

        if (!videoResponse.ok) {
            throw new Error(`Failed to fetch download URL: ${videoResponse.statusText}`);
        }

        const videoData = await videoResponse.json();
        console.log("Second API Response:", videoData);

        if (!videoData.download_url) {
            return res.status(404).json({ error: "Download URL not available" });
        }

        console.log("Download URL:", videoData.download_url);

        // Send video details and download URL in response
        res.json({
            title: searchData.title,
            duration: searchData.duration,
            url: videoUrl,
            downloadUrl: videoData.download_url
        });

    } catch (error) {
        console.error("Error in /download:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});
*/


const apiKeys = [
  "AIzaSyC5n8Fr6Xq722k0jkrRM0emqSQk_4s_C-o",
  "AIzaSyD5CCNspQlYuqIR2t1BggzEFG0jmTThino"
];

const API_KEY = apiKeys[Math.floor(Math.random() * apiKeys.length)];
const MODEL_NAME = models[Math.floor(Math.random() * models.length)];
if (!API_KEY) {
  console.error("API_KEY is not set.");
  process.exit(1);
}

app.get('/test', async (req, res) => {
  const ask = req.query.ask;
  const imagurl = req.query.imagurl;

  if (!ask) {
    return res.status(400).json({ error: 'The ask parameter is required.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    let result;

    if (imagurl) {
      // Fetch the image and include it in the request
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
      model: MODEL_NAME, // Include the randomly selected model in the response
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
  

app.get('/gemini-2.0pro', async (req, res) => { // Updated endpoint
  const ask = req.query.ask;
  const imagurl = req.query.imagurl;

  if (!ask) {
    return res.status(400).json({ error: 'The ask parameter is required.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

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
   //let roles = [{ role: "user", }];
    let data = await gpt.v3({ messages, markdown: false, stream: false, status: true });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/llama2', async (req, res) => {
       const q = req.query.q;
       const id = 1;

       if (!q) {
           return res.status(400).json({ error: 'Both "q" and "id" parameters are required' });
       }

       let messages = [];
       const filePath = path.join(__dirname, 'json', 'llama', `${id}.json`);

       try {
           const data = await fs.readFile(filePath, 'utf8');
           messages = JSON.parse(data);
       } catch (error) {
           messages = [
               { role: "system", content: "You're a helpful assistant." }
           ];
       }

       messages.push({ role: "user", content: q });

       try {
           const response = await llama({
               messages,
               markdown: false,
               stream: false
           });

           res.json({ response });
       } catch (error) {
           res.status(500).json({ error: 'Internal Server Error' });
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
