#!/usr/bin/env node

/**
 * Test Script for NexusSync AI
 * Validates project structure and performs basic checks
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(type, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  switch (type) {
    case 'pass':
      console.log(`${colors.green}✓${colors.reset} [${timestamp}] ${message}`);
      testsPassed++;
      break;
    case 'fail':
      console.log(`${colors.red}✗${colors.reset} [${timestamp}] ${message}`);
      testsFailed++;
      break;
    case 'info':
      console.log(`${colors.blue}ℹ${colors.reset} [${timestamp}] ${message}`);
      break;
    case 'warn':
      console.log(`${colors.yellow}⚠${colors.reset} [${timestamp}] ${message}`);
      break;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function directoryExists(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

async function runTests() {
  console.log(`\n${colors.blue}=== NexusSync AI Test Suite ===${colors.reset}\n`);

  // Test 1: Project structure
  log('info', 'Checking project structure...');
  const rootPath = path.join(__dirname, '..');

  const requiredDirs = [
    'public',
    'data',
    'data/schemas',
    'data/templates',
    'docs'
  ];

  const requiredFiles = [
    'server.js',
    'package.json',
    'README.md'
  ];

  // Check directories
  console.log();
  for (const dir of requiredDirs) {
    const fullPath = path.join(rootPath, dir);
    if (directoryExists(fullPath)) {
      log('pass', `Directory exists: ${dir}`);
    } else {
      log('fail', `Directory missing: ${dir}`);
    }
  }

  // Check files
  console.log();
  for (const file of requiredFiles) {
    const fullPath = path.join(rootPath, file);
    if (fileExists(fullPath)) {
      log('pass', `File exists: ${file}`);
    } else {
      log('fail', `File missing: ${file}`);
    }
  }

  // Test 2: Dependencies check
  console.log(`\n${colors.blue}=== Dependency Check ===${colors.reset}\n`);
  const nodeModulesPath = path.join(rootPath, 'node_modules');
  if (directoryExists(nodeModulesPath)) {
    log('pass', 'node_modules directory exists');
  } else {
    log('warn', 'node_modules not installed. Run: npm install');
  }

  // Test 3: Environment setup
  console.log(`\n${colors.blue}=== Environment Check ===${colors.reset}\n`);
  const envPath = path.join(rootPath, '.env');
  const envExamplePath = path.join(rootPath, '.env.example');
  
  if (fileExists(envPath)) {
    log('pass', '.env file configured');
  } else if (fileExists(envExamplePath)) {
    log('warn', '.env not found. Copy from .env.example and configure');
  } else {
    log('fail', 'Neither .env nor .env.example found');
  }

  // Test 4: Public assets
  console.log(`\n${colors.blue}=== Public Assets Check ===${colors.reset}\n`);
  const publicDirs = [
    'public/js',
    'public/styles',
    'public/workers',
    'public/assets'
  ];

  for (const dir of publicDirs) {
    const fullPath = path.join(rootPath, dir);
    if (directoryExists(fullPath)) {
      log('pass', `Asset directory exists: ${dir}`);
    } else {
      log('warn', `Asset directory missing: ${dir}`);
    }
  }

  // Test summary
  console.log(`\n${colors.blue}=== Test Summary ===${colors.reset}\n`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  if (testsFailed > 0) {
    console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  }

  console.log();
  if (testsFailed === 0) {
    console.log(`${colors.green}All checks passed! ✓${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}Some checks failed. Please review above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite error:${colors.reset}`, error);
  process.exit(1);
});
