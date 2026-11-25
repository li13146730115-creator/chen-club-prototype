const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load.cjs');
const legacyKey = 'chenclub-prototype-20261111-v1';
const key = 'chenclub-prototype-20261111-v2';

function listen(ctx) {
  const listeners = {};
  ctx.scope.addEventListener = (name, fn) => { listeners[name] = fn; };
  ctx.A.start();
  return listeners;
}

test('升级隔离旧页面缓存且一次性迁移已有订单、配置和会员资料', () => {
  const source = load().A.S;
  source.profile.nickname = '原有会员资料';
  source.configs['qa-preserved'] = {capacity: 31};
  const saved = JSON.stringify(source), storage = {[legacyKey]:saved};
  const { A } = load([], { storage });
  assert.equal(A.storageKey, key);
  assert.equal(A.S.profile.nickname, '原有会员资料');
  assert.equal(A.S.configs['qa-preserved'].capacity, 31);
  assert.equal(A.S.orders[0].id, source.orders[0].id);
  assert.equal(storage[legacyKey], saved, '保留旧缓存供旧版页面使用');
  assert.equal(JSON.parse(storage[key]).profile.nickname, '原有会员资料');
  const newState = JSON.parse(storage[key]);newState.profile.nickname = '新版资料';storage[key]=JSON.stringify(newState);
  const again = load([], { storage });
  assert.equal(again.A.S.profile.nickname, '新版资料', '后续启动不再次导入过期缓存');
});

test('旧版本缓存事件不覆盖新页会员草稿和支付选择', () => {
  const ctx=load(),{A}=ctx,events=listen(ctx),M=A.v07;
  M.B.checkout={kind:'retail',operator:true,lines:[{item:M.products()[0].id,qty:1}],name:'填写中的客户'};
  const before=M.B.checkout;
  const old=JSON.parse(JSON.stringify(A.S));old.v07.checkout=null;old.profile.nickname='旧标签页';
  events.storage({key:legacyKey,newValue:JSON.stringify(old)});
  assert.equal(M.B.checkout,before);
  assert.notEqual(A.S.profile.nickname,'旧标签页');
});

test('新版同步保留共享引用但不回写缓存触发重绘循环', () => {
  const ctx=load(),{A,scope}=ctx,events=listen(ctx),shared=A.S.v07;
  const next=JSON.parse(JSON.stringify(A.S));next.profile.nickname='同版本会员更新';
  let writes=0;scope.localStorage.setItem=()=>writes++;
  const original=A.views.U01;
  A.register({U01:()=>{A.save();return original();}});
  events.storage({key,newValue:JSON.stringify(next)});
  assert.equal(A.S.profile.nickname,'同版本会员更新');
  assert.equal(A.S.v07,shared);
  assert.equal(writes,0,'接收同步时，渲染不得再向缓存广播');
  A.S.profile.nickname='用户主动修改';A.save();
  assert.equal(writes,1,'真实操作仍保存和同步');
});

test('普通页面反复退出扫码上下文时无变更不保存', () => {
  const {A}=load();let writes=0;A.save=()=>writes++;
  A.v13Scan.clear();A.v13Scan.clear();
  assert.equal(writes,0);
  const t=A.v13Scan.tables()[0];A.v13Scan.activate(t);writes=0;
  A.v13Scan.clear();assert.equal(writes,1);
  A.v13Scan.clear();assert.equal(writes,1);
});

for(const route of ['S03','S04','S10','A27','A28','M17'])test(route+'在线支付直接弹出可重开的订单二维码',()=>{
  const {A,go,nodes,scope}=load(),M=A.v07;
  scope.document.getElementById('overlay');
  scope.document.querySelectorAll=selector=>selector==='#overlay,#phone-overlay'?[nodes.overlay]:[];
  const g=M.submit({kind:'retail',operator:true,lines:[{item:M.products()[0].id,qty:1}]});
  go(route+'?step=5&id='+g.id);
  A.actions['v07-method']({id:g.id,value:'online'});
  assert.match(nodes.overlay.innerHTML,/role="dialog"/);
  assert.ok(nodes.overlay.innerHTML.includes('data-qr="CHEN-PAY:'+g.id+'"'));
  assert.match(nodes.overlay.innerHTML,/会员扫码支付/);
  assert.match(nodes.overlay.innerHTML,/确认会员已完成支付/);
  A.close();assert.equal(nodes.overlay.innerHTML,'');
  assert.match(go(route+'?step=5&id='+g.id),/data-action="v08-payment-qr"/);
  A.actions['v08-payment-qr']({id:g.id});
  assert.match(nodes.overlay.innerHTML,/role="dialog"/);
  A.actions['v07-pay']({id:g.id});
  assert.equal(g.status,'已支付');
  assert.throws(()=>A.actions['v08-payment-qr']({id:g.id}),/支付|处理/);
});

test('二维码确认必须仍是在线支付，其他标签页切换线下后不可按旧弹窗确认', () => {
  const {A,go}=load(),M=A.v07;
  const g=M.submit({kind:'retail',operator:true,lines:[{item:M.products()[0].id,qty:1}]});
  go('A27?step=5&id='+g.id);
  A.actions['v07-method']({id:g.id,value:'online'});
  g.paymentMethod='offline';
  assert.throws(()=>A.actions['v07-pay']({id:g.id,expected:'online'}),/支付方式/);
  assert.equal(g.status,'待支付');
});
