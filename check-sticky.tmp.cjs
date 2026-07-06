const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:5173');
  await page.waitForSelector('.app-header');

  await page.fill('.search-bar__input', 'cat');
  await page.click('.search-bar__button');
  await page.waitForSelector('.gif-list__item', { timeout: 10000 });
  await page.waitForTimeout(500);

  const before = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    return {
      htmlOverflow: getComputedStyle(html).overflow,
      bodyOverflow: getComputedStyle(body).overflow,
      bodyPosition: getComputedStyle(body).position,
      bodyHeight: getComputedStyle(body).height,
      htmlHeight: getComputedStyle(html).height,
    };
  });
  console.log(before);

  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(400);

  const scrollInfo = await page.evaluate(() => ({
    scrollY: window.scrollY,
    docScrollTop: document.documentElement.scrollTop,
    bodyScrollTop: document.body.scrollTop,
  }));
  console.log('after wheel', scrollInfo);

  const headerBox = await page.locator('.app-header').boundingBox();
  console.log('header box after wheel scroll:', headerBox);

  await page.screenshot({ path: '/Users/steven/Projects/Work/NotGiphy/after-wheel.png' });

  await browser.close();
})();
