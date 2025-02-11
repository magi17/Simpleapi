const express = require("express");
const { gpt, llama } = require("gpti");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

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
