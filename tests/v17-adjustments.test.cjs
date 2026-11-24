const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load.cjs');

test('V0.13 首页与装修预览的人数只在预约按钮上方展示一次', () => {
  const { A, go } = load();
  const s = A.v07.service('BJX01');
  A.S.orders.push({ id: 'V17-POOL', project: s.project, service: s.id,
    resource: s.id + '-1', date: A.v08.days(s)[0], time: A.v08.times(s)[0],
    duration: 60, people: 4, status: '待履约', paid: true, amount: 0 });
  const component = { id: 'v17-today', type: 'today', visible: true, count: 2, ids: [s.id], style: 0 };
  for (const html of [go('U01'), A.decor.component(component, true, true), A.v07Decoration.component(component, true, true)]) {
    const card = html.match(/<a class="home-today-card" href="#\/U06\?id=BJX01">[\s\S]*?<\/a>/)?.[0];
    assert.ok(card, '泳池卡片应展示');
    assert.match(card, /已预约 4\s*\/\s*20人/);
    assert.doesNotMatch(card, /可预约\s*\d+人/);
    assert.ok(card.indexOf('v16-pool-card-count') < card.indexOf('home-today-action'));
    assert.equal((card.match(/v16-pool-card-count/g) || []).length, 1);
  }
});

test('V0.13 业主、员工、PC代客及改期共用精简人数标签，保留约满与容量限制', () => {
  const { A, go, nodes } = load();
  const s = A.v07.service('BJX01'), date = '2099-12-28';
  Object.assign(A.S.v02.v03.merchantServices[s.id], { dateList: [date], slotList: ['09:00', '11:00'] });
  const req = { project: s.project, service: s.id, title: s.name, resource: s.id + '-1', date, time: '09:00', duration: 60, people: 20, amount: 0 };
  const order = A.C.book(A.S, req);
  for (const route of ['U07?id=' + s.id, 'S03?step=2', 'A27?step=2', 'M17?step=2']) {
    A.v07.B.ownerDraft = { service: s.id, resource: req.resource, date, times: [], variant: 'standard', people: 1, couponInitialized: true };
    A.v07.B.proxy = { project: s.project, selected: [s.id], selections: { [s.id]: { resource: req.resource, date, times: [], people: 1, variant: 'standard' } }, goods: {}, lines: [] };
    const html = go(route);
    assert.match(html, /已预约 20\s*\/\s*20人/);
    assert.doesNotMatch(html, /v14-slot-available/);
    assert.match(html, /已约满/);
    assert.match(html, /disabled/);
  }
  A.actions.reschedule({ id: order.id });
  assert.doesNotMatch(nodes.overlay.innerHTML, /v14-slot-available/);
  assert.match(nodes.overlay.innerHTML, /已预约 0\s*\/\s*20人/);
  assert.throws(() => A.C.book(A.S, { ...req, people: 1 }), /人数|容量|约满|占用/);
});

for (const kind of ['booking', 'retail']) test('V0.13 跨标签页同步后' + (kind === 'booking' ? '预约' : '商品') + '下单不读取失效订单引用', () => {
  const { A, scope } = load();
  const listeners = {};
  let reloads = 0;
  scope.addEventListener = (name, fn) => { listeners[name] = fn; };
  scope.location.reload = () => { reloads++; };
  A.start();
  const state = A.S, business = state.v07, members = state.v02, scan = business.v13Scan;
  const orders = state.orders, firstOrder = orders[0], next = JSON.parse(JSON.stringify(state));
  next.profile.nickname = '跨标签页会员';
  next.orders.reverse();
  const event = { key: 'chenclub-prototype-20261111-v1', newValue: JSON.stringify(next) };
  listeners.storage(event);
  assert.equal(reloads, 0, '同步不应重载页面或清除当前填写内容');
  assert.equal(A.S, state, '同步应保留页面共享状态引用');
  assert.equal(A.S.v07, business);
  assert.equal(A.S.v02, members);
  assert.equal(A.S.v07.v13Scan, scan);
  assert.equal(A.S.orders, orders);
  assert.equal(A.S.orders.find(o => o.id === firstOrder.id), firstOrder, '排序后仍保留原订单对象');
  assert.equal(A.S.orders.at(-1).id, firstOrder.id);
  assert.equal(A.S.profile.nickname, '跨标签页会员');
  const M = A.v07, service = M.service('BJX02'), product = M.products().find(p => !p.passService);
  const line = kind === 'booking'
    ? { item: service.id, qty: 1, resource: service.id + '-1', date: A.v08.days(service)[2], time: '09:00', people: 1, variant: 'standard' }
    : { item: product.id, skuId: A.v09.sku(product).id, qty: 1 };
  const group = M.submit({ kind, memberId: A.v08.me().id, lines: [line], coupons: [] });
  assert.ok(group.orderIds.every(id => A.S.orders.some(o => o.id === id)));
  assert.ok(group.orderIds.every(id => A.S.orders.find(o => o.id === id).operator === '会员本人'));
});

test('V0.13 无效及其他业务的缓存事件不破坏当前状态', () => {
  const { A, scope } = load(), listeners = {}, state = A.S;
  let reloads = 0;
  scope.addEventListener = (name, fn) => { listeners[name] = fn; };
  scope.location.reload = () => { reloads++; };
  A.start();
  const key = 'chenclub-prototype-20261111-v1';
  for (const event of [{ key, newValue: JSON.stringify(A.S) }, { key, newValue: '{' },
    { key, newValue: JSON.stringify({ version: 2 }) }, { key, newValue: JSON.stringify({ version: 1 }) }, { key, newValue: null },
    { key: 'another-app', newValue: JSON.stringify(A.S) }]) assert.doesNotThrow(() => listeners.storage(event));
  assert.equal(A.S, state);
  assert.equal(A.S.version, 1);
  assert.equal(reloads, 0);
  assert.ok(A.S.orders.length > 0);
});

test('V0.13 其他标签页重置演示数据时重新初始化各模块', () => {
  const { A, scope } = load(), listeners = {};
  let reloads = 0;
  scope.addEventListener = (name, fn) => { listeners[name] = fn; };
  scope.location.reload = () => { reloads++; };
  A.start();
  listeners.storage({ key: 'chenclub-prototype-20261111-v1', newValue: JSON.stringify(A.C.seed()) });
  assert.equal(reloads, 1);
  assert.ok(A.S.v07, '整页初始化前保留完整业务状态');
});
