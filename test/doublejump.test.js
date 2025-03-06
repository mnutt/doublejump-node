const { DoubleJump } = require('../build/Release/doublejump.node');

describe('DoubleJump', () => {
  let dj;

  beforeEach(() => {
    dj = new DoubleJump();
  });

  describe('add', () => {
    it('should add nodes', () => {
      dj.add('node1');
      dj.add('node2');
      expect(dj.len()).toBe(2);
      expect(dj.all()).toEqual(['node1', 'node2']);
    });

    it('should not add duplicate nodes', () => {
      dj.add('node1');
      dj.add('node1');
      expect(dj.len()).toBe(1);
      expect(dj.all()).toEqual(['node1']);
    });

    it('should not add empty strings', () => {
      dj.add('');
      expect(dj.len()).toBe(0);
      expect(dj.all()).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should remove nodes', () => {
      dj.add('node1');
      dj.add('node2');
      dj.remove('node1');
      expect(dj.len()).toBe(1);
      expect(dj.all()).toEqual(['node2']);
    });

    it('should handle removing non-existent nodes', () => {
      dj.add('node1');
      dj.remove('node2');
      expect(dj.len()).toBe(1);
      expect(dj.all()).toEqual(['node1']);
    });

    it('should handle removing empty strings', () => {
      dj.add('node1');
      dj.remove('');
      expect(dj.len()).toBe(1);
      expect(dj.all()).toEqual(['node1']);
    });
  });

  describe('get', () => {
    it('should consistently map keys to nodes', () => {
      dj.add('node1');
      dj.add('node2');
      dj.add('node3');

      const key = 'test-key';
      const node1 = dj.get(key);
      const node2 = dj.get(key);

      expect(node1).toBe(node2);
      expect(['node1', 'node2', 'node3']).toContain(node1);
    });

    it('should return empty string for empty hash', () => {
      expect(dj.get('any-key')).toBe('');
    });

    it('should handle empty string keys', () => {
      dj.add('node1');
      dj.add('node2');
      const node = dj.get('');
      expect(['node1', 'node2']).toContain(node);
    });
  });

  describe('shrink', () => {
    it('should compact the internal storage', () => {
      dj.add('node1');
      dj.add('node2');
      dj.remove('node1');

      const looseLenBefore = dj.looseLen();
      dj.shrink();
      const looseLenAfter = dj.looseLen();

      expect(looseLenAfter).toBeLessThan(looseLenBefore);
      expect(dj.len()).toBe(1);
      expect(dj.all()).toEqual(['node2']);
    });
  });

  describe('random', () => {
    it('should return a valid node', () => {
      dj.add('node1');
      dj.add('node2');
      dj.add('node3');

      const node = dj.random();
      expect(['node1', 'node2', 'node3']).toContain(node);
    });

    it('should return empty string for empty hash', () => {
      expect(dj.random()).toBe('');
    });
  });

  describe('consistency after node removal', () => {
    it('should maintain consistent mapping for remaining nodes', () => {
      // Add nodes
      for (let i = 0; i < 10; i++) {
        dj.add(`node-${i}`);
      }

      // Get initial mapping
      const key = 'test-key';
      const initialNode = dj.get(key);

      // Remove some nodes
      dj.remove('node-5');
      dj.remove('node-7');

      // Get mapping after removal
      const finalNode = dj.get(key);

      // The mapping should be different but valid
      expect(finalNode).not.toBe(initialNode);
      expect(dj.all()).toContain(finalNode);
    });
  });

  describe('edge cases', () => {
    it('should handle many nodes', () => {
      for (let i = 0; i < 1000; i++) {
        dj.add(`node-${i}`);
      }
      expect(dj.len()).toBe(1000);
    });

    it('should handle long node names', () => {
      const longName = 'a'.repeat(1000);
      dj.add(longName);
      expect(dj.get('test-key')).toBe(longName);
    });

    it('should handle special characters in node names', () => {
      dj.add('node!@#$%^&*()');
      expect(dj.get('test-key')).toBe('node!@#$%^&*()');
    });
  });

  describe('distribution', () => {
    it('should distribute items uniformly across nodes', () => {
      // Add 10 buckets
      for (let i = 0; i < 10; i++) {
        dj.add(`node-${i}`);
      }

      // Hash 10,000 items and count their distribution
      const counts = new Array(10).fill(0);
      for (let i = 0; i < 100000; i++) {
        const node = dj.get(`item-${i}`);
        const nodeIndex = parseInt(node.split('-')[1]);
        counts[nodeIndex]++;
      }

      // Calculate expected count per bucket (should be ~1000)
      const expectedCount = 100000 / 10;
      const tolerance = 0.02; // 2% tolerance

      // Check each bucket is within tolerance
      counts.forEach((count, index) => {
        const deviation = Math.abs(count - expectedCount) / expectedCount;
        expect(deviation).toBeLessThan(tolerance);
      });

      // Log distribution for debugging
      console.log('Bucket distribution:', counts.map((count, i) =>
        `node-${i}: ${count} (${((count / expectedCount) * 100).toFixed(1)}%)`
      ).join('\n'));
    });
  });
}); 