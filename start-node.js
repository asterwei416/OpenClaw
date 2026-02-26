const { spawn } = require('child_process');

const child = spawn('node', [
  'dist/index.js', 
  'node', 'run', 
  '--host', 'asterwei-openclaw.zeabur.app', 
  '--port', '443', 
  '--tls'
], { stdio: 'inherit' });

child.on('close', (code) => {
  process.exit(code);
});
