/* =========================================================
   server.js — Simple backend API for your website
   - Saves chat messages
   - Loads chat history
   - Clears chat history

   Everything is in ONE file to keep it easy to install.
   Requires MongoDB (local or Atlas).
========================================================= */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');

const app = express();
let aiClient = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

app.use(cors());
app.use(express.json());

/* ---------------- Database connection ---------------- */
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/websiteChat';
mongoose.set('bufferCommands', false);

let isMongoConnected = false;
mongoose
  .connect(MONGO_URI)
  .then(() => {
    isMongoConnected = true;
    console.log('MongoDB connected');
  })
  .catch((err) => console.warn('MongoDB connection notice:', err.message));

mongoose.connection.on('connected', () => { isMongoConnected = true; });
mongoose.connection.on('disconnected', () => { isMongoConnected = false; });
mongoose.connection.on('error', () => { isMongoConnected = false; });

const inMemoryChats = [];

/* ---------------- Chat message model ---------------- */
const chatSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true }, // any identifier: email, username, session id
    sender: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

const Chat = mongoose.model('Chat', chatSchema);

/* ---------------- Routes ---------------- */

// health check
app.get('/', (req, res) => {
  res.send('Chat API is running.');
});

// Save a chat message
// POST /api/chat   body: { userId, sender, text }
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, sender, text } = req.body;

    if (!userId || !sender || !text) {
      return res.status(400).json({ error: 'userId, sender, and text are required.' });
    }

    if (isMongoConnected) {
      try {
        const message = await Chat.create({ userId, sender, text });
        return res.status(201).json(message);
      } catch (dbErr) {
        console.warn('Mongoose save failed, using memory store:', dbErr.message);
      }
    }

    const fallbackMsg = {
      _id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      sender,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryChats.push(fallbackMsg);
    res.status(201).json(fallbackMsg);
  } catch (err) {
    console.error('Save chat error:', err);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

// Get chat history for a user
// GET /api/chat/:userId
app.get('/api/chat/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    if (isMongoConnected) {
      try {
        const history = await Chat.find({ userId }).sort({ createdAt: 1 });
        return res.status(200).json(history);
      } catch (dbErr) {
        console.warn('Mongoose find failed, using memory store:', dbErr.message);
      }
    }

    const userHistory = inMemoryChats
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.status(200).json(userHistory);
  } catch (err) {
    console.error('Get chat history error:', err);
    res.status(500).json({ error: 'Failed to load chat history.' });
  }
});

// Clear chat history for a user
// DELETE /api/chat/:userId
app.delete('/api/chat/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    if (isMongoConnected) {
      try {
        await Chat.deleteMany({ userId });
      } catch (dbErr) {
        console.warn('Mongoose delete failed:', dbErr.message);
      }
    }

    for (let i = inMemoryChats.length - 1; i >= 0; i--) {
      if (inMemoryChats[i].userId === userId) {
        inMemoryChats.splice(i, 1);
      }
    }

    res.status(200).json({ message: 'Chat history cleared.' });
  } catch (err) {
    console.error('Clear chat history error:', err);
    res.status(500).json({ error: 'Failed to clear chat history.' });
  }
});

/* ---------------- Gemini AI Chat ---------------- */

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required.'
      });
    }

    console.log('User message:', message);

    const ai = getAI();
    if (!ai) {
      return res.json({
        reply: "I am Nova, your AI study assistant. To activate live Gemini responses, please set your GEMINI_API_KEY."
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: message
    });

    console.log('Gemini response:', response.text);

    res.json({
      reply: response.text
    });

  } catch (error) {
    console.error('Gemini API error:', error);

    res.status(500).json({
      error: error.message || 'Failed to get AI response.'
    });
  }
});

/* ---------------- Start server ---------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));