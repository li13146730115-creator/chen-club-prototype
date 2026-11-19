const test=require('node:test'),assert=require('node:assert/strict'),load=require('./helpers/load.cjs');
const fs=require('node:fs'),path=require('node:path');
const setup=()=>load(['v12-membership.js',...(fs.existsSync(path.join(__dirname,'../v12-catalog.js'))?['v12-catalog.js']:[])]);
test('Word V0.9：服务与代客目录有具体演示价，已知客户价与免费身份不改',()=>{
 const {A,go}=setup();
 assert.equal(A.offer(A.service('BJX02'),'mc').amount,40000);
 assert.equal(A.offer(A.service('BJX01'),'ma').amount,0);
 assert.equal(A.v10.baseOffer(A.service('BJX01'),'na').amount,null);
 for(const p of Object.keys(A.projects)){A.S.project=p;for(const route of ['S03','A27','M17']){const h=go(route);assert.doesNotMatch(h,/价格待确认|默认规格|场地权益免费/);assert.match(h,/v12-catalog-card/);} }
 const s=A.service('BJX21');A.S.project='bj';assert.ok(A.offer(s,'ma').amount>0);assert.ok(A.offer(s,'na').amount>A.offer(s,'ma').amount);
});
test('Word V0.9：商品详情不显示零元或内部权益原文，零元结算保持可用',()=>{
 const {A,go}=setup();A.S.project='bj';A.S.identity='ma';
 const h=go('U06?id=BJX15');assert.doesNotMatch(h,/场地权益免费|价格待确认|权益与价格|v19-price[^>]*>¥0/);assert.match(h,/立即购买|立即预约/);
 assert.match(go('U06?id=BJX21'),/¥498/);
});
test('Word V0.9：缺价演示配置在服务后台可改，报价、预约核对保持同一金额',()=>{
 const {A,go}=setup();A.S.project='bj';const s=A.service('BJX01');
 assert.match(go('M09?id='+s.id),/单价配置/);
 A.forms['v12-demo-price']({id:s.id,price:'199',duration:'60'});assert.equal(A.offer(s,'na').amount,19900);
 const date=A.v07.iso(new Date(Date.now()+86400000*3));const d={kind:'booking',identity:'na',lines:[{item:s.id,resource:s.id+'-2',date,time:'11:00',qty:1,people:1}]};assert.equal(A.v07.quote(d).gross,19900);assert.equal(A.offer(s,'ma').amount,0);
 assert.throws(()=>A.forms['v12-demo-price']({id:s.id,price:'0',duration:'60'}),/有效/);
});
test('Word V0.9：每个演示会员服务选券有五条，不能在其它项目使用，重复访问不增加',()=>{
 const {A,go}=setup(),M=A.v07;
 for(const p of Object.keys(A.projects)){A.S.project=p;go('U31');for(const m of M.members()){const s=A.services.find(s=>s.project===p);assert.ok(M.coupons(m.id,[{item:s.id,variant:'standard'}]).length>=5,m.id);}}
 const n=A.S.assets.filter(c=>c.v12Demo).length;go('S03');go('U31');assert.equal(A.S.assets.filter(c=>c.v12Demo).length,n);
 A.S.project='bj';assert.equal(M.coupons(M.members()[0].id,[{item:'ZJX01',variant:'standard'}]).length,0);
});
test('Word V0.9：导航删除代客模块，全部订单保留创建动作',()=>{
 const {A,go}=setup();assert.ok(A.navigationGroups.find(g=>g.title==='订单管理').ids.every(id=>!['A25','A26','A27','A28'].includes(id)));const h=go('A08');assert.match(h,/创建代客订单/);assert.match(h,/class="mall-brand" href="#\/A08"/);
});
