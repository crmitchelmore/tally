const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Landing page hero
  await page.goto('https://tally-tracker.app');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'public/screenshots/landing-hero.png' });

  // Desktop view
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://tally-tracker.app');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'public/screenshots/desktop-hero.png' });

  await browser.close();
  console.log('Screenshots captured!');
}

captureScreenshots().catch(console.error);
