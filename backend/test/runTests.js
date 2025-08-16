#!/usr/bin/env node

/**
 * Test Runner Script
 * Provides easy way to run specific test suites
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = join(__dirname, '..');

const testSuites = {
  all: 'test/',
  models: 'test/models/',
  services: 'test/services/', 
  integration: 'test/integration/',
  user: 'test/services/UserService.test.js',
  hangout: 'test/services/HangoutService.test.js',
  bill: 'test/services/BillService.test.js',
  workflow: 'test/integration/fullWorkflow.test.js'
};

function runTests(suite = 'all') {
  const testPath = testSuites[suite] || testSuites.all;
  
  console.log(`🧪 Running ${suite} tests...`);
  console.log(`📁 Test path: ${testPath}`);
  console.log('');

  const jestArgs = [
    testPath,
    '--verbose',
    '--colors',
    '--detectOpenHandles',
    '--forceExit'
  ];

  const jest = spawn('npx', ['jest', ...jestArgs], {
    cwd: backendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });

  jest.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Tests completed successfully!');
    } else {
      console.log('\n❌ Tests failed!');
      process.exit(code);
    }
  });

  jest.on('error', (error) => {
    console.error('❌ Failed to start tests:', error);
    process.exit(1);
  });
}

function showHelp() {
  console.log('🧪 Backend Test Runner\n');
  console.log('Usage: node runTests.js [suite]\n');
  console.log('Available test suites:');
  Object.entries(testSuites).forEach(([name, path]) => {
    console.log(`  ${name.padEnd(12)} - ${path}`);
  });
  console.log('\nExamples:');
  console.log('  node runTests.js all         # Run all tests');
  console.log('  node runTests.js services    # Run service tests');
  console.log('  node runTests.js user        # Run user service tests');
  console.log('  node runTests.js workflow    # Run integration tests');
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else {
  runTests(command);
}
