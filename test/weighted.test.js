const { WeightedHash } = require('../build/Release/doublejump.node');

describe('WeightedHash', () => {
  test('should create a weighted hash instance with weights', () => {
    const weights = {
      'node1': 1,
      'node2': 2,
      'node3': 3
    };
    const weightedHash = new WeightedHash(weights);
    expect(weightedHash.size()).toBe(3);
  });

  test('should distribute keys according to weights', () => {
    const weights = {
      'node1': 1,
      'node2': 2,
      'node3': 3
    };
    const weightedHash = new WeightedHash(weights);

    // Test multiple keys to verify distribution
    const results = new Map();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const key = `key${i}`;
      const node = weightedHash.get(key);
      results.set(node, (results.get(node) || 0) + 1);
    }

    // Verify rough distribution matches weights
    const node1Count = results.get('node1') || 0;
    const node2Count = results.get('node2') || 0;
    const node3Count = results.get('node3') || 0;

    // Allow for some variance due to randomness
    expect(node1Count).toBeGreaterThan(iterations * 0.15); // ~16.7%
    expect(node2Count).toBeGreaterThan(iterations * 0.3);  // ~33.3%
    expect(node3Count).toBeGreaterThan(iterations * 0.45); // ~50%
  });

  test('should handle empty weights', () => {
    expect(() => new WeightedHash({})).toThrow('At least one node must have a positive weight');
  });

  test('should handle single node', () => {
    const weightedHash = new WeightedHash({ 'node1': 1 });
    expect(weightedHash.size()).toBe(1);

    // All keys should map to the single node
    for (let i = 0; i < 100; i++) {
      expect(weightedHash.get(`key${i}`)).toBe('node1');
    }
  });

  test('should handle zero weights', () => {
    expect(() => new WeightedHash({
      'node1': 0,
      'node2': 0,
      'node3': 0
    })).toThrow('At least one node must have a positive weight');
  });
}); 