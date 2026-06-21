const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== SECURITY MIDDLEWARE ====================

// 1. Set secure HTTP response headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://ecopulse-495956506438.us-central1.run.app", "http://localhost:3000", "http://localhost:5173"],
      imgSrc: ["'self'", "data:", "blob:"],
      upgradeInsecureRequests: [],
    },
  },
}));

// 2. Strict CORS policy
const allowedOrigins = [
  'http://localhost:5173', // Vite dev client
  'http://localhost:3000', // Node server local port
  'https://ecopulse-495956506438.us-central1.run.app' // Live Cloud Run domain
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.run.app')) {
      callback(null, true);
    } else {
      console.warn(`CORS block for origin: ${origin}`);
      callback(new Error('Access blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-EcoPulse-Reset-Key'],
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Mitigate payload flooding attacks

// 3. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict limit of 10 AI queries per 15 mins to mitigate cost spamming
  message: { error: 'Gemini AI chat limit reached. Please wait 15 minutes before asking more questions.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/chat', chatLimiter);

// ==================== INPUT VALIDATION ROUTINES ====================

function validateProfileAnswers(answers) {
  const errors = [];

  const checkNumeric = (val, name, min = 0) => {
    if (val === undefined || isNaN(Number(val)) || Number(val) < min) {
      errors.push(`${name} must be a valid number and at least ${min}`);
    }
  };

  checkNumeric(answers.carMileage, 'carMileage');
  checkNumeric(answers.flightsShort, 'flightsShort');
  checkNumeric(answers.flightsMedium, 'flightsMedium');
  checkNumeric(answers.flightsLong, 'flightsLong');
  checkNumeric(answers.transitMileage, 'transitMileage');
  checkNumeric(answers.electricityBill, 'electricityBill');
  checkNumeric(answers.gasBill, 'gasBill');
  checkNumeric(answers.clothingPurchases, 'clothingPurchases');
  checkNumeric(answers.electronicsPurchases, 'electronicsPurchases');
  checkNumeric(answers.wasteOutput, 'wasteOutput');

  if (answers.householdSize === undefined || !Number.isInteger(Number(answers.householdSize)) || Number(answers.householdSize) < 1) {
    errors.push('householdSize must be an integer and at least 1');
  }

  const validCarTypes = ['gasolineCar', 'dieselCar', 'hybridCar', 'electricCar', 'motorcycle'];
  if (!validCarTypes.includes(answers.carType)) {
    errors.push('carType must be one of: ' + validCarTypes.join(', '));
  }

  const validDietTypes = ['meatLover', 'average', 'vegetarian', 'vegan'];
  if (!validDietTypes.includes(answers.dietType)) {
    errors.push('dietType must be one of: ' + validDietTypes.join(', '));
  }

  const recycleRate = Number(answers.recycleRate);
  if (isNaN(recycleRate) || recycleRate < 0 || recycleRate > 100) {
    errors.push('recycleRate must be a percentage between 0 and 100');
  }

  return errors;
}

function validateActivity(activity) {
  const errors = [];

  if (!activity.date || !/^\d{4}-\d{2}-\d{2}$/.test(activity.date)) {
    errors.push('date must be in YYYY-MM-DD format');
  } else {
    // Prevent future dates
    const inputDate = new Date(activity.date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (inputDate > tomorrow) {
      errors.push('date cannot be in the future');
    }
  }

  const categories = ['transport', 'energy', 'food', 'consumption'];
  if (!categories.includes(activity.category)) {
    errors.push('category must be transport, energy, food, or consumption');
  }

  const validSubtypes = {
    transport: ['gasolineCar', 'dieselCar', 'hybridCar', 'electricCar', 'publicTransit', 'flightShort', 'flightMedium', 'flightLong'],
    energy: ['electricity', 'naturalGas', 'lpg', 'heatingOil'],
    food: ['beefOrLamb', 'poultryOrPork', 'fishOrSeafood', 'vegetarian', 'vegan'],
    consumption: ['clothing', 'electronics', 'generalGoods', 'wasteLandfill', 'wasteRecycledOffset']
  };

  const allowedTypes = validSubtypes[activity.category];
  if (allowedTypes && !allowedTypes.includes(activity.type)) {
    errors.push(`type must be one of: ${allowedTypes.join(', ')}`);
  }

  if (activity.value === undefined || isNaN(Number(activity.value)) || Number(activity.value) <= 0) {
    errors.push('value must be a positive number');
  }

  return errors;
}

// ==================== API ENDPOINTS ====================

// 1. Profile / Baseline Endpoints
app.get('/api/profile', (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile configuration.' });
  }
});

app.post('/api/profile', (req, res) => {
  try {
    const answers = req.body;
    if (!answers) {
      return res.status(400).json({ error: 'Answers are required.' });
    }

    const validationErrors = validateProfileAnswers(answers);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to save baseline carbon profile.' });
  }
});

// Reset Profile & Data endpoint (Protected via custom headers to prevent CSRF / unauthorized wipe)
app.post('/api/reset', (req, res) => {
  try {
    const resetKey = req.headers['x-ecopulse-reset-key'];
    if (resetKey !== 'reset-approved') {
      return res.status(403).json({ error: 'Forbidden: Missing or invalid reset verification key.' });
    }
    db.resetAll();
    res.json({ success: true, message: 'All carbon logs reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Reset operation failed.' });
  }
});

// 2. Activities Endpoints
app.get('/api/activities', (req, res) => {
  try {
    const activities = db.getActivities();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs.' });
  }
});

app.post('/api/activities', (req, res) => {
  try {
    const { date, category, type, value, description } = req.body;
    const validationErrors = validateActivity({ date, category, type, value });
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }

    // Sanitize user description input to prevent basic HTML/script tag injections
    const cleanDescription = (description || '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim()
      .substring(0, 100);

    const newActivity = db.addActivity({ 
      date, 
      category, 
      type, 
      value: Number(value), 
      description: cleanDescription 
    });
    res.status(201).json(newActivity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log carbon activity.' });
  }
});

app.delete('/api/activities/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteActivity(id);
    if (deleted) {
      res.json({ success: true, message: 'Activity deleted.' });
    } else {
      res.status(404).json({ error: 'Activity not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete activity log.' });
  }
});

// 3. Commitments Endpoints
app.get('/api/commitments', (req, res) => {
  try {
    const commitments = db.getCommitments();
    res.json(commitments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals.' });
  }
});

app.post('/api/commitments/:action_id/status', (req, res) => {
  try {
    const { action_id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'active', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid status is required.' });
    }

    const updated = db.updateCommitmentStatus(action_id, status);
    if (updated) {
      res.json({ success: true, action_id, status });
    } else {
      res.status(404).json({ error: 'Commitment not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goals.' });
  }
});

// 4. AI Gemini Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Limit query size to prevent buffer overflow/attacks
    if (message.length > 500) {
      return res.status(400).json({ error: 'Query size exceeds limit of 500 characters.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ 
        reply: "I'd love to help, but the backend Gemini API Key is not configured yet! Please set the `GEMINI_API_KEY` environment variable in your server configuration." 
      });
    }

    const profile = db.getLatestProfile();
    const activities = db.getActivities().slice(0, 50);
    const commitments = db.getCommitments();
    const activeCommitments = commitments.filter(c => c.status === 'active');

    // Initialize Gen AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construct prompt with context
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

    const chatHistory = (history || []).slice(-10).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 800,
      },
    });

    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error('Error with Gemini API:', error.message);
    res.status(500).json({ error: 'AI processing failed. Please try again later.' });
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

// Global generic error boundary middleware (hides stack traces)
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`EcoPulse Server is running on port ${PORT}`);
});
