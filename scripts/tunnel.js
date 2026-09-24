const { spawn } = require('child_process');
const fs = require('fs');

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
console.log(`\x1b[90mMenggunakan binary: ${bin}\x1b[0m\n`);

// Periksa apakah server Next.js (port 3000) sudah menyala
const checkReq = http.get('http://127.0.0.1:3000', () => {});
checkReq.on('error', () => {
    console.log(
        `\x1b[33m⚠️  PERHATIAN: Server Next.js (port 3000) terdeteksi belum aktif.\x1b[0m\n` +
        `\x1b[33m   Pastikan Anda telah menjalankan 'npm run dev' di jendela terminal lain!\x1b[0m\n`
    );
});
checkReq.setTimeout(1500, () => checkReq.destroy());

const tunnel = spawn(bin, ['tunnel', '--url', 'http://127.0.0.1:3000'], {
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
