const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./helpers/load.cjs');

function makeOperatorOrder(A) {
  const M = A.v07;
  const product = M.products()[0];
  const sku = A.v09.sku(product);
  return M.submit({
    kind: 'retail',
    operator: true,
    lines: [{ item: product.id, skuId: sku.id, qty: 1 }]
  });
}

function makeLegacyOperatorOrder(A) {
  const M = A.v07;
  const product = M.products()[0];
  const group = M.submit({
    kind: 'retail',
    operator: true,
    lines: [{ item: product.id, skuId: A.v09.sku(product).id, qty: 1 }]
  });
  const order = A.S.orders.find(o => o.id === group.orderIds[0]);
  M.B.groups = M.B.groups.filter(g => g.id !== group.id);
  delete order.paymentGroup;
  order.staffOrder = false;
  order.operator = '会所前台';
  order.origin = '代客下单';
  order.source = '代客下单';
  return order;
}

const paymentRoutes = groupId => [
  'S03?step=5&id=' + groupId,
  'A27?step=5&id=' + groupId,
  'M17?step=5&id=' + groupId,
  'S04?id=' + groupId,
  'S10?step=5&id=' + groupId,
  'T03?step=5&id=' + groupId,
  'T04?id=' + groupId,
  'A28?step=5&id=' + groupId
];

test('所有代客收款入口都明确展示在线会员扫码与线下收款', () => {
  const { A, go } = load();
  const group = makeOperatorOrder(A);

  for (const route of paymentRoutes(group.id)) {
    const html = go(route);
    assert.match(html, /在线支付/, route);
    assert.match(html, /会员扫码支付/, route);
    assert.match(html, /线下支付/, route);
    assert.match(html, /现场收款/, route);
  }
});

test('选择在线支付展示会员扫码二维码，选择线下支付提示确认到账', () => {
  const { A, go } = load();
  const group = makeOperatorOrder(A);
  const route = paymentRoutes(group.id)[0];

  go(route);
  A.actions['v07-method']({ id: group.id, value: 'online' });
  let html = go(route);
  assert.match(html, /data-qr="CHEN-PAY:/);
  assert.match(html, /会员使用微信扫码支付/);
  assert.match(html, /确认会员已完成支付/);

  A.actions['v07-method']({ id: group.id, value: 'offline' });
  html = go(route);
  assert.match(html, /线下支付已选择/);
  assert.match(html, /确认实际到账/);
  assert.match(html, /确认线下款项已到账/);
});

test('首页今日可约卡片用弹性内容区将预约按钮对齐到底部', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../v18-adjustments.css'), 'utf8');
  assert.match(css, /home-today-card[^{}]*\{[^}]*display:\s*flex/);
  assert.match(css, /home-today-info[^{}]*\{[^}]*flex:\s*1/);
  assert.match(css, /home-today-action[^{}]*\{[^}]*margin-top:\s*auto/);
});

test('历史代客订单无付款单时仍进入代客双方式收款页', () => {
  const { A, go } = load();
  const order = makeLegacyOperatorOrder(A);
  const html = go('U23?id=' + order.id);
  assert.match(html, /会员扫码支付/);
  assert.match(html, /线下支付/);
  assert.doesNotMatch(html, /v19-wechat-method/);
  assert.match(go('A27?step=5&id=' + order.id), /会员扫码支付/);
  assert.match(go('M17?step=5&id=' + order.id), /会员扫码支付/);
});


test('历史订单从移动和PC详情恢复收款始终保留当前端', () => {
  for (const route of ['S08', 'T08', 'A08', 'A25', 'M07', 'M16']) {
    const { A, go } = load();
    const o = makeLegacyOperatorOrder(A);
    const h = go(route + (/^[ST]/.test(route) ? '?id=' + o.id : ''));
    const prefix = /^[ST]/.test(route) ? 'S04' : route.startsWith('M') ? 'M17' : 'A27';
    assert.ok(h.includes('href="#/' + prefix + (prefix === 'S04' ? '?id=' : '?step=5&id=') + o.id + '"'), route);
    const payRoute = prefix + (prefix === 'S04' ? '?id=' : '?step=5&id=') + o.id;
    assert.match(go(payRoute), /会员扫码支付/);
    const g = A.v07.B.groups.find(g => g.orderIds.includes(o.id));
    assert.ok(g.operator, route);
    assert.equal(A.v07.B.groups.filter(g => g.orderIds.includes(o.id)).length, 1);
    assert.match(go(payRoute), /线下支付/);
    assert.equal(A.v07.B.groups.filter(g => g.orderIds.includes(o.id)).length, 1);
  }
});

test('各端预约及商品单在线线下收款后同步金额、渠道和完成页且拒绝重复确认', () => {
  for (const route of ['S03', 'A27', 'M17']) for (const kind of ['booking', 'retail']) for (const method of ['online', 'offline']) {
    const { A, go } = load(), M = A.v07;
    const p = M.products()[0];
    const lines = kind === 'booking' ? [{ item: 'BJX02', resource: 'BJX02-2', date: '2099-12-28', time: '18:00', qty: 1, people: 1 }] : [{ item: p.id, qty: 1 }];
    const g = M.submit({ kind, operator: true, lines, identity: 'na' });
    assert.ok(g.total > 0);
    go(route + '?step=5&id=' + g.id);
    A.actions['v07-method']({ id: g.id, value: method });
    A.actions['v07-pay']({ id: g.id });
    A.render();
    assert.equal(A.route, route);
    assert.equal(A.params.get('step'), '6');
    assert.equal(g.status, '已支付');
    assert.ok(g.orderIds.every(id => A.S.orders.find(o => o.id === id).channel === (method === 'online' ? '在线扫码支付' : '线下收款')));
    assert.throws(() => A.actions['v07-pay']({ id: g.id }), /支付|状态/);
  }
});

test('普通会员订单保留微信收银台，已错误标记的代客付款单恢复扫码与线下方式', () => {
  const { A, go } = load(), M = A.v07;
  const g = M.submit({ kind: 'retail', operator: false, lines: [{ item: M.products()[0].id, qty: 1 }] });
  assert.equal(A.S.orders.find(o => o.id === g.orderIds[0]).operator, '会员本人');
  assert.match(go('U23?id=' + g.id), /v19-wechat-method/);
  const proxy = makeOperatorOrder(A);
  proxy.operator = false;
  assert.match(go('U23?id=' + proxy.id), /会员扫码支付/);
  assert.equal(proxy.operator, true);
});

test('员工查看普通会员自助订单时继续支付保留原会员收银台', () => {
  const { A, go } = load(), M = A.v07;
  const g = M.submit({ kind: 'retail', operator: false, lines: [{ item: M.products()[0].id, qty: 1 }] });
  const h = go('S08?id=' + g.orderIds[0]);
  assert.ok(h.includes('href="#/U23?id=' + g.id + '"'));
  assert.match(go('U23?id=' + g.id), /v19-wechat-method/);
});
