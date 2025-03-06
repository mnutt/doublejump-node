const { DoubleJump } = require('./build/Release/doublejump.node');

// Create a new DoubleJump instance
const dj = new DoubleJump();

// Add some nodes
for (let i = 0; i < 10; i++) {
  dj.add(`node-${i}`);
}

// Get a node for a key
const key = "foo";
const node = dj.get(key);
console.log(`Key "${key}" maps to node: ${node}`);

// Get all nodes
console.log('All nodes:', dj.all());

// Get a random node
console.log('Random node:', dj.random());

// Remove a node
dj.remove('node-5');
console.log('After removing node-5, all nodes:', dj.all());

// Get the same key again (should map to a different node)
const node2 = dj.get(key);
console.log(`Key "${key}" now maps to node: ${node2}`); 