#!/usr/bin/env node
/** Export transparent character PNGs from the adventure SDF renderer, offline. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');

const project = path.resolve(__dirname, '..');
const adventure = ['NAILONG_A Adventure', 'NAILONG_ADVENTURE']
  .map(name => path.resolve(project, '..', name))
  .find(folder => fs.existsSync(path.join(folder, 'js/sprites.js')));
if (!adventure) throw new Error('Cannot find the sibling Nailong adventure project.');
const assets = path.join(project, 'assets');
fs.mkdirSync(assets, { recursive: true });

class OfflineCanvas {
  constructor() { this.width = 0; this.height = 0; this.pixels = null; }
  getContext() {
    return { putImageData: image => { this.pixels = image.data; } };
  }
}

class OfflineImageData {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

const context = {
  window: {},
  document: { createElement: tag => {
    if (tag !== 'canvas') throw new Error(`Unsupported element: ${tag}`);
    return new OfflineCanvas();
  } },
  ImageData: OfflineImageData,
  Uint8ClampedArray,
};
vm.runInNewContext(fs.readFileSync(path.join(adventure, 'js/sprites.js'), 'utf8'), context, {
  filename: path.join(adventure, 'js/sprites.js'),
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, bytes) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, bytes])));
  return Buffer.concat([length, name, bytes, checksum]);
}

function encodePng(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const stride = width * 4;
  const rows = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(rows, y * (stride + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function trim(canvas, padding = 20) {
  const { width, height, pixels } = canvas;
  if (!pixels) throw new Error('SDF renderer returned no pixels.');
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3]) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left) throw new Error('SDF renderer returned empty artwork.');
  const outputWidth = right - left + 1 + padding * 2;
  const outputHeight = bottom - top + 1 + padding * 2;
  const output = new Uint8ClampedArray(outputWidth * outputHeight * 4);
  for (let y = top; y <= bottom; y++) {
    const start = (y * width + left) * 4;
    output.set(pixels.subarray(start, start + (right - left + 1) * 4), ((y - top + padding) * outputWidth + padding) * 4);
  }
  return { width: outputWidth, height: outputHeight, pixels: output };
}

const sprites = context.window.NailongAdventure.Sprites;
const jobs = [
  ['nailong-happy.png', () => sprites.buildNailongSprite('happy', 0, false, 400)],
  ['nailong-run.png', () => sprites.buildNailongSprite('run', 0, false, 400)],
  ['nailong.png', () => sprites.buildNailongSprite('idle', 0, false, 400)],
  ['xiaoqi.png', () => sprites.buildXiaoQiSprite(false, 0, 400)],
  ['baobaolong.png', () => sprites.buildBaobaolongSprite('patrol', 0, false, 400)],
];
for (const [name, build] of jobs) {
  const image = trim(build());
  fs.writeFileSync(path.join(assets, name), encodePng(image.width, image.height, image.pixels));
  process.stdout.write(`${name}: ${image.width} x ${image.height}\n`);
}
