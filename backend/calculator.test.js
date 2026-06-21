const { test, describe } = require('node:test');
const assert = require('node:assert');
const { calculateBaseline, calculateActivityEmissions, EMISSION_FACTORS } = require('./calculator');

describe('Carbon Calculator Calculations', () => {
  
  test('calculateBaseline computes emissions correctly for a standard profile', () => {
    const mockAnswers = {
      householdSize: 2,
      carMileage: 5000,
      carType: 'hybridCar',
      flightsShort: 2,
      flightsMedium: 1,
      flightsLong: 0,
      transitMileage: 10,
      electricityBill: 100, // estimated KWh = (100 / 0.16) * 12 = 7500 KWh
      gasBill: 50,          // estimated Therms = (50 / 1.20) * 12 = 500 Therms
      dietType: 'vegetarian',
      clothingPurchases: 2,
      electronicsPurchases: 1,
      wasteOutput: 2,       // 2 bags * 5kg * 52 weeks = 520 kg
      recycleRate: 50       // 260 kg landfill, 260 kg recycle
    };

    const result = calculateBaseline(mockAnswers);

    assert.ok(result.total > 0, 'Total emissions should be positive');
    assert.ok(result.breakdown, 'Should return breakdown object');
    assert.strictEqual(typeof result.breakdown.transport, 'number');
    assert.strictEqual(typeof result.breakdown.energy, 'number');
    assert.strictEqual(typeof result.breakdown.food, 'number');
    assert.strictEqual(typeof result.breakdown.consumption, 'number');

    // Expected Transport calculation:
    // Car: 5000 * 0.200 = 1000 kg CO2e
    // FlightsShort: 2 * 200 * 0.225 = 90 kg CO2e
    // FlightsMedium: 1 * 600 * 0.150 = 90 kg CO2e
    // Transit: 10 * 52 * 0.140 = 72.8 kg CO2e
    // Total Transport = 1000 + 90 + 90 + 72.8 = 1252.8 kg (rounded to 1253)
    assert.ok(Math.abs(result.breakdown.transport - 1253) <= 2, 'Transport emissions calculation should match standard offsets');
  });

  test('calculateActivityEmissions converts individual logs to CO2 equivalent', () => {
    // 1. Test Transport Car
    const transportCO2 = calculateActivityEmissions('transport', 'gasolineCar', 100);
    // 100 miles * 0.404 kg/mile = 40.4 kg CO2
    assert.strictEqual(transportCO2, 40.4);

    // 2. Test Energy Electricity
    const electricityCO2 = calculateActivityEmissions('energy', 'electricity', 250);
    // 250 kWh * 0.380 kg/kWh = 95 kg CO2
    assert.strictEqual(electricityCO2, 95);

    // 3. Test Food Beef meal
    const beefCO2 = calculateActivityEmissions('food', 'beefOrLamb', 2);
    // 2 meals * 7.5 kg/meal = 15 kg CO2
    assert.strictEqual(beefCO2, 15);

    // 4. Test Recycled Waste offset (Negative carbon)
    const recycleCO2 = calculateActivityEmissions('consumption', 'wasteRecycledOffset', 50);
    // 50 kg * -0.2 kg/kg = -10 kg CO2
    assert.strictEqual(recycleCO2, -10);
  });

  test('calculateActivityEmissions handles invalid category fallback gracefully', () => {
    const invalidCO2 = calculateActivityEmissions('unknown', 'type', 50);
    assert.strictEqual(invalidCO2, 0);
  });

  test('calculateBaseline handles empty/zero answers and returns a base value', () => {
    const emptyAnswers = {
      householdSize: 1,
      carMileage: 0,
      flightsShort: 0,
      flightsMedium: 0,
      flightsLong: 0,
      transitMileage: 0,
      electricityBill: 0,
      gasBill: 0,
      dietType: 'vegan',
      clothingPurchases: 0,
      electronicsPurchases: 0,
      wasteOutput: 0,
      recycleRate: 0
    };
    const result = calculateBaseline(emptyAnswers);
    // Base food emissions should remain: vegan diet = 1.0 * 365 = 365
    assert.strictEqual(result.breakdown.food, 365);
    assert.strictEqual(result.breakdown.transport, 0);
    assert.strictEqual(result.breakdown.energy, 0);
    assert.strictEqual(result.breakdown.consumption, 0);
    assert.strictEqual(result.total, 365);
  });

  test('calculateActivityEmissions handles zero values and negative offsets correctly', () => {
    const zeroTransport = calculateActivityEmissions('transport', 'gasolineCar', 0);
    assert.strictEqual(zeroTransport, 0);

    const negativeOffset = calculateActivityEmissions('consumption', 'wasteRecycledOffset', 10);
    assert.strictEqual(negativeOffset, -2.0); // 10 * -0.2 = -2.0
  });

  test('calculateBaseline handles extremely large inputs without crashing', () => {
    const massiveAnswers = {
      householdSize: 1,
      carMileage: 999999,
      carType: 'dieselCar',
      flightsShort: 50,
      flightsMedium: 50,
      flightsLong: 50,
      transitMileage: 5000,
      electricityBill: 5000,
      gasBill: 5000,
      dietType: 'meatLover',
      clothingPurchases: 100,
      electronicsPurchases: 100,
      wasteOutput: 50,
      recycleRate: 100
    };
    const result = calculateBaseline(massiveAnswers);
    assert.ok(result.total > 100000, 'Emissions total should be very large but computed');
  });
});
