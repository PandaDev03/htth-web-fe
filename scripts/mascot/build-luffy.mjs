import sharp from 'sharp';
import { writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'characters/luffy');
const destination = path.join(root, 'public/mascots');
const TILE = 360, SIDE = TILE * 3, BASELINE = 338, MARGIN = 14;
await mkdir(destination, { recursive: true });

// Segment the full sheet: AI grid gutters are not precise enough for a blind crop.
async function segment(kind) {
  const { data, info } = await sharp(path.join(source, kind + '.png'))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== info.height) throw new Error(kind + ': source must be square');
  const w = info.width, h = info.height, labels = new Int32Array(w * h);
  const queue = new Int32Array(w * h), components = [];
  let id = 0;
  for (let p = 0; p < w * h; p++) {
    if (labels[p] || data[p * 4 + 3] < 60) continue;
    id++;
    let head = 0, tail = 1, area = 0, x0 = w, x1 = 0, y0 = h, y1 = 0;
    queue[0] = p; labels[p] = id;
    while (head < tail) {
      const q = queue[head++], x = q % w, y = Math.floor(q / w);
      area++; x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      const neighbors = [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1,
        y > 0 ? q - w : -1, y < h - 1 ? q + w : -1];
      for (const n of neighbors) {
        if (n >= 0 && !labels[n] && data[n * 4 + 3] >= 60) {
          labels[n] = id; queue[tail++] = n;
        }
      }
    }
    components.push({ id, area, x0, x1, y0, y1 });
  }
  const gridIndex = c => Math.min(2, Math.floor((c.y0 + c.y1) / 2 / (h / 3))) * 3
    + Math.min(2, Math.floor((c.x0 + c.x1) / 2 / (w / 3)));
  const bodies = components.filter(c => c.area > 10000).sort((a, b) => gridIndex(a) - gridIndex(b));
  if (bodies.length !== 9 || new Set(bodies.map(gridIndex)).size !== 9)
    throw new Error(kind + ': expected nine distinct character bodies');

  return bodies.map((body, index) => {
    const kept = [body];
    if (kind === 'reactions') {
      kept.push(...components.filter(c => c.area >= 80 && c.area < 10000 &&
        gridIndex(c) === index && c.y1 < body.y0 + (body.y1 - body.y0) * .38));
    }
    const ids = new Set(kept.map(c => c.id));
    const x0 = Math.max(0, Math.min(...kept.map(c => c.x0)) - 3);
    const y0 = Math.max(0, Math.min(...kept.map(c => c.y0)) - 3);
    const x1 = Math.min(w - 1, Math.max(...kept.map(c => c.x1)) + 3);
    const y1 = Math.min(h - 1, Math.max(...kept.map(c => c.y1)) + 3);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, pixels = Buffer.alloc(cw * ch * 4);
    // Keep antialiasing adjacent to accepted components; discard detached generation specks.
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const p = y * w + x;
      let keep = ids.has(labels[p]);
      if (!keep && data[p * 4 + 3] > 0 && data[p * 4 + 3] < 60) {
        for (let dy = -2; dy <= 2 && !keep; dy++) for (let dx = -2; dx <= 2; dx++) {
          if (x + dx >= 0 && x + dx < w && y + dy >= 0 && y + dy < h &&
            ids.has(labels[(y + dy) * w + x + dx])) { keep = true; break; }
        }
      }
      if (keep) data.copy(pixels, ((y - y0) * cw + x - x0) * 4, p * 4, p * 4 + 4);
    }
    let left = w, right = 0;
    for (let y = body.y1 - 60; y <= body.y1 - 35; y++) {
      for (let x = body.x0; x <= body.x1; x++) {
        if (labels[y * w + x] === body.id && data[(y * w + x) * 4 + 3] > 120) {
          left = Math.min(left, x); right = Math.max(right, x);
        }
      }
    }
    const anchorX = (left + right) / 2, bodyWidth = right - left + 1;
    return { kind, index, pixels, cw, ch, x0, y0, x1, y1, body, anchorX, bodyWidth };
  });
}

const directions = await segment('directions'), reactions = await segment('reactions');
const all = [...directions, ...reactions];
// A single common torso width preserves scale between both sheets and reserves symbol margins.
const torsoWidth = Math.min(256, ...all.flatMap(f => [
  (TILE / 2 - MARGIN) * f.bodyWidth / (f.anchorX - f.x0),
  (TILE / 2 - MARGIN) * f.bodyWidth / (f.x1 - f.anchorX),
  (BASELINE - MARGIN) * f.bodyWidth / (f.body.y1 - f.y0)
]));
const transparent = () => sharp({ create: { width: TILE, height: TILE, channels: 4,
  background: { r: 0, g: 0, b: 0, alpha: 0 } } });
