const { DoubleJump } = require('../');
const { HashRing } = require('@movable/hash_ring');
const WeightedHash = require('../lib/weighted_hash');

// Test data generation
function generateTestData(numKeys) {
  const keys = [];
  for (let i = 0; i < numKeys; i++) {
    keys.push(`key-${i}-${Math.random().toString(36).substring(7)}`);
  }
  return keys;
}

// Helper to limit output to first 10 nodes
function limitOutput(dist) {
  const entries = Object.entries(dist).sort(([a], [b]) => a.localeCompare(b));
  const limited = entries.slice(0, 10);
  const result = Object.fromEntries(limited);
  if (entries.length > 10) {
    result['...'] = `+${entries.length - 10} more nodes`;
  }
  return result;
}

const NUM_KEYS = 100000;
const PRECISION = 100;

// Test scenarios
const scenarios = [
  {
    name: '100 nodes, equal weights',
    nodes: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`node-${i}`, 1])),
    weightedNodes: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`node-${i}`, 1]))
  },
  {
    name: '1000 nodes, equal weights',
    nodes: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`node-${i}`, 1])),
    weightedNodes: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`node-${i}`, 1]))
  },
  {
    name: '2 nodes, 10/90 split',
    nodes: { 'node-0': 1, 'node-1': 1 },
    weightedNodes: { 'node-0': 10, 'node-1': 90 }
  },
  {
    name: '10 nodes, varied weights',
    nodes: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`node-${i}`, 1])),
    weightedNodes: {
      'node-0': 5,   // 5%
      'node-1': 10,  // 10%
      'node-2': 15,  // 15%
      'node-3': 20,  // 20%
      'node-4': 25,  // 25%
      'node-5': 10,  // 10%
      'node-6': 5,   // 5%
      'node-7': 3,   // 3%
      'node-8': 4,   // 4%
      'node-9': 3    // 3%
    }
  }
];

// Benchmark functions
function benchmarkDoubleJump(keys, nodes) {
  const dj = new DoubleJump();
  Object.keys(nodes).forEach(node => dj.add(node));

  // Warmup run
  for (const key of keys) {
    dj.get(key);
  }

  // Actual benchmark run
  const start = process.hrtime.bigint();
  for (const key of keys) {
    dj.get(key);
  }
  const end = process.hrtime.bigint();
  return Number(end - start) / 1_000_000; // Convert to ms
}

function benchmarkWeightedHash(keys, weightedNodes) {
  const weightedHash = new WeightedHash(weightedNodes);

  // Warmup run
  for (const key of keys) {
    weightedHash.get(key);
  }

  // Actual benchmark run
  const start = process.hrtime.bigint();
  for (const key of keys) {
    weightedHash.get(key);
  }
  const end = process.hrtime.bigint();
  return Number(end - start) / 1_000_000; // Convert to ms
}

function benchmarkHashRing(keys, nodes) {
  const ring = new HashRing(nodes, PRECISION);

  // Warmup run
  for (const key of keys) {
    ring.getNode(key);
  }

  // Actual benchmark run
  const start = process.hrtime.bigint();
  for (const key of keys) {
    ring.getNode(key);
  }
  const end = process.hrtime.bigint();
  return Number(end - start) / 1_000_000; // Convert to ms
}

function benchmarkHashRingWeighted(keys, weightedNodes) {
  const ring = new HashRing(weightedNodes, PRECISION);

  // Warmup run
  for (const key of keys) {
    ring.getNode(key);
  }

  // Actual benchmark run
  const start = process.hrtime.bigint();
  for (const key of keys) {
    ring.getNode(key);
  }
  const end = process.hrtime.bigint();
  return Number(end - start) / 1_000_000; // Convert to ms
}

// Distribution analysis
function analyzeDistribution(keys, getNode) {
  const distribution = {};
  for (const key of keys) {
    const node = getNode(key);
    distribution[node] = (distribution[node] || 0) + 1;
  }

  const total = keys.length;
  const percentages = {};
  for (const [node, count] of Object.entries(distribution)) {
    percentages[node] = ((count / total) * 100).toFixed(2) + '%';
  }
  return percentages;
}

