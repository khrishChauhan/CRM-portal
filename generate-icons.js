/**
 * Generates proper PNG icon files for the PWA.
 * Uses only Node.js built-in modules (no dependencies).
 * Creates a blue gradient square with a white "K" letter centered.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ─── PNG helpers ─────────────────────────────────────────────────────────────

function writeUint32BE(buf, value, offset) {
    buf[offset] = (value >>> 24) & 0xff;
    buf[offset + 1] = (value >>> 16) & 0xff;
    buf[offset + 2] = (value >>> 8) & 0xff;
    buf[offset + 3] = value & 0xff;
}

function crc32(data) {
    const table = (() => {
        const t = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            t[i] = c;
        }
        return t;
    })();
    let crc = 0xffffffff;
    for (const byte of data) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    writeUint32BE(lenBuf, data.length, 0);
    const crcInput = Buffer.concat([typeBytes, data]);
    const crcBuf = Buffer.alloc(4);
    writeUint32BE(crcBuf, crc32(crcInput), 0);
    return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function makePNG(size) {
    // IHDR
    const ihdr = Buffer.alloc(13);
    writeUint32BE(ihdr, size, 0);   // width
    writeUint32BE(ihdr, size, 4);   // height
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 2;  // color type: RGB
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    // Build pixel rows — blue gradient with white "K"
    const rows = [];
    const cx = size / 2;
    const cy = size / 2;
    const letterScale = size / 512;

    // Simple K letter strokes (relative to 512px grid, scaled)
    const isWhiteLetter = (px, py) => {
        const x = px - cx;
        const y = py - cy;
        const s = letterScale;
        const vw = 36 * s, hw = 28 * s;
        const h = 200 * s;
        const top = -h / 2, bot = h / 2;
        const left = -90 * s;
        // Vertical bar of K
        if (x >= left && x <= left + vw && y >= top && y <= bot) return true;
        // Upper arm of K
        if (y >= top && y <= -8 * s) {
            const armRight = left + vw + (-(y - top) * 0.9);
            if (x >= left + vw && x <= armRight + hw && x <= cx + 80*s) return true;
        }
        // Lower arm of K
        if (y >= -8 * s && y <= bot) {
            const armRight = left + vw + ((y + 8 * s) * 0.9);
            if (x >= left + vw && x <= armRight + hw && x <= cx + 80*s) return true;
        }
        return false;
    };

    for (let y = 0; y < size; y++) {
        // filter byte = 0 (None)
        const row = Buffer.alloc(1 + size * 3);
        row[0] = 0;
        for (let x = 0; x < size; x++) {
            let r, g, b;
            if (isWhiteLetter(x, y)) {
                r = 255; g = 255; b = 255;
            } else {
                // Blue gradient: top-left #3b82f6 → bottom-right #1e3a8a
                const t = (x + y) / (size * 2);
                r = Math.round(59  + (30  - 59)  * t);
                g = Math.round(130 + (58  - 130) * t);
                b = Math.round(246 + (138 - 246) * t);
            }
            const i = 1 + x * 3;
            row[i] = r; row[i + 1] = g; row[i + 2] = b;
        }
        rows.push(row);
    }

    const rawData = Buffer.concat(rows);
    const compressed = zlib.deflateSync(rawData, { level: 6 });

    const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const pngData = Buffer.concat([
        PNG_SIGNATURE,
        chunk('IHDR', ihdr),
        chunk('IDAT', compressed),
        chunk('IEND', Buffer.alloc(0))
    ]);

    return pngData;
}

// ─── Generate icons ───────────────────────────────────────────────────────────

const outputDir = path.join(__dirname, 'client', 'public', 'icons');
fs.mkdirSync(outputDir, { recursive: true });

const icon192 = makePNG(192);
const icon512 = makePNG(512);

fs.writeFileSync(path.join(outputDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(outputDir, 'icon-512.png'), icon512);

// Also write to public root (for apple-touch-icon)
const rootDir = path.join(__dirname, 'client', 'public');
fs.writeFileSync(path.join(rootDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(rootDir, 'icon-512.png'), icon512);

console.log('✅ icon-192.png generated:', icon192.length, 'bytes');
console.log('✅ icon-512.png generated:', icon512.length, 'bytes');
console.log('   Both are valid PNG (header: 89 50 4e 47)');
console.log('   Header check 192:', icon192.slice(0,4).toString('hex'));
console.log('   Header check 512:', icon512.slice(0,4).toString('hex'));

// Verify dimensions are correct
const w192 = icon192.readUInt32BE(16);
const h192 = icon192.readUInt32BE(20);
const w512 = icon512.readUInt32BE(16);
const h512 = icon512.readUInt32BE(20);
console.log(`   icon-192.png dimensions: ${w192}x${h192}`);
console.log(`   icon-512.png dimensions: ${w512}x${h512}`);
