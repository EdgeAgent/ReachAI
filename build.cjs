#!/usr/bin/env node
// build.cjs - Custom build script for ReachAI Electron app

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist-electron');

function clean() {
  console.log('Cleaning dist-electron...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', cwd: __dirname });
}

async function build() {
  try {
    clean();
    console.log('Building main process...');
    run('npx vite build --config electron/main.vite.config.ts');

    console.log('Building preload script...');
    run('npx vite build --config electron/preload.vite.config.ts');

    console.log('Building renderer...');
    run('npx vite build --config electron/renderer.vite.config.ts');

    console.log('\n✅ Build complete! Output in dist-electron/');
  } catch (err) {
    console.error('\n❌ Build failed:', err.message);
    process.exit(1);
  }
}

build();
