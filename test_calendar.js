const { spawn } = require('child_process');
const fs = require('fs');

try {
  const refreshToken = fs.readFileSync('refresh_token.txt', 'utf8').trim();
  console.log('Loaded Refresh Token:', refreshToken.substring(0, 10) + '...');

  const env = {
    ...process.env,
    GOOGLE_CLIENT_ID: '762797721491-kcumk3mhbbjdg2hejfskclrlspg3rigf.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: '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',
    GOOGLE_USER_EMAIL: 'tristan416@gmail.com',
    GOOGLE_REFRESH_TOKEN: refreshToken
  };

  const child = spawn('npx', ['-y', 'mcp-server-google-workspace'], { env, shell: true });
  
  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    output += data.toString();
    // Check if we got a response
    if (output.includes('"result"')) {
      console.log('\n--- API RESPONSE ---\n');
      console.log(output);
      console.log('\n--- END RESPONSE ---\n');
      child.kill(); 
      process.exit(0);
    }
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  // Wait for server start then send request
  setTimeout(() => {
    const request = JSON.stringify({
      jsonrpc: '2.0', 
      method: 'tools/call', 
      params: { 
        name: 'calendar_list_events', 
        arguments: {} 
      }, 
      id: 10 
    }) + '\n';
    
    console.log('Sending request...');
    child.stdin.write(request);
  }, 3000);

  // Timeout safety
  setTimeout(() => {
    console.log('Timeout. Stderr:', errorOutput);
    console.log('Stdout:', output);
    child.kill();
  }, 15000);

} catch (err) {
  console.error('Error:', err);
}
