const { DoubleJump } = require('.');

class Split {
  constructor(weights) {
    this.dj = new DoubleJump();
    this.nodes = [];
    this.virtualNodes = 1000; // Same as C++ version

    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let accumWeight = 0;

    // Create sorted array of nodes with their weight ranges
    for (const [name, weight] of Object.entries(weights)) {
      const normalizedWeight = weight / totalWeight;
      accumWeight += normalizedWeight;
      this.nodes.push({ name, weight: normalizedWeight, accumulatedWeight: accumWeight });
    }

    // Create virtual nodes to achieve desired distribution
    for (let i = 0; i < this.virtualNodes; i++) {
      const target = i / this.virtualNodes;
      const node = this.nodes.find(n => n.accumulatedWeight >= target);
      this.dj.add(node.name);
    }
  }

  get(key) {
    return this.dj.get(key);
  }
}

module.exports = { Split }; 
