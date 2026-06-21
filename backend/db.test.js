const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const db = require('./db');

describe('JSON Database Controller', () => {
  before(() => {
    db.resetAll();
    db.seed();
  });

  test('Database is initialized with seed profile and commitments', () => {
    const profile = db.getLatestProfile();
    assert.ok(profile, 'Should have a seeded profile');
    assert.strictEqual(typeof profile.baseline_total, 'number');
    
    const commitments = db.getCommitments();
    assert.ok(commitments.length > 0, 'Should have seeded commitments');
    assert.ok(commitments.some(c => c.action_id === 'meatless_monday'));
  });

  test('addActivity appends new activity and recalculates emissions output', () => {
    const initialCount = db.getActivities().length;
    const testActivity = {
      date: '2026-06-21',
      category: 'transport',
      type: 'gasolineCar',
      value: 100,
      description: 'Test driving activity'
    };

    const added = db.addActivity(testActivity);
    assert.ok(added.id, 'Added activity should have a unique ID');
    assert.strictEqual(added.category, 'transport');
    assert.strictEqual(added.emissions, 40.4, 'Emissions should equal 100 miles * 0.404 factor');

    const updatedActivities = db.getActivities();
    assert.strictEqual(updatedActivities.length, initialCount + 1, 'Activities list should grow by 1');
  });

  test('updateCommitmentStatus modifies commitment state in-place', () => {
    const testActionId = 'thermostat_adjust';
    const initialCommitment = db.getCommitments().find(c => c.action_id === testActionId);
    assert.strictEqual(initialCommitment.status, 'available');

    const updated = db.updateCommitmentStatus(testActionId, 'active');
    assert.ok(updated);
    assert.strictEqual(updated.status, 'active');

    // Clean up
    db.updateCommitmentStatus(testActionId, 'available');
  });

  test('resetAll clears profiles and activities successfully', () => {
    db.resetAll();
    
    assert.strictEqual(db.getLatestProfile(), null, 'Profile list should be empty');
    assert.strictEqual(db.getActivities().length, 0, 'Activities list should be empty');
    
    const commitments = db.getCommitments();
    assert.ok(commitments.every(c => c.status === 'available'), 'All commitments should reset to available');
  });
});
