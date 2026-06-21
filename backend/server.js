const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { calculateBaseline, calculateActivityEmissions } = require('./calculator');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize database path and directory
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const dbPath = path.join(dbDir, 'carbon.db');

// Connect to SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    initializeDatabase();
  }
});

// Database schema initialization
function initializeDatabase() {
  db.serialize(() => {
    // 1. Profiles Table
    db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        baseline_total REAL,
        baseline_transport REAL,
        baseline_energy REAL,
        baseline_food REAL,
        baseline_consumption REAL,
        onboarding_answers TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Activities Table
    db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        category TEXT,
        type TEXT,
        value REAL,
        emissions REAL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Commitments Table
    db.run(`
      CREATE TABLE IF NOT EXISTS commitments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_id TEXT UNIQUE,
        title TEXT,
        category TEXT,
        co2_savings REAL,
        status TEXT, -- 'available', 'active', 'completed'
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if we need to seed initial/mock data (for visual dashboard completeness)
    db.get('SELECT COUNT(*) as count FROM profiles', (err, row) => {
      if (row && row.count === 0) {
        seedInitialData();
      }
    });
  });
}

// Seed function to pre-populate database for rich charts and visuals
function seedInitialData() {
  console.log('Seeding mock data for carbon footprint dashboard...');
  
  // 1. Seed Profile
  const mockAnswers = {
    carMileage: 8000,
    carType: 'gasolineCar',
    flightsShort: 3,
    flightsMedium: 2,
    flightsLong: 1,
    transitMileage: 15,
    householdSize: 2,
    electricityBill: 120,
    gasBill: 60,
    dietType: 'average',
    clothingPurchases: 4,
    electronicsPurchases: 2,
    wasteOutput: 2,
    recycleRate: 40
  };

  const baseline = calculateBaseline(mockAnswers);
  db.run(`
    INSERT INTO profiles (baseline_total, baseline_transport, baseline_energy, baseline_food, baseline_consumption, onboarding_answers)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    baseline.total,
    baseline.breakdown.transport,
    baseline.breakdown.energy,
    baseline.breakdown.food,
    baseline.breakdown.consumption,
    JSON.stringify(mockAnswers)
  ]);

  // 2. Seed Activities for the past 30 days
  const categories = ['transport', 'energy', 'food', 'consumption'];
  const today = new Date();
  
  const seedActivities = [
    // Transport logs
    { date: formatDateOffset(30), category: 'transport', type: 'gasolineCar', value: 45, emissions: 18.2, description: 'Commute to office' },
    { date: formatDateOffset(28), category: 'transport', type: 'gasolineCar', value: 60, emissions: 24.2, description: 'Weekend road trip' },
    { date: formatDateOffset(25), category: 'transport', type: 'publicTransit', value: 15, emissions: 2.1, description: 'Bus ride to shopping mall' },
    { date: formatDateOffset(20), category: 'transport', type: 'flightMedium', value: 600, emissions: 90.0, description: 'Flight to Chicago (Business)' },
    { date: formatDateOffset(18), category: 'transport', type: 'gasolineCar', value: 35, emissions: 14.1, description: 'Weekly grocery run' },
    { date: formatDateOffset(15), category: 'transport', type: 'electricCar', value: 50, emissions: 5.5, description: 'Drove rental EV on trip' },
    { date: formatDateOffset(12), category: 'transport', type: 'gasolineCar', value: 40, emissions: 16.2, description: 'Commute to office' },
    { date: formatDateOffset(5), category: 'transport', type: 'publicTransit', value: 20, emissions: 2.8, description: 'Subway rides' },
    { date: formatDateOffset(2), category: 'transport', type: 'gasolineCar', value: 30, emissions: 12.1, description: 'Errands and gym' },

    // Energy logs (monthly utility readings converted to daily/weekly representations)
    { date: formatDateOffset(28), category: 'energy', type: 'electricity', value: 150, emissions: 57.0, description: 'Mid-month electricity usage reading' },
    { date: formatDateOffset(14), category: 'energy', type: 'naturalGas', value: 12, emissions: 63.6, description: 'Gas heating usage' },
    { date: formatDateOffset(1), category: 'energy', type: 'electricity', value: 130, emissions: 49.4, description: 'End-month electricity usage' },

    // Food logs (individual meals)
    { date: formatDateOffset(29), category: 'food', type: 'beefOrLamb', value: 1, emissions: 7.5, description: 'Ribeye steak dinner' },
    { date: formatDateOffset(27), category: 'food', type: 'vegetarian', value: 3, emissions: 2.4, description: 'Meat-free Monday meals' },
    { date: formatDateOffset(26), category: 'food', type: 'poultryOrPork', value: 2, emissions: 5.0, description: 'Chicken salad and pork chops' },
    { date: formatDateOffset(24), category: 'food', type: 'vegan', value: 3, emissions: 1.5, description: 'Vegan weekend menu' },
    { date: formatDateOffset(21), category: 'food', type: 'fishOrSeafood', value: 1, emissions: 1.8, description: 'Salmon lunch' },
    { date: formatDateOffset(17), category: 'food', type: 'beefOrLamb', value: 1, emissions: 7.5, description: 'Beef burger with friends' },
    { date: formatDateOffset(13), category: 'food', type: 'vegetarian', value: 3, emissions: 2.4, description: 'Vegetarian meals' },
    { date: formatDateOffset(10), category: 'food', type: 'poultryOrPork', value: 2, emissions: 5.0, description: 'Turkey wrap and pork loin' },
    { date: formatDateOffset(8), category: 'food', type: 'vegan', value: 3, emissions: 1.5, description: 'Plant-based diet day' },
    { date: formatDateOffset(4), category: 'food', type: 'fishOrSeafood', value: 1, emissions: 1.8, description: 'Seafood pasta' },
    { date: formatDateOffset(3), category: 'food', type: 'beefOrLamb', value: 1, emissions: 7.5, description: 'Lamb gyro' },
    { date: formatDateOffset(1), category: 'food', type: 'vegetarian', value: 3, emissions: 2.4, description: 'Veggie day' },

    // Consumption logs
    { date: formatDateOffset(25), category: 'consumption', type: 'clothing', value: 2, emissions: 30.0, description: 'Purchased winter jacket and jeans' },
    { date: formatDateOffset(19), category: 'consumption', type: 'generalGoods', value: 45, emissions: 90.0, description: 'Home decor items ($45)' },
    { date: formatDateOffset(11), category: 'consumption', type: 'electronics', value: 1, emissions: 80.0, description: 'Replaced broken smart monitor' },
    { date: formatDateOffset(7), category: 'consumption', type: 'wasteLandfill', value: 12, emissions: 6.0, description: 'Weekly trash bag disposal (12kg)' },
    { date: formatDateOffset(7), category: 'consumption', type: 'wasteRecycledOffset', value: 8, emissions: -1.6, description: 'Recycled paper and plastic bottles (8kg)' }
  ];

  const insertActivity = db.prepare(`
    INSERT INTO activities (date, category, type, value, emissions, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  seedActivities.forEach(act => {
    insertActivity.run([act.date, act.category, act.type, act.value, act.emissions, act.description]);
  });
  insertActivity.finalize();

  // 3. Seed Commitments
  const seedCommitments = [
    { action_id: 'meatless_monday', title: 'Adopt Meatless Mondays', category: 'food', co2_savings: 416, status: 'active' }, // 52 days * ~8kg diff
    { action_id: 'led_bulbs', title: 'Switch to LED Lighting', category: 'energy', co2_savings: 150, status: 'completed' },
    { action_id: 'public_transit', title: 'Commute via Transit 2x/Week', category: 'transport', co2_savings: 580, status: 'active' },
    { action_id: 'thermostat_adjust', title: 'Adjust Thermostat by 2°F', category: 'energy', co2_savings: 220, status: 'available' },
    { action_id: 'cold_wash', title: 'Wash Clothes in Cold Water', category: 'energy', co2_savings: 75, status: 'available' },
    { action_id: 'avoid_fast_fashion', title: 'Limit New Clothing Purchases', category: 'consumption', co2_savings: 180, status: 'available' },
    { action_id: 'composting', title: 'Compost Organic Waste', category: 'consumption', co2_savings: 110, status: 'available' },
    { action_id: 'ev_upgrade', title: 'Transition to Electric Vehicle', category: 'transport', co2_savings: 2350, status: 'available' }
  ];

  const insertCommitment = db.prepare(`
    INSERT INTO commitments (action_id, title, category, co2_savings, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  seedCommitments.forEach(com => {
    insertCommitment.run([com.action_id, com.title, com.category, com.co2_savings, com.status]);
  });
  insertCommitment.finalize();
  
  console.log('Mock data seeded successfully.');
}

function formatDateOffset(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// ==================== API ENDPOINTS ====================

// 1. Profile / Baseline Endpoints
app.get('/api/profile', (req, res) => {
  db.get('SELECT * FROM profiles ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ profileExists: false });
    }
    res.json({
      profileExists: true,
      profile: {
        id: row.id,
        total: row.baseline_total,
        breakdown: {
          transport: row.baseline_transport,
          energy: row.baseline_energy,
          food: row.baseline_food,
          consumption: row.baseline_consumption
        },
        answers: JSON.parse(row.onboarding_answers),
        created_at: row.created_at
      }
    });
  });
});

app.post('/api/profile', (req, res) => {
  const answers = req.body;
  if (!answers) {
    return res.status(400).json({ error: 'Answers are required.' });
  }

  const baseline = calculateBaseline(answers);
  
  db.run(`
    INSERT INTO profiles (baseline_total, baseline_transport, baseline_energy, baseline_food, baseline_consumption, onboarding_answers)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    baseline.total,
    baseline.breakdown.transport,
    baseline.breakdown.energy,
    baseline.breakdown.food,
    baseline.breakdown.consumption,
    JSON.stringify(answers)
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      total: baseline.total,
      breakdown: baseline.breakdown
    });
  });
});

// Reset Profile & Data endpoint
app.post('/api/reset', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM profiles');
    db.run('DELETE FROM activities');
    db.run('UPDATE commitments SET status = "available"');
    
    // Seed default commitments but no activity logs so they can start fresh
    db.get('SELECT COUNT(*) as count FROM commitments', (err, row) => {
      if (row && row.count === 0) {
        seedInitialData();
      }
    });

    res.json({ success: true, message: 'All carbon logs reset successfully.' });
  });
});

// 2. Activities Endpoints
app.get('/api/activities', (req, res) => {
  db.all('SELECT * FROM activities ORDER BY date DESC, id DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/activities', (req, res) => {
  const { date, category, type, value, description } = req.body;
  
  if (!date || !category || !type || value === undefined) {
    return res.status(400).json({ error: 'Missing required activity parameters.' });
  }

  const emissions = calculateActivityEmissions(category, type, value);
  const desc = description || `${category} - ${type}`;

  db.run(`
    INSERT INTO activities (date, category, type, value, emissions, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [date, category, type, value, emissions, desc], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      date,
      category,
      type,
      value,
      emissions,
      description: desc
    });
  });
});

