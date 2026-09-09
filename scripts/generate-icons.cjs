// Run from the repository root after installing tally-web dependencies.
// The generated colour reference informed the native, deterministic mark geometry.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('../tally-web/node_modules/sharp');

const root = path.resolve(__dirname, '..');
const icons = path.join(root, 'assets/icons');
const web = path.join(root, 'tally-web/public');
const ios = path.join(root, 'ios/App/Resources/Assets.xcassets/AppIcon.appiconset');
const android = path.join(root, 'tally-android/app/src/main/res');
const svg = (body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`);
const background = '<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#6255EE"/><stop offset="0.5" stop-color="#4F46E5"/><stop offset="1" stop-color="#3730A3"/></linearGradient></defs><path fill="url(#bg)" d="M0 0H1024V1024H0Z"/>';
const roundMask = (radius) => svg(`<rect width="1024" height="1024" rx="${radius}" fill="white"/>`);
async function png(input, size, destination, opaque = false) {
  let pipeline = sharp(input).resize(size, size, { kernel: 'lanczos3' }).toColourspace('srgb');
  if (opaque) pipeline = pipeline.removeAlpha();
  await pipeline.png({ compressionLevel: 9 }).toFile(destination);
}

(async () => {
  const markFile = await fs.readFile(path.join(icons, 'source/mark.svg'), 'utf8');
  const mark = markFile.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const master = svg(background + mark);
  await fs.writeFile(path.join(icons, 'icon.svg'), master);
  for (const size of [1024, 512, 192]) await png(master, size, path.join(icons, `icon-${size}.png`), true);
  await png(master, 180, path.join(icons, 'apple-touch-icon.png'), true);
  // Optically enlarge the mark in browser tabs; full-bleed indigo still fills every edge.
  for (const size of [16, 32, 48]) {
    await png(svg(background + `<g transform="translate(-61.44 -61.44) scale(1.12)">${mark}</g>`), size, path.join(icons, `favicon-${size}x${size}.png`), true);
  }
  // ICO container with PNG entries: no lossy palette conversion.
  const icoImages = await Promise.all([16, 32, 48].map(s => fs.readFile(path.join(icons, `favicon-${s}x${s}.png`))));
  const header = Buffer.alloc(6 + 16 * icoImages.length);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(icoImages.length, 4);
  let offset = header.length;
  icoImages.forEach((image, i) => {
    const at = 6 + 16 * i; header[at] = header[at + 1] = [16, 32, 48][i];
    header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(image.length, at + 8); header.writeUInt32LE(offset, at + 12); offset += image.length;
  });
  await fs.writeFile(path.join(icons, 'favicon.ico'), Buffer.concat([header, ...icoImages]));
  // PWA maskable variant has all essential artwork inside the central 80% circle.
  await png(master, 512, path.join(icons, 'icon-maskable-512.png'), true);
  for (const name of ['icon.svg', 'icon-512.png', 'icon-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png']) {
    await fs.copyFile(path.join(icons, name), path.join(web, name));
  }
  await png(master, 1024, path.join(ios, 'AppIcon-1024.png'), true);
  await png(svg(mark), 1024, path.join(ios, 'AppIcon-dark.png'));
  await sharp(svg(mark)).flatten({ background: '#000000' }).greyscale().toColourspace('srgb').png().toFile(path.join(ios, 'AppIcon-tinted.png'));
  await fs.writeFile(path.join(ios, 'Contents.json'), JSON.stringify({ images: [
    { filename: 'AppIcon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' },
    ...['dark', 'tinted'].map(value => ({ appearances: [{ appearance: 'luminosity', value }], filename: `AppIcon-${value}.png`, idiom: 'universal', platform: 'ios', size: '1024x1024' })),
  ], info: { author: 'xcode', version: 1 } }, null, 2) + '\n');
  for (const mode of ['dark', 'tinted']) await fs.copyFile(path.join(ios, `AppIcon-${mode}.png`), path.join(icons, `icon-${mode}.png`));
  // Android uses a vector at every density. The 0.76 transform places the complete
  // mark inside the 66dp safe circle in a 108dp layer, including its diagonal ends.
  const vector = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="1024" android:viewportHeight="1024">
  <group android:scaleX="0.76" android:scaleY="0.76" android:pivotX="512" android:pivotY="512">
    <path android:pathData="M314,276L314,750M446,276L446,750M578,276L578,750M710,276L710,750" android:strokeColor="#FFF9F2" android:strokeWidth="76" android:strokeLineCap="round"/>
    <path android:pathData="M222,699L810,358" android:strokeColor="#FF947E" android:strokeWidth="66" android:strokeLineCap="round"/>
  </group>
</vector>\n`;
  await fs.writeFile(path.join(android, 'drawable/ic_launcher_foreground.xml'), vector);
  await fs.writeFile(path.join(android, 'drawable/ic_launcher_background.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android"><gradient android:angle="315" android:startColor="#6255EE" android:centerColor="#4F46E5" android:endColor="#3730A3"/></shape>\n');
  const adaptive = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@drawable/ic_launcher_background"/>\n    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n    <monochrome android:drawable="@drawable/ic_launcher_foreground"/>\n</adaptive-icon>\n';
  for (const name of ['ic_launcher', 'ic_launcher_round']) await fs.writeFile(path.join(android, `mipmap-anydpi-v26/${name}.xml`), adaptive);
  const full = await sharp(master).png().toBuffer();
  for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    for (const [name, radius] of [['ic_launcher', 224], ['ic_launcher_round', 512]]) {
      const masked = await sharp(full).composite([{ input: roundMask(radius), blend: 'dest-in' }]).png().toBuffer();
      await png(masked, size, path.join(android, `mipmap-${density}/${name}.png`));
    }
    await fs.rm(path.join(android, `mipmap-${density}/ic_launcher_foreground.png`), { force: true });
  }
  console.log('Generated web, iOS light/dark/tinted, and Android adaptive/themed/legacy icons.');
})().catch(error => { console.error(error); process.exitCode = 1; });
