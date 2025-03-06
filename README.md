# doublejump-node

A Node.js native addon implementing the Jump Consistent Hash algorithm with a dual-bucket strategy for efficient object distribution and lookup.

## Features

- Consistent hashing implementation using Jump Hash algorithm
- Dual-bucket strategy for efficient object management:
  - Loose bucket: Handles rapid additions/removals with minimal memory reallocation
  - Compact bucket: Provides dense storage and efficient lookups
- Thread-safe random object selection
- Zero external dependencies (besides Node.js and C++ standard library)
- Written in modern C++ with noexcept guarantees

## Installation

```bash
npm install doublejump-node
```

## Usage

```javascript
const DoubleJump = require('doublejump-node').DoubleJump;

// Create a new instance
const dj = new DoubleJump();

// Add some objects
dj.add("object1");
dj.add("object2");
dj.add("object3");

// Get an object using a key (returns consistent results for the same key)
const obj = dj.get("my-key");  // Returns one of the added objects consistently

// Get a random object
const randomObj = dj.random();  // Returns a random object from the collection

// Remove an object
dj.remove("object2");

// Get all objects
const allObjects = dj.all();  // Returns ["object1", "object3"]

// Get counts
const totalCount = dj.len();      // Number of objects in compact storage
const looseCount = dj.looseLen(); // Number of objects in loose storage

// Optimize storage (moves all objects to compact storage)
dj.shrink();
```

## API

### `new DoubleJump()`
Creates a new DoubleJump instance.

### `add(object: string): void`
Adds an object to the collection. If the object already exists, it is not added again.

### `remove(object: string): void`
Removes an object from the collection. If the object doesn't exist, nothing happens.

### `get(key: string): string`
Returns an object from the collection based on the hash of the key. The same key will always return the same object (as long as the collection hasn't changed).

### `random(): string`
Returns a random object from the collection. Uses a high-quality random number generator.

### `all(): string[]`
Returns an array of all objects in the collection.

### `len(): number`
Returns the total number of objects in compact storage.

### `looseLen(): number`
Returns the number of objects in loose storage.

### `shrink(): void`
Optimizes the storage by moving all objects to compact storage. This can be useful after many add/remove operations.

## How it Works

The package uses a dual-bucket strategy for object storage:

1. **Loose Bucket**: Handles rapid additions and removals without moving objects around. Uses a free list to track empty slots.
2. **Compact Bucket**: Provides dense storage for efficient lookups and memory usage.

When objects are added, they go into both buckets. When objects are removed, they're marked as removed in the loose bucket and actually removed from the compact bucket.

The `get()` operation first tries the loose bucket, falling back to the compact bucket if necessary. This ensures consistent object distribution even during rapid changes.

The `shrink()` operation consolidates both buckets into the compact form for optimal performance.

## Building from Source

Requirements:
- Node.js 12+
- node-gyp
- C++17 compatible compiler

```bash
git clone https://github.com/yourusername/doublejump-node.git
cd doublejump-node
npm install
```

## Performance Testing

The package includes comprehensive performance benchmarks that measure:
- Add/remove operations with different dataset sizes (1K, 10K, 100K items)
- Lookup performance with 1 million operations
- Random selection performance
- Shrink operation performance
- Memory usage statistics

To run the benchmarks:

```bash
npm run bench
```

Example output:
```
=== DoubleJump Performance Tests ===

Small Dataset Tests (1,000 items)
----------------------------------
Adding 1,000 items: 500,000 ops/sec
Getting items (1,000,000 lookups): 2,500,000 ops/sec
Random selection (1,000,000 selections): 1,800,000 ops/sec
Removing 500 items: 450,000 ops/sec
Shrink operation: 25,000 ops/sec

... medium and large dataset results ...

Memory Usage
------------
heapTotal: 4.23 MB
heapUsed: 3.15 MB
external: 0.89 MB
```

The benchmark suite tests the performance characteristics across different workloads to help you understand how the package performs in your use case.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 