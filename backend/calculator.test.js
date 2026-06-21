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
});
