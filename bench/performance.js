const { DoubleJump } = require('../');
const { performance } = require('perf_hooks');

// Utility function to format numbers with commas
const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// Utility function to run and measure a test
function runBenchmark(name, fn, iterations) {
  const start = performance.now();
  fn();
  const end = performance.now();
  const opsPerSec = Math.floor((iterations / (end - start)) * 1000);
  console.log(`${name}: ${formatNumber(opsPerSec)} ops/sec (${iterations} iterations in ${(end - start).toFixed(2)}ms)`);
  return end - start;
}

// Test configuration
const SMALL_SET = 10;
const MEDIUM_SET = 1000;
const LARGE_SET = 100000;
const GET_ITERATIONS = 10000000;

// Generate test data
const testData = Array.from({ length: LARGE_SET }, (_, i) => `item-${i}`);
const testKeys = Array.from({ length: GET_ITERATIONS }, (_, i) => `key-${i % LARGE_SET}`);

console.log('\n=== DoubleJump Performance Tests ===\n');

// Test adding items
function testAdd(size) {
  const dj = new DoubleJump();
  runBenchmark(
    `Adding ${formatNumber(size)} items`,
    () => {
      for (let i = 0; i < size; i++) {
        dj.add(testData[i]);
      }
    },
    size
  );
  return dj;
}

// Test getting items
function testGet(dj, iterations) {
  runBenchmark(
    `Getting items (${formatNumber(iterations)} lookups)`,
    () => {
      for (let i = 0; i < iterations; i++) {
        dj.get(testKeys[i]);
      }
    },
    iterations
  );
}

// Test random selection
function testRandom(dj, iterations) {
  runBenchmark(
    `Random selection (${formatNumber(iterations)} selections)`,
    () => {
      for (let i = 0; i < iterations; i++) {
        dj.random();
      }
    },
    iterations
  );
}

// Test removing items
function testRemove(dj, size) {
  runBenchmark(
    `Removing ${formatNumber(size)} items`,
    () => {
      for (let i = 0; i < size; i++) {
        dj.remove(testData[i]);
      }
    },
    size
  );
}

// Test shrink operation
function testShrink(dj) {
  runBenchmark(
    'Shrink operation',
    () => {
      dj.shrink();
    },
    1
  );
}

// Run small dataset tests
console.log('Small Dataset Tests (1,000 items)');
console.log('----------------------------------');
let dj = testAdd(SMALL_SET);
testGet(dj, GET_ITERATIONS);
testRandom(dj, GET_ITERATIONS);
testRemove(dj, Math.floor(SMALL_SET / 2));
testShrink(dj);

// Run medium dataset tests
console.log('\nMedium Dataset Tests (10,000 items)');
console.log('------------------------------------');
dj = testAdd(MEDIUM_SET);
testGet(dj, GET_ITERATIONS);
testRandom(dj, GET_ITERATIONS);
testRemove(dj, Math.floor(MEDIUM_SET / 2));
testShrink(dj);

// Run large dataset tests
console.log('\nLarge Dataset Tests (100,000 items)');
console.log('------------------------------------');
dj = testAdd(LARGE_SET);
testGet(dj, GET_ITERATIONS);
testRandom(dj, GET_ITERATIONS);
testRemove(dj, Math.floor(LARGE_SET / 2));
testShrink(dj);

// Memory usage
const used = process.memoryUsage();
console.log('\nMemory Usage');
console.log('------------');
for (let key in used) {
  console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
} 
