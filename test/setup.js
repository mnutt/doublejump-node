const { execSync } = require('child_process');
const path = require('path');

// Ensure we're in the project root
process.chdir(path.join(__dirname, '..'));

// Rebuild the native module
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to build native module:', error);
  process.exit(1);
} 