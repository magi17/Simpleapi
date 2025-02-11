const express = require("express");
const { gpt, llama } = require("gpti");
const path = require("path");
const fs = require("fs");

const app = express();
//const PORT = 4000;
const PORT = process.env.PORT || 4000; 

app.use(express.json()); // Middleware to parse JSON requests

app.get("/", async function (req, res) {
res.sendFile(path.join(__dirname, "./index.html"));
});

// API Endpoint
app.get('/shoti', (req, res) => {
    // Path to the JSON file
    const filePath = path.join(__dirname, 'shoti.json');

    // Read the JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read the responses file.' });
        }

        try {
            // Parse the JSON data
            const responses = JSON.parse(data);

            // Select a random object
            const randomIndex = Math.floor(Math.random() * responses.length);
            const randomItem = responses[randomIndex];

            // Send the random object as JSON
            res.json(randomItem);
        } catch (error) {
            res.status(500).json({ error: 'Invalid JSON format in the file.' });
        }
    });
});

// ✅ GET Route for GPT (Single Message via Query)
app.get("/gpt", async (req, res) => {
    try {
        const message = req.query.message;
        if (!message) {
            return res.status(400).json({ error: "Message is required as a query parameter. Example: /gpt?message=hi" });
        }

        let messages = [{ role: "user", content: message }];

        let data = await gpt.v3({
            messages,
            markdown: false,
            stream: false
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ GET Route for Llama (Single Message via Query)
app.get("/llama", async (req, res) => {
    try {
        const message = req.query.message;
        if (!message) {
            return res.status(400).json({ error: "Message is required as a query parameter. Example: /llama?message=hi" });
        }

        let messages = [{ role: "user", content: message }];

        let data = await llama({
            messages,
            markdown: false,
            stream: false
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post("/gpt", async (req, res) => {
    try {
        const { messages, stream } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid messages format. It should be an array of chat history." });
        }

        if (stream) {
            // Streaming response
            gpt.v3({
                messages,
                stream: true,
                markdown: false,
                results: (err, data) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json(data);
                }
            });
        } else {
            // Normal response
            let data = await gpt.v3({
                messages,
                markdown: false,
                stream: false
            });
            res.json(data);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Start the server
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
});