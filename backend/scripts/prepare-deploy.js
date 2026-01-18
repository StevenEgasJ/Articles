const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', shell: true });
}

try {
  // Build frontend
  run('cd ../frontend && npm ci && npm run build');

  const src = path.join(__dirname, '..', '..', 'frontend', 'dist', 'frontend');
  const dest = path.join(__dirname, '..', 'public');

  // Remove dest if exists
  if (fs.existsSync(dest)) {
    console.log('Removing existing public directory');
    fs.rmSync(dest, { recursive: true, force: true });
  }

  // Copy recursively
  console.log(`Copying ${src} -> ${dest}`);
  fs.cpSync(src, dest, { recursive: true });
  console.log('Frontend artifacts copied to public/');
} catch (err) {
  console.error('prepare-deploy failed:', err);
  process.exit(1);
}