async function normalize(f) {
  const scale = torsoWidth / f.bodyWidth;
  const width = Math.round(f.cw * scale), height = Math.round(f.ch * scale);
  const left = Math.round(TILE / 2 - (f.anchorX - f.x0) * scale);
  const top = Math.round(BASELINE - (f.body.y1 - f.y0) * scale);
  if (left < 0 || top < 0 || left + width > TILE || top + height > TILE)
    throw new Error(f.kind + '/' + f.index + ': frame exceeds tile');
  const input = await sharp(f.pixels, { raw: { width: f.cw, height: f.ch, channels: 4 } })
    .resize(width, height, { kernel: 'lanczos3' }).png().toBuffer();
  return transparent().composite([{ input, left, top }]).raw().toBuffer();
}
let frames = await Promise.all(all.map(normalize));
const mask = raw => {
  const result = new Uint8Array(TILE * TILE);
  for (let y = 270; y < 323; y++) for (let x = 0; x < TILE; x++)
    result[y * TILE + x] = raw[(y * TILE + x) * 4 + 3] > 120 ? 1 : 0;
  return result;
};
const reference = mask(frames[4]);
function displacement(raw) {
  const other = mask(raw);
  let best = { score: -1, dx: 0, dy: 0 };
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    let intersection = 0, union = 0;
    for (let y = 276; y < 317; y++) for (let x = 20; x < TILE - 20; x++) {
      const a = reference[y * TILE + x], b = other[(y - dy) * TILE + x - dx];
      if (a || b) union++;
      if (a && b) intersection++;
    }
    const score = intersection / Math.max(1, union);
    if (score > best.score + 1e-9 || (Math.abs(score - best.score) < 1e-9 &&
      Math.abs(dx) + Math.abs(dy) < Math.abs(best.dx) + Math.abs(best.dy))) best = { score, dx, dy };
  }
  return best;
}
const corrections = frames.map(displacement);
frames = frames.map((raw, index) => {
  const { dx, dy } = corrections[index], shifted = Buffer.alloc(raw.length);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const sx = x - dx, sy = y - dy;
    if (sx >= 0 && sx < TILE && sy >= 0 && sy < TILE)
      raw.copy(shifted, (y * TILE + x) * 4, (sy * TILE + sx) * 4, (sy * TILE + sx) * 4 + 4);
  }
  return shifted;
});

const report = { generatedAt: new Date().toISOString(), tile: TILE, atlas: SIDE, displaySize: 160,
  torsoWidth, frames: [], files: [] };
for (const [kind, offset] of [['directions', 0], ['reactions', 9]]) {
  const overlays = [];
  for (let i = 0; i < 9; i++) {
    const raw = frames[offset + i];
    let transparentPixels = 0, minX = TILE, maxX = 0, minY = TILE, maxY = 0;
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const alpha = raw[(y * TILE + x) * 4 + 3];
      if (alpha === 0) transparentPixels++;
      if (alpha > 40) { minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    }
    if (Math.min(minX, minY, TILE - 1 - maxX, TILE - 1 - maxY) < 5)
      throw new Error(kind + '/' + i + ': insufficient edge clearance');
    const measured = displacement(raw);
    report.frames.push({ kind, index: i, bounds: [minX, minY, maxX, maxY],
      transparentRatio: transparentPixels / (TILE * TILE), correction: corrections[offset + i],
      residualShiftAt160: Math.hypot(measured.dx, measured.dy) * 160 / TILE,
      torsoOverlap: measured.score });
    const input = await sharp(raw, { raw: { width: TILE, height: TILE, channels: 4 } }).png().toBuffer();
    overlays.push({ input, left: (i % 3) * TILE, top: Math.floor(i / 3) * TILE });
  }
  const atlas = sharp({ create: { width: SIDE, height: SIDE, channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(overlays);
  const output = path.join(destination, 'luffy-' + kind + '.webp');
  await atlas.clone().webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(output);
  const metadata = await sharp(output).metadata();
  if (!metadata.hasAlpha || metadata.width !== SIDE || metadata.height !== SIDE || (metadata.pages ?? 1) !== 1)
    throw new Error('Invalid static WebP atlas: ' + output);
  report.files.push({ name: path.basename(output), bytes: (await stat(output)).size,
    width: metadata.width, height: metadata.height, hasAlpha: metadata.hasAlpha });
}
report.maxResidualShiftAt160 = Math.max(...report.frames.map(f => f.residualShiftAt160));
if (report.maxResidualShiftAt160 > 1) throw new Error('Torso alignment exceeds 1px at 160px');
await writeFile(path.join(source, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, frames: undefined }, null, 2));
