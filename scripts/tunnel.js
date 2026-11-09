const { spawn } = require('child_process');
const fs = require('fs');

const port = process.argv[2] ? parseInt(process.argv[2]) : (process.env.PORT || 3000);
const host = process.argv[3] || process.env.HOST || '127.0.0.1';

const candidates = [
  'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
  'C:\\Program Files\\cloudflared\\cloudflared.exe',
  'cloudflared',
];

let bin = 'cloudflared';
for (const c of candidates) {
  if (c === 'cloudflared') {
    bin = c;
  } else if (fs.existsSync(c)) {
    bin = c;
    break;
  }
}

const http = require('http');

console.log(`\x1b[36mMemulai Cloudflare Quick Tunnel (trycloudflare.com)...\x1b[0m`);
console.log(`\x1b[90mMenggunakan binary: ${bin}\x1b[0m`);
console.log(`\x1b[90mTarget: http://${host}:${port}\x1b[0m\n`);

// Periksa apakah server Next.js sudah menyala
const checkReq = http.get(`http://${host}:${port}`, () => {});
checkReq.on('error', () => {
  console.log(
    `\x1b[33m⚠️  PERHATIAN: Server (port ${port}) terdeteksi belum aktif.\x1b[0m\n` +
    `\x1b[33m   Pastikan Anda telah menjalankan server di jendela terminal lain!\x1b[0m\n`
  );
});
checkReq.setTimeout(1500, () => checkReq.destroy());

const tunnel = spawn(bin, ['tunnel', '--url', `http://${host}:${port}`], {
  stdio: 'inherit',
});

tunnel.on('error', (err) => {
  console.error('\x1b[31mGagal menjalankan cloudflared:\x1b[0m', err.message);
  console.log('\nPastikan cloudflared telah terinstall di sistem Anda.');
});

process.on('SIGINT', () => {
  tunnel.kill('SIGINT');
  process.exit(0);
});