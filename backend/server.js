const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// ==================== API ENDPOINTS ====================

// 1. Profile / Baseline Endpoints
app.get('/api/profile', (req, res) => {
  const profile = db.getLatestProfile();
  if (!profile) {
    return res.json({ profileExists: false });
  }
  res.json({
    profileExists: true,
    profile: {
      id: profile.id,
      total: profile.baseline_total,
      breakdown: {
        transport: profile.baseline_transport,
        energy: profile.baseline_energy,
        food: profile.baseline_food,
        consumption: profile.baseline_consumption
      },
      answers: JSON.parse(profile.onboarding_answers),
      created_at: profile.created_at
    }
  });
});

app.post('/api/profile', (req, res) => {
  const answers = req.body;
  if (!answers) {
    return res.status(400).json({ error: 'Answers are required.' });
  }
  const newProfile = db.saveProfile(answers);
  res.status(201).json({
    id: newProfile.id,
    total: newProfile.baseline_total,
    breakdown: {
      transport: newProfile.baseline_transport,
      energy: newProfile.baseline_energy,
      food: newProfile.baseline_food,
      consumption: newProfile.baseline_consumption
    }
  });
});

// Reset Profile & Data endpoint
app.post('/api/reset', (req, res) => {
  db.resetAll();
  res.json({ success: true, message: 'All carbon logs reset successfully.' });
});

// 2. Activities Endpoints
app.get('/api/activities', (req, res) => {
  const activities = db.getActivities();
  res.json(activities);
});

app.post('/api/activities', (req, res) => {
  const { date, category, type, value, description } = req.body;
  
  if (!date || !category || !type || value === undefined) {
    return res.status(400).json({ error: 'Missing required activity parameters.' });
  }

  const newActivity = db.addActivity({ date, category, type, value, description });
  res.status(201).json(newActivity);
});

app.delete('/api/activities/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteActivity(id);
  if (deleted) {
    res.json({ success: true, message: 'Activity deleted.' });
  } else {
    res.status(404).json({ error: 'Activity not found.' });
  }
});

// 3. Commitments Endpoints
app.get('/api/commitments', (req, res) => {
  const commitments = db.getCommitments();
  res.json(commitments);
});

app.post('/api/commitments/:action_id/status', (req, res) => {
  const { action_id } = req.params;
  const { status } = req.body; // 'available', 'active', 'completed'

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  const updated = db.updateCommitmentStatus(action_id, status);
  if (updated) {
    res.json({ success: true, action_id, status });
  } else {
    res.status(404).json({ error: 'Commitment not found.' });
  }
});

// 4. AI Gemini Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Get key from environment variable
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ 
      reply: "I'd love to help, but the backend Gemini API Key is not configured yet! Please set the `GEMINI_API_KEY` environment variable in your server configuration." 
    });
  }

  try {
    const profile = db.getLatestProfile();
    const activities = db.getActivities().slice(0, 50);
    const commitments = db.getCommitments();
    const activeCommitments = commitments.filter(c => c.status === 'active');

    // 2. Initialize Gen AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Construct prompt with context
    const contextPrompt = `
You are EcoPulse AI, a friendly, encouraging, and highly knowledgeable sustainability and carbon footprint expert.
The user is asking a question in their Carbon Footprint Tracker application.

Here is their current footprint data context:
- **Baseline Annual Carbon Footprint**: ${profile ? `${profile.baseline_total} kg CO2e` : 'Not completed yet'}
- **Baseline Breakdown**: ${profile ? JSON.stringify({ transport: profile.baseline_transport, energy: profile.baseline_energy, food: profile.baseline_food, consumption: profile.baseline_consumption }) : 'N/A'}
- **Active commitments**: ${activeCommitments.length > 0 ? activeCommitments.map(c => `${c.title} (${c.co2_savings}kg savings)`).join(', ') : 'None yet'}
- **Recent activity entries (last 50 logs)**: ${JSON.stringify(activities)}

Guidelines:
- Analyze their profile data if they ask about their footprint.
- Suggest concrete, practical actions based on their highest emission categories.
- Keep your answers highly readable, format using clear markdown, bold key points, and list steps concisely.
- Use encouraging, positive reinforcement. Do not sound preachy or judgmental.

User Message: "${message}"
`;

    // 4. Generate content
    const chatHistory = (history || []).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: 'Failed to process AI query: ' + error.message });
  }
});

// Serving React built static files in production
const frontendBuildPath = fs.existsSync(path.join(__dirname, '../frontend/dist'))
  ? path.join(__dirname, '../frontend/dist')
  : path.join(__dirname, 'frontend/dist');

if (fs.existsSync(frontendBuildPath)) {
  console.log('Serving frontend static files from:', frontendBuildPath);
  app.use(express.static(frontendBuildPath));
  app.get('*splat', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  console.log('Frontend build path not found. Serving API only.');
}

// Start Server
app.listen(PORT, () => {
  console.log(`EcoPulse Server is running on port ${PORT}`);
});