app.delete('/api/activities/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM activities WHERE id = ?', id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Activity deleted.' });
  });
});

// 3. Commitments Endpoints
app.get('/api/commitments', (req, res) => {
  db.all('SELECT * FROM commitments', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/commitments/:action_id/status', (req, res) => {
  const { action_id } = req.params;
  const { status } = req.body; // 'available', 'active', 'completed'

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  db.run(`
    UPDATE commitments 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE action_id = ?
  `, [status, action_id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, action_id, status });
  });
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
    // 1. Retrieve current profile and activities to provide context to Gemini
    const profile = await new Promise((resolve) => {
      db.get('SELECT * FROM profiles ORDER BY id DESC LIMIT 1', (err, row) => {
        resolve(row ? { total: row.baseline_total, breakdown: { transport: row.baseline_transport, energy: row.baseline_energy, food: row.baseline_food, consumption: row.baseline_consumption } } : null);
      });
    });

    const activities = await new Promise((resolve) => {
      db.all('SELECT category, type, emissions, date FROM activities ORDER BY date DESC LIMIT 50', (err, rows) => {
        resolve(rows || []);
      });
    });

    const activeCommitments = await new Promise((resolve) => {
      db.all('SELECT title, co2_savings FROM commitments WHERE status = "active"', (err, rows) => {
        resolve(rows || []);
      });
    });

    // 2. Initialize Gen AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are EcoPulse AI, a friendly, encouraging, and highly knowledgeable sustainability and carbon footprint expert. Your goal is to help users track and reduce their carbon footprint."
    });

    // 3. Construct prompt with context
    const contextPrompt = `
You are EcoPulse AI, a friendly, encouraging, and highly knowledgeable sustainability and carbon footprint expert.
The user is asking a question in their Carbon Footprint Tracker application.

Here is their current footprint data context:
- **Baseline Annual Carbon Footprint**: ${profile ? `${profile.total} kg CO2e` : 'Not completed yet'}
- **Baseline Breakdown**: ${profile ? JSON.stringify(profile.breakdown) : 'N/A'}
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
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('*splat', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`EcoPulse Server is running on port ${PORT}`);
});
