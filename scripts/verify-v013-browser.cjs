/* V0.13 真实浏览器核验；运行前在仓库根目录启动 8874 静态服务。 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const target = process.env.CHEN_QA_URL || 'http://127.0.0.1:8874/';
const output = path.resolve(__dirname, '../docs/qa/v4.28.0');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'] });
  const report = { titles: [], selections: [], flows: [], errors: [] };
  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    let navigation = 0;
    const go = async route => {
      const url = new URL(target);
      url.searchParams.set('qa', String(++navigation));
      url.hash = '#/' + route;
      await page.goto(url.href);
      await page.locator('#app .workspace').waitFor();
    };
    const syncFromPeer = async label => {
      const peer = await context.newPage();
      try {
        await peer.goto(target + '#/U01');
        await peer.locator('#app .workspace').waitFor();
        const nickname = '同步核验-' + label;
        await peer.evaluate(nickname => { Club.S.profile.nickname = nickname; Club.save(); }, nickname);
        await page.waitForFunction(nickname => Club.S.profile.nickname === nickname, nickname);
        assert.equal(await page.evaluate(() => Club.S.profile.nickname), nickname);
        report.flows.push({ result: label + '：外部标签页同步后共享数据引用保持一致' });
      } finally { await peer.close(); }
    };
    await go('U01');
    await page.locator('.mobile-screen').evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: output + '/01-home-pool.png' });
    const routes = await page.evaluate(() => Club.pages.filter(p => /^[UST]/.test(p.id)).map(p => p.id));
    for (const route of routes) {
      await page.evaluate(route => { location.hash = '#/' + route; Club.render(); }, route);
      const headers = await page.locator('.device .mp-head').evaluateAll(es => es.map(e => ({
        title: e.innerText, background: getComputedStyle(e).backgroundColor,
        image: getComputedStyle(e).backgroundImage, color: getComputedStyle(e).color
      })));
      for (const head of headers) {
        assert.equal(head.background, 'rgba(0, 0, 0, 0)', route + ': title background');
        assert.equal(head.image, 'none', route + ': title image');
        assert.equal(head.color, 'rgb(60, 48, 40)', route + ': title color');
        report.titles.push({ route, ...head });
      }
      assert.ok(!(await page.locator('#app').innerText()).includes('页面数据异常'), route);
    }
    await go('U01');
    const card = page.locator('.home-today-card').filter({ has: page.locator('.v16-pool-card-count') }).first();
    await card.scrollIntoViewIfNeeded();
    assert.ok((await card.innerText()).indexOf('已预约') < (await card.innerText()).indexOf('立即预约'));
    assert.doesNotMatch(await card.innerText(), /可预约\s*\d+人/);

    for (const [id, coupon, result] of [['BJX01', false, 'U09'], ['BJX02', true, 'U09'], ['BJX02', false, 'U23']]) {
      await page.evaluate(() => { localStorage.clear(); });
      await go('U07?id=' + id);
      if (id === 'BJX02' && !coupon) await syncFromPeer('服务预约');
      await page.locator('[data-action="v08-owner-date"]:not(:disabled)').nth(2).click();
      await page.locator('input[name="time"]:not(:disabled)').first().check({ force: true });
      if (!coupon) {
        await page.locator('[data-action="v08-coupon-open"]').click();
        await page.locator('[data-action="v08-coupon-none"]').click();
        await page.locator('[data-action="v08-coupon-done"]').click();
        await page.waitForURL(url => url.hash.startsWith('#/U07'));
      }
      await page.locator('input[name="phone"]').fill('13800000001');
      const selection = await page.locator('.owner-time-option:has(input:checked)').evaluate(e => {
        e.querySelector('input').blur();
        const a = getComputedStyle(e), b = getComputedStyle(e.querySelector(':scope > span'));
        return { outerBorder: a.borderWidth, outerShadow: a.boxShadow,
          innerBorder: b.borderWidth, innerStyle: b.borderStyle, innerShadow: b.boxShadow };
      });
      assert.equal(selection.outerBorder, '0px');
      assert.equal(selection.outerShadow, 'none');
      assert.equal(selection.innerBorder, '1px');
      assert.equal(selection.innerStyle, 'solid');
      assert.equal(selection.innerShadow, 'none');
      report.selections.push({ id, coupon, ...selection });
      if (id === 'BJX01') {
        await page.locator('.mobile-screen').evaluate(el => { el.scrollTop = 0; });
        await page.screenshot({ path: output + '/02-booking-selection.png' });
      }
      await page.locator('[data-form="book-draft"] button[type="submit"]').click();
      await page.waitForURL(url => url.hash === '#/U08');
      if (id === 'BJX01') {
        await page.locator('.mobile-screen').evaluate(el => { el.scrollTop = 0; });
        await page.screenshot({ path: output + '/03-checkout.png' });
      }
      await page.locator('input[name="agreed"]').check({ force: true });
      await page.locator('[data-form="place-order"] button[type="submit"]').click();
      await page.waitForURL(url => url.hash.startsWith('#/' + result));
      report.flows.push({ id, coupon, result: new URL(page.url()).hash });
      if (result === 'U23') {
        await page.evaluate(() => Club.actions['v08-payment-back']({ id: Club.params.get('id') }));
        await page.waitForURL(url => url.hash === '#/U08');
        await page.locator('input[name="agreed"]').check({ force: true });
        await page.locator('[data-form="place-order"] button[type="submit"]').click();
        await page.waitForURL(url => url.hash.startsWith('#/U23'));
        report.flows.push({ id, coupon, result: '返回修改处理逻辑后再次下单通过（调用既有处理函数）' });
        await page.screenshot({ path: output + '/04-payment.png' });
      }
    }
    await go('U01');
    await syncFromPeer('商品下单');
    await page.evaluate(() => {
      const A = Club, M = A.v07, p = M.products().find(p => !p.passService);
      const sku = A.v09.sku(p);
      M.B.checkout = { kind: 'retail', memberId: A.v08.me().id,
        lines: [{ item: p.id, skuId: sku.id, qty: 1 }], coupons: [] };
      A.save();
    });
    await go('U22');
    await page.locator('[data-form="v09-owner-submit"] button[type="submit"]').click();
    await page.waitForURL(url => url.hash.startsWith('#/U23'));
    report.flows.push({ result: '商品确认订单→立即下单→收银台通过' });
    await go('U29');
    await page.screenshot({ path: output + '/05-cart.png' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await go('A10');
    await page.screenshot({ path: output + '/06-pc-home-editor.png' });
    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify({ headers: report.titles.length, selections: report.selections.length,
      flows: report.flows, errors: report.errors }, null, 2));
  } finally {
    fs.writeFileSync(output + '/browser-audit.json', JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
