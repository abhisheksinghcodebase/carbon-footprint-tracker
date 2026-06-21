/**
 * EcoPulse Carbon Footprint Calculator Utilities
 * Co-efficients and formulas based on EPA, IPCC, and DEFRA data.
 * All output values are in kg CO2e (Carbon Dioxide Equivalent).
 */

// Constants for emission factors
const EMISSION_FACTORS = {
  // Transport: kg CO2e per mile
  transport: {
    gasolineCar: 0.404,  // average passenger vehicle (EPA)
    dieselCar: 0.430,
    hybridCar: 0.200,
    electricCar: 0.110,  // US grid average mix for EV
    publicTransit: 0.140, // average bus/transit
    flightShort: 0.225,   // < 300 miles
    flightMedium: 0.150,  // 300 - 1000 miles
    flightLong: 0.130,    // > 1000 miles
    motorcycle: 0.180
  },

  // Energy: kg CO2e per unit
  energy: {
    electricity: 0.380,   // per kWh (US average grid mix)
    naturalGas: 5.300,    // per therm
    heatingOil: 10.200,   // per gallon
    lpg: 5.680            // per gallon
  },

  // Food: kg CO2e per day (diet-based) or per meal (individual)
  food: {
    // Diet types (daily baseline)
    diet: {
      meatLover: 2.9,     // high meat consumption (>100g/day)
      average: 2.0,       // moderate meat (50-100g/day)
      vegetarian: 1.4,    // no meat, has dairy/eggs
      vegan: 1.0          // plant-based only
    },
    // Individual meals
    meals: {
      beefOrLamb: 7.5,
      poultryOrPork: 2.5,
      fishOrSeafood: 1.8,
      vegetarian: 0.8,
      vegan: 0.5
    }
  },

  // Consumption and Waste: kg CO2e
  consumption: {
    clothing: 15.0,       // average garment
    electronics: 80.0,    // phone/laptop average manufacturing footprint
    furniture: 45.0,      // average item
    generalGoods: 2.0,     // per $ spent on miscellaneous goods
    wasteLandfill: 0.5,   // per kg of landfill waste
    wasteRecycledOffset: -0.2 // reduction credit per kg of waste recycled
  }
};

/**
 * Calculates the baseline carbon footprint (annualized, in kg CO2e)
 * from the onboarding questionnaire answers.
 */
function calculateBaseline(answers) {
  let annualTransport = 0;
  let annualEnergy = 0;
  let annualFood = 0;
  let annualConsumption = 0;

  // 1. Transportation
  if (answers.carMileage && answers.carType) {
    const carFactor = EMISSION_FACTORS.transport[answers.carType] || EMISSION_FACTORS.transport.gasolineCar;
    annualTransport += Number(answers.carMileage) * carFactor;
  }
  if (answers.flightsShort) {
    annualTransport += Number(answers.flightsShort) * 200 * EMISSION_FACTORS.transport.flightShort; // assume avg 200 miles
  }
  if (answers.flightsMedium) {
    annualTransport += Number(answers.flightsMedium) * 600 * EMISSION_FACTORS.transport.flightMedium; // assume avg 600 miles
  }
  if (answers.flightsLong) {
    annualTransport += Number(answers.flightsLong) * 2500 * EMISSION_FACTORS.transport.flightLong; // assume avg 2500 miles
  }
  if (answers.transitMileage) {
    annualTransport += Number(answers.transitMileage) * 52 * EMISSION_FACTORS.transport.publicTransit; // weekly mileage * 52
  }

  // 2. Household Energy (Divided by household size)
  const householdSize = Number(answers.householdSize) || 1;
  if (answers.electricityBill) {
    // Assume average $0.16 per kWh -> convert $ to kWh, then calculate
    const estimatedKWh = (Number(answers.electricityBill) / 0.16) * 12;
    annualEnergy += (estimatedKWh * EMISSION_FACTORS.energy.electricity) / householdSize;
  }
  if (answers.gasBill) {
    // Assume average $1.20 per therm -> convert $ to therms, then calculate
    const estimatedTherms = (Number(answers.gasBill) / 1.20) * 12;
    annualEnergy += (estimatedTherms * EMISSION_FACTORS.energy.naturalGas) / householdSize;
  }

  // 3. Food (Daily factor * 365)
  const dietType = answers.dietType || 'average';
  const dailyFoodFactor = EMISSION_FACTORS.food.diet[dietType] || EMISSION_FACTORS.food.diet.average;
  annualFood += dailyFoodFactor * 365;

  // 4. Consumption and Waste
  if (answers.clothingPurchases) {
    // Estimated clothing items per year
    annualConsumption += Number(answers.clothingPurchases) * 12 * EMISSION_FACTORS.consumption.clothing;
  }
  if (answers.electronicsPurchases) {
    annualConsumption += Number(answers.electronicsPurchases) * EMISSION_FACTORS.consumption.electronics;
  }
  if (answers.wasteOutput) {
    // Estimated weekly bags of trash * weight (~5kg) * 52 weeks
    const annualWasteKg = Number(answers.wasteOutput) * 5 * 52;
    const recycleRate = Number(answers.recycleRate) || 0; // percentage 0-100
    
    const landfillKg = annualWasteKg * (1 - recycleRate / 100);
    const recycledKg = annualWasteKg * (recycleRate / 100);

    annualConsumption += landfillKg * EMISSION_FACTORS.consumption.wasteLandfill;
    annualConsumption += recycledKg * EMISSION_FACTORS.consumption.wasteRecycledOffset;
  }

  const total = annualTransport + annualEnergy + annualFood + annualConsumption;

  return {
    breakdown: {
      transport: Math.round(annualTransport),
      energy: Math.round(annualEnergy),
      food: Math.round(annualFood),
      consumption: Math.round(annualConsumption)
    },
    total: Math.round(total)
  };
}

/**
 * Calculates emissions for a specific logged activity
 */
function calculateActivityEmissions(category, type, value, details = {}) {
  let emissions = 0;
  const numValue = Number(value);

  switch (category) {
    case 'transport':
      const transportFactor = EMISSION_FACTORS.transport[type] || EMISSION_FACTORS.transport.gasolineCar;
      emissions = numValue * transportFactor;
      break;

    case 'energy':
      const energyFactor = EMISSION_FACTORS.energy[type] || EMISSION_FACTORS.energy.electricity;
      emissions = numValue * energyFactor;
      break;

    case 'food':
      const foodFactor = EMISSION_FACTORS.food.meals[type] || EMISSION_FACTORS.food.meals.vegetarian;
      emissions = numValue * foodFactor; // value is number of meals
      break;

    case 'consumption':
      const consumptionFactor = EMISSION_FACTORS.consumption[type] || EMISSION_FACTORS.consumption.generalGoods;
      emissions = numValue * consumptionFactor;
      break;

    default:
      emissions = 0;
  }

  return Math.round(emissions * 10) / 10; // round to 1 decimal place
}

module.exports = {
  EMISSION_FACTORS,
  calculateBaseline,
  calculateActivityEmissions
};
