const fs = require('fs');
const path = require('path');
const { calculateBaseline, calculateActivityEmissions } = require('./calculator');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Default commitments seed
const DEFAULT_COMMITMENTS = [
  { action_id: 'meatless_monday', title: 'Adopt Meatless Mondays', category: 'food', co2_savings: 416, status: 'active' },
  { action_id: 'led_bulbs', title: 'Switch to LED Lighting', category: 'energy', co2_savings: 150, status: 'completed' },
  { action_id: 'public_transit', title: 'Commute via Transit 2x/Week', category: 'transport', co2_savings: 580, status: 'active' },
  { action_id: 'thermostat_adjust', title: 'Adjust Thermostat by 2°F', category: 'energy', co2_savings: 220, status: 'available' },
  { action_id: 'cold_wash', title: 'Wash Clothes in Cold Water', category: 'energy', co2_savings: 75, status: 'available' },
  { action_id: 'avoid_fast_fashion', title: 'Limit New Clothing Purchases', category: 'consumption', co2_savings: 180, status: 'available' },
  { action_id: 'composting', title: 'Compost Organic Waste', category: 'consumption', co2_savings: 110, status: 'available' },
  { action_id: 'ev_upgrade', title: 'Transition to Electric Vehicle', category: 'transport', co2_savings: 2350, status: 'available' }
];

