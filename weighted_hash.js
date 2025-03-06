const { DoubleJump } = require('.');

class WeightedHash {
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
      const node = this.findNode(target);
      // Add virtual node with suffix, matching C++ implementation
      this.dj.add(`${node.name}_${i}`);
    }
  }

  // Binary search to find the appropriate node for a given target weight
  findNode(target) {
    let left = 0;
    let right = this.nodes.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const node = this.nodes[mid];

      if (node.accumulatedWeight >= target) {
        if (mid === 0 || this.nodes[mid - 1].accumulatedWeight < target) {
          return node;
        }
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // If we didn't find a node (shouldn't happen with valid weights), return the last node
    return this.nodes[this.nodes.length - 1];
  }

  get(key) {
    const result = this.dj.get(key);
    // Extract the physical node name (everything before the underscore)
    const underscorePos = result.indexOf('_');
    return underscorePos !== -1 ? result.substring(0, underscorePos) : result;
  }
}

module.exports = { WeightedHash }; 
