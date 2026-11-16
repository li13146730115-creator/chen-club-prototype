const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const audit=fs.readFileSync(path.join(root,'appointment-audit.js'),'utf8');

test('预约最终复核脚本在所有旧端口脚本之后加载并覆盖三个移动预约入口',()=>{
  assert.ok(index.indexOf('xmind-adjustments.js?')<index.indexOf('appointment-audit.js?'));
  assert.match(audit,/A\.register\(\{U07:ownerBooking,S03:proxyView,T03:proxyView\}\)/);
});

test('业主、员工和商家移动预约都使用日期卡片与日期下时段卡片',()=>{
  assert.match(audit,/data-action="audit-owner-date"/);
  assert.match(audit,/data-action="audit-proxy-date"/);
  assert.match(audit,/data-audit-slot-container/);
  assert.match(audit,/name="time" value="'\+x\.time/);
  assert.doesNotMatch(audit,/select\('time'/);
  assert.doesNotMatch(audit,/select\('date'/);
});

test('移动代客预约保留预约与现场点单两种业务方式',()=>{
  assert.match(audit,/name="mode" value="booking"/);
  assert.match(audit,/name="mode" value="direct"/);
  assert.match(audit,/direct\?iso\(now\)/);
});
