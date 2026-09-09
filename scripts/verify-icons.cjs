const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('../tally-web/node_modules/sharp');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFile(path.join(root, name));
(async () => {
  let checked = 0;
  for (const [name, size] of Object.entries({ 'icon-1024.png': 1024, 'icon-512.png': 512, 'icon-192.png': 192, 'icon-maskable-512.png': 512, 'apple-touch-icon.png': 180, 'favicon-16x16.png': 16, 'favicon-32x32.png': 32, 'favicon-48x48.png': 48 })) {
    const bytes = await read(`assets/icons/${name}`), m = await sharp(bytes).metadata();
    assert.equal(m.width, size); assert.equal(m.height, size); assert.equal(m.hasAlpha, false, `${name} must fill its square`);
    if (size !== 1024) assert.deepEqual(await read(`tally-web/public/${name}`), bytes, `Web icon drift: ${name}`);
    checked++;
  }
  const iosDir = 'ios/App/Resources/Assets.xcassets/AppIcon.appiconset';
  const catalog = JSON.parse(await read(`${iosDir}/Contents.json`));
  assert.equal(catalog.images.length, 3);
  for (const item of catalog.images) {
    const bytes = await read(`${iosDir}/${item.filename}`), m = await sharp(bytes).metadata();
    assert.equal(m.width, 1024); assert.equal(m.height, 1024);
    if (item.filename === 'AppIcon-1024.png') assert.deepEqual(bytes, await read('assets/icons/icon-1024.png'));
    if (item.filename === 'AppIcon-tinted.png') {
      const { data, info } = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
      for (let i = 0; i < data.length; i += info.channels) assert.ok(data[i] === data[i + 1] && data[i] === data[i + 2], 'Tinted icon must be grayscale');
      assert.equal(m.hasAlpha, false);
    }
    checked++;
  }
  const { data, info } = await sharp(await read(`${iosDir}/AppIcon-dark.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let visible = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 16) {
    visible++;
    const radius = Math.hypot(x - 512, y - 512);
    assert.ok(radius < 409.6, 'PWA maskable safe circle clips the mark');
    assert.ok(radius * .76 < 1024 * 33 / 108, 'Android adaptive safe circle clips the mark');
  }
  assert.ok(visible > 100000 && visible < 300000, 'Missing foreground or opaque dark background');
  const manifest = JSON.parse(await read('tally-web/public/site.webmanifest'));
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) await fs.access(path.join(root, 'tally-web/public', icon.src.split('?')[0]));
  for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) for (const icon of ['ic_launcher', 'ic_launcher_round']) {
    const m = await sharp(await read(`tally-android/app/src/main/res/mipmap-${density}/${icon}.png`)).metadata();
    assert.equal(m.width, size); assert.equal(m.height, size); checked++;
  }
  for (const icon of ['ic_launcher', 'ic_launcher_round']) {
    const xml = String(await read(`tally-android/app/src/main/res/mipmap-anydpi-v26/${icon}.xml`));
    assert.ok(xml.includes('<monochrome') && xml.includes('@drawable/ic_launcher_foreground'));
  }
  console.log(`${checked} icon exports verified: dimensions, web/native parity, opacity, grayscale and mask safety.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