// Helper to format date offset
function formatDateOffset(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// Initial seed activities
const DEFAULT_ACTIVITIES = [
  { id: 1, date: formatDateOffset(30), category: 'transport', type: 'gasolineCar', value: 45, emissions: 18.2, description: 'Commute to office' },
  { id: 2, date: formatDateOffset(28), category: 'transport', type: 'gasolineCar', value: 60, emissions: 24.2, description: 'Weekend road trip' },
  { id: 3, date: formatDateOffset(25), category: 'transport', type: 'publicTransit', value: 15, emissions: 2.1, description: 'Bus ride to shopping mall' },
  { id: 4, date: formatDateOffset(20), category: 'transport', type: 'flightMedium', value: 600, emissions: 90.0, description: 'Flight to Chicago (Business)' },
  { id: 5, date: formatDateOffset(18), category: 'transport', type: 'gasolineCar', value: 35, emissions: 14.1, description: 'Weekly grocery run' },
  { id: 6, date: formatDateOffset(15), category: 'transport', type: 'electricCar', value: 50, emissions: 5.5, description: 'Drove rental EV on trip' },
  { id: 7, date: formatDateOffset(12), category: 'transport', type: 'gasolineCar', value: 40, emissions: 16.2, description: 'Commute to office' },
  { id: 8, date: formatDateOffset(5), category: 'transport', type: 'publicTransit', value: 20, emissions: 2.8, description: 'Subway rides' },
  { id: 9, date: formatDateOffset(2), category: 'transport', type: 'gasolineCar', value: 30, emissions: 12.1, description: 'Errands and gym' },

  { id: 10, date: formatDateOffset(28), category: 'energy', type: 'electricity', value: 150, emissions: 57.0, description: 'Mid-month electricity usage reading' },
  { id: 11, date: formatDateOffset(14), category: 'energy', type: 'naturalGas', value: 12, emissions: 63.6, description: 'Gas heating usage' },
  { id: 12, date: formatDateOffset(1), category: 'energy', type: 'electricity', value: 130, emissions: 49.4, description: 'End-month electricity usage' },

  { id: 13, date: formatDateOffset(29), category: 'food', type: 'beefOrLamb', value: 1, emissions: 7.5, description: 'Ribeye steak dinner' },
  { id: 14, date: formatDateOffset(27), category: 'food', type: 'vegetarian', value: 3, emissions: 2.4, description: 'Meat-free Monday meals' },
  { id: 15, date: formatDateOffset(26), category: 'food', type: 'poultryOrPork', value: 2, emissions: 5.0, description: 'Chicken salad and pork chops' },
  { id: 16, date: formatDateOffset(24), category: 'food', type: 'vegan', value: 3, emissions: 1.5, description: 'Vegan weekend menu' },
  { id: 17, date: formatDateOffset(21), category: 'food', type: 'fishOrSeafood', value: 1, emissions: 1.8, description: 'Salmon lunch' },
  { id: 18, date: formatDateOffset(17), category: 'food', type: 'beefOrLamb', value: 1, emissions: 7.5, description: 'Beef burger with friends' },
  { id: 19, date: formatDateOffset(13), category: 'food', type: 'vegetarian', value: 3, emissions: 2.4, description: 'Vegetarian meals' },
  { id: 20, date: formatDateOffset(10), category: 'food', type: 'poultryOrPork', value: 2, emissions: 5.0, description: 'Turkey wrap and pork loin' },
  { id: 21, date: formatDateOffset(8), category: 'food', type: 'vegan', value: 3, emissions: 1.5, description: 'Plant-based diet day' },
  { id: 22, date: formatDateOffset(4), category: 'food', type: 'fishOrSeafood', value: 1, emissions: 1.8, description: 'Seafood pasta' },
  { id: 23, date: formatDateOffset(3), category: 'food', type: 'beefOrLamb', value: 1, emissions: 7.5, description: 'Lamb gyro' },
  { id: 24, date: formatDateOffset(1), category: 'food', type: 'vegetarian', value: 3, emissions: 2.4, description: 'Veggie day' },

  { id: 25, date: formatDateOffset(25), category: 'consumption', type: 'clothing', value: 2, emissions: 30.0, description: 'Purchased winter jacket and jeans' },
  { id: 26, date: formatDateOffset(19), category: 'consumption', type: 'generalGoods', value: 45, emissions: 90.0, description: 'Home decor items ($45)' },
  { id: 27, date: formatDateOffset(11), category: 'consumption', type: 'electronics', value: 1, emissions: 80.0, description: 'Replaced broken smart monitor' },
  { id: 28, date: formatDateOffset(7), category: 'consumption', type: 'wasteLandfill', value: 12, emissions: 6.0, description: 'Weekly trash bag disposal (12kg)' },
  { id: 29, date: formatDateOffset(7), category: 'consumption', type: 'wasteRecycledOffset', value: 8, emissions: -1.6, description: 'Recycled paper and plastic bottles (8kg)' }
];

class JsonDatabase {
  constructor() {
    this.data = {
      profiles: [],
      activities: [],
      commitments: []
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        console.log('Database loaded successfully from JSON.');
      } catch (err) {
        console.error('Error reading JSON DB file, initializing new database:', err.message);
        this.seed();
      }
    } else {
      this.seed();
    }
  }

  seed() {
    console.log('Seeding initial JSON database...');
    
    // Seed profile
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
    this.data.profiles.push({
      id: 1,
      baseline_total: baseline.total,
      baseline_transport: baseline.breakdown.transport,
      baseline_energy: baseline.breakdown.energy,
      baseline_food: baseline.breakdown.food,
      baseline_consumption: baseline.breakdown.consumption,
      onboarding_answers: JSON.stringify(mockAnswers),
      created_at: new Date().toISOString()
    });

    // Seed activities
    this.data.activities = [...DEFAULT_ACTIVITIES];

    // Seed commitments
    this.data.commitments = [...DEFAULT_COMMITMENTS];

    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database to JSON file:', err.message);
    }
  }

  // API operations
  getLatestProfile() {
    if (this.data.profiles.length === 0) return null;
    return this.data.profiles[this.data.profiles.length - 1];
  }

  saveProfile(answers) {
    const baseline = calculateBaseline(answers);
    const id = this.data.profiles.length + 1;
    const newProfile = {
      id,
      baseline_total: baseline.total,
      baseline_transport: baseline.breakdown.transport,
      baseline_energy: baseline.breakdown.energy,
      baseline_food: baseline.breakdown.food,
      baseline_consumption: baseline.breakdown.consumption,
      onboarding_answers: JSON.stringify(answers),
      created_at: new Date().toISOString()
    };
    this.data.profiles.push(newProfile);
    this.save();
    return newProfile;
  }

  getActivities() {
    // Return sorted by date desc
    return [...this.data.activities].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }

  addActivity(activity) {
    const id = this.data.activities.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const emissions = calculateActivityEmissions(activity.category, activity.type, activity.value);
    const newActivity = {
      id,
      date: activity.date,
      category: activity.category,
      type: activity.type,
      value: Number(activity.value),
      emissions,
      description: activity.description || `${activity.category} - ${activity.type}`,
      created_at: new Date().toISOString()
    };
    this.data.activities.push(newActivity);
    this.save();
    return newActivity;
  }

  deleteActivity(id) {
    const numId = Number(id);
    const initialLength = this.data.activities.length;
    this.data.activities = this.data.activities.filter(a => a.id !== numId);
    if (this.data.activities.length !== initialLength) {
      this.save();
      return true;
    }
    return false;
  }

  getCommitments() {
    return this.data.commitments;
  }

  updateCommitmentStatus(actionId, status) {
    const commitment = this.data.commitments.find(c => c.action_id === actionId);
    if (commitment) {
      commitment.status = status;
      commitment.updated_at = new Date().toISOString();
      this.save();
      return commitment;
    }
    return null;
  }

  resetAll() {
    this.data.profiles = [];
    this.data.activities = [];
    this.data.commitments = DEFAULT_COMMITMENTS.map(c => ({ ...c, status: 'available' }));
    this.save();
    return true;
  }
}

module.exports = new JsonDatabase();
