const DoubleJump = require('./doublejump');

class WeightedHash {
  constructor(weights) {
    if (!weights || Object.keys(weights).length === 0) {
      throw new Error('At least one node must have a positive weight');
    }

    // Check if any weight is positive
    const hasPositiveWeight = Object.values(weights).some(w => w > 0);
    if (!hasPositiveWeight) {
      throw new Error('At least one node must have a positive weight');
    }

    this.dj = new DoubleJump();
    const numNodes = Object.keys(weights).length;
    this.nodes = new Array(numNodes);
    this.virtualNodes = 1000; // Same as C++ version

    // Normalize weights and create nodes array
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let accumWeight = 0;
    let i = 0;

    // Create sorted array of nodes with their weight ranges
    for (const [name, weight] of Object.entries(weights)) {
      const normalizedWeight = weight / totalWeight;
      accumWeight += normalizedWeight;
      this.nodes[i++] = { name, weight: normalizedWeight, accumulatedWeight: accumWeight };
    }

    // Pre-allocate virtual node names to avoid string concatenation in the loop
    const virtualNodeNames = new Array(this.virtualNodes);
    for (let i = 0; i < this.virtualNodes; i++) {
      const target = i / this.virtualNodes;
      const node = this.findNode(target);
      virtualNodeNames[i] = `${node.name}_${i}`;
    }

    // Add all virtual nodes at once
    for (const name of virtualNodeNames) {
      this.dj.add(name);
    }
  }

  // Optimized binary search implementation
  findNode(target) {
    let left = 0;
    let right = this.nodes.length - 1;

    while (left < right) {
      const mid = (left + right) >>> 1; // Faster integer division by 2
      if (this.nodes[mid].accumulatedWeight < target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    return this.nodes[left];
  }

  get(key) {
    const result = this.dj.get(key);
    // Use a faster string split approach
    const pos = result.indexOf('_');
    return pos === -1 ? result : result.slice(0, pos);
  }

  size() {
    return this.nodes.length;
  }
}

module.exports = WeightedHash; 