// Calculate distribution accuracy score
function calculateDistributionScore(actualDist, expectedWeights) {
  const totalWeight = Object.values(expectedWeights).reduce((a, b) => a + b, 0);
  const expectedDist = Object.fromEntries(
    Object.entries(expectedWeights).map(([node, weight]) => [
      node,
      (weight / totalWeight) * 100
    ])
  );

  // Convert actual percentages to numbers (remove % symbol)
  const actualPercentages = Object.fromEntries(
    Object.entries(actualDist).map(([node, pct]) => [node, parseFloat(pct)])
  );

  // Calculate RMSE
  let sumSquaredError = 0;
  let count = 0;
  for (const node of Object.keys(expectedDist)) {
    const expected = expectedDist[node];
    const actual = actualPercentages[node] || 0;
    sumSquaredError += Math.pow(expected - actual, 2);
    count++;
  }
  return Math.sqrt(sumSquaredError / count);
}

// Run benchmarks
console.log('Running benchmarks...\n');
console.log(`Using ${NUM_KEYS} keys for each test\n`);

for (const scenario of scenarios) {
  console.log(`\nScenario: ${scenario.name}`);
  console.log('='.repeat(scenario.name.length + 10));

  // Calculate and display weights as percentages
  const totalWeight = Object.values(scenario.weightedNodes).reduce((a, b) => a + b, 0);
  const weightPercentages = Object.fromEntries(
    Object.entries(scenario.weightedNodes)
      .map(([node, weight]) => [node, ((weight / totalWeight) * 100).toFixed(2) + '%'])
      .sort(([a], [b]) => a.localeCompare(b))
  );
  console.log('Node weights:', limitOutput(weightPercentages));

  const keys = generateTestData(NUM_KEYS);

  // Basic consistent hashing
  const djTime = benchmarkDoubleJump(keys, scenario.nodes);
  const hrTime = benchmarkHashRing(keys, scenario.nodes);

  // Weighted distribution
  const weightedHashTime = benchmarkWeightedHash(keys, scenario.weightedNodes);
  const hrWeightedTime = benchmarkHashRingWeighted(keys, scenario.weightedNodes);

  console.log(`\nPerformance:`);
  console.log(`DoubleJump: ${djTime.toFixed(2)}ms (${(djTime / NUM_KEYS).toFixed(3)}µs/key)`);
  console.log(`WeightedHash: ${weightedHashTime.toFixed(2)}ms (${(weightedHashTime / NUM_KEYS).toFixed(3)}µs/key)`);
  console.log(`HashRing: ${hrTime.toFixed(2)}ms (${(hrTime / NUM_KEYS).toFixed(3)}µs/key)`);
  console.log(`HashRing (weighted): ${hrWeightedTime.toFixed(2)}ms (${(hrWeightedTime / NUM_KEYS).toFixed(3)}µs/key)`);

  // Analyze distribution for weighted tests
  console.log('\nDistribution analysis:');
  const weightedHash = new WeightedHash(scenario.weightedNodes);
  const hashRing = new HashRing(scenario.weightedNodes, PRECISION);

  const weightedHashDist = analyzeDistribution(keys, key => weightedHash.get(key));
  const hrDist = analyzeDistribution(keys, key => hashRing.getNode(key));

  console.log('WeightedHash distribution:', limitOutput(weightedHashDist));
  console.log('HashRing distribution:', limitOutput(hrDist));

  // Calculate and display distribution accuracy scores
  const weightedHashScore = calculateDistributionScore(weightedHashDist, scenario.weightedNodes);
  const hashRingScore = calculateDistributionScore(hrDist, scenario.weightedNodes);
  console.log('\nDistribution accuracy (lower is better):');
  console.log(`WeightedHash RMSE: ${weightedHashScore.toFixed(2)}%`);
  console.log(`HashRing RMSE: ${hashRingScore.toFixed(2)}%`);
} 
