const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),load=require('./helpers/load.cjs');
const file=path.join(__dirname,'../v21-voucher.js');
const setup=()=>load(fs.existsSync(file)?['v21-voucher.js']:[]);
function appointment(A){const o=A.currentOrders().find(o=>o.paid&&o.status==='待履约'&&!o.children&&!o.cardOrder&&!o.orderScene);assert.ok(o);Object.assign(o,{date:'2099-12-30',time:'09:00',attendees:3,remark:'请安排安静区域，与家人一同到场。'});return o;}
const actions=h=>[...h.matchAll(/<(?:button|a)\b[^>]*(?:data-action|href)="[^"]*"[^>]*>[\s\S]*?<\/(?:button|a)>/g)].map(m=>m[0]).sort();

test('预约主凭证集中呈现服务、原预约时间、项目和人数，次要信息默认折叠且保留原文',()=>{
 const{A,go}=setup(),o=appointment(A),before=JSON.stringify(A.S.orders),h=go('U09?id='+o.id);
 assert.match(h,/class="v05-ticket-page v21-voucher-page"/);
 assert.match(h,/v05-ticket-top[^]*?v20-brand-wordmark/);
 assert.match(h,/class="v21-voucher-schedule"[^]*?datetime="2099-12-30"[^]*?09:00/);
 assert.match(h,/class="v21-voucher-location"[^]*?北京宸园[^]*?3人/);
 assert.match(h,/<details class="v21-voucher-details"><summary>预约详情/);
 assert.match(h,/<details class="v05-rules"\s*>/);
 for(const value of ['恒温泳池','凭证编号',o.code,'到场人数','预约服务','场地使用','备注说明',o.remark,A.v05.usage(A.service(o.service))])assert.ok(h.includes(value),value);
 assert.match(h,new RegExp('data-qr="'+o.code+'"'));
 assert.match(h,new RegExp('data-action="copy-code" data-code="'+o.code+'"'));
 assert.equal(JSON.stringify(A.S.orders),before);
});

test('完成、取消、退款、过期与未支付状态沿用原凭证规则，不产生可核销二维码',()=>{
 const{A,go}=setup(),o=appointment(A);
 for(const state of [
  {status:'已完成',paid:true,label:'已核销',extra:'2026-11-26 14:30'},
  {status:'已取消',paid:true,label:'预约已取消'},
  {status:'已退款',paid:true,label:'预约已退款'},
  {status:'待履约',paid:true,date:'2020-01-01',label:'预约时段已结束'},
  {status:'待支付',paid:false,label:'预约尚未生效'}
 ]){
  Object.assign(o,{date:'2099-12-30',verifiedAt:state.extra||'',...state});const h=go('U09?id='+o.id);
  assert.match(h,/v21-voucher-page/);assert.ok(h.includes(state.label));assert.doesNotMatch(h,/data-qr=|data-action="reschedule"|data-action="v04-cancel"|data-action="v14-share-voucher"/);
  if(state.extra)assert.ok(h.includes(state.extra));
  assert.ok(h.includes(state.status==='已完成'?'再次预约':'重新选择服务'));
 }
});

test('原调整、取消、分享及复制操作完整保留，活动不可改期的限制不被解除',()=>{
 const{A,scope,go}=load([],{skipScripts:['v21-voucher.js']}),o=appointment(A);go('U09?id='+o.id);const original=A.views.U09();
 assert.ok(fs.existsSync(file),'缺少凭证呈现扩展');vm.runInContext(fs.readFileSync(file,'utf8'),scope);const h=A.views.U09();
 assert.deepEqual(actions(h),actions(original));
 o.activityId='TEST-ACTIVITY';const event=A.views.U09();assert.doesNotMatch(event,/data-action="reschedule"/);assert.match(event,/data-action="v14-share-voucher"/);assert.match(event,/活动预约/);
});

test('仅装饰原预约视图，未找到、访客、其他页面和商品提货凭证保持原输出',()=>{
 const{A,scope,go}=load([],{skipScripts:['v21-voucher.js']});
 const retail=A.S.orders.find(o=>o.project===A.S.project&&o.children);
 assert.ok(retail,'缺少提货订单用例');
 const untouched=['U01','U10','U38'].map(route=>[route,A.views[route]]);
 const routes=['U09?id=NO-SUCH-ORDER','U09?id='+retail.id];const before=new Map(routes.map(route=>{go(route);return[route,A.views[A.route]()];}));
 A.S.guest=true;go('U09?id=NO-SUCH-ORDER');const guest=A.views.U09();A.S.guest=false;
 assert.ok(fs.existsSync(file),'缺少凭证呈现扩展');vm.runInContext(fs.readFileSync(file,'utf8'),scope);
 for(const[route,view]of untouched)assert.equal(A.views[route],view,route);
 for(const route of routes){go(route);assert.equal(A.views[A.route](),before.get(route),route);}
 A.S.guest=true;go('U09?id=NO-SUCH-ORDER');assert.equal(A.views.U09(),guest);
});

test('重复加载不会重复品牌、折叠面板或分享入口',()=>{
 const{A,scope,go}=setup(),o=appointment(A);assert.ok(A.v21Voucher,'缺少凭证呈现扩展');go('U09?id='+o.id);const before=A.views.U09();
 vm.runInContext(fs.readFileSync(file,'utf8'),scope);assert.equal(A.views.U09(),before);
 assert.equal((before.match(/class="v21-voucher-details"/g)||[]).length,1);assert.equal((before.match(/data-action="v14-share-voucher"/g)||[]).length,1);
});
